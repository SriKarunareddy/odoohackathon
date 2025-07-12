const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Daddy#123',
  database:'rewear',
  port: 3306
});
db.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected to MySQL!');
  }
  db.end();
});
