const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection config
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 120000,
    query_timeout: 120000,
    ssl: {
        rejectUnauthorized: false // Use this for self-signed certificates
    }
});

async function connectWithRetry(retries = 5, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // This tests the connection
            await pool.query('SELECT 1');
            return pool;
        } catch (err) {
            console.error(`Attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) {
                throw new Error('Failed to connect to the PostgreSQL database after multiple attempts.');
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

// query function using $1, $2, ... and parameter array
const queryDatabase = async (query, params = []) => {
    try {
        const client = await connectWithRetry();
        const result = await client.query(query, params);
        return result.rows;
    } catch (err) {
        console.error('Query failed:', err);
        throw err;
    }
};

module.exports = { queryDatabase };