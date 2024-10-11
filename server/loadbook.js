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
connection.connect((err, conn) => {
    if (err) {
        console.error('Unable to connect to Snowflake:', err.message);
    } else {
        console.log('Connected to Snowflake');
        loadBooks();  // Call function to load the books after the connection is established
    }
});

// Sample book and page data
const books = [
    {
        title: "The Wave",
        authorId: 1,
        genreId: 1,
        publishedYear: 2022,
        summary: "A story of a man on a train.",
        pageCount: 3,
        pages: [
            "This is the first paragraph of the book. It introduces the main character.",
            "In this chapter, the adventure begins as the knight embarks on his journey.",
            "As the journey continues, the challenges grow greater."
        ]
    }
];

// Function to load the book and its details into the database
function loadBooks() {
    books.forEach((book) => {
        // Step 1: Insert the book into the BOOKS table
        const insertBookSQL = `
            INSERT INTO BOOKS (TITLE, AUTHOR_ID, GENRE_ID, PUBLISHED_YEAR, SUMMARY, PAGE_COUNT, UPDATED_AT)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        connection.execute({
            sqlText: insertBookSQL,
            binds: [book.title, book.authorId, book.genreId, book.publishedYear, book.summary, book.pageCount],
            complete: function (err, stmt) {
                if (err) {
                    console.error('Error inserting book:', err);
                } else {
                    console.log(`Book inserted: ${book.title}`);

                    // Step 2: Retrieve the BOOK_ID of the newly inserted book
                    const selectBookIdSQL = `
                        SELECT BOOK_ID 
                        FROM BOOKS 
                        WHERE TITLE = ? AND AUTHOR_ID = ? 
                        ORDER BY UPDATED_AT DESC 
                        LIMIT 1
                    `;

                    connection.execute({
                        sqlText: selectBookIdSQL,
                        binds: [book.title, book.authorId],
                        complete: function (err, stmt, rows) {
                            if (err) {
                                console.error('Error retrieving BOOK_ID:', err);
                            } else if (rows.length > 0) {
                                const bookId = rows[0].BOOK_ID;  // Retrieve the BOOK_ID
                                console.log(`Retrieved BOOK_ID: ${bookId}`);

                                // Step 3: Insert pages for the book
                                book.pages.forEach((pageContent, pageIndex) => {
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
                                                console.log(`Page ${pageIndex + 1} inserted for book: ${book.title}`);
                                            }
                                        }
                                    });
                                });
                            } else {
                                console.error('Failed to retrieve BOOK_ID.');
                            }
                        }
                    });
                }
            }
        });
    });
}