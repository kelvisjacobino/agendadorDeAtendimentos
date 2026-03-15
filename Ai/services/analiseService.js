const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MODEL } = require("../config/model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function analisarErro(erro){

 const model = genAI.getGenerativeModel({
  model: MODEL
 });

 const prompt = `
Você é um especialista em suporte técnico de ERP.

Analise o erro abaixo e informe:

1) Causa provável
2) Como corrigir

Erro:
${erro}
`;

 const result = await model.generateContent(prompt);

 return result.response.text();
}

module.exports = { analisarErro };