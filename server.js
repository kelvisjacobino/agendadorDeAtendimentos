// ========================== SERVER.JS FINAL COM LOGS DETALHADOS ==========================
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
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3033;

// Rota buscar atendimentos
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
            console.log(`[SEARCH LOG] Nada encontrado no JSON. Consultando Banco Oracle...`);
            resultados = await atendimentosDB.buscarNoBanco(termo);
            console.log(`[SEARCH LOG] Encontrados no Oracle: ${resultados.length}`);
        }
        console.log(`[SEARCH LOG] Retornando ${resultados.length} resultados.`);
        res.json(resultados);
    } catch (err) {
        console.error("[SEARCH ERROR] Erro na busca de atendimentos:", err);
        res.status(500).json({ erro: "Erro ao processar busca" });
    }
});

// Rota salvar cliente
app.post("/salvar_cliente", async (req, res) => {
    const { codCliente, nome } = req.body;
    console.log(`[CLIENT LOG] Requisição para criar cliente: ${codCliente} - ${nome}`);
    try {
        await clientesDB.garantirCliente(codCliente, nome);
        console.log(`[CLIENT LOG] Cliente ${codCliente} - ${nome} criado/garantido com sucesso.`);
        res.json({ status: "ok", codCliente, nome });
    } catch (err) {
        console.error(`[CLIENT ERROR] Falha ao criar cliente ${codCliente}:`, err);
        res.status(500).json({ status: "erro", mensagem: "Erro ao criar cliente" });
    }
});

// Rota salvar atendimento
app.post("/salvar", async (req, res) => {
    const { cliente, codCliente, codAtendimento, responsavel, status, relatorio } = req.body;
    console.log(`[SAVE LOG] Requisição recebida para salvar atendimento: ${codAtendimento}, Cliente: ${cliente} (${codCliente})`);
    try {
        await clientesDB.garantirCliente(codCliente, cliente);
        console.log(`[SAVE LOG] Cliente garantido: ${codCliente} - ${cliente}`);
        const resultadoTXT = salvarTXT(cliente, codAtendimento, relatorio);
        console.log(`[SAVE LOG] Arquivo físico criado: ${resultadoTXT.arquivo}`);
        await atendimentosDB.salvarAtendimento({ codAtendimento, codCliente, cliente, responsavel, status, arquivo: resultadoTXT.arquivo, conteudo: relatorio });
        console.log(`[SAVE LOG] Atendimento ${codAtendimento} salvo no Oracle`);
        indexador.atualizarIndex(cliente, codAtendimento, resultadoTXT.arquivo, relatorio);
        console.log(`[SAVE LOG] Index atualizado para atendimento ${codAtendimento}`);
        res.json({ status: "ok", arquivo: resultadoTXT.arquivo });
    } catch (error) {
        console.error("[SAVE ERROR] Falha ao salvar atendimento:", error);
        res.status(500).json({ status: "erro", mensagem: "Erro ao salvar atendimento" });
    }
});

// Rota análise IA
app.post("/analisar", async (req, res) => {
    const { codAtendimento } = req.body;
    console.log(`[AI LOG] Requisição de análise IA para atendimento ${codAtendimento}`);
    try {
        const texto = await atendimentosDB.obterConteudoParaIA(codAtendimento);
        console.log(`[AI LOG] Conteúdo obtido para atendimento ${codAtendimento}`);
        res.json({ status: "ok", conteudo: texto });
    } catch (error) {
        console.error("[AI ERROR] Falha na análise IA:", error);
        res.status(500).json({ status: "erro", mensagem: "Erro ao obter conteúdo para IA" });
    }
});

// Rota buscar cliente
app.get("/buscar_cliente", async (req, res) => {
    const termo = req.query.termo || null;
    console.log(`[CLIENT LOG] Buscando cliente para termo: ${termo}`);
    try {
        const clientes = await clientesDB.buscarClientes(termo);
        console.log(`[CLIENT LOG] Clientes encontrados: ${clientes.length}`);
        res.json(clientes);
    } catch (err) {
        console.error("[CLIENT ERROR] Falha ao buscar clientes:", err);
        res.status(500).json({ erro: "Erro ao buscar clientes" });
    }
});

app.listen(PORT, () => console.log(`DocAI rodando em http://localhost:${PORT}`));