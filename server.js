// ========================== SERVER.JS FINAL INTEGRADO ==========================
require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");

const salvarTXT = require("./storage/salvarTXT");
const atendimentosDB = require("./database/atendimentos");
const clientesDB = require("./database/clientes");
const indexador = require("./storage/index");

const app = express();
app.use(express.json());

// Serve arquivos da pasta public (HTML, CSS, JS do front-end)
app.use(express.static(path.join(__dirname, "public")));

// CORREÇÃO: Permite que o navegador acesse a pasta docs diretamente para ver os arquivos .txt
app.use('/docs', express.static(path.join(__dirname, 'docs')));

const PORT = process.env.PORT || 3033;

// ================= ROTA: BUSCAR ATENDIMENTOS =================
app.get("/buscar", async (req, res) => {
    const termo = req.query.termo?.toLowerCase() || "";
    let resultados = [];
    console.log(`[SEARCH LOG] Nova busca iniciada: "${termo}"`);
    try {
        if (fs.existsSync("index.json")) {
            const index = JSON.parse(fs.readFileSync("index.json", "utf8"));
            resultados = index.filter(item => item.conteudo.toLowerCase().includes(termo));
            console.log(`[SEARCH LOG] Encontrados no INDEX.JSON: ${resultados.length}`);
        }
        if (resultados.length === 0 && termo.length > 0) {
            console.log(`[SEARCH LOG] Consultando Banco Oracle...`);
            resultados = await atendimentosDB.buscarNoBanco(termo);
            console.log(`[SEARCH LOG] Encontrados no Oracle: ${resultados.length}`);
        }
        res.json(resultados);
    } catch (err) {
        console.error("[SEARCH ERROR] Erro na busca:", err);
        res.status(500).json({ erro: "Erro ao processar busca" });
    }
});

// ================= ROTA: SALVAR CLIENTE =================
app.post("/salvar_cliente", async (req, res) => {
    const { codCliente, nome } = req.body;
    console.log(`[CLIENT LOG] Criando cliente: ${codCliente} - ${nome}`);
    try {
        await clientesDB.garantirCliente(codCliente, nome);
        res.json({ status: "ok", codCliente, nome });
    } catch (err) {
        console.error(`[CLIENT ERROR] Falha ao criar cliente:`, err);
        res.status(500).json({ status: "erro", mensagem: "Erro ao criar cliente" });
    }
});

// ================= ROTA: SALVAR ATENDIMENTO =================
app.post("/salvar", async (req, res) => {
    const { cliente, codCliente, codAtendimento, responsavel, problema, causa, solucao, status } = req.body;
    console.log(`[SAVE LOG] Salvando atendimento: ${codAtendimento}`);
    try {
        await clientesDB.garantirCliente(codCliente, cliente);
        
        // Gera o arquivo .txt físico
        const resultadoTXT = salvarTXT(cliente, codAtendimento, responsavel, problema, causa, solucao, status);
        console.log(`[SAVE LOG] Arquivo criado em: ${resultadoTXT.caminhoCompleto}`);

        // Salva no Banco de Dados
        await atendimentosDB.salvarAtendimento({ 
            codAtendimento, codCliente, cliente, responsavel, status, 
            arquivo: resultadoTXT.arquivo, conteudo: problema 
        });

        // Atualiza o índice de busca rápida
        indexador.atualizarIndex(cliente, codAtendimento, resultadoTXT.arquivo, problema);

        res.json({ status: "ok", arquivo: resultadoTXT.arquivo, caminhoCompleto: resultadoTXT.caminhoCompleto });
    } catch (error) {
        console.error("[SAVE ERROR] Falha no salvamento:", error);
        res.status(500).json({ status: "erro", mensagem: "Erro ao salvar atendimento" });
    }
});

// ================= ROTA: ABRIR RELATÓRIO =================
app.get("/abrir", (req, res) => {
    const caminhoRelativo = req.query.caminho;
    console.log("[DEBUG] Caminho recebido do front-end:", caminhoRelativo);

    if (!caminhoRelativo) return res.status(400).send("Parâmetro 'caminho' é obrigatório.");

    const caminhoCompleto = path.join(__dirname, 'storage', caminhoRelativo);
    console.log("[DEBUG] Caminho absoluto montado:", caminhoCompleto);

    if (!fs.existsSync(caminhoCompleto)) {
        console.warn("[DEBUG] Arquivo não encontrado no caminho absoluto:", caminhoCompleto);
        // Listar conteúdo da pasta para verificar se o arquivo existe
        const pasta = path.dirname(caminhoCompleto);
        if (fs.existsSync(pasta)) {
            console.log("[DEBUG] Conteúdo da pasta:", fs.readdirSync(pasta));
        } else {
            console.log("[DEBUG] Pasta não existe:", pasta);
        }
        return res.status(404).send("Arquivo não encontrado.");
    }

    console.log("[DEBUG] Arquivo encontrado, lendo conteúdo...");
    const conteudo = fs.readFileSync(caminhoCompleto, "utf8");
    res.type("text/plain").send(conteudo);
});
// ================= ROTA: BUSCAR CLIENTE =================
app.get("/buscar_cliente", async (req, res) => {
    const termo = req.query.termo || null;
    try {
        const clientes = await clientesDB.buscarClientes(termo);
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar clientes" });
    }
});

app.listen(PORT, () => console.log(`DocAI rodando em http://localhost:${PORT}`));