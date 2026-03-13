// ========================== NOVO.JS FINAL AUTOCOMPLETE HIERÁRQUICO DOC AI ==========================

// Expor funções globalmente para HTML
window.verificarCliente = verificarCliente;
window.gerarRelatorio = gerarRelatorio;

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("problema").addEventListener("input", ()=>{

clearTimeout(window.timerDiagnostico)

window.timerDiagnostico = setTimeout(()=>{

diagnosticar()

},2000)

})
    const codInput = document.getElementById("codCliente");
    if (codInput) {
        codInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                console.log("[JS LOG] Enter pressionado, verificando cliente...");
                verificarCliente();
            }
        });
    }
document.getElementById("problema").addEventListener("input", function(){

clearTimeout(window.timerSugestao)

window.timerSugestao = setTimeout(()=>{

sugerirSolucao()

},1500)

})
    // Configura autocomplete hierárquico para problema, causa e solução
    setupHierarchicalAutocomplete();
});

function usarSugestao(){

const texto = document.getElementById("textoSugestao").innerText

document.getElementById("solucao").value = texto

console.log("[IA] Solução aplicada automaticamente")

}
function setupHierarchicalAutocomplete() {
    const problemaInput = document.getElementById("problema");
    const causaInput = document.getElementById("causa");
    const solucaoInput = document.getElementById("solucao");
setupAutocomplete(problemaInput,'problema', async (problemaSelecionado)=>{

console.log("[IA] Problema selecionado:", problemaSelecionado)

const resp = await fetch(`/autocomplete?campo=causa&termo=${encodeURIComponent(problemaSelecionado)}`)

const causas = await resp.json()

if(causas.length>0){

console.log("[IA] Causa sugerida:", causas[0])

causaInput.value = causas[0]

}

})
setupAutocomplete(causaInput,'causa', async (causaSelecionada)=>{

console.log("[IA] Causa selecionada:", causaSelecionada)

const resp = await fetch(`/autocomplete?campo=solucao&termo=${encodeURIComponent(causaSelecionada)}`)

const solucoes = await resp.json()

if(solucoes.length>0){

console.log("[IA] Solução sugerida:", solucoes[0])

solucaoInput.value = solucoes[0]

}

})

async function diagnosticar(){

const problema = document.getElementById("problema").value

if(problema.length < 10){
return
}

console.log("[IA] Iniciando diagnóstico automático")

try{

const resp = await fetch(`/diagnostico?termo=${encodeURIComponent(problema)}`)

const dados = await resp.json()

if(!dados){
return
}

console.log("[IA] Diagnóstico encontrado:", dados)

document.getElementById("causa").value = dados.causa || ""
document.getElementById("solucao").value = dados.solucao || ""

}catch(err){

console.error("[IA ERROR]",err)

}

}
setupAutocomplete(solucaoInput,'solucao')
    // Autocomplete problema
    setupAutocomplete(problemaInput, 'problema', async (selectedProblema) => {
        // Após selecionar problema, buscar causas relacionadas
        const resp = await fetch(`/autocomplete?campo=causa&termo=${encodeURIComponent(selectedProblema)}`);
        const causas = await resp.json();
        if (causas.length > 0) {
            causaInput.value = causas[0]; // preenche primeira sugestão automaticamente
        }
    });

    // Autocomplete causa
    setupAutocomplete(causaInput, 'causa', async (selectedCausa) => {
        // Após selecionar causa, buscar soluções relacionadas
        const resp = await fetch(`/autocomplete?campo=solucao&termo=${encodeURIComponent(selectedCausa)}`);
        const solucoes = await resp.json();
        if (solucoes.length > 0) {
            solucaoInput.value = solucoes[0];
        }
    });

    // Autocomplete solução simples
    setupAutocomplete(solucaoInput, 'solucao');
}
async function sugerirSolucao() {
console.log("[IA DEBUG] sugerirSolucao chamada")
const problema = document.getElementById("problema").value

if(problema.length < 10){
return
}

console.log("[IA] Buscando sugestão para:", problema)

try{
console.log("[IA DEBUG] Enviando termo:", problema)
const resposta = await fetch(`/buscar_semantico?termo=${encodeURIComponent(problema)}`)

const dados = await resposta.json()

if(!dados || dados.length === 0){
return
console.log("[IA DEBUG] Resposta recebida:", dados)
}

const melhor = dados[0]

document.getElementById("textoSugestao").innerText = melhor.solucao || melhor.SOLUCAO

document.getElementById("sugestaoIA").style.display = "block"

}catch(err){

console.error("[IA ERROR]", err)

}

}

