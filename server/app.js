const express = require('express');
const snowflake = require('snowflake-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient();

// Handle Redis errors
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

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

// Fetch books from Snowflake with Redis caching
app.get('/books', (req, res) => {
  const sql = `SELECT BOOK_ID, TITLE, PUBLISHED_YEAR FROM BOOKS`;

  redisClient.get('books', (err, books) => {
    if (books) {
      console.log('Serving books from Redis cache');
      return res.json(JSON.parse(books)); // Return cached books
    } else {
      connection.execute({
        sqlText: sql,
        complete: function (err, stmt, rows) {
          if (err) {
            console.error('Error retrieving books:', err);
            res.status(500).json({ message: 'Error retrieving books' });
          } else {
            redisClient.setex('books', 3600, JSON.stringify(rows)); // Cache result for 1 hour
            res.json(rows);
          }
        }
      });
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
        redisClient.del('books'); // Invalidate the cache
        res.status(201).json({ message: 'Book added successfully' });
      }
    }
  });
});

// Fetch book details and increment view count with Redis caching
app.get('/book/:bookId', (req, res) => {
  const bookId = req.params.bookId;

  // First, check Redis for cached book details
  redisClient.get(`book:${bookId}`, (err, book) => {
    if (book) {
      console.log(`Serving book ${bookId} from Redis cache`);
      return res.json(JSON.parse(book)); // Return cached data
    }

    // If not in cache, increment view count and fetch details from Snowflake
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
              const bookDetails = rows[0];
              redisClient.setex(`book:${bookId}`, 3600, JSON.stringify(bookDetails)); // Cache book details for 1 hour
              return res.json(bookDetails);
            } else {
              return res.status(404).json({ message: 'Book not found' });
            }
          }
        });
      }
    });
  });
});

// Fetch specific page of a book with Redis caching
app.get('/book/:bookId/page/:pageNumber', (req, res) => {
  const { bookId, pageNumber } = req.params;

  // Check Redis for cached page content
  redisClient.get(`book:${bookId}:page:${pageNumber}`, (err, page) => {
    if (page) {
      console.log(`Serving page ${pageNumber} of book ${bookId} from Redis cache`);
      return res.json(JSON.parse(page)); // Return cached page data
    }

    // If not in cache, fetch from Snowflake
    const sql = `SELECT PAGE_NUMBER, CONTENT FROM BOOK_PAGES WHERE BOOK_ID = ? AND PAGE_NUMBER = ?`;

    connection.execute({
      sqlText: sql,
      binds: [bookId, pageNumber],
      complete: function (err, stmt, rows) {
        if (err) {
          return res.status(500).json({ message: 'Error retrieving page content' });
        } else if (rows.length > 0) {
          const pageDetails = rows[0];
          redisClient.setex(`book:${bookId}:page:${pageNumber}`, 3600, JSON.stringify(pageDetails)); // Cache page content for 1 hour
          return res.json(pageDetails);
        } else {
          return res.status(404).json({ message: 'Page not found' });
        }
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});