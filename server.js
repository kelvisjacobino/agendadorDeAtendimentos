// ========================== SERVER.JS FINAL ==========================
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
            if (resultados.length > 0) console.log(`[SEARCH LOG] Foram encontrados ${resultados.length} itens no INDEX.JSON`);
        }
        if (resultados.length === 0 && termo.length > 0) {
            console.log(`[SEARCH LOG] Nada encontrado no JSON. Consultando Banco Oracle...`);
            resultados = await atendimentosDB.buscarNoBanco(termo);
        }
        console.log(`[SEARCH LOG] Retornando ${resultados.length} resultados totais.`);
        res.json(resultados);
    } catch (err) {
        console.error("[SEARCH LOG] Erro geral na busca:", err);
        res.status(500).json({ erro: "Erro ao processar busca" });
    }
});

// Rota salvar atendimento
app.post("/salvar", async (req, res) => {
    const { cliente, codCliente, codAtendimento, responsavel, status, relatorio } = req.body;
    console.log(`[SAVE LOG] Salvando atendimento: ${codAtendimento}, Cliente: ${cliente}`);
    try {
        await clientesDB.garantirCliente(codCliente, cliente);
        console.log(`[SAVE LOG] Cliente garantido: ${codCliente} - ${cliente}`);
        const resultadoTXT = salvarTXT(cliente, codAtendimento, relatorio);
        console.log(`[SAVE LOG] Arquivo salvo em: ${resultadoTXT.arquivo}`);
        await atendimentosDB.salvarAtendimento({ codAtendimento, codCliente, cliente, responsavel, status, arquivo: resultadoTXT.arquivo, conteudo: relatorio });
        console.log(`[SAVE LOG] Metadados salvos no Oracle para atendimento ${codAtendimento}`);
        indexador.atualizarIndex(cliente, codAtendimento, resultadoTXT.arquivo, relatorio);
        console.log(`[SAVE LOG] Index atualizado para atendimento ${codAtendimento}`);
        res.json({ status: "ok", arquivo: resultadoTXT.arquivo });
    } catch (error) {
        console.error("[SERVER ERROR] Falha ao salvar atendimento:", error);
        res.status(500).json({ status: "erro", mensagem: "Erro ao salvar atendimento" });
    }
});

// Rota análise IA
app.post("/analisar", async (req, res) => {
    try {
        const { codAtendimento } = req.body;
        console.log(`[AI LOG] Preparando análise para atendimento ${codAtendimento}`);
        const texto = await atendimentosDB.obterConteudoParaIA(codAtendimento);
        res.json({ status: "ok", conteudo: texto });
    } catch (error) {
        console.error("[AI ERROR] Falha ao preparar conteúdo para IA:", error);
        res.status(500).json({ status: "erro", mensagem: "Erro ao obter conteúdo para IA" });
    }
});

// Rota buscar cliente para preenchimento automático
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
