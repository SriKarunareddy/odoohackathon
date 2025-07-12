
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
  user: 'root',        // use your MySQL username
  password: 'SMP512',        // use your MySQL password
});

// Create database and tables if not exist
db.connect((err) => {
  if (err) throw err;
  db.query('CREATE DATABASE IF NOT EXISTS rewear', (err) => {
    if (err) throw err;
    db.query('USE rewear', (err) => {
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
        // Login success, redirect to dashboard
        res.redirect('/dashboard');
      } else {
        // Login failed, redirect to home with error (could be improved)
        res.redirect('/?login=fail');
      }
    }
  );
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
