// ...existing code...
// Route definitions (move below app initialization)
// (Moved below app initialization)

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
// Multer setup for file uploads
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'public/uploads/') });

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
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Serve static files from the public/images directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

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
  db.query(`CREATE TABLE IF NOT EXISTS clothes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clothesname VARCHAR(100) NOT NULL,
    bought_or_sold ENUM('bought', 'sold', 'swapped') NOT NULL,
    username VARCHAR(100) NOT NULL,
    accepted_by_admin TINYINT(1) DEFAULT 0,
    is_live TINYINT(1) DEFAULT 1,
    points_gone INT DEFAULT 0,
    points_added INT DEFAULT 0
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
  db.query('SELECT * FROM clothes WHERE accepted_by_admin = 0', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading listings');
    }
    res.render('admin-dashboard', { username, email, listings: results });
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
  if (!req.session.user) {
    return res.redirect('/');
  }
  const { username, email, points } = req.session.user;
  db.query('SELECT * FROM clothes WHERE accepted_by_admin = 1 AND is_live = 1', (err, products) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading products');
    }
    res.render('dashboard', { username, email, points, products });
  });
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
});
// Remove duplicate route definition
app.post('/sell', upload.single('photo'), (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const { description, size, texture, category, colour, points } = req.body;
  const clothesname = description;
  const username = req.session.user.username;
  // Save all product details, including photo filename
  const photo = req.file ? req.file.filename : null;
  db.query(
    'INSERT INTO clothes (clothesname, bought_or_sold, username, accepted_by_admin, is_live, points_gone, points_added, size, texture, category, colour, points, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [clothesname, 'sold', username, 0, 1, 0, 0, size, texture, category, colour, points, photo],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving listing');
      }
      res.redirect('/dashboard?listing=success');
    }
  );
});

// Ensure clothes table has all columns

// Add columns individually (ignore error if column exists)
const addColumn = (colName) => {
  db.query(`ALTER TABLE clothes ADD COLUMN ${colName} VARCHAR(50)`, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.error(`Could not add column ${colName}:`, err);
    }
  });
};
addColumn('size');
addColumn('texture');
addColumn('category');
addColumn('colour');

// Ensure server closes properly
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// --- ADMIN LISTING APPROVAL/REJECTION ROUTES ---
app.post('/admin/listing/:id/accept', (req, res) => {
  if (!req.session.admin) {
    return res.status(403).send('Unauthorized');
  }
  const listingId = req.params.id;
  db.query('UPDATE clothes SET accepted_by_admin = 1 WHERE id = ?', [listingId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error approving listing');
    }
    res.redirect('/admin-dashboard');
  });
});

app.post('/admin/listing/:id/reject', (req, res) => {
  if (!req.session.admin) {
    return res.status(403).send('Unauthorized');
  }
  const listingId = req.params.id;
  // Option 1: Remove listing from DB
  db.query('DELETE FROM clothes WHERE id = ?', [listingId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error rejecting listing');
    }
    res.redirect('/admin-dashboard');
  });
  // Option 2: Mark as rejected (uncomment if you want to keep record)
  // db.query('UPDATE clothes SET accepted_by_admin = -1 WHERE id = ?', [listingId], (err) => {
  //   if (err) {
  //     console.error(err);
  //     return res.status(500).send('Error rejecting listing');
  //   }
  //   res.redirect('/admin-dashboard');
  // });
});

// User profile route
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const { username, email, points } = req.session.user;
  // Fetch sold and bought history from DB
  db.query('SELECT * FROM clothes WHERE username = ? AND bought_or_sold = "sold"', [username], (err, soldListings) => {
    if (err) {
      return res.status(500).send('Error loading sold listings');
    }
    db.query('SELECT * FROM clothes WHERE buyer_username = ? AND bought_or_sold = "bought"', [username], (err, boughtListings) => {
      if (err) {
        return res.status(500).send('Error loading bought listings');
      }
      res.render('profile', { username, email, points, listings: soldListings, purchases: boughtListings });
    });
  });
});

// --- BUY PRODUCT ROUTE ---
app.post('/buy/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const buyerUsername = req.session.user.username;
  const productId = req.params.id;
  // Get product info
  db.query('SELECT * FROM clothes WHERE id = ?', [productId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Product not found');
    }
    const product = results[0];
    const productPoints = parseInt(product.points);
    const sellerUsername = product.username;
    // Get buyer info
    db.query('SELECT * FROM users WHERE username = ?', [buyerUsername], (err, buyerResults) => {
      if (err || buyerResults.length === 0) {
        return res.status(404).send('Buyer not found');
      }
      const buyer = buyerResults[0];
      let buyerPoints = parseInt(buyer.points || 50);
      if (buyerPoints < productPoints) {
        return res.send('<script>alert("Not enough points to buy this product."); window.location.href="/dashboard";</script>');
      }
      // Get seller info
      db.query('SELECT * FROM users WHERE username = ?', [sellerUsername], (err, sellerResults) => {
        if (err || sellerResults.length === 0) {
          return res.status(404).send('Seller not found');
        }
        const seller = sellerResults[0];
        let sellerPoints = parseInt(seller.points || 50);
        // Update points
        buyerPoints -= productPoints;
        sellerPoints += productPoints;
        // Update DB for both users
        db.query('UPDATE users SET points = ? WHERE username = ?', [buyerPoints, buyerUsername], (err) => {
          if (err) {
            return res.status(500).send('Error updating buyer points');
          }
          db.query('UPDATE users SET points = ? WHERE username = ?', [sellerPoints, sellerUsername], (err) => {
            if (err) {
              return res.status(500).send('Error updating seller points');
            }
            // Mark product as bought and record buyer
            db.query('UPDATE clothes SET bought_or_sold = "bought", is_live = 0, buyer_username = ? WHERE id = ?', [buyerUsername, productId], (err) => {
              if (err) {
                return res.status(500).send('Error updating product status');
              }
              // Update session points for buyer
              req.session.user.points = buyerPoints;
              // Add to purchases for buyer
              req.session.purchases = req.session.purchases || [];
              req.session.purchases.push(product);
              // Redirect to dashboard with success
              return res.redirect('/dashboard');
            });
          });
        });
      });
    });
  });
});

