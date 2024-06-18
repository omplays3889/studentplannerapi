const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

const { queryDatabase } = require('./db');

// Middleware to parse JSON
app.use(express.json());

let books = [
    { id: 1, title: "1984", author: "George Orwell" },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee" },
    { id: 3, title: "The Great Gatsby", author: "F. Scott Fitzgerald" }
];

// Get all books
app.get('/getUser/:emailID', async (req, res) => {
    try {
        console.log(req.params.emailID);
        const query = 'SELECT * FROM PlannerUser WHERE email_id = @emailID';
        const params = [
            { name: 'emailID', type: sql.VarChar, value: req.params.emailID }
        ];
        const results = await queryDatabase(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error running queries', err);
    }
});

// Create a new book
app.post('/User', (req, res) => {
    const newBook = {
        id: books.length + 1,
        title: req.body.title,
        author: req.body.author
    };
    books.push(newBook);
    res.status(201).json(newBook);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
