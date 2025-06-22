
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
    },
    // Setting timeouts
    connectionTimeout: 120000, // 120 seconds
    requestTimeout: 120000 // 120 seconds
};

async function connectWithRetry(retries = 5, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            let pool = await sql.connect(config);
            return pool;
        } catch (err) {
            console.error(`Attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) {
                throw new Error('Failed to connect to the database after multiple attempts.');
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

  const queryDatabase = async (query, params) => {
    try {
        let pool = await connectWithRetry();
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
