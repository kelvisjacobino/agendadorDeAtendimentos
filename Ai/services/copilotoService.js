const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getConnection } = require("../../database/oracle");
const { MODEL } = require("../config/model");
const oracledb = require("oracledb");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function copiloto(pergunta){

 console.log("Pergunta:", pergunta);

 const atendimentos = await buscarChamadosSemelhantes(pergunta);

 let contexto = "";
 let origem = "IA";

 if(atendimentos.length > 0){

  origem = "ATENDIMENTOS";
for(const row of atendimentos){

 let problema = row.problema || ""
 let causa = row.causa || ""
 let solucao = row.solucao || ""

 // tentar extrair do texto
 if(!problema && row.conteudo){

  const texto = row.conteudo.toLowerCase()

  const p = texto.match(/problema[:\-]\s*(.*)/)
  const c = texto.match(/causa[:\-]\s*(.*)/)
  const s = texto.match(/solucao[:\-]\s*(.*)/)

  if(p) problema = p[1]
  if(c) causa = c[1]
  if(s) solucao = s[1]

 }

 contexto += `
DocAI:

Problema: ${problema}
Causa: ${causa}
Solução: ${solucao}

`

}

 }

 const prompt = `
Você é um especialista em suporte técnico de ERP.

Utilize os atendimentos anteriores para ajudar o analista.

${contexto}

Pergunta do analista:
${pergunta}

Responda com:

Diagnóstico provável
Passos para solução
`;

 const model = genAI.getGenerativeModel({
  model: MODEL
 });

 const result = await model.generateContent(prompt);

 const resposta = result.response.text();

 return {
  resposta,
  origem
 };

}

async function buscarChamadosSemelhantes(pergunta){

 const conn = await getConnection();

 const result = await conn.execute(
 `SELECT
  PROBLEMA,
  CAUSA,
  SOLUCAO,
  CONTEUDO
  FROM DOCAI_ATENDIMENTOS
  ...
`,
{ p: `%${pergunta}%` },
{ outFormat: oracledb.OUT_FORMAT_OBJECT }
)

console.log("RESULTADO ORACLE:", result.rows)

return result.rows || []

}

module.exports = {
 copiloto
};