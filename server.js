// ========================== SERVER.JS FINAL DOC AI CORRIGIDO ==========================
require("dotenv").config();
require("./reindexar_embeddings");
const express = require("express");
const path = require("path");
const fs = require("fs");
const oracledb = require("oracledb");
const { getConnection } = require("./database/oracle");
const salvarTXT = require("./storage/salvarTXT");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { autenticar } = require("./auth/usuarios");
const auth = require("./auth/authMiddleware");
require("./modules/insights/insights.routes");

const app = express();

app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 8081;

// ===================== CLIENTE =====================
app.get("/buscar_cliente", async (req, res) => {
  const termo = req.query.termo || null;
  console.log("[DEBUG] Termo recebido:", termo);

  try {
    const conn = await getConnection();
    console.log("[DEBUG] Conexão obtida:", !!conn);

    const result = await conn.execute(
      `SELECT COD_CLIENTE AS "codigo", NOME_CLIENTE AS "nome"
             FROM DOCAI_CLIENTES
             WHERE :termo IS NULL OR TO_CHAR(COD_CLIENTE)=:termo OR UPPER(NOME_CLIENTE) LIKE '%'||UPPER(:termo)||'%'`,
      { termo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    console.log("[DEBUG] Resultados obtidos:", result.rows.length);
    await conn.close();

    res.json(result.rows || []);
  } catch (err) {
    console.error("[DEBUG] ERRO detalhado no /buscar_cliente:", err);
    res.status(500).json([]);
  }
});

function normalizarTexto(texto) {
  if (!texto) return "";

  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/ç/g, "c")
    .trim();
}
app.get("/buscar", (req, res) => {
  const termo = normalizarTexto(req.query.termo || "");

  console.log("[SEARCH LOG] Nova busca iniciada:", termo);

  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      console.log("[SEARCH LOG] index.json não encontrado");
      return res.json([]);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    console.log("[SEARCH LOG] Total no index:", index.length);

    const resultados = index.filter((item) => {
      const texto = normalizarTexto(JSON.stringify(item));

      return texto.includes(termo);
    });

    console.log("[SEARCH LOG] Resultados encontrados:", resultados.length);

    res.json(resultados);
  } catch (err) {
    console.error("[SEARCH ERROR]", err);

    res.json([]);
  }
});

function extrairCampo(texto, campo) {
  if (!texto) return "";

  const regex = new RegExp(`${campo}:([\\s\\S]*?)\\n`, "i");

  const match = texto.match(regex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return "";
}
app.get("/buscar_semantico", async (req, res) => {
  const termo = req.query.termo;

  console.log("[AI SEARCH] Consulta recebida:", termo);

  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      console.log("[AI SEARCH] index.json não encontrado");
      return res.json([]);
    }

    const vectorPath = path.join(__dirname, "vector_index.json");

    let index = [];

    if (fs.existsSync(vectorPath)) {
      index = JSON.parse(fs.readFileSync(vectorPath, "utf8"));
    }

    const contexto = index
      .map((a) => {
        const problema = a.problema || "";
        const causa = a.causa || "";
        const solucao = a.solucao || "";

        if (!problema && !causa && !solucao) return null;

        return `
Problema: ${problema}
Causa: ${causa}
Solução: ${solucao}
`;
      })
      .filter(Boolean)
      .join("\n");

    console.log("[AI SEARCH] Contexto enviado ao Gemini:");
    console.log(contexto.substring(0, 500));
    const prompt = `
Você é um especialista em suporte técnico de sistemas ERP.

O usuário descreveu o problema:

"${termo}"

Abaixo está o histórico real de atendimentos.

Encontre problemas semelhantes e explique a solução.

Histórico:

${contexto}

Se encontrar algo semelhante, responda SOMENTE em JSON no formato:

[
{
"problema":"...",
"causa":"...",
"solucao":"..."
}
]

Se não encontrar nada semelhante, responda apenas:

[]
`;
    console.log("[AI SEARCH] Enviando prompt ao Gemini...");

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const data = await resposta.json();

    let texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    texto = texto.replace(/```json/g, "");
    texto = texto.replace(/```/g, "");
    texto = texto.trim();

    console.log("[AI SEARCH] Resposta bruta Gemini:", texto);

    let resultado = [];

    try {
      resultado = JSON.parse(texto);
    } catch (parseError) {
      console.warn("[AI SEARCH] JSON inválido retornado pela IA");

      resultado = [];
    }

    res.json(resultado);
  } catch (err) {
    console.error("[AI SEARCH ERROR]", err);

    res.json([]);
  }
});

