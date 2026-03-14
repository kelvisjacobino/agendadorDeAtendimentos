const fs = require("fs")
const path = require("path")

const GEMINI_KEY = process.env.GEMINI_KEY

function lerIndex(){

const indexPath = path.join(process.cwd(),"index.json")

if(!fs.existsSync(indexPath)) return []

return JSON.parse(fs.readFileSync(indexPath,"utf8"))

}

async function gerarInsights(){

const index = lerIndex()

const mapaProblemas = {}

index.forEach(item=>{

const problema = (item.problema || "DESCONHECIDO").toUpperCase()
const causa = (item.causa || "").toUpperCase()
const solucao = (item.solucao || "").toUpperCase()

if(!mapaProblemas[problema]){

mapaProblemas[problema] = {
problema,
ocorrencias:0,
causas:{},
solucoes:{}
}

}

mapaProblemas[problema].ocorrencias++

if(causa){

mapaProblemas[problema].causas[causa] =
(mapaProblemas[problema].causas[causa] || 0) + 1

}

if(solucao){

mapaProblemas[problema].solucoes[solucao] =
(mapaProblemas[problema].solucoes[solucao] || 0) + 1

}

})

const resultado = Object.values(mapaProblemas).map(item=>{

const causaMaisComum = Object.entries(item.causas)
.sort((a,b)=>b[1]-a[1])[0]

const solucaoMaisUsada = Object.entries(item.solucoes)
.sort((a,b)=>b[1]-a[1])[0]

return {

problema:item.problema,
ocorrencias:item.ocorrencias,
causa_mais_comum: causaMaisComum ? causaMaisComum[0] : "",
solucao_mais_usada: solucaoMaisUsada ? solucaoMaisUsada[0] : ""

}

})

return resultado.sort((a,b)=>b.ocorrencias-a.ocorrencias)

}

async function gerarInsightsIA(){

const insights = await gerarInsights()

const resumo = insights.map(i=>

`Problema: ${i.problema}
Ocorrências: ${i.ocorrencias}
Causa: ${i.causa_mais_comum}
Solução: ${i.solucao_mais_usada}`

).join("\n\n")

const prompt = `

Analise os problemas de suporte abaixo e gere insights.

${resumo}

Explique:

1 problemas mais recorrentes
2 causas principais
3 melhorias sugeridas no sistema

`

const resposta = await fetch(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,

{
method:"POST",
headers:{ "Content-Type":"application/json" },

body:JSON.stringify({

contents:[{
parts:[{text:prompt}]
}]

})

}

)

const data = await resposta.json()

const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

return {analise:texto}

}

module.exports = {
gerarInsights,
gerarInsightsIA
}