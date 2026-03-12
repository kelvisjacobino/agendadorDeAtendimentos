const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
})

async function perguntarGemini(pergunta){

    console.log("[AI] Pergunta recebida:", pergunta)

    try{

        const result = await model.generateContent(pergunta)

        const resposta = result.response.text()

        console.log("[AI] Resposta gerada")

        return resposta

    }catch(err){

        console.error("[AI ERROR]",err)

        return "Erro ao consultar IA"

    }

}

module.exports = { perguntarGemini }