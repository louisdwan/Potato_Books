const express = require('express');
const snowflake = require('snowflake-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, 'serviceaccountkey.json'), // Replace with the correct path
  projectId: 'potato-books-437814', // Your Google Cloud project ID
});
const bucketName = 'potatobooks'; // Your GCS bucket name

// Set up Multer for file uploads (if any)
const upload = multer({ storage: multer.memoryStorage() });

// Route to handle book submission
app.post('/submit-book', upload.single('contentFile'), async (req, res) => {
  try {
    const { title, author, genre, summary, bookContent, yearPublished } = req.body; // Extract the text fields including summary
    const file = req.file; // Extract the uploaded file (if any)

    // 1. Upload the Quill editor content (book text) to Google Cloud Storage
    const textFileName = `${title.replace(/\s+/g, '_')}_content.txt`; // Create a unique filename for the text content
    const textBlob = storage.bucket(bucketName).file(textFileName);

    await textBlob.save(bookContent, {
      resumable: false,
      contentType: 'text/plain',
    });
    console.log('Text content uploaded successfully to GCS.');

    let uploadedFileName = '';
    if (file) {
      // 2. If a file is uploaded, save it to Google Cloud Storage
      const fileBlob = storage.bucket(bucketName).file(file.originalname);
      const blobStream = fileBlob.createWriteStream({
        resumable: false,
        contentType: file.mimetype, // Preserve the file's original type
      });

      blobStream.on('error', (err) => {
        console.error('File upload failed:', err);
        return res.status(500).json({ error: 'Failed to upload file to GCS.' });
      });

      blobStream.on('finish', () => {
        console.log('File uploaded successfully to GCS.');
      });

      blobStream.end(file.buffer);
      uploadedFileName = file.originalname; // Store uploaded file name for database insertion
    }

    // Insert book metadata into the BOOKS table with the genre_id and summary
    const sql = `INSERT INTO BOOKS (TITLE, AUTHOR, GENRE_ID, SUMMARY, CONTENT_URL, PUBLISHED_YEAR) VALUES (?, ?, ?, ?, ?, ?)`;
    const contentUrl = `https://storage.googleapis.com/${bucketName}/${textFileName}`;

    connection.execute({
      sqlText: sql,
      binds: [title, author, genre, summary, contentUrl,yearPublished],
      complete: function (err, stmt, rows) {
        if (err) {
          console.error('Error inserting book metadata:', err);
          return res.status(500).json({ message: 'Error adding book to database.' });
        } else {
          console.log('Book metadata added to Snowflake.');
          return res.status(201).json({
            message: 'Book submitted successfully!',
            textFileUrl: contentUrl,
            uploadedFileName: uploadedFileName,
          });
        }
      },
    });
  } catch (error) {
    console.error('Error during book submission:', error);
    return res.status(500).json({ error: 'Failed to submit book.' });
  }
});

// Create a Snowflake connection configuration
const connection = snowflake.createConnection({
  account: 'tu31985.europe-west2.gcp',
  username: 'louisdwan',
  password: 'Ro3kwell1234$',
  warehouse: 'COMPUTE_WH',
  database: 'POTATOBOOKS',
  schema: 'POTATOSCHEMA',
  role: 'ACCOUNTADMIN',
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
        res.json(rows); // Return books directly from Snowflake
      }
    },
  });
});

// Add a new book to Snowflake
app.post('/books', (req, res) => {
  const { title, author, genre, summary, contentUrl } = req.body;

  const sql = `INSERT INTO BOOKS (TITLE, AUTHOR, GENRE, SUMMARY, CONTENT_URL) VALUES (?, ?, ?, ?, ?)`;

  connection.execute({
    sqlText: sql,
    binds: [title, author, genre, summary, contentUrl],
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ message: 'Error adding book' });
      } else {
        console.log('Book added:', { title, author, genre });
        res.status(201).json({ message: 'Book added successfully' });
      }
    },
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
        },
      });
    },
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
    },
  });
});

// Fetch genres
app.get('/genres', (req, res) => {
  const sql = `SELECT GENRE_ID, GENRE_NAME FROM GENRES`;

  connection.execute({
    sqlText: sql,
    complete: function (err, stmt, rows) {
      if (err) {
        console.error('Error fetching genres:', err);
        res.status(500).json({ message: 'Error fetching genres' });
      } else {
        res.json(rows); // Return the list of genres
      }
    },
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
