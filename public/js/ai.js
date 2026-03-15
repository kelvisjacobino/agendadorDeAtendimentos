async function analisarErro(){

 const erro = document.getElementById("erro").value

 const resp = await fetch("/api/ai/copiloto",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body: JSON.stringify({
   pergunta: erro
  })
 })

 const data = await resp.json()

 document.getElementById("resposta").innerText = data.resposta

}