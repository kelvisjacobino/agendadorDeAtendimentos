const fs = require("fs");
const path = require("path");

function atualizarIndex(cliente, atendimento, arquivo, conteudo) {
    const indexPath = path.join(__dirname, "../index.json");
    let index = [];

    if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    }

    // Garante que 'arquivo' seja definido antes de usar split
    const nomeArquivo = arquivo ? arquivo.split(path.sep).pop() : `${cliente}_ATD${atendimento}.txt`;

    const caminhoRelativo = arquivo || `docs/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${nomeArquivo}`;

    index.push({
        cliente: cliente,
        atendimento: atendimento,
        arquivo: nomeArquivo,
        caminho: caminhoRelativo,
        data: new Date().toISOString().slice(0,10).replace(/-/g,''),
        conteudo: conteudo.toLowerCase()
    });

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`[INDEX LOG] Index atualizado para atendimento ${atendimento}`);
}

module.exports = { atualizarIndex };
