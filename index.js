function loadBooks() {
    const bookList = document.getElementById('book-list');

    // Fetch the books from the backend
    fetch('http://localhost:5000/books')
        .then(response => response.json())
        .then(books => {
            bookList.innerHTML = ''; // Clear the book list before adding new content

            books.forEach(book => {
                const bookItem = document.createElement('div');
                bookItem.className = 'book-item';
                // Display the book title and published year, hyperlink to reader.html with the bookId
                bookItem.innerHTML = `<a href="reader.html?bookId=${book.BOOK_ID}">${book.TITLE} (${book.PUBLISHED_YEAR})</a>`;
                bookList.appendChild(bookItem);
            });
        })
        .catch(error => {
            console.error('Error loading books:', error);
        });
}

document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('search-query').value;
    console.log('Search for:', searchQuery);
    // Add functionality to search books
});

function openWriterLogin() {
    // Redirect to login section
    document.getElementById('login-with-socials').classList.remove('hidden');
}

function loginWithGoogle() {
    window.location.href = 'https://accounts.google.com/signin'; // Use Google OAuth URL
}

function loginWithFacebook() {
    window.location.href = 'https://www.facebook.com/login.php'; // Use Facebook OAuth URL
}