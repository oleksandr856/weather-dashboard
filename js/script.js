console.log('script.js підключено');

// Дані прогнозу погоди на тиждень (значення з карток прогнозу на сторінці)
const forecast = [
  { day: 'Пн', temp: 19 },
  { day: 'Вт', temp: 18 },
  { day: 'Ср', temp: 16 },
  { day: 'Чт', temp: 13 },
  { day: 'Пт', temp: 9 },
  { day: 'Сб', temp: 5 },
  { day: 'Нд', temp: -2 }
];

// Класифікує день за температурою: морозно, прохолодно або тепло
function classifyTemp(temp) {
  if (temp < 0) {
    return 'морозно';
  } else if (temp <= 18) {
    return 'прохолодно';
  } else {
    return 'тепло';
  }
}

// Рахує середню температуру за всі дні прогнозу
function averageTemp(list) {
  let sum = 0;
  for (const item of list) {
    sum += item.temp;
  }
  return sum / list.length;
}

const forecastGrid = document.querySelector('.forecast-grid');
const avgTempElement = document.querySelector('#avg-temp');

const staticCards = forecastGrid.querySelectorAll('.card');
staticCards.forEach(card => card.remove());

/**
 * Функція малювання списку прогнозу на сторінці
 * @param {Array} list - масив об'єктів з прогнозом погоди
 */
function renderForecast(list) {
  // Очищення контейнера перед рендером
  forecastGrid.innerHTML = '';

  // Проходимо по масиву даних
  list.forEach(item => {
    // Створення article для картки
    const card = document.createElement('article');
    card.classList.add('card');

    // Встановлення data-атрибута та умовного класу cold
    card.dataset.temp = item.temp;
    if (item.temp < 0) {
      card.classList.add('cold');
    }

    // Створення елементів для вмісту картки
    const title = document.createElement('h3');
    title.textContent = item.day;

    const tempVal = document.createElement('p');
    tempVal.classList.add('temp-value');
    tempVal.textContent = (item.temp > 0 ? '+' : '') + item.temp + ' C';

    // Встановлення кольору температури
    if (item.temp > 18) {
      tempVal.classList.add('temp-warm');
    } else {
      tempVal.classList.add('temp-cold');
    }

    const desc = document.createElement('p');
    desc.classList.add('forecast-desc');
    desc.textContent = item.description ? item.description : classifyTemp(item.temp);

    // Додавання елементів у картку та картки в контейнер
    card.append(title, tempVal, desc);
    forecastGrid.append(card);
  });

  // Оновлення підсумкового елемента із середньою температурою
  if (avgTempElement) {
    avgTempElement.textContent = 'Середня температура за період: ' + averageTemp(list).toFixed(1) + ' C';
  }
}

renderForecast(forecast);

// Вибираємо форму та її елементи
const addWeatherForm = document.querySelector('#add-weather-form');
const tempInput = document.querySelector('#temp-input');
const warmestBtn = document.querySelector('#warmest-btn');
const warmestResult = document.querySelector('#warmest-result');

// Обробка відправки форми (submit)
addWeatherForm.addEventListener('submit', (event) => {
  // Скасувати перезавантаження сторінки
  event.preventDefault();

  // Зчитати значення полів
  const dayValue = addWeatherForm.querySelector('#day-input').value.trim();
  const tempValue = Number(tempInput.value);
  const descValue = addWeatherForm.querySelector('#desc-input').value.trim();

  // Зібрати новий об'єкт і додати в масив forecast
  forecast.push({
    day: dayValue,
    temp: tempValue,
    description: descValue
  });

  // Перемалювати список карток з оновленим масивом
  renderForecast(forecast);

  // Очистити форму після успішного додавання
  addWeatherForm.reset();
});

// Додаткова клієнтська валідація на подію input
tempInput.addEventListener('input', () => {
  const val = Number(tempInput.value);
  // Валідація, якщо значення поза межами -50...50
  if (val < -50 || val > 50) {
    tempInput.setCustomValidity('Температура поза реалістичним діапазоном');
  } else {
    tempInput.setCustomValidity(''); // Скидаємо помилку
  }
});

// Реалізувати другу подію варіанта (click на кнопку)
warmestBtn.addEventListener('click', () => {
  let maxTemp = -Infinity;
  let maxDay = '';

  // Шукаємо день з максимальною температурою
  forecast.forEach(item => {
    if (item.temp > maxTemp) {
      maxTemp = item.temp;
      maxDay = item.day;
    }
  });

  // Виводимо результат
  warmestResult.textContent = `Найтепліший день: ${maxDay} (+${maxTemp} C)`;
});