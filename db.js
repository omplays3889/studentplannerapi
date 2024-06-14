const sql = require('mssql');

const config = {
    user: 'studentplanner-db-admin',
    password: 'Password',
    server: 'studentplanner-db-server.database.windows.net', // You can use 'localhost\\instance' to connect to a named instance
    database: 'studentplanner-db',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Use this to trust the server certificate (self-signed certificates)
    }
};

let pool;

const connectToDatabase = async () => {
    if (pool) {
        return pool;
    }
    try {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server');
        return pool;
    } catch (err) {
        console.error('Database connection failed', err);
        throw err;
    }
};

const queryDatabase = async (query, params) => {
    try {
        const pool = await connectToDatabase();
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
};

module.exports = {
    queryDatabase
};
