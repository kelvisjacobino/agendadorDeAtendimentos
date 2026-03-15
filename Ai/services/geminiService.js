const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MODEL } = require("../config/model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function analisarProblema(problema){

 const model = genAI.getGenerativeModel({
  model: MODEL
 });

 const prompt = `
Você é um analista de suporte técnico especializado em ERP.

Analise o problema abaixo e responda:

1) Diagnóstico provável
2) Como resolver

Problema:
${problema}
`;

 const result = await model.generateContent(prompt);

 return result.response.text();

}

module.exports = { analisarProblema };