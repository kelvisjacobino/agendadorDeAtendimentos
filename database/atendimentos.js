const oracledb = require("oracledb");
const { getConnection } = require("./oracle");

// database/atendimentos.js

async function salvarAtendimento(dados) {
    let conn;
    try {
        conn = await getConnection();
        // Usando MERGE para evitar ORA-00001 (Unique Constraint Violated)
        const sql = `
            MERGE INTO DOCAI_ATENDIMENTOS A
            USING (SELECT :codAtendimento AS COD_ATENDIMENTO FROM dual) X
            ON (A.COD_ATENDIMENTO = X.COD_ATENDIMENTO)
            WHEN MATCHED THEN
                UPDATE SET STATUS = :status, RESPONSAVEL = :responsavel, CONTEUDO = :conteudo
            WHEN NOT MATCHED THEN
                INSERT (COD_ATENDIMENTO, COD_CLIENTE, CLIENTE, DATA_ATENDIMENTO, RESPONSAVEL, STATUS, ARQUIVO_TXT, CONTEUDO)
                VALUES (:codAtendimento, :codCliente, :cliente, SYSDATE, :responsavel, :status, :arquivo, :conteudo)
        `;

        await conn.execute(sql, dados);
        await conn.commit();
        console.log(`[DB SUCCESS] Atendimento ${dados.codAtendimento} processado.`);
    } catch (err) {
        console.error("Erro ao salvar no banco:", err);
        throw err;
    } finally {
        if (conn) await conn.close();
    }
}
async function buscarNoBanco(termo) {
    let conn;
    try {
        conn = await getConnection();
        conn.outFormat = oracledb.OUT_FORMAT_OBJECT;

        const sql = `
            SELECT 
                COD_ATENDIMENTO AS "atendimento",
                CLIENTE AS "cliente",
                ARQUIVO_TXT AS "arquivo",
                CONTEUDO AS "conteudo"
            FROM DOCAI_ATENDIMENTOS
            WHERE LOWER(CONTEUDO) LIKE :termo 
               OR LOWER(CLIENTE) LIKE :termo
            ORDER BY DATA_ATENDIMENTO DESC
        `;

        const result = await conn.execute(sql, { termo: `%${termo.toLowerCase()}%` });
        return result.rows;
    } catch (err) {
        console.error("Erro na busca no banco:", err);
        return [];
    } finally {
        if (conn) await conn.close();
    }
}

module.exports = { salvarAtendimento, buscarNoBanco };