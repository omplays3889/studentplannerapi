const express = require('express');
const app = express();
const {getUsers, getClasses, getAssignments, createClass, createAssignment, createUser,
  deleteAssignment, deleteClass
} = require('./process.js')

app.get('/api/getuser', async (req, res) => {
    const queryParams = req.query;
    const results = await getUsers(queryParams.email_id);
    res.write(JSON.stringify(results));
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
    const class_id = await createClass(queryParams.email_id, body);
    res.json({ class_id });
  });

  app.post('/api/createuser', express.json(), async (req, res) => {
    const queryParams = req.query;
    const body = req.body;
    const user_id = await createUser(queryParams.email_id, body);
    res.json({ user_id });
  });

  
app.post('/api/createassignment', express.json(), async (req, res) => {
  const queryParams = req.query;
  const body = req.body;
  const assignment_id = await createAssignment(queryParams.email_id, body);
  res.json({ assignment_id });
  });

app.post('/api/deleteassignment', express.json(), async (req, res) => {
    const queryParams = req.query;
    const body = req.body;
    await deleteAssignment(queryParams.email_id, body);
    res.json( "SUCCESS" );
    });

app.post('/api/deleteclass', express.json(), async (req, res) => {
      const queryParams = req.query;
      const body = req.body;
      await deleteClass(queryParams.email_id, body);
      res.json( "SUCCESS" );
      });

app.post('/api/updateclass', express.json(), async (req, res) => {
        const queryParams = req.query;
        const body = req.body;
        await deleteClass(queryParams.email_id, body);
        const class_id = await createClass(queryParams.email_id, body);
        res.json({ class_id });
      });

const PORT = 9999;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });