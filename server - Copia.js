// ========================== SERVER.JS FINAL DOC AI CORRIGIDO ==========================
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');
const { getConnection } = require('./database/oracle');
const salvarTXT = require('./storage/salvarTXT');
const { GoogleGenerativeAI } = require("@google/generative-ai")
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3033;

// ===================== CLIENTE =====================
app.get('/buscar_cliente', async (req, res) => {
    const termo = req.query.termo || null;
    console.log('[DEBUG] Termo recebido:', termo);

    try {
        const conn = await getConnection();
        console.log('[DEBUG] Conexão obtida:', !!conn);

        const result = await conn.execute(
            `SELECT COD_CLIENTE AS "codigo", NOME_CLIENTE AS "nome"
             FROM DOCAI_CLIENTES
             WHERE :termo IS NULL OR TO_CHAR(COD_CLIENTE)=:termo OR UPPER(NOME_CLIENTE) LIKE '%'||UPPER(:termo)||'%'`,
            { termo },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('[DEBUG] Resultados obtidos:', result.rows.length);
        await conn.close();

        res.json(result.rows || []);
    } catch (err) {
        console.error('[DEBUG] ERRO detalhado no /buscar_cliente:', err);
        res.status(500).json([]);
    }
});
app.get('/buscar', (req, res) => {

    const termo = (req.query.termo || "").toLowerCase().trim();

    console.log("[SEARCH LOG] Nova busca iniciada:", termo);

    try {

        const indexPath = path.join(__dirname, "index.json");

        if (!fs.existsSync(indexPath)) {
            console.log("[SEARCH LOG] index.json não encontrado");
            return res.json([]);
        }

        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

        console.log("[SEARCH LOG] Total no index:", index.length);

        const resultados = index.filter(item => {

            const texto = JSON.stringify(item).toLowerCase();

            return texto.includes(termo);

        });

        console.log("[SEARCH LOG] Resultados encontrados:", resultados.length);

        res.json(resultados);

    } catch(err) {

        console.error("[SEARCH ERROR]", err);

        res.json([]);

    }

});


function extrairCampo(texto, campo){

if(!texto) return ""

const regex = new RegExp(`${campo}:([\\s\\S]*?)\\n`, "i")

const match = texto.match(regex)

if(match && match[1]){

return match[1].trim()

}

return ""

}
app.get('/buscar_semantico', async (req,res)=>{

const termo = req.query.termo

console.log("[AI SEARCH] Consulta recebida:", termo)

try{

const indexPath = path.join(__dirname,"index.json")

if(!fs.existsSync(indexPath)){
console.log("[AI SEARCH] index.json não encontrado")
return res.json([])
}

const index = JSON.parse(fs.readFileSync(indexPath,"utf8"))

const contexto = index
.map(a => {

const problema = extrairCampo(a.conteudo,"problema")
const causa = extrairCampo(a.conteudo,"causa")
const solucao = extrairCampo(a.conteudo,"solucao")

// ignorar registros vazios
if(!problema && !causa && !solucao){
return null
}

return `
Problema: ${problema}
Causa: ${causa}
Solução: ${solucao}
`

})
.filter(Boolean)
.join("\n")


console.log("[AI SEARCH] Contexto enviado ao Gemini:");
console.log(contexto.substring(0,500));
const prompt = `
Você é um técnico especialista em suporte de sistemas ERP.

O usuário descreveu o seguinte problema:

"${termo}"

Analise o histórico de atendimentos abaixo e encontre problemas SEMELHANTES.

Mesmo que as palavras sejam diferentes, tente identificar situações equivalentes.

Histórico:

${contexto}

Se encontrar algo semelhante, retorne em JSON:

[
{
"problema":"",
"causa":"",
"solucao":""
}
]

Se não encontrar nada semelhante, retorne [].
`

console.log("[AI SEARCH] Enviando prompt ao Gemini...")

const resposta = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
contents:[{
parts:[{text:prompt}]
}]
})

})

const data = await resposta.json()

const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

console.log("[AI SEARCH] Resposta bruta Gemini:", texto)

let resultado = []

try{

resultado = JSON.parse(texto)

}catch(parseError){

console.warn("[AI SEARCH] JSON inválido retornado pela IA")

resultado = []

}

res.json(resultado)

}catch(err){

console.error("[AI SEARCH ERROR]",err)

res.json([])

}

})

async function gerarEmbedding(texto){

const model = genAI.getGenerativeModel({
model: "text-embedding-004"
})

const result = await model.embedContent(texto)

return result.embedding.values

}


app.post('/salvar_cliente', async (req, res) => {
    const { codCliente, nome } = req.body;
    console.log('[CLIENT LOG] Garantindo cliente:', codCliente, '-', nome);
    try {
        const conn = await getConnection();
        await conn.execute(
            `MERGE INTO DOCAI_CLIENTES C
             USING (SELECT :cod AS COD_CLIENTE, :nome AS NOME_CLIENTE FROM dual) X
             ON (C.COD_CLIENTE = X.COD_CLIENTE)
             WHEN NOT MATCHED THEN
             INSERT (COD_CLIENTE, NOME_CLIENTE) VALUES (X.COD_CLIENTE, X.NOME_CLIENTE)`,
            { cod: codCliente, nome }
        );
        await conn.commit();
        await conn.close();
        console.log('[CLIENT LOG] Cliente garantido no banco:', codCliente);
        res.json({ status: 'ok', codCliente, nome });
    } catch (err) {
        console.error('[CLIENT ERROR] Falha ao criar cliente:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao criar cliente' });
    }
});

