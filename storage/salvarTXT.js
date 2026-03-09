const fs = require("fs")

function salvarTXT(cliente,codAtendimento,relatorio){

const agora = new Date()

const ano = agora.getFullYear()
const mes = String(agora.getMonth()+1).padStart(2,"0")
const dia = String(agora.getDate()).padStart(2,"0")

const dataArquivo = `${ano}${mes}${dia}`

const nomeCliente = cliente.replace(/\s+/g,"_")

const nomeArquivo = `${nomeCliente}_ATD${codAtendimento}_${dataArquivo}.txt`

const pasta = `docs/${ano}/${mes}`

if(!fs.existsSync(pasta)){
fs.mkdirSync(pasta,{recursive:true})
}

if(fs.existsSync(pasta)){

const arquivos = fs.readdirSync(pasta)

const existe = arquivos.some(arq => arq.includes(`ATD${codAtendimento}`))

if(existe){

return {
erro:true,
mensagem:"Código de atendimento já existe neste mês"
}

}

}

const caminho = `${pasta}/${nomeArquivo}`

fs.writeFileSync(caminho,relatorio)
// atualizar index

const indexPath = "index.json"

let index = []

if(fs.existsSync(indexPath)){
index = JSON.parse(fs.readFileSync(indexPath,"utf8"))
}

index.push({

cliente: cliente,
atendimento: codAtendimento,
arquivo: nomeArquivo,
caminho: caminho,
data: dataArquivo,
conteudo: relatorio.toLowerCase()

})

fs.writeFileSync(indexPath,JSON.stringify(index,null,2))

return {
erro:false,
arquivo:caminho
}

}

module.exports = salvarTXT