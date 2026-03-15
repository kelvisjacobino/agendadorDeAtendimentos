async function enviarPergunta(){

 const perguntaInput = document.getElementById("pergunta")
 const pergunta = perguntaInput.value

 if(!pergunta) return

 adicionarMensagem(pergunta,"user")

 perguntaInput.value=""

 const resp = await fetch("/api/ai/copiloto",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body: JSON.stringify({
   pergunta
  })
 })

const data = await resp.json()

adicionarMensagem(data.resposta,"ai")

if(data.origem === "ATENDIMENTOS"){
 adicionarMensagem("📚 Baseado em atendimentos anteriores","info")
}

if(data.origem === "IA"){
 adicionarMensagem("🤖 Resposta gerada pela IA","info")
}

}

function adicionarMensagem(texto,tipo){

 const chat = document.getElementById("chat-box")

 const div = document.createElement("div")

if(tipo === "user"){
 div.className = "msg-user"
}else if(tipo === "info"){
 div.className = "msg-info"
}else{
 div.className = "msg-ai"
}

 div.innerHTML = texto

 chat.appendChild(div)

 chat.scrollTop = chat.scrollHeight

}
document.getElementById("pergunta").addEventListener("keydown", function(e){

 if(e.key === "Enter" && !e.shiftKey){

  e.preventDefault()

  enviarPergunta()

 }

})