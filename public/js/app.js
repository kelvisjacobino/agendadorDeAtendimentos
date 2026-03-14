// ===============================
// DOC AI - APP.JS OTIMIZADO
// ===============================

// ======================================
// EVENTOS AO CARREGAR A PÁGINA
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("[JS INIT] App carregado.");

    const campoBusca = document.getElementById("termoBusca");

    if (campoBusca) {

        campoBusca.addEventListener("keypress", function(e){

            if(e.key === "Enter"){
                e.preventDefault();
                console.log("[JS] Enter pressionado → iniciando busca");
                buscar();
            }

        });

    }
    const usuario = localStorage.getItem("usuario_nome") || "Usuário"

const campo = document.getElementById("nomeUsuarioIA")

if(campo){
campo.innerText = usuario
}

    const inputIA = document.getElementById("perguntaIA")

if(inputIA){

inputIA.addEventListener("keypress", function(e){

if(e.key === "Enter"){

e.preventDefault()

perguntarIA()

}

})

}


});


// ======================================
// GERAR RELATÓRIO
// ======================================

async function gerarRelatorio(){

    console.log("[JS] Gerando relatório...");

    const cliente = document.getElementById("cliente").value
    const codCliente = document.getElementById("codCliente").value
    const codAtendimento = document.getElementById("codAtendimento").value
    const responsavel = document.getElementById("responsavel").value
    const problema = document.getElementById("problema").value
    const causa = document.getElementById("causa").value
    const solucao = document.getElementById("solucao").value
    const status = document.getElementById("status").value

    const data = new Date().toLocaleString("pt-BR")

    const relatorio = `
========================================
RELATORIO DE ATENDIMENTO
========================================
CLIENTE: ${cliente}
COD CLIENTE: ${codCliente}
COD ATENDIMENTO: ${codAtendimento}
DATA: ${data}
RESPONSAVEL: ${responsavel}
----------------------------------------
PROBLEMA:
${problema}
----------------------------------------
CAUSA RAIZ:
${causa}
----------------------------------------
SOLUCAO:
${solucao}
----------------------------------------
STATUS: ${status}
========================================
`

    try{

        const resposta = await fetch("/salvar",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                cliente,
                codCliente,
                codAtendimento,
                responsavel,
                status,
                relatorio

            })

        })

        console.log("[JS] Atendimento enviado para o servidor.");

        alert("Atendimento salvo!")

    }catch(err){

        console.error("[JS ERROR] Falha ao salvar atendimento:", err);

    }

}


// ======================================
// BUSCA DE CLIENTES
// ======================================

async function buscarCliente(){

    const termo = document.getElementById("buscaCliente").value

    console.log("[JS] Buscando cliente:", termo)

    const resposta = await fetch(`/buscar?termo=${encodeURIComponent(termo)}`)

    const dados = await resposta.json()

    const div = document.getElementById("resultadoCliente")

    div.innerHTML = ""

    dados.forEach(item => {

        div.innerHTML += `
        <div class="card mb-2">
        <div class="card-body">

        <strong>${item.cliente}</strong>

        <button class="btn btn-sm btn-success float-end" onclick="selecionarCliente('${item.cliente}')">
        Selecionar
        </button>

        </div>
        </div>
        `

    })

}


// ======================================
// AUTOCOMPLETE CLIENTE
// ======================================

async function autocompleteCliente(){

    const termoDigitado = document.getElementById("cliente").value

    let termo = termoDigitado

    if(termoDigitado === "" || termoDigitado === "%") termo = "%"

    console.log("[JS] Autocomplete cliente:", termo)

    const resposta = await fetch(`/buscar_cliente?termo=${encodeURIComponent(termo)}`)

    const clientes = await resposta.json()

    const div = document.getElementById("listaClientes")

    div.innerHTML = ""

    clientes.forEach(c => {

        div.innerHTML += `
            <button class="list-group-item list-group-item-action"
                onclick="selecionarCliente('${c.codigo}','${c.nome}')">

                ${c.nome} (${c.codigo})

            </button>
        `

    })

}


function selecionarCliente(codigo,nome){

    console.log("[JS] Cliente selecionado:", codigo, nome)

    document.getElementById("codCliente").value = codigo
    document.getElementById("cliente").value = nome
    document.getElementById("listaClientes").innerHTML = ""

}


// ======================================
// BUSCA INTELIGENTE DE ATENDIMENTOS
// ======================================

