const express = require('express');
const snowflake = require('snowflake-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
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

// Fetch books from Snowflake (without Redis)
app.get('/books', (req, res) => {
  const sql = `SELECT BOOK_ID, TITLE, PUBLISHED_YEAR FROM BOOKS`;

  connection.execute({
    sqlText: sql,
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Error retrieving books:', err);
        res.status(500).json({ message: 'Error retrieving books' });
      } else {
        res.json(rows); // Return books directly from Snowflake
      }
    }
  });
});

// Add a new book to Snowflake
app.post('/books', (req, res) => {
  const { title, author, genre, contentUrl } = req.body;

  const sql = `INSERT INTO BOOKS (TITLE, AUTHOR, GENRE, CONTENT_URL) VALUES (?, ?, ?, ?)`;

  connection.execute({
    sqlText: sql,
    binds: [title, author, genre, contentUrl],
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ message: 'Error adding book' });
      } else {
        console.log('Book added:', { title, author, genre });
        res.status(201).json({ message: 'Book added successfully' });
      }
    }
  });
});

// Fetch a single book's details by bookId
app.get('/book/:bookId', (req, res) => {
  const bookId = req.params.bookId;

  const incrementViewCountSQL = `
    UPDATE BOOKS
    SET VIEW_COUNT = VIEW_COUNT + 1
    WHERE BOOK_ID = ?
  `;

  connection.execute({
    sqlText: incrementViewCountSQL,
    binds: [bookId],
    complete: function (err, stmt) {
      if (err) {
        console.error('Error updating view count:', err);
        return res.status(500).json({ message: 'Error updating view count' });
      }

      const fetchBookDetailsSQL = `
        SELECT BOOK_ID, TITLE, SUMMARY, PAGE_COUNT, VIEW_COUNT
        FROM BOOKS
        WHERE BOOK_ID = ?
      `;

      connection.execute({
        sqlText: fetchBookDetailsSQL,
        binds: [bookId],
        complete: function (err, stmt, rows) {
          if (err) {
            return res.status(500).json({ message: 'Error retrieving book details' });
          } else if (rows.length > 0) {
            res.json(rows[0]);
          } else {
            res.status(404).json({ message: 'Book not found' });
          }
        }
      });
    }
  });
});

// Fetch a specific page of a book by bookId and pageNumber
app.get('/book/:bookId/page/:pageNumber', (req, res) => {
  const { bookId, pageNumber } = req.params;

  const sql = `SELECT PAGE_NUMBER, CONTENT FROM BOOK_PAGES WHERE BOOK_ID = ? AND PAGE_NUMBER = ?`;

  connection.execute({
    sqlText: sql,
    binds: [bookId, pageNumber],
    complete: function (err, stmt, rows) {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving page content' });
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