const { getConnection } = require("../../database/oracle");

async function buscarConhecimento(pergunta){

 const conn = await getConnection()

 const result = await conn.execute(
 `
 SELECT RESPOSTA
 FROM AI_CONHECIMENTO
 WHERE LOWER(PERGUNTA) LIKE LOWER(:pergunta)
 FETCH FIRST 1 ROWS ONLY
 `,
 [`%${pergunta}%`]
 )

 if(result.rows.length > 0){
  return result.rows[0][0]
 }

 return null

}

async function salvarConhecimento(pergunta,resposta){

 const conn = await getConnection()

 await conn.execute(
 `
 INSERT INTO AI_CONHECIMENTO
 (PERGUNTA,RESPOSTA)
 VALUES (:1,:2)
 `,
 [pergunta,resposta],
 { autoCommit:true }
 )

}

module.exports = {
 buscarConhecimento,
 salvarConhecimento
}