const fs = require("fs");
const path = require("path");

function salvarTXT(cliente, codAtendimento, responsavel, problema, causa, solucao, status) {
    const agora = new Date();
    const ano = String(agora.getFullYear());
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');

    const dataArquivo = `${ano}${mes}${dia}`;
    const timestamp = `${dia}/${mes}/${ano}, ${hora}:${minuto}:${segundo}`;

    const nomeCliente = cliente.replace(/\s+/g, "_");
    const nomeArquivo = `${nomeCliente}_ATD${codAtendimento}_${dataArquivo}.txt`;

    const pasta = path.join(__dirname, "docs", ano, mes);
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

    const caminhoCompleto = path.join(pasta, nomeArquivo);

    // Montar conteúdo no formato antigo separado por seções
    const relatorio = `========================================\nRELATORIO DE ATENDIMENTO\n========================================\n` +
        `CLIENTE: ${cliente}\n` +
        `COD CLIENTE: ${codAtendimento.toString().slice(0,4)}\n` +
        `COD ATENDIMENTO: ${codAtendimento}\n` +
        `DATA: ${timestamp}\n` +
        `RESPONSAVEL: ${responsavel}\n` +
        `----------------------------------------\n` +
        `PROBLEMA:\n${problema}\n` +
        `----------------------------------------\n` +
        `CAUSA RAIZ:\n${causa}\n` +
        `----------------------------------------\n` +
        `SOLUCAO:\n${solucao}\n` +
        `----------------------------------------\n` +
        `STATUS: ${status}\n` +
        `========================================\n`;

    fs.writeFileSync(caminhoCompleto, relatorio, 'utf8');
    console.log(`[FILE LOG] Arquivo salvo em: ${caminhoCompleto}`);

    const caminhoRelativo = path.relative(__dirname, caminhoCompleto);

    // Atualizar index.json
    const indexPath = path.join(__dirname, "index.json");
    let index = [];
    if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }

    index.push({
        cliente: cliente,
        atendimento: codAtendimento,
        arquivo: nomeArquivo,
        caminho: caminhoRelativo,
        data: dataArquivo,
        conteudo: relatorio.toLowerCase()
    });

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    return {
        erro: false,
        arquivo: caminhoRelativo,
        caminhoCompleto: caminhoCompleto
    };
}

module.exports = salvarTXT;