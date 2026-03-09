// ========================== CLIENTES.JS FINAL NORMALIZADO ==========================
const oracledb = require("oracledb");
const { getConnection } = require("./oracle");

async function garantirCliente(codCliente, nome) {
    const conn = await getConnection();
    console.log(`[CLIENT LOG] Garantindo cliente: ${codCliente} - ${nome}`);
    await conn.execute(
        `MERGE INTO DOCAI_CLIENTES C
         USING (SELECT :cod AS COD_CLIENTE, :nome AS NOME_CLIENTE FROM dual) X
         ON (C.COD_CLIENTE = X.COD_CLIENTE)
         WHEN NOT MATCHED THEN
         INSERT (COD_CLIENTE, NOME_CLIENTE) VALUES (X.COD_CLIENTE, X.NOME_CLIENTE)`,
        { cod: codCliente, nome: nome }
    );
    await conn.commit();
    console.log(`[CLIENT LOG] Cliente garantido no banco: ${codCliente}`);
    await conn.close();
}

async function buscarClientes(termo) {
    let conn;
    try {
        conn = await getConnection();
        console.log(`[CLIENT LOG] Executando busca de clientes para termo: ${termo}`);
        const result = await conn.execute(`
            SELECT COD_CLIENTE AS "codigo", NOME_CLIENTE AS "nome"
            FROM DOCAI_CLIENTES
            WHERE :termo IS NULL
               OR TO_CHAR(COD_CLIENTE) = :termo
               OR UPPER(NOME_CLIENTE) LIKE '%' || UPPER(:termo) || '%'
            ORDER BY NOME_CLIENTE
        `, { termo: termo || null }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const clientesNormalizados = result.rows.map(r => ({
            codigo: String(r.codigo || r.CODIGO || r.COD_CLIENTE || ''),
            nome: r.nome || r.NOME || ''
        }));

        console.log(`[CLIENT LOG] Clientes encontrados: ${clientesNormalizados.length}`);
        if (clientesNormalizados.length > 0) console.log(`[CLIENT LOG] Primeiro item (normalizado):`, JSON.stringify(clientesNormalizados[0]));

        return clientesNormalizados;
    } catch (err) {
        console.error("[CLIENT ERROR] Erro na busca de clientes:", err);
        throw err;
    } finally {
        if (conn) await conn.close();
    }
}

module.exports = { garantirCliente, buscarClientes };