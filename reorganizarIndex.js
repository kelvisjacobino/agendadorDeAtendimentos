const fs = require("fs")

const dados = JSON.parse(fs.readFileSync("index.json","utf8"))

const atendimentos = new Map()

for(const item of dados){

 const id = item.atendimento || Math.random()

 let problema = item.problema || ""
 let causa = item.causa || ""
 let solucao = item.solucao || ""

 const texto = (item.conteudo || "").toLowerCase()

 if(!problema){
  const m = texto.match(/problema[:\-]\s*(.*)/)
  if(m) problema = m[1]
 }

 if(!causa){
  const m = texto.match(/causa[:\-]\s*(.*)/)
  if(m) causa = m[1]
 }

 if(!solucao){
  const m = texto.match(/solucao[:\-]\s*(.*)/)
  if(m) solucao = m[1]
 }

 const registro = {
  cliente: item.cliente || "",
  atendimento: id,
  data: item.data || "",
  problema: problema || "",
  causa: causa || "",
  solucao: solucao || "",
  conteudo: item.conteudo || "",
  arquivo: item.caminho || item.arquivo || ""
 }

 atendimentos.set(id, registro)

}

const novoIndex = Array.from(atendimentos.values())

fs.writeFileSync(
 "index_reorganizado.json",
 JSON.stringify(novoIndex,null,2)
)

console.log("✅ index_reorganizado.json criado")
console.log("Total de atendimentos:", novoIndex.length)