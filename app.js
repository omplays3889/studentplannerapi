const http = require('http');
const { queryDatabase } = require('./db.js');
const sql = require('mssql');
const {getUsers, getClasses, getAssignments} = require('./process.js')


const server = http.createServer( async(req, res) => {
if (req.url === '/')    {
    res.write('Hello World');
    res.end();
}
else if(req.url.startsWith('/api/getuser')) {
    const results = await getUsers(req);
    res.write(JSON.stringify(results));
    res.end();
}
else if(req.url.startsWith('/api/verifyuser')) {
    res.write('verifyUser');
    res.end();
}
else if(req.url.startsWith('/api/createclass')) {
    res.write('create class');
    res.end();
}
else if(req.url.startsWith('/api/obtainclasses')) {
    const results = await getClasses(req);
    res.write(JSON.stringify(results));
    res.end();
}
else if(req.url.startsWith('/api/createassignment')) {
    res.write('createassignment');
    res.end();
}
else if(req.url.startsWith('/api/obtainassignments')) {
    const results = await getAssignments(req);
    res.write(JSON.stringify(results));
    res.end();
}
else {
    res.write("Endpoint Not Found");
    res.end();
}
});
server.listen(9999);
console.log('listening on port 9999');