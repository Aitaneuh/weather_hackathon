const express = require('express');
const cors = require('cors')
require('dotenv').config();
const app = express();
const sqlite3 = require('sqlite3').verbose();
const port = 8080;

app.use(cors());
const db = new sqlite3.Database('./meteo_cache.db');

db.run(`CREATE TABLE IF NOT EXISTS weather_cache (
    city TEXT PRIMARY KEY, 
    data TEXT, 
    last_updated INTEGER
)`);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js')
})

app.get('/weather', async (req, res) => {
  const city = req.query.city.toLowerCase();
  const now = Date.now();
  const ONE_HOUR = 3600000;

  db.get("SELECT * FROM weather_cache WHERE city = ?", [city], async (err, row) => {
    if (row && (now - row.last_updated < ONE_HOUR)) {
      return res.json(JSON.parse(row.data));
    }

    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&lang=fr`);
      const data = await response.json();

      db.run("INSERT OR REPLACE INTO weather_cache (city, data, last_updated) VALUES (?, ?, ?)",
        [city, JSON.stringify(data), now]);

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "API Error" });
    }
  });
});

app.listen(port, '0.0.0.0', console.log(`listening on port ${port}`));