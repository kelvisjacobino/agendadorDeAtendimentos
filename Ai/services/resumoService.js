const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MODEL } = require("../config/model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function resumirAtendimento(texto){

 const model = genAI.getGenerativeModel({
  model: MODEL
 });

 const prompt = `
Você é um analista de suporte técnico.

Resuma o atendimento abaixo de forma objetiva:

${texto}
`;

 const result = await model.generateContent(prompt);

 return result.response.text();
}

module.exports = { resumirAtendimento };