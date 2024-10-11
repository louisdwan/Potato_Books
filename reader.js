document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    let currentPage = 1;
    let totalPages = 0;
    let bookData = {};

    // Fetch the book details and pages from the backend using the bookId
    fetch(`http://localhost:5000/book/${bookId}`)
        .then(response => response.json())
        .then(book => {
            if (book) {
                bookData = book;
                totalPages = book.PAGE_COUNT; // Set total pages
                displayBookDetails(book); // Display book information
                loadPage(currentPage); // Load the first page
            } else {
                document.getElementById('book-details').textContent = "Book not found.";
            }
        })
        .catch(error => {
            console.error('Error fetching book:', error);
            document.getElementById('book-details').textContent = "Error loading book details.";
        });

    // Display the book details (ID, Title, Summary, Page Count)
    function displayBookDetails(book) {
        document.getElementById('book-id').textContent = `Book ID: ${book.BOOK_ID}`;
        document.getElementById('book-title').textContent = `Title: ${book.TITLE}`;
        document.getElementById('book-summary').textContent = `Summary: ${book.SUMMARY}`;
        document.getElementById('book-page-count').textContent = `Page Count: ${book.PAGE_COUNT}`;
    }

    // Load a specific page's content
    function loadPage(pageNumber) {
        fetch(`http://localhost:5000/book/${bookId}/page/${pageNumber}`)
            .then(response => response.json())
            .then(page => {
                if (page) {
                    document.getElementById('page-number').textContent = `Page ${page.PAGE_NUMBER}`;
                    document.getElementById('page-content').textContent = page.CONTENT;
                } else {
                    document.getElementById('page-content').textContent = "Page not found.";
                }
            })
            .catch(error => {
                console.error('Error fetching page content:', error);
                document.getElementById('page-content').textContent = "Error loading page content.";
            });
    }

    // Event listeners for page navigation
    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            loadPage(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (currentPage < totalPages) {
            currentPage++;
            loadPage(currentPage);
        }
    });
});