// ===================== AUTOCOMPLETE =====================
app.get('/autocomplete', (req, res) => {
    const { campo, termo } = req.query;
    if (!campo || !termo) return res.status(400).json([]);

    try {
        let index = [];
        const indexPath = path.join(__dirname, 'index.json');
        if (fs.existsSync(indexPath)) {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        let suggestions = index
            .map(item => item[campo])
            .filter(Boolean)
            .filter(t => t.toLowerCase().includes(termo.toLowerCase()));

        res.json([...new Set(suggestions)].slice(0, 10));
        console.log(`[AUTOCOMPLETE LOG] Campo: ${campo}, Termo: ${termo}, Sugestões: ${suggestions.length}`);
    } catch (err) {
        console.error('[AUTOCOMPLETE ERROR]', err);
        res.status(500).json([]);
    }
});

// ===================== ATENDIMENTO =====================
app.post('/salvar', async (req, res) => {
    const { cliente, codCliente, codAtendimento, responsavel, problema, causa, solucao, status } = req.body;
    console.log('[SAVE LOG] Salvando atendimento:', codAtendimento);
    const textoEmbedding = `${problema} ${causa} ${solucao}`
    const vetor = await gerarEmbedding(textoEmbedding)

    try {
        const conn = await getConnection();

        // Garantir cliente
        await conn.execute(
            `MERGE INTO DOCAI_CLIENTES C
             USING (SELECT :cod AS COD_CLIENTE, :nome AS NOME_CLIENTE FROM dual) X
             ON (C.COD_CLIENTE = X.COD_CLIENTE)
             WHEN NOT MATCHED THEN
             INSERT (COD_CLIENTE, NOME_CLIENTE) VALUES (X.COD_CLIENTE, X.NOME_CLIENTE)`,
            { cod: codCliente, nome: cliente }
        );
        await conn.commit();
        console.log('[CLIENT LOG] Cliente garantido no banco:', codCliente);

        // Salvar arquivo TXT
        const resultadoTXT = salvarTXT(cliente, codAtendimento, responsavel, problema, causa, solucao, status);
        console.log('[FILE LOG] Arquivo salvo em:', resultadoTXT.caminhoCompleto);

        // Salvar atendimento no banco
   await conn.execute(
  `INSERT INTO DOCAI_ATENDIMENTOS
  (COD_ATENDIMENTO, COD_CLIENTE, CLIENTE, RESPONSAVEL, STATUS, ARQUIVO, SOLUCAO, CONTEUDO)
  VALUES (:codAtd, :codCli, :cli, :resp, :stat, :arquivo, :sol, :conteudo)`,
  {
    codAtd: codAtendimento,
    codCli: codCliente,
    cli: cliente,
    resp: responsavel,
    stat: status,
    arquivo: resultadoTXT.arquivo,
    sol: solucao,
    conteudo: `${problema || ''} ${causa || ''} ${solucao}`.toLowerCase()
  }
);
        await conn.commit();
        await conn.close();
        console.log('[DB SUCCESS] Atendimento', codAtendimento, 'processado.');

        // Atualizar index.json
        const indexPath = path.join(__dirname, 'index.json');
        let index = [];
        if (fs.existsSync(indexPath)) {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }
        index.push({ cliente, atendimento: codAtendimento, problema, causa, solucao, arquivo: resultadoTXT.arquivo, conteudo: `${problema} ${causa} ${solucao}`.toLowerCase() });
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
        console.log('[INDEX LOG] Index atualizado para atendimento', codAtendimento);

        res.json({ status: 'ok', arquivo: resultadoTXT.arquivo, caminhoCompleto: resultadoTXT.caminhoCompleto });
    } catch (error) {
        console.error('[SAVE ERROR] Falha ao salvar atendimento:', error);
        res.status(500).json([]); // Retorna array vazio para não quebrar o front-end
    }
});
app.get('/gemini_suggestions', async (req, res) => {
    const { campo, termo, contexto } = req.query; // campo: problema|causa|solucao

    try {
        const indexPath = path.join(__dirname, 'index.json');
        let index = [];
        if (fs.existsSync(indexPath)) {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        // Filtrar histórico relevante
        const historico = index
            .filter(a => contexto ? a.problema === contexto.problema : true)
            .map(a => a[campo])
            .filter(Boolean);

        // Aqui chamamos o Gemini (pseudo-código)
        const sugestoes = await gemini.predict({
            prompt: `Sugira 10 ${campo} relacionados a "${termo}" com base no histórico: ${historico.join(', ')}`,
            maxTokens: 50
        });

        res.json([...new Set(sugestoes)]);
    } catch (err) {
        console.error('[GEMINI ERROR]', err);
        res.status(500).json([]);
    }
});
// ===================== ABRIR RELATÓRIO =====================
app.get('/abrir', (req, res) => {
    const caminhoRelativo = req.query.caminho;
    if (!caminhoRelativo) return res.status(400).send("Parâmetro 'caminho' é obrigatório.");

    const caminhoCompleto = path.join(__dirname, 'storage', caminhoRelativo);
    console.log('[FILE LOG] Tentando abrir arquivo:', caminhoCompleto);

    if (!fs.existsSync(caminhoCompleto)) {
        console.warn('[FILE WARN] Arquivo não encontrado:', caminhoCompleto);
        return res.status(404).send('Arquivo não encontrado.');
    }

    const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
    res.type('text/plain').send(conteudo);
});

app.get('/buscar_inteligente', (req, res) => {

    const termo = (req.query.termo || "").toLowerCase();

    console.log("[SMART SEARCH] Busca iniciada:", termo);

    try {

        const indexPath = path.join(__dirname, "index.json");

        if (!fs.existsSync(indexPath)) {
            return res.json([]);
        }

        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

        const palavras = termo.split(" ");

        const resultados = index.map(item => {

            let score = 0;

            palavras.forEach(p => {
                if (item.conteudo.includes(p)) score += 2;
                if (item.problema?.includes(p)) score += 3;
                if (item.causa?.includes(p)) score += 2;
                if (item.solucao?.includes(p)) score += 2;
            });

            return {
                ...item,
                score
            };

        })
        .filter(r => r.score > 0)
        .sort((a,b) => b.score - a.score)
        .slice(0,10);

        console.log("[SMART SEARCH] Resultados encontrados:", resultados.length);

        res.json(resultados);

    } catch(err) {

        console.error("[SMART SEARCH ERROR]", err);
        res.json([]);

    }

});
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


app.get('/buscar_vetorial', async (req,res)=>{

const termo = req.query.termo

console.log("[VECTOR SEARCH]", termo)

const embeddingBusca = await gerarEmbedding(termo)

const vectorPath = path.join(__dirname,"vector_index.json")

if(!fs.existsSync(vectorPath)){
return res.json([])
}

const vectorIndex = JSON.parse(fs.readFileSync(vectorPath,"utf8"))

const resultados = vectorIndex.map(item=>{

const score = similaridadeCoseno(
embeddingBusca,
item.embedding
)

return { ...item, score }

})

.sort((a,b)=>b.score-a.score)
.slice(0,3)

res.json(resultados)

})

app.listen(PORT, () => console.log(`DocAI rodando em http://localhost:${PORT}`));