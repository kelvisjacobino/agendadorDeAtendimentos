require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function testar(){

 const model = genAI.getGen
 erativeModel({
  model: "gemini-2.5-flash"
 });

 const result = await model.generateContent("Responda apenas: OK");

 console.log(result.response.text());

}

testar();