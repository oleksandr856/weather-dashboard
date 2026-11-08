const express = require('express');
const path = require('path');
const cities = require('./data/cities.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Роздаємо клієнтську частину з теки public
app.use(express.static(path.join(__dirname, 'public')));

// Список усіх збережених міст
app.get('/api/cities', (req, res) => {
  res.json(cities);
});

// Одне місто за id або 404, якщо такого немає
app.get('/api/cities/:id', (req, res) => {
  const city = cities.find((c) => String(c.id) === req.params.id);
  if (!city) {
    return res.status(404).json({ error: 'Місто не знайдено' });
  }
  res.json(city);
});

// Будь-який інший шлях, що починається з /api, - теж JSON з кодом 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ендпоінт не знайдено' });
});

app.listen(PORT, () => {
  console.log('Сервер запущено на http://localhost:' + PORT);
});