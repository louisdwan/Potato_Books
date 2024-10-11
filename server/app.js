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
  const sql = `SELECT BOOK_ID, TITLE, PUBLISHED_YEAR FROM BOOKS`;

  connection.execute({
      sqlText: sql,
      complete: function (err, stmt, rows) {
          if (err) {
              console.error('Error retrieving books:', err);
              res.status(500).json({ message: 'Error retrieving books' });
          } else {
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

app.get('/book/:bookId', (req, res) => {
  const bookId = req.params.bookId;
  const sql = `SELECT BOOK_ID, TITLE, SUMMARY, PAGE_COUNT FROM BOOKS WHERE BOOK_ID = ?`;

  connection.execute({
      sqlText: sql,
      binds: [bookId],
      complete: function (err, stmt, rows) {
          if (err) {
              res.status(500).json({ message: 'Error retrieving book details' });
          } else if (rows.length > 0) {
              res.json(rows[0]);
          } else {
              res.status(404).json({ message: 'Book not found' });
          }
      }
  });
});

app.get('/book/:bookId/page/:pageNumber', (req, res) => {
  const { bookId, pageNumber } = req.params;
  const sql = `SELECT PAGE_NUMBER, CONTENT FROM BOOK_PAGES WHERE BOOK_ID = ? AND PAGE_NUMBER = ?`;

  connection.execute({
      sqlText: sql,
      binds: [bookId, pageNumber],
      complete: function (err, stmt, rows) {
          if (err) {
              res.status(500).json({ message: 'Error retrieving page content' });
          } else if (rows.length > 0) {
              res.json(rows[0]);
          } else {
              res.status(404).json({ message: 'Page not found' });
          }
      }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
