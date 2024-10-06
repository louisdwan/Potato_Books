// Simulate dynamic book loading
function loadBooks() {
    const bookList = document.getElementById('book-list');
    const books = [
        { title: "The Dragon's Call", genre: "Fantasy", author: "A. Knight" },
        { title: "Heartstrings", genre: "Romance", author: "E. Love" },
        { title: "Galaxy Wars", genre: "Sci-Fi", author: "Z. Star" },
        { title: "Rainbow Tales", genre: "LGBTQ+", author: "J. Pride" }
    ];

    bookList.innerHTML = ''; // Clear existing content
    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        bookItem.innerHTML = `<strong>${book.title}</strong> - ${book.genre} by ${book.author}`;
        bookList.appendChild(bookItem);
    });
}

// Simulate login functionality
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'user' && password === 'password123') {
        document.getElementById('login-status').textContent = 'Login successful!';
    } else {
        document.getElementById('login-status').textContent = 'Invalid username or password.';
    }
});
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
    window.location.href = 'https://accounts.google.com/signin'; // Mock Google login URL
}