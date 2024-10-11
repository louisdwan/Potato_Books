document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');

    // Fetch the book details from the backend using the bookId
    fetch(`http://localhost:5000/book/${bookId}`)
        .then(response => response.json())
        .then(book => {
            if (book) {
                document.getElementById('book-title').textContent = book.TITLE;
                document.getElementById('book-paragraph').textContent = book.CONTENT; // Display the full content of the book
            } else {
                document.getElementById('book-paragraph').textContent = "Book not found.";
            }
        })
        .catch(error => {
            console.error('Error fetching book:', error);
            document.getElementById('book-paragraph').textContent = "Error loading book content.";
        });
});

