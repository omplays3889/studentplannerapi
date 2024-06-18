const sql = require("mssql");
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST, // You can use 'localhost\\instance' to connect to a named instance
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Use this to trust the server certificate (self-signed certificates)
    }
};

  const queryDatabase = async (query, params) => {
    try {
        let pool = await sql.connect(config)
        const request = pool.request();
        // Add parameters to the request
        if (params) {
            for (const param of params) {
                request.input(param.name, param.type, param.value);
            }
        }
        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Query failed', err);
        throw err;
    }
}

module.exports = {
    queryDatabase
};
