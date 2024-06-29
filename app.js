const express = require('express');
const basicAuth = require('basic-auth');
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your allowed origin
};

const app = express();

const {getUsers, getClasses, getAssignments, createClass, createAssignment, createUser,
  deleteAssignment, deleteClass, deleteAllData
} = require('./process.js')

// Basic Authentication Middleware
const authMiddleware = (req, res, next) => {
  const user = basicAuth(req);

  if (!user || user.name !== process.env.API_USERNAME || user.pass !== process.env.API_PASSWORD) {
      res.set('WWW-Authenticate', 'Basic realm="studentforce"');
      return res.status(401).send('Unauthorized');
  }
  next();
};

app.use(cors(corsOptions));
app.use(authMiddleware);

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

  app.post('/api/deleteAllData', express.json(), async (req, res) => {
    const response = await deleteAllData();
    res.json({response });
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

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
    console.log("Delete data enpoint added - trial 2");
    console.log(`Port provided is ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
  });