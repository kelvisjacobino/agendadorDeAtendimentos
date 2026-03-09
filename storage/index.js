const fs = require("fs")

function atualizarIndex(cliente,codAtendimento,arquivo,conteudo){

const indexPath = "index.json"

let index = []

if(fs.existsSync(indexPath)){
index = JSON.parse(fs.readFileSync(indexPath,"utf8"))
}

index.push({

cliente: cliente,
atendimento: codAtendimento,
arquivo: arquivo.split("/").pop(),
caminho: arquivo,
conteudo: conteudo.toLowerCase()

})

fs.writeFileSync(indexPath,JSON.stringify(index,null,2))

}

module.exports = { atualizarIndex }