const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MODEL } = require("../config/model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function gerarRespostaCliente(problema, solucao){

 const model = genAI.getGenerativeModel({
  model: MODEL
 });

 const prompt = `
Você é um analista de suporte.

Transforme o diagnóstico técnico em uma resposta clara e educada para o cliente.

Problema:
${problema}

Solução aplicada:
${solucao}
`;

 const result = await model.generateContent(prompt);

 return result.response.text();
}

module.exports = { gerarRespostaCliente };