document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    const loggedIn = false; // Assume user is not logged in initially

    // Simulate fetching book details from the backend
    const books = {
        1: { title: "The Dragon's Call", content: "This is the full content of The Dragon's Call. It's a fantasy book about dragons." },
        2: { title: "Heartstrings", content: "This is the full content of Heartstrings. A romance novel about finding love in unexpected places." }
    };

    const book = books[bookId];
    if (book) {
        document.getElementById('book-title').textContent = book.title;
        const paragraph = loggedIn ? book.content : book.content.split('.')[0] + '.';
        document.getElementById('book-paragraph').textContent = paragraph;

        // Show login form if not logged in
        if (!loggedIn) {
            document.getElementById('login').classList.remove('hidden');
        }
    } else {
        document.getElementById('book-paragraph').textContent = "Book not found.";
    }

    // Simulate login process
    document.getElementById('login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simulate login check
        if (username === 'user' && password === 'password123') {
            document.getElementById('login-status').textContent = 'Login successful!';
            document.getElementById('book-paragraph').textContent = book.content; // Load full content after login
            document.getElementById('login').classList.add('hidden');
        } else {
            document.getElementById('login-status').textContent = 'Invalid username or password.';
        }
    });
});
