const express = require('express');
const app = express();
const {getUsers, getClasses, getAssignments, createClass} = require('./process.js')

app.get('/api/getuser', async (req, res) => {
    const queryParams = req.query;
    const results = await getUsers(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.get('/api/verifyuser', async (req, res) => {
     res.write("verifyuser called");
    res.end();
});

app.get('/api/obtainclasses', async (req, res) => {
    const queryParams = req.query;
    const results = await getClasses(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.get('/api/obtainassignments', async (req, res) => {
    const queryParams = req.query;
    const results = await getAssignments(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.post('/api/createclass', express.json(), async (req, res) => {
    const queryParams = req.query;
    const body = req.body;
    await createClass(queryParams.email_id, body);
    res.json({ body });
  });

app.post('/api/createassignment', express.json(), async (req, res) => {
    // Access body data
    const body = req.body;
    console.log('Body Data:', body);
    res.json({ body });
  });

const PORT = 9999;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });