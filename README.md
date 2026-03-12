# 🧠 DocAI — Plataforma Inteligente de Suporte Técnico com IA

<p align="center">
<img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js">
<img src="https://img.shields.io/badge/Oracle-Database-red?logo=oracle">
<img src="https://img.shields.io/badge/IA-Google%20Gemini-blue?logo=google">
<img src="https://img.shields.io/badge/Embeddings-Vector%20Search-purple">
<img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange">
<img src="https://img.shields.io/badge/License-MIT-lightgrey">
</p>

<p align="center">
<b>DocAI</b> transforma o histórico de suporte técnico em uma base de conhecimento inteligente utilizando Inteligência Artificial.
</p>

---

# 📌 Sobre o Projeto

O **DocAI** é uma plataforma desenvolvida para **registrar, pesquisar e diagnosticar atendimentos técnicos** utilizando:

- Inteligência Artificial
- Busca semântica
- Busca vetorial (embeddings)
- Histórico estruturado de suporte

A ideia central é transformar:

```
Histórico de atendimentos
```

em

```
Inteligência técnica reutilizável
```

permitindo que técnicos encontrem soluções rapidamente.

---

# 🎯 Objetivo

Reduzir o tempo de diagnóstico de problemas técnicos transformando soluções anteriores em **conhecimento automático**.

---

# ✨ Funcionalidades

## 📋 Registro de Atendimento

Cada atendimento registra:

- Cliente
- Código do atendimento
- Responsável
- Problema
- Causa
- Solução
- Status
- Relatório TXT automático

---

## 🔎 Busca Inteligente

DocAI possui múltiplos motores de busca:

| Motor | Descrição |
|------|------|
| Busca simples | pesquisa textual |
| Busca inteligente | ranking por relevância |
| Busca vetorial | similaridade semântica |
| Busca IA | análise contextual |

---

## 🧠 Diagnóstico Automático

Exemplo:

```
Pergunta:
Sistema não inicia
```

Resposta sugerida:

```
Problema: SISTEMA NÃO INICIA

Causa:
BANCO DE DADOS OFFLINE

Solução:
INICIADO BANCO VIA PUTTY
```

---

# 🤖 Inteligência Artificial

DocAI integra **Google Gemini AI** para:

- análise de histórico
- diagnóstico técnico
- sugestão de solução

---

# 🔬 Busca Vetorial (Embeddings)

O sistema gera embeddings utilizando:

```
Xenova/all-MiniLM-L6-v2
```

Isso permite encontrar problemas semelhantes mesmo com frases diferentes.

Exemplo:

```
ERP não abre
```

encontra

```
Sistema não inicia
```

---

# 🧬 Arquitetura do Sistema

```
                 Usuário
                    │
                    ▼
             Interface Web
          (HTML + JavaScript)
                    │
                    ▼
              Node.js / Express
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
   Oracle DB     index.json    vector_index.json
      │             │             │
      └─────────────┴──────┬──────┘
                            ▼
                       Google Gemini
```

---

# 📂 Estrutura do Projeto

```
docai
│
├── database
│   └── oracle.js
│
├── storage
│   ├── salvarTXT.js
│   └── docs/
│
├── public
│   ├── index.html
│   ├── novo.html
│   ├── app.js
│   └── novo.js
│
├── index.json
├── vector_index.json
├── server.js
└── README.md
```

---

# ⚙️ Instalação

## 1️⃣ Clonar o repositório

```bash
git clone https://github.com/seuusuario/docai.git
```

---

## 2️⃣ Instalar dependências

```bash
npm install
```

---

## 3️⃣ Criar arquivo `.env`

```
PORT=3033

DB_USER=usuario
DB_PASSWORD=senha
DB_CONNECTION_STRING=host:porta/servico

GEMINI_KEY=sua_chave_google_ai
```

---

## 4️⃣ Executar servidor

```bash
node server.js
```

Servidor iniciará em:

```
http://localhost:3033
```

---

# 🌐 Acesso externo

Se utilizar DDNS:

```
http://seuservidor.ddns.net:3033
```

---

# 📡 Endpoints Principais

| Endpoint | Função |
|------|------|
| `/buscar` | busca simples |
| `/buscar_inteligente` | ranking de resultados |
| `/buscar_vetorial` | busca por embeddings |
| `/buscar_semantico` | busca com IA |
| `/chat_suporte` | chat técnico |
| `/diagnostico` | diagnóstico automático |

---

# 📸 Interface

### Tela de busca

```
![Busca](docs/screenshots/busca.png)
```

### Cadastro de atendimento

```
![Cadastro](docs/screenshots/cadastro.png)
```

---

# 🎥 Demonstração

```
![Demo](docs/demo.gif)
```

---

# 🛣 Roadmap

Melhorias planejadas:

- autenticação de usuários
- dashboard de suporte
- métricas de chamados
- auto aprendizagem da base
- deploy em cloud
- interface mobile
- recomendação automática de solução

---

# 🧑‍💻 Autor

**Kelvis Jacobino**

Especialista em:

- ERP
- automação
- inteligência artificial aplicada ao suporte técnico

---

# ⭐ Contribuição

Pull requests são bem-vindos.

---

# 📜 Licença

MIT License

---

# 🚀 Visão

Transformar:

```
Suporte técnico manual
```

em

```
Suporte técnico assistido por IA
```

Criando uma plataforma inteligente de diagnóstico técnico.
