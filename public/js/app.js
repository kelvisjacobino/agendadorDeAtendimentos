async function gerarRelatorio(){

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

await fetch("/salvar",{

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

alert("Atendimento salvo!")

}
async function buscarCliente(){

const termo = document.getElementById("buscaCliente").value

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
function abrirBuscaCliente(){

window.open(
"/buscar_cliente.html",
"buscarCliente",
"width=600,height=500"
)

}
async function autocompleteCliente() {
    const termoDigitado = document.getElementById("cliente").value;
    let termo = termoDigitado;
    if(termoDigitado === "" || termoDigitado === "%") termo = "%";

    const resposta = await fetch(`/buscar_cliente?termo=${encodeURIComponent(termo)}`);
    const clientes = await resposta.json();

    const div = document.getElementById("listaClientes");
    div.innerHTML = "";

    clientes.forEach(c => {
        div.innerHTML += `
            <button class="list-group-item list-group-item-action"
                onclick="selecionarCliente('${c.codigo}','${c.nome}')">
                ${c.nome} (${c.codigo})
            </button>
        `;
    });
}

function selecionarCliente(codigo, nome){
    document.getElementById("codCliente").value = codigo;
    document.getElementById("cliente").value = nome;
    document.getElementById("listaClientes").innerHTML = "";
}
// public/js/app.js

async function buscar() {
    const termo = document.getElementById("termoBusca").value;
    const div = document.getElementById("resultado");
    
    if (!termo) {
        div.innerHTML = '<div class="alert alert-warning">Digite algo para buscar.</div>';
        return;
    }

    console.log(`[JS] Iniciando busca por: ${termo}`);

    try {
        const resposta = await fetch(`/buscar?termo=${encodeURIComponent(termo)}`);
        const dados = await resposta.json();

        console.log("[JS] Dados recebidos do servidor:", dados);

        div.innerHTML = ""; // Limpa a tela de resultados

        if (dados.length === 0) {
            div.innerHTML = '<div class="alert alert-info">Nenhum atendimento encontrado.</div>';
            return;
        }

        dados.forEach(item => {
            // Mapeamento flexível: aceita nomes vindos do JSON (minúsculos) ou Oracle (MAIÚSCULOS)
            const nAtendimento = item.atendimento || item.COD_ATENDIMENTO || "N/A";
            const nomeCliente = item.cliente || item.CLIENTE || "Desconhecido";
            const resumo = item.conteudo || item.CONTEUDO || "";
            const caminhoArq = item.arquivo || item.ARQUIVO_TXT || "";

            const cartao = `
                <div class="card mb-3 shadow-sm border-start border-primary border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title text-primary">Atendimento: ${nAtendimento}</h5>
                            <span class="badge bg-secondary">${nomeCliente}</span>
                        </div>
                        <p class="card-text mt-2" style="font-size: 0.9rem; color: #555;">
                            ${resumo.substring(0, 200)}...
                        </p>
                        <a href="/abrir?caminho=${encodeURIComponent(caminhoArq)}" target="_blank" class="btn btn-sm btn-outline-primary">
                            Ver Relatório Completo
                        </a>
                    </div>
                </div>
            `;
            div.innerHTML += cartao;
        });

    } catch (error) {
        console.error("[JS] Erro ao processar busca:", error);
        div.innerHTML = '<div class="alert alert-danger">Erro ao carregar resultados na tela.</div>';
    }
}