const { pipeline } = require("@xenova/transformers");

let embedder = null;

async function gerarEmbedding(texto) {
  console.log("[VECTOR LOG] Gerando embedding local...");

  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await embedder(texto);

  return Array.from(output.data);
}

app.post("/salvar_cliente", async (req, res) => {
  const { codCliente, nome } = req.body;
  console.log("[CLIENT LOG] Garantindo cliente:", codCliente, "-", nome);
  try {
    const conn = await getConnection();
    await conn.execute(
      `MERGE INTO DOCAI_CLIENTES C
             USING (SELECT :cod AS COD_CLIENTE, :nome AS NOME_CLIENTE FROM dual) X
             ON (C.COD_CLIENTE = X.COD_CLIENTE)
             WHEN NOT MATCHED THEN
             INSERT (COD_CLIENTE, NOME_CLIENTE) VALUES (X.COD_CLIENTE, X.NOME_CLIENTE)`,
      { cod: codCliente, nome },
    );
    await conn.commit();
    await conn.close();
    console.log("[CLIENT LOG] Cliente garantido no banco:", codCliente);
    res.json({ status: "ok", codCliente, nome });
  } catch (err) {
    console.error("[CLIENT ERROR] Falha ao criar cliente:", err);
    res.status(500).json({ status: "erro", mensagem: "Erro ao criar cliente" });
  }
});

// ===================== AUTOCOMPLETE =====================
app.get("/autocomplete", (req, res) => {
  const { campo, termo } = req.query;

  console.log(`[AUTOCOMPLETE] Campo: ${campo} | Termo: ${termo}`);

  if (!campo || !termo) {
    return res.json([]);
  }

  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      return res.json([]);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const palavras = termo.toLowerCase().split(" ");

    let sugestoes = [];

    index.forEach((item) => {
      let valor = item[campo];

      if (!valor) return;

      valor = valor.toLowerCase();

      const match = palavras.some((p) => valor.includes(p));

      if (match) {
        sugestoes.push(item[campo]);
      }
    });

    const unicos = [...new Set(sugestoes)];

    console.log(`[AUTOCOMPLETE] Sugestões encontradas: ${unicos.length}`);

    res.json(unicos.slice(0, 10));
  } catch (err) {
    console.error("[AUTOCOMPLETE ERROR]", err);

    res.json([]);
  }
});

// ===================== ATENDIMENTO =====================
 // ===================== ATENDIMENTO =====================