function setupAutocomplete(input, campo, onSelect) {
    const containerId = input.id + "_suggestions";
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement("ul");
        container.id = containerId;
        container.style.position = "absolute";
        container.style.background = "#fff";
        container.style.border = "1px solid #ccc";
        container.style.listStyle = "none";
        container.style.padding = "0";
        container.style.margin = "0";
        container.style.width = input.offsetWidth + "px";
        container.style.maxHeight = "150px";
        container.style.overflowY = "auto";
        input.parentNode.appendChild(container);
    }

    input.addEventListener("input", async () => {
        const termo = input.value;
        if (!termo) {
            container.innerHTML = "";
            return;
        }

        try {
            const resp = await fetch(`/autocomplete?campo=${campo}&termo=${encodeURIComponent(termo)}`);
            const sugestoes = await resp.json();

            container.innerHTML = "";
            sugestoes.forEach(s => {
                const li = document.createElement("li");
                li.textContent = s;
                li.style.padding = "4px 8px";
                li.style.cursor = "pointer";
                li.addEventListener("click", () => {
                    input.value = s;
                    container.innerHTML = "";
                    if (onSelect) onSelect(s);
                });
                container.appendChild(li);
            });
        } catch (err) {
            console.error(`[AUTOCOMPLETE ERROR] Campo: ${campo}`, err);
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target !== input) container.innerHTML = "";
    });
}

async function verificarCliente() {
    const codInput = document.getElementById("codCliente");
    const nomeInput = document.getElementById("clienteNovo");
    const cod = codInput.value.trim();

    if (!cod) return;

    try {
        console.log(`[JS LOG] Buscando cliente no servidor para código: ${cod}`);
        const resposta = await fetch(`/buscar_cliente?termo=${encodeURIComponent(cod)}`);
        const clientes = await resposta.json();
        console.log("[JS LOG] Dados recebidos do /buscar_cliente:", clientes);

        let clienteEncontrado = clientes.find(c => String(c.codigo) === String(cod));

        if (!clienteEncontrado && nomeInput.value.trim() !== "") {
            const nomeNovo = nomeInput.value.trim();
            console.log(`[JS LOG] Cliente não encontrado, criando novo: ${cod} - ${nomeNovo}`);
            const criarResp = await fetch("/salvar_cliente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codCliente: cod, nome: nomeNovo })
            });
            const resCriar = await criarResp.json();
            if (resCriar.status === "ok") {
                console.log(`[JS LOG] Cliente ${cod} - ${nomeNovo} criado com sucesso.`);
                clienteEncontrado = { codigo: cod, nome: nomeNovo };
            } else {
                console.error(`[JS ERROR] Falha ao criar cliente:`, resCriar);
            }
        }

        if (clienteEncontrado) {
            console.log("[JS LOG] Cliente identificado:", clienteEncontrado.nome);
            nomeInput.value = clienteEncontrado.nome;
            nomeInput.readOnly = true;
            document.getElementById("codAtendimento").focus();
        } else {
            console.warn("[JS WARN] Nenhum cliente encontrado e nenhum nome fornecido para criação.");
            nomeInput.value = "";
            nomeInput.readOnly = false;
            nomeInput.placeholder = "Cliente novo! Digite o nome.";
        }
    } catch (e) {
        console.error("[JS ERROR] Erro na requisição de cliente:", e);
    }
}

async function gerarRelatorio() {
    const dados = {
        cliente: document.getElementById("clienteNovo").value,
        codCliente: document.getElementById("codCliente").value,
        codAtendimento: document.getElementById("codAtendimento").value,
        responsavel: localStorage.getItem("usuario_nome"),
        problema: document.getElementById("problema").value,
        causa: document.getElementById("causa").value,
        solucao: document.getElementById("solucao").value,
        status: document.getElementById("status").value
    };

    if (!dados.codCliente || !dados.cliente || !dados.codAtendimento) {
        console.warn("[JS WARN] Preenchimento incompleto, não é possível gerar relatório.");
        return alert("Por favor, preencha o código do cliente e do atendimento.");
    }

    try {
        const resp = await fetch("/salvar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const res = await resp.json();

        if (res.status === "ok") {
            console.log(`[JS LOG] Atendimento ${dados.codAtendimento} salvo com sucesso.`);

            const caminhoRelatorio = res.arquivo.replace(/\\/g, '/');
            console.log(`[JS LOG] Caminho do relatório (relativo): ${caminhoRelatorio}`);

            window.open(`/abrir?caminho=${encodeURIComponent(caminhoRelatorio)}`, '_blank');
        } else {
            console.error("[JS ERROR] Falha ao salvar atendimento:", res);
            alert("Erro ao salvar atendimento.");
        }
    } catch (e) {
        console.error("[JS ERROR] Erro de conexão ao salvar atendimento:", e);
        alert("Erro de conexão");
    }
}