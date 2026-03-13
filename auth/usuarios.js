const bcrypt = require("bcrypt")
const { getConnection } = require("../database/oracle")

async function autenticar(usuario, senha){

const conn = await getConnection()

const result = await conn.execute(
`SELECT * FROM DOCAI_USUARIOS WHERE USUARIO=:u`,
{u:usuario}
)

await conn.close()

if(result.rows.length === 0) return null

const user = result.rows[0]

const ok = await bcrypt.compare(senha,user.SENHA_HASH)

if(!ok) return null

return user
}

module.exports = {autenticar}