app.post('/salvar', async (req, res) => {

const { cliente, codCliente, codAtendimento, responsavel, problema, causa, solucao, status } = req.body;

console.log('[SAVE LOG] Salvando atendimento:', codAtendimento);

try{

// 1️⃣ gerar embedding
const textoEmbedding = `${problema} ${causa} ${solucao}`
const vetor = await gerarEmbedding(textoEmbedding)

// 2️⃣ salvar TXT
const resultadoTXT = salvarTXT(cliente, codAtendimento, responsavel, problema, causa, solucao, status)

console.log('[FILE LOG] Arquivo salvo em:', resultadoTXT.caminhoCompleto)

// 3️⃣ conexão banco
const conn = await getConnection()

// 4️⃣ parâmetros SQL
const params = {

codAtd: codAtendimento,
codCli: codCliente,
cli: cliente,
resp: responsavel,
stat: status,
prob: problema,
cau: causa,
sol: solucao,
conteudo: textoEmbedding.toLowerCase(),
arquivo: resultadoTXT.arquivo

}

console.log("[SAVE DEBUG PARAMS]", params)

// 5️⃣ salvar atendimento
await conn.execute(`

INSERT INTO DOCAI_ATENDIMENTOS (
ID_DOCAI,
COD_ATENDIMENTO,
COD_CLIENTE,
CLIENTE,
RESPONSAVEL,
STATUS,
PROBLEMA,
CAUSA,
SOLUCAO,
CONTEUDO,
ARQUIVO_TXT
)
VALUES (
SEQ_DOCAI_ATD.NEXTVAL,
:codAtd,
:codCli,
:cli,
:resp,
:stat,
:prob,
:cau,
:sol,
:conteudo,
:arquivo
)

`, params)

await conn.commit()

console.log('[DB SUCCESS] Atendimento salvo:', codAtendimento)

// 6️⃣ atualizar vector_index.json

const vectorPath = path.join(__dirname,"vector_index.json")

let vectorIndex = []

if(fs.existsSync(vectorPath)){

vectorIndex = JSON.parse(fs.readFileSync(vectorPath,"utf8"))

}

vectorIndex.push({

problema,
causa,
solucao,
embedding: vetor

})

fs.writeFileSync(vectorPath, JSON.stringify(vectorIndex,null,2))

console.log("[VECTOR LOG] Vector index atualizado")

// 7️⃣ atualizar index.json

const indexPath = path.join(__dirname,'index.json')

let index = []

if(fs.existsSync(indexPath)){

index = JSON.parse(fs.readFileSync(indexPath,'utf8'))

}

index.push({

cliente,
atendimento: codAtendimento,
problema,
causa,
solucao,
arquivo: resultadoTXT.arquivo,
conteudo: textoEmbedding.toLowerCase()

})

fs.writeFileSync(indexPath, JSON.stringify(index,null,2))

console.log("[INDEX LOG] Index atualizado")

await conn.close()

res.json({

status:'ok',
arquivo: resultadoTXT.arquivo,
caminhoCompleto: resultadoTXT.caminhoCompleto

})

}catch(error){

console.error('[SAVE ERROR] Falha ao salvar atendimento:', error)

res.status(500).json([])

}

})

app.get("/gemini_suggestions", async (req, res) => {
  const { campo, termo, contexto } = req.query; // campo: problema|causa|solucao

  try {
    const indexPath = path.join(__dirname, "index.json");
    let index = [];
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    }

    // Filtrar histórico relevante
    const historico = index
      .filter((a) => (contexto ? a.problema === contexto.problema : true))
      .map((a) => a[campo])
      .filter(Boolean);

    // Aqui chamamos o Gemini (pseudo-código)
    const sugestoes = await gemini.predict({
      prompt: `Sugira 10 ${campo} relacionados a "${termo}" com base no histórico: ${historico.join(", ")}`,
      maxTokens: 50,
    });

    res.json([...new Set(sugestoes)]);
  } catch (err) {
    console.error("[GEMINI ERROR]", err);
    res.status(500).json([]);
  }
});

app.get("/diagnostico", (req, res) => {
  const termo = (req.query.termo || "").toLowerCase();

  console.log("[DIAGNOSTICO] Consulta:", termo);

  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      return res.json(null);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    let melhor = null;
    let scoreMelhor = 0;

    index.forEach((item) => {
      const texto = (item.conteudo || "").toLowerCase();

      let score = 0;

      termo.split(" ").forEach((palavra) => {
        if (texto.includes(palavra)) {
          score++;
        }
      });

      if (score > scoreMelhor) {
        scoreMelhor = score;
        melhor = item;
      }
    });

    if (!melhor) {
      console.log("[DIAGNOSTICO] Nenhum resultado encontrado");

      return res.json(null);
    }

    console.log("[DIAGNOSTICO] Resultado encontrado:", melhor.atendimento);

    res.json({
      problema: melhor.problema,
      causa: melhor.causa,
      solucao: melhor.solucao,
    });
  } catch (err) {
    console.error("[DIAGNOSTICO ERROR]", err);

    res.json(null);
  }
});

