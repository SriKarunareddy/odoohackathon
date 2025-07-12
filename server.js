// ...existing code...
// Route definitions (move below app initialization)
// (Moved below app initialization)

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- SESSION MANAGEMENT SETUP ---
const session = require('express-session');
app.use(session({
  secret: 'rewear_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ...existing code...

// Route definitions (now correctly placed below app initialization)
app.get('/swap-sell', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('swap-sell');
});
app.get('/sell', (req, res) => {
  if (!req.session.user) {
    return res.render('sell', { error: 'You must be logged in to sell an item.' });
  }
  res.render('sell');
});
app.get('/swap', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.send('<h2>Swap Clothes page coming soon!</h2>');
});

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
    // Insert two admin records if not already present
    db.query(`INSERT IGNORE INTO admins (username, email, password) VALUES ('admin1', 'admin1@gmail.com', '1234'), ('admin2', 'admin2@gmail.com', '1234')`, (err) => {
      if (err) throw err;
    });
});
app.post('/login/admin', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM admins WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server error');
      }
      if (results.length > 0) {
        // Admin exists, login success
        req.session.admin = {
          username: results[0].username,
          email: results[0].email
        };
        res.redirect('/admin-dashboard');
      } else {
        // Admin does not exist, show error
        res.send('<script>alert("Admin not found or wrong password."); window.location.href="/";</script>');
      }
    }
  );
});
app.get('/admin-dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/');
  }
  const { username, email } = req.session.admin;
  res.render('admin-dashboard', { username, email });
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
  if (!req.session.user) {
    return res.redirect('/');
  }
  const { username, email, points } = req.session.user;
  const listings = req.session.listings || [];
  const purchases = req.session.purchases || [];
  res.render('dashboard', { username, email, points, listings, purchases });
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
        // Store user info in session
        req.session.user = {
          username: user.username,
          email: user.email,
          points: 50
        };
        req.session.listings = [];
        req.session.purchases = [];
        res.redirect('/dashboard');
      } else {
        // User does not exist, show error
        res.send('<script>alert("User not found or wrong password. Please sign up first."); window.location.href="/signup";</script>');
      }
    }
  );
// User profile route
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const { username, email, points } = req.session.user;
  res.render('profile', { username, email, points });
});
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

