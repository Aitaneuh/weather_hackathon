const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
const sqlite3 = require('sqlite3').verbose();
const port = 8080;

app.use(cors());
const db = new sqlite3.Database('./weathers.db');

db.run(`CREATE TABLE IF NOT EXISTS weathers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT, 
    temperature REAL,
    description TEXT, 
    timestamp INTEGER,
    host_id INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT, 
    lastname TEXT,
    email TEXT,
    password TEXT,
    sessionID TEXT
)`);

function protect(req, res, next) {
  const sessionID = req.cookies.sessionID;

  if (!sessionID) {
    return res.redirect('/user/login');
  }

  db.get("SELECT * FROM users WHERE sessionID = ?", [sessionID], (err, user) => {
    if (err || !user) {
      return res.redirect('/user/login');
    }
    req.user = user;
    next();
  });
}

app.get('/', protect, (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.get('/api/me', protect, (req, res) => {
  res.json({
    id: req.user.id,
    firstname: req.user.firstname,
    lastname: req.user.lastname
  });
});

app.get('/user/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/user/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      return res.status(401).send("Aucun compte n'existe avec cet email.");
    }

    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
      if (err || !user) {
        return res.status(401).send("Identifiants incorrects");
      }

      const newSessionID = crypto.randomBytes(16).toString('hex');

      db.run("UPDATE users SET sessionID = ? WHERE id = ?", [newSessionID, user.id], () => {
        res.cookie('sessionID', newSessionID, {
          httpOnly: true,
          maxAge: 86400000
        });
        res.redirect('/');
      });
    });
  });
})

app.get('/user/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/user/signup', (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || user) {
      return res.status(401).send("Un compte existe déjà avec cet email.");
    }

    const newSessionID = crypto.randomBytes(16).toString('hex');

    db.run("INSERT INTO users (firstname, lastname, email, password, sessionID) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email, password, newSessionID], (err) => {
        if (err) { console.log(err) }
        res.cookie('sessionID', newSessionID, {
          httpOnly: true,
          maxAge: 86400000
        });
        res.redirect('/');
      });
  });
})

app.get('/user/logout', (req, res) => {
  res.clearCookie('sessionID');
  res.redirect('/user/login');
});

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js')
})

app.get('/weather', protect, async (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: "Ville manquante" });

  const now = Date.now();
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const user_id = req.user.id;

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=fr`);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(data.cod).json({ error: data.message });
    }

    const temp = data.main.temp;
    const desc = data.weather[0].description;

    db.run("INSERT INTO weathers (city, temperature, description, timestamp, host_id) VALUES (?, ?, ?, ?, ?)",
      [city, temp, desc, now, user_id], (err) => {
        if (err) console.error("Erreur DB Insert:", err.message);

        db.all("SELECT * FROM weathers WHERE city=? ORDER BY timestamp DESC LIMIT 10", [city], (err, rows) => {
          if (err) {
            return res.status(500).json({ error: "Erreur lecture historique" });
          }
          res.json({
            current: { city, temp, desc, now },
            history: rows
          });
        });
      }
    );

  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(port, '0.0.0.0', console.log(`listening on port ${port}`));