app.get("/perguntar", (req, res) => {
  const pergunta = (req.query.pergunta || "").toLowerCase();

  console.log("[DOC AI] Pergunta recebida:", pergunta);

  const indexPath = path.join(__dirname, "index.json");

  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const encontrados = index.filter(
      (item) => item.conteudo && item.conteudo.toLowerCase().includes(pergunta),
    );

    if (encontrados.length > 0) {
      console.log(
        "[DOC AI] Resultado encontrado em index.json:",
        encontrados.length,
      );

      return res.json(encontrados);
    }
  }

  console.log("[DOC AI] Nada encontrado localmente");

  res.json([]);
});

app.get("/usuarios", async (req, res) => {
  try {
    const conn = await getConnection();

    const result = await conn.execute(
      `SELECT id, usuario, nome FROM DOCAI_USUARIOS`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    await conn.close();

    res.json(result.rows);
  } catch (err) {
    console.error("[USERS ERROR]", err);

    res.status(500).json([]);
  }
});

app.post("/resetar_senha", async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);

    const conn = await getConnection();

    await conn.execute(
      `UPDATE DOCAI_USUARIOS
SET senha = :senha
WHERE usuario = :usuario`,

      { senha: hash, usuario },
    );

    await conn.commit();

    await conn.close();

    res.json({ ok: true });
  } catch (err) {
    console.error("[RESET ERROR]", err);

    res.json({ ok: false });
  }
});
app.get("/chat_suporte", async (req, res) => {
  const pergunta = req.query.pergunta;
  const usuario = req.query.usuario;
  console.log("[CHAT IA] Pergunta:", pergunta);
  console.log("[IA] Usuário:", usuario);
  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      return res.json({ resposta: "Nenhum histórico disponível" });
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const contexto = index
      .slice(-20)
      .map(
        (a) =>
          `Problema: ${a.problema}
Causa: ${a.causa}
Solução: ${a.solucao}`,
      )
      .join("\n\n");

    const prompt = `
Você é um especialista em suporte técnico de sistemas.

Pergunta do técnico:

${pergunta}

Histórico de atendimentos:

${contexto}

Com base no histórico responda:

- qual o problema mais provável
- qual a causa provável
- qual a solução recomendada

Seja objetivo.
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const data = await resposta.json();

    const texto =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não consegui encontrar resposta.";

    console.log("[CHAT IA] Resposta gerada");

    res.json({ resposta: texto });
  } catch (err) {
    console.error("[CHAT IA ERROR]", err);

    res.json({ resposta: "Erro ao consultar IA" });
  }
});
// ===================== ABRIR RELATÓRIO =====================
app.get("/abrir", (req, res) => {
  const caminhoRelativo = req.query.caminho;
  if (!caminhoRelativo)
    return res.status(400).send("Parâmetro 'caminho' é obrigatório.");

  const caminhoCompleto = path.join(__dirname, "storage", caminhoRelativo);
  console.log("[FILE LOG] Tentando abrir arquivo:", caminhoCompleto);

  if (!fs.existsSync(caminhoCompleto)) {
    console.warn("[FILE WARN] Arquivo não encontrado:", caminhoCompleto);
    return res.status(404).send("Arquivo não encontrado.");
  }

  const conteudo = fs.readFileSync(caminhoCompleto, "utf8");
  res.type("text/plain").send(conteudo);
});

app.get("/buscar_inteligente", (req, res) => {
  const termo = (req.query.termo || "").toLowerCase();

  console.log("[SMART SEARCH] Busca iniciada:", termo);

  try {
    const indexPath = path.join(__dirname, "index.json");

    if (!fs.existsSync(indexPath)) {
      return res.json([]);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const palavras = termo.split(" ");

    const resultados = index
      .map((item) => {
        let score = 0;

        palavras.forEach((p) => {
          if (item.conteudo.includes(p)) score += 2;
          if (item.problema?.includes(p)) score += 3;
          if (item.causa?.includes(p)) score += 2;
          if (item.solucao?.includes(p)) score += 2;
        });

        return {
          ...item,
          score,
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log("[SMART SEARCH] Resultados encontrados:", resultados.length);

    res.json(resultados);
  } catch (err) {
    console.error("[SMART SEARCH ERROR]", err);
    res.json([]);
  }
});

app.get("/buscar_vetorial", async (req, res) => {
  const termo = req.query.termo;

  console.log("[VECTOR SEARCH]", termo);

  const embeddingBusca = await gerarEmbedding(termo);

  const vectorPath = path.join(__dirname, "vector_index.json");

  if (!fs.existsSync(vectorPath)) {
    return res.json([]);
  }

  const vectorIndex = JSON.parse(fs.readFileSync(vectorPath, "utf8"));

  const resultados = vectorIndex
    .map((item) => {
      const score = similaridadeCoseno(embeddingBusca, item.embedding);

      return { ...item, score };
    })

    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json(resultados);
});

app.post("/login", async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    console.log("🔐 [AUTH] Tentativa de login:", usuario);

    if (!usuario || !senha) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const user = await autenticar(usuario, senha);

    if (!user) {
      console.log("❌ [AUTH] Login inválido para:", usuario);

      return res.status(401).json({ erro: "Login inválido" });
    }

    const token = jwt.sign(user, "docai_secret", { expiresIn: "8h" });

    console.log("✅ [AUTH] Login realizado:", usuario);

    res.json({
      token,
      nome: user.nome,
    });
  } catch (err) {
    console.error("🔥 [AUTH ERROR]", err);

    res.status(500).json({
      erro: "Erro interno no login",
    });
  }
});

app.post("/resetar_senha", auth, async (req, res) => {
  if (req.usuario.usuario !== "kelvis") {
    return res.status(403).json({ erro: "Apenas KELVIS pode resetar senha" });
  }

  const { usuario, novaSenha } = req.body;

  const hash = await bcrypt.hash(novaSenha, 10);

  const conn = await getConnection();

  await conn.execute(
    `UPDATE DOCAI_USUARIOS SET SENHA_HASH=:s WHERE USUARIO=:u`,
    { s: hash, u: usuario },
  );

  await conn.commit();
  await conn.close();

  res.json({ ok: true });
});

app.post("/criar_usuario", async (req, res) => {
  try {
    const { usuario, nome, senha } = req.body;

    console.log("👤 [AUTH] Criando usuário:", usuario);

    if (!usuario || !senha) {
      console.log("⚠️ [AUTH] Dados incompletos");

      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const hash = await bcrypt.hash(senha, 10);

    const conn = await getConnection();

    await conn.execute(
      `INSERT INTO DOCAI_USUARIOS (USUARIO,NOME,SENHA_HASH,PERFIL)
VALUES (:u,:n,:s,'USER')`,
      { u: usuario, n: nome, s: hash },
    );

    await conn.commit();
    await conn.close();

    console.log("✅ [AUTH] Usuário criado:", usuario);

    res.json({ ok: true });
  } catch (err) {
    console.error("🔥 [AUTH ERROR criar_usuario]", err);

    res.status(500).json({
      erro: "Erro ao criar usuário",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

async function criarUsuarioMaster() {
  try {
    const conn = await getConnection();

    const check = await conn.execute(
      `SELECT USUARIO FROM DOCAI_USUARIOS WHERE USUARIO='kelvis'`,
    );

    if (check.rows.length === 0) {
      const bcrypt = require("bcrypt");

      const senha = await bcrypt.hash("admin123", 10);

      await conn.execute(
        `INSERT INTO DOCAI_USUARIOS (USUARIO,NOME,SENHA_HASH,PERFIL)
VALUES ('kelvis','Kelvis','${senha}','ADMIN')`,
      );

      await conn.commit();

      console.log("👑 Usuário MASTER criado: kelvis / admin123");
    }

    await conn.close();
  } catch (err) {
    console.error("[AUTH INIT ERROR]", err);
  }
}

criarUsuarioMaster();

process.on("uncaughtException", (err) => {
  console.error("🔥 ERRO GLOBAL:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 PROMISE ERROR:", err);
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
});
