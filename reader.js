document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    let currentPage = 1;
    let totalPages = 0;
    let bookData = {}; // To store the book metadata and pages

    // Fetch the book details and content URL from the backend using the bookId
    fetch(`http://localhost:5000/book/${bookId}`)
        .then(response => response.json())
        .then(book => {
            if (book) {
                bookData = book;
                totalPages = book.PAGE_COUNT || 1; // Set total pages, default to 1 if missing
                displayBookDetails(book); // Display book information
                loadBookContent(book.CONTENT_URL); // Load the content from the bucket URL
            } else {
                document.getElementById('book-details').textContent = "Book not found.";
            }
        })
        .catch(error => {
            console.error('Error fetching book:', error);
            document.getElementById('book-details').textContent = "Error loading book details.";
        });

    // Display the book details (ID, Title, Summary, Page Count, View Count)
    function displayBookDetails(book) {
        document.getElementById('book-id').textContent = `Book ID: ${book.BOOK_ID}`;
        document.getElementById('book-title').textContent = `Title: ${book.TITLE}`;
        document.getElementById('book-summary').textContent = `Summary: ${book.SUMMARY || 'No summary available.'}`;
        document.getElementById('book-page-count').textContent = `Page Count: ${book.PAGE_COUNT || 'N/A'}`;
        document.getElementById('book-view-count').textContent = `Views: ${book.VIEW_COUNT}`; // Display the view count
    }

    // Load the book content from the Google Cloud Storage URL
    function loadBookContent(contentUrl) {
        if (!contentUrl) {
            document.getElementById('page-content').textContent = "No content available for this book.";
            return;
        }
        fetch(contentUrl)
            .then(response => response.text()) // Get the text content from the GCS file
            .then(content => {
                displayPageContent(content); // Display the book content
            })
            .catch(error => {
                console.error('Error fetching book content from GCS:', error);
                document.getElementById('page-content').textContent = "Error loading book content.";
            });
    }

    // Display the entire book content (or the first part of it for pagination)
    function displayPageContent(content) {
        const pages = splitIntoPages(content, totalPages); // Split the content into pages
        bookData.pages = pages; // Store pages for future use
        loadPage(currentPage, pages); // Load the first page
    }

    // Split the book content into pages based on totalPages
    function splitIntoPages(content, totalPages) {
        const lines = content.split('\n'); // Split content into lines
        const linesPerPage = Math.ceil(lines.length / totalPages); // Calculate lines per page
        const pages = [];

        for (let i = 0; i < totalPages; i++) {
            const pageContent = lines.slice(i * linesPerPage, (i + 1) * linesPerPage).join('\n');
            pages.push(pageContent);
        }
        return pages;
    }

    // Load a specific page's content
    function loadPage(pageNumber, pages) {
        if (pages && pages[pageNumber - 1]) {
            document.getElementById('page-number').textContent = `Page ${pageNumber}`;
            document.getElementById('page-content').textContent = pages[pageNumber - 1];
        } else {
            document.getElementById('page-content').textContent = "Page not found.";
        }
    }

    // Event listeners for page navigation
    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            loadPage(currentPage, bookData.pages);
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (currentPage < totalPages) {
            currentPage++;
            loadPage(currentPage, bookData.pages);
        }
    });
});