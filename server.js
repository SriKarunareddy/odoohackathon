
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS)
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Daddy#123',
  database: 'rewear',
  port: 3306
});

// Create tables if not exist
db.connect((err) => {
  if (err) throw err;
  db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL
  )`, (err) => {
    if (err) throw err;
  });
  db.query(`CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
  )`, (err) => {
    if (err) throw err;
  });
});

// Home route
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// User dashboard route
app.get('/dashboard', (req, res) => {
  // In a real app, check user session/auth here
  res.render('dashboard');
});

// User signup POST
app.post('/signup/user', (req, res) => {
  const { username, email, password, location } = req.body;
  db.query(
    'INSERT INTO users (username, email, password, location) VALUES (?, ?, ?, ?)',
    [username, email, password, location],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving user');
      }
      res.redirect('/');
    }
  );
});

// Admin signup POST
app.post('/signup/admin', (req, res) => {
  const { username, email, password } = req.body;
  db.query(
    'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)',
    [username, email, password],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving admin');
      }
      res.redirect('/');
    }
  );
});


// User login POST
app.post('/login/user', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server error');
      }
      if (results.length > 0) {
        // User exists, login success
        const user = results[0];
        res.render('dashboard', {
          username: user.username,
          email: user.email,
          points: 50,
          listings: [], // You can fetch actual listings from DB
          purchases: [] // You can fetch actual purchases from DB
        });
      } else {
        // User does not exist, show error
        res.send('<script>alert("User not found or wrong password. Please sign up first."); window.location.href="/signup";</script>');
      }
    }
  );
// User profile route
app.get('/profile', (req, res) => {
  // For demo, just show username. In real app, fetch user details from DB.
  res.render('profile', { username: 'User' });
});
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

