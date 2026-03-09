// ========================== NOVO.JS FINAL COM AUTO-CADASTRO E FUNÇÃO GLOBAL ==========================

// Expor funções globalmente para HTML
window.verificarCliente = verificarCliente;
window.gerarRelatorio = gerarRelatorio;

document.addEventListener("DOMContentLoaded", () => {
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
});

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
        responsavel: document.getElementById("responsavel").value,
        problema: document.getElementById("problema").value,
        causa: document.getElementById("causa").value,
        solucao: document.getElementById("solucao").value,
        status: document.getElementById("status").value
    };

    if (!dados.codCliente || !dados.cliente || !dados.codAtendimento) {
        console.warn("[JS WARN] Preenchimento incompleto, não é possível gerar relatório.");
        return alert("Por favor, preencha o código do cliente e do atendimento.");
    }

    const relatorio = `RELATÓRIO: ${dados.cliente}\nCOD: ${dados.codCliente}\nPROBLEMA: ${dados.problema}`;
    console.log(`[JS LOG] Gerando relatório para atendimento ${dados.codAtendimento}`);

    try {
        const resp = await fetch("/salvar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...dados, relatorio })
        });
        const res = await resp.json();
        if (res.status === "ok") {
            console.log(`[JS LOG] Atendimento ${dados.codAtendimento} salvo com sucesso em: ${res.arquivo}`);
            alert("Atendimento salvo com sucesso!");
            window.location.href = "index.html";
        } else {
            console.error(`[JS ERROR] Falha ao salvar atendimento:`, res);
            alert("Erro ao salvar atendimento.");
        }
    } catch (e) {
        console.error("[JS ERROR] Erro de conexão ao salvar atendimento:", e);
        alert("Erro de conexão");
    }
}
