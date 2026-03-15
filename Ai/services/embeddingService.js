function gerarEmbedding(texto){

 texto = texto.toLowerCase()

 const palavras = texto.split(/\s+/)

 const vetor = {}

 for(const p of palavras){

  if(!vetor[p]){
   vetor[p] = 0
  }

  vetor[p]++

 }

 return vetor
}

module.exports = { gerarEmbedding }