async function buscar() {

    const termo = document.getElementById("termoBusca").value;
    const div = document.getElementById("resultado");

    if (!termo) {
        div.innerHTML = '<div class="alert alert-warning">Digite algo para buscar.</div>';
        return;
    }

    console.log("[JS] Iniciando busca por:", termo);

    try {

        // ==============================
        // BUSCA LOCAL PRIMEIRO
        // ==============================

        const resposta = await fetch(`/buscar?termo=${encodeURIComponent(termo)}`);
        const dados = await resposta.json();

        console.log("[JS] Resultados recebidos:", dados.length);

        div.innerHTML = "";

        if (dados.length > 0) {

            dados.forEach(item => {

                const atendimento = item.atendimento || item.COD_ATENDIMENTO || "";
                const cliente = item.cliente || item.CLIENTE || "";
                const resumo = item.conteudo || item.CONTEUDO || "";
                const arquivo = item.arquivo || item.ARQUIVO || "";

                const card = `
                <div class="card mb-3 shadow-sm border-start border-primary border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title text-primary">Atendimento ${atendimento}</h5>
                            <span class="badge bg-secondary">${cliente}</span>
                        </div>

                        <p class="card-text mt-2">
                            ${resumo.substring(0,200)}...
                        </p>

                        <a href="/abrir?caminho=${encodeURIComponent(arquivo)}" 
                           target="_blank" 
                           class="btn btn-sm btn-outline-primary">

                           Ver relatório
                        </a>
                    </div>
                </div>
                `;

                div.innerHTML += card;

            });

            return;

        }

        // ==============================
        // SE NÃO ENCONTROU LOCAL
        // ==============================

        console.log("[JS] Nenhum resultado local encontrado");

        div.innerHTML = `
        <div class="alert alert-warning">
            Nenhum resultado encontrado localmente.
            <br><br>
            <button onclick="buscarIA('${termo}')" class="btn btn-primary">
                Buscar com IA
            </button>
        </div>
        `;

    } catch (error) {

        console.error("[JS ERROR]", error);

        div.innerHTML = `
        <div class="alert alert-danger">
            Erro ao realizar busca.
        </div>
        `;

    }

}

async function perguntarIA(){

const pergunta = document.getElementById("perguntaIA").value

const chat = document.getElementById("chatBox")
const usuario = localStorage.getItem("usuario_nome") || "desconhecido"

console.log("[JS] Pergunta enviada para IA:", pergunta)
console.log("[JS] Usuário logado:", usuario)

const resposta = await fetch(`/chat_suporte?pergunta=${encodeURIComponent(pergunta)}&usuario=${encodeURIComponent(usuario)}`)

const dados = await resposta.json()

if(!pergunta) return

console.log("[JS] Pergunta enviada para IA:", pergunta)

chat.innerHTML += `
<div style="text-align:right;margin-bottom:10px">
<b>Você:</b><br>
${pergunta}
</div>
`

document.getElementById("perguntaIA").value=""

chat.innerHTML += `
<div id="iaLoading" style="color:#999">
IA pensando...
</div>
`

chat.scrollTop = chat.scrollHeight

try{

const resp = await fetch(`/perguntar?pergunta=${encodeURIComponent(pergunta)}`)
const dados = await resp.json()

document.getElementById("iaLoading").remove()

let resposta = ""

if(!dados || dados.length === 0){

resposta = "Nenhuma solução encontrada."

}else{

dados.forEach(r=>{

resposta += `
<div style="margin-bottom:10px">

<b>Problema:</b> ${r.problema}<br>
<b>Causa:</b> ${r.causa}<br>
<b>Solução:</b> ${r.solucao}

</div>
`

})

}

chat.innerHTML += `
<div style="text-align:left;margin-bottom:15px;color:#0d6efd">
<b>DocAI:</b><br>
${resposta}
</div>
`

chat.scrollTop = chat.scrollHeight

}catch(err){

console.error("[JS ERROR]",err)

chat.innerHTML += `
<div style="color:red">Erro ao consultar IA</div>
`

}

}



async function buscarGemini(termo){

    console.log("[JS] Iniciando busca SEMÂNTICA com Gemini:", termo)

    const div = document.getElementById("resultado")

    div.innerHTML = `
    <div class="alert alert-info">
        Consultando IA... aguarde
    </div>
    `

    try{

        const resposta = await fetch(`/buscar_semantico?termo=${encodeURIComponent(termo)}`)

        if(!resposta.ok){
            throw new Error("Erro HTTP: " + resposta.status)
        }

        const dados = await resposta.json()

        console.log("[JS] Resposta Gemini:", dados)

        if(!Array.isArray(dados) || dados.length === 0){

            div.innerHTML = `
            <div class="alert alert-warning">
                A IA não encontrou solução no histórico.
            </div>
            `

            return
        }

        // usa a mesma função da busca local
        mostrarResultados(dados)

    }catch(err){

        console.error("[JS ERROR] Gemini:", err)

        div.innerHTML = `
        <div class="alert alert-danger">
            Erro ao consultar IA
        </div>
        `

    }

}

function alterarSenha(){

const senha = prompt("Digite sua nova senha")

if(!senha) return

fetch("/alterar_senha",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

usuario:localStorage.getItem("usuario_nome"),
senha

})

})
.then(r=>r.json())
.then(()=>{

alert("Senha alterada com sucesso")

})

}
