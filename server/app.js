const express = require('express');
const snowflake = require('snowflake-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create a Snowflake connection configuration
const connection = snowflake.createConnection({
  account: 'tu31985.europe-west2.gcp',
  username: 'louisdwan',
  password: 'Ro3kwell1234$',
  warehouse: 'COMPUTE_WH',
  database: 'POTATOBOOKS',
  schema: 'POTATOSCHEMA',
  role: 'ACCOUNTADMIN'
});

// Connect to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.error('Unable to connect to Snowflake:', err.message);
  } else {
    console.log('Successfully connected to Snowflake with ID:', conn.getId());
  }
});

// Fetch books from Snowflake
app.get('/books', (req, res) => {
  const sql = `SELECT title, genre, author FROM books`;
  
  connection.execute({
    sqlText: sql,
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Failed to execute statement due to error:', err);
        res.status(500).json({ message: 'Error retrieving books' });
      } else {
        console.log('Books retrieved:', rows);
        res.json(rows);
      }
    }
  });
});

// Add a book to Snowflake
app.post('/books', (req, res) => {
  const { title, genre, author } = req.body;
  const sql = `INSERT INTO books (title, genre, author) VALUES (?, ?, ?)`;

  connection.execute({
    sqlText: sql,
    binds: [title, genre, author],
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Failed to execute statement due to error:', err);
        res.status(400).json({ message: 'Error adding book' });
      } else {
        console.log('Book added:', { title, genre, author });
        res.status(201).json({ message: 'Book added successfully' });
      }
    }
  });
});

app.get('/book/:id', (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  const books = {
      1: { title: "The Dragon's Call", content: "This is the full content of The Dragon's Call..." },
      2: { title: "Heartstrings", content: "This is the full content of Heartstrings..." }
  };

  const book = books[bookId];
  if (book) {
      res.json(book);
  } else {
      res.status(404).json({ message: 'Book not found.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
