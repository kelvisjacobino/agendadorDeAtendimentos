const bcrypt = require("bcrypt")
const oracledb = require("oracledb")
const { getConnection } = require("../database/oracle")

async function autenticar(usuario,senha){

const conn = await getConnection()

const result = await conn.execute(
`SELECT USUARIO,NOME,SENHA_HASH,PERFIL
 FROM DOCAI_USUARIOS
 WHERE UPPER(USUARIO)=UPPER(:u)`,
{u:usuario},
{ outFormat: oracledb.OUT_FORMAT_OBJECT }
)

await conn.close()

if(result.rows.length === 0){
return null
}

const user = result.rows[0]

const senhaHash = user.SENHA_HASH

if(!senhaHash){
console.log("⚠️ SENHA_HASH não encontrado")
return null
}

const ok = await bcrypt.compare(senha, senhaHash)

if(!ok){
return null
}

return {
usuario:user.USUARIO,
nome:user.NOME,
perfil:user.PERFIL
}

}

module.exports = { autenticar }