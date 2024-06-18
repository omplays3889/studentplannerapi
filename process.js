const sql = require("mssql");
const http = require('http');
const { queryDatabase } = require('./db.js');


  const getUsers = async (req) => {
    const parsedUrl = new URL(req.url, `https://${req.headers.host}/`);
    const emailID = parsedUrl.searchParams.get('email_id');
    const query = 'SELECT * FROM tbl_users WHERE email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: emailID }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getClasses = async (req) => {
    const parsedUrl = new URL(req.url, `https://${req.headers.host}/`);
    const emailID = parsedUrl.searchParams.get('email_id');
    const query = 'SELECT * FROM tbl_classes WHERE teacher_email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: emailID }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getAssignments = async (req) => {
    const parsedUrl = new URL(req.url, `https://${req.headers.host}/`);
    const emailID = parsedUrl.searchParams.get('email_id');
    const query = 'SELECT * FROM tbl_assignments WHERE owner_email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: emailID }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

module.exports = {
    getUsers, getClasses, getAssignments
};
