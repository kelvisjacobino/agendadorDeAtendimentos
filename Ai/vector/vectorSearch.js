const fs = require("fs")
const path = require("path")

const indexPath = path.join(__dirname,"../../vector_index.json")

function similaridade(v1,v2){

 if(!v1 || !v2) return 0

 let score = 0

 for(const palavra in v1){

  if(v2[palavra]){
   score += v1[palavra] * v2[palavra]
  }

 }

 return score
}

function buscarSemelhante(queryVector){

 const data = JSON.parse(fs.readFileSync(indexPath))

 let melhor = null
 let melhorScore = 0

 for(const item of data){

  if(!item.vector) continue

  const score = similaridade(queryVector,item.vector)

  if(score > melhorScore){

   melhorScore = score
   melhor = item

  }

 }

 if(melhorScore > 0 && melhor){
  return melhor.texto || melhor.pergunta || null
 }

 return null
}

module.exports = { buscarSemelhante }