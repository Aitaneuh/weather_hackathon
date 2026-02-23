const express = require('express');
const cors = require('cors')
require('dotenv').config();
const app = express();
const sqlite3 = require('sqlite3').verbose();
const port = 8080;

app.use(cors());
const db = new sqlite3.Database('./weathers.db');

db.run(`CREATE TABLE IF NOT EXISTS weathers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT, 
    temperature REAL,
    description TEXT, 
    timestamp INTEGER
)`);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js')
})

app.get('/weather', async (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: "Ville manquante" });

  const now = Date.now();
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=fr`);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(data.cod).json({ error: data.message });
    }

    const temp = data.main.temp;
    const desc = data.weather[0].description;

    db.run("INSERT INTO weathers (city, temperature, description, timestamp) VALUES (?, ?, ?, ?)",
      [city, temp, desc, now], (err) => {
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