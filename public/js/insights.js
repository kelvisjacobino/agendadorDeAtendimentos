async function carregarInsights(){

const div = document.getElementById("listaInsights")

div.innerHTML="Carregando..."

const resp = await fetch("/insights")

const dados = await resp.json()

div.innerHTML=""

dados.forEach(i=>{

div.innerHTML += `

<div class="card">

<h3>${i.problema}</h3>

<p><b>Ocorrências:</b> ${i.ocorrencias}</p>

<p><b>Causa mais comum:</b> ${i.causa_mais_comum}</p>

<p><b>Solução mais usada:</b> ${i.solucao_mais_usada}</p>

</div>

`

})

}

async function gerarAnaliseIA(){

const div = document.getElementById("analiseIA")

div.innerHTML="Analisando..."

const resp = await fetch("/insights/ia")

const dados = await resp.json()

div.innerHTML = `

<div class="card">

${dados.analise.replace(/\n/g,"<br>")}

</div>

`

}