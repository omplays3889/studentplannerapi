const express = require('express');
const basicAuth = require('basic-auth');
const cors = require('cors');
require('./scheduler.js')

const corsOptions = {
  origin: ['http://localhost:3000', 
    'https://witty-stone-06908e31e.2.azurestaticapps.net/',
    'https://witty-stone-06908e31e.2.azurestaticapps.net',
    'https://www.witty-stone-06908e31e.2.azurestaticapps.net/',
    'https://www.witty-stone-06908e31e.2.azurestaticapps.net',
    'https://students-planner.net/',
    'https://students-planner.net',
    'https://www.students-planner.net/',
    'https://www.students-planner.net']
};

const app = express();
const {unsubscribe, getUsers, getGroups, getAssignments, createGroup, createAssignment, createUser,
  deleteAssignment, deleteGroup, deleteAllData
} = require('./process.js')

// Basic Authentication Middleware
const authMiddleware = (req, res, next) => {
  if (req.path === '/api/unsubscribe') {
    return next();
  }

  if (req.path === '/api/health') {
    return next();
  }

  const user = basicAuth(req);

  if (!user || user.name !== process.env.API_USERNAME || user.pass !== process.env.API_PASSWORD) {
      res.set('WWW-Authenticate', 'Basic realm="studentforce"');
      return res.status(401).send('Unauthorized');
  }
  next();
};

app.use(cors(corsOptions));
app.use(authMiddleware);

app.get('/api/health', async (req, res) => {
  console.log("ping received");
  res.end();
});

app.get('/api/unsubscribe', async (req, res) => {
  const queryParams = req.query;
  let result =  await unsubscribe(queryParams.token);
  res.write(result);
  res.end();
});

app.get('/api/getuser', async (req, res) => {
    const queryParams = req.query;
    const results = await getUsers(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.get('/api/obtaingroups', async (req, res) => {
    const queryParams = req.query;
    const results = await getGroups(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.get('/api/obtainassignments', async (req, res) => {
    const queryParams = req.query;
    const results = await getAssignments(queryParams.email_id);
    res.write(JSON.stringify(results));
    res.end();
});

app.post('/api/creategroup', express.json(), async (req, res) => {
    const queryParams = req.query;
    const body = req.body;
    const group_id = await createGroup(queryParams.email_id, body);
    res.json({ group_id });
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

app.post('/api/deletegroup', express.json(), async (req, res) => {
      const queryParams = req.query;
      const body = req.body;
      await deleteGroup(body);
      res.json( "SUCCESS" );
      });

app.post('/api/updategroup', express.json(), async (req, res) => {
        const queryParams = req.query;
        const body = req.body;
        await deleteGroup(body);
        const group_id = await createGroup(queryParams.email_id, body);
        res.json({ group_id });
      });

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
    console.log("App updated - version 6");
    console.log(`Port provided is ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
  });