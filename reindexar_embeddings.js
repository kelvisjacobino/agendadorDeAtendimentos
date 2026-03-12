const fs = require("fs")
const path = require("path")

const indexPath = path.join(__dirname,"index.json")
const vectorPath = path.join(__dirname,"vector_index.json")

const { pipeline } = require('@xenova/transformers')

let embedder = null

async function gerarEmbedding(texto){

if(!embedder){

embedder = await pipeline(
'feature-extraction',
'Xenova/all-MiniLM-L6-v2'
)

}

const output = await embedder(texto)

return Array.from(output.data)

}

async function reindexar(){

console.log("[REINDEX] Iniciando reindexação...")

if(!fs.existsSync(indexPath)){

console.log("[REINDEX] index.json não encontrado")

return

}

const index = JSON.parse(fs.readFileSync(indexPath,"utf8"))

let vectorIndex = []

if(fs.existsSync(vectorPath)){
vectorIndex = JSON.parse(fs.readFileSync(vectorPath,"utf8"))
}

const idsExistentes = new Set(vectorIndex.map(v => v.id))

for(const item of index){

const id = item.atendimento

if(idsExistentes.has(id)){
continue
}

console.log("[REINDEX] Gerando embedding:", id)

const texto = item.conteudo || ""

const embedding = await gerarEmbedding(texto)

vectorIndex.push({

id,
embedding

})

}

fs.writeFileSync(vectorPath, JSON.stringify(vectorIndex,null,2))

console.log("[REINDEX] Finalizado")

}

reindexar()