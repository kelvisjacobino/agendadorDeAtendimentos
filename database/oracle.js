const oracledb = require("oracledb");
require('dotenv').config(); // Carrega as variáveis do .env

let pool;

async function initializePool() {
    if (!pool) {
        pool = await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log("Pool de conexões Oracle inicializado.");
    }
}

async function getConnection() {
    await initializePool();
    return await pool.getConnection();
}

module.exports = { getConnection };