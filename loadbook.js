const snowflake = require('snowflake-sdk');

// Establish a Snowflake connection
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
// Connect to Snowflake
connection.connect((err, conn) => {
    if (err) {
        console.error('Unable to connect to Snowflake:', err.message);
    } else {
        console.log('Connected to Snowflake!');
        loadBook();  // Call function to load the book after the connection is established
    }
});

// Sample book details
const bookTitle = "The Great Adventure";
const bookAuthor = "John Doe";
const bookGenre = "Adventure";
const genreId = 1;  // Assuming genre ID is pre-defined
const userId = 1;   // Assuming user ID (author) is pre-defined
const bookContent = `
    This is the first paragraph of the book. It introduces the main character.
    
    This is the second paragraph where the adventure begins.
    
    The plot thickens in this part of the story.
    
    And finally, this is the conclusion of the book.
`;

// Function to load the book and its pages into the database
function loadBook() {
    const pages = bookContent.split('\n\n'); // Split the content by paragraphs

    // Step 1: Insert the book into the BOOKS table
    const insertBookSQL = `
        INSERT INTO BOOKS (TITLE, AUTHOR_ID, GENRE_ID) 
        VALUES (?, ?, ?)
    `;

    connection.execute({
        sqlText: insertBookSQL,
        binds: [bookTitle, userId, genreId],  // Assuming author_id and genre_id are already available
        complete: function (err, stmt) {
            if (err) {
                console.error('Error inserting book:', err);
            } else {
                // Step 2: Retrieve the BOOK_ID of the newly inserted book
                const selectBookIdSQL = `
                    SELECT BOOK_ID 
                    FROM BOOKS 
                    WHERE TITLE = ? AND AUTHOR_ID = ?
                `;

                connection.execute({
                    sqlText: selectBookIdSQL,
                    binds: [bookTitle, userId],  // Match by title and author
                    complete: function (err, stmt, rows) {
                        if (err) {
                            console.error('Error retrieving book ID:', err);
                        } else if (rows.length > 0) {
                            const bookId = rows[0].BOOK_ID;  // Retrieve the book ID
                            console.log(`Book inserted with ID: ${bookId}`);

                            // Step 3: Insert pages into the BOOK_PAGES table
                            pages.forEach((pageContent, pageIndex) => {
                                const insertPageSQL = `
                                    INSERT INTO BOOK_PAGES (BOOK_ID, PAGE_NUMBER, CONTENT) 
                                    VALUES (?, ?, ?)
                                `;

                                connection.execute({
                                    sqlText: insertPageSQL,
                                    binds: [bookId, pageIndex + 1, pageContent],
                                    complete: function (err) {
                                        if (err) {
                                            console.error(`Error inserting page ${pageIndex + 1}:`, err);
                                        } else {
                                            console.log(`Page ${pageIndex + 1} inserted for book: ${bookTitle}`);
                                        }
                                    }
                                });
                            });
                        } else {
                            console.error('Book ID not found after insertion.');
                        }
                    }
                });
            }
        }
    });
}