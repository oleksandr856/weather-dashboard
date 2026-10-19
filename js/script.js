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

// Тестові дані з низькими температурами для перевірки умови "морозно"
const frostTest = [
  { day: 'Пн', temp: -5 },
  { day: 'Вт', temp: 0 },
  { day: 'Ср', temp: 5 }
];

// Переводить температуру з градусів Цельсія в градуси Фаренгейта
const toFahrenheit = celsius => celsius * 9 / 5 + 32;

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

// Виводить у консоль кожен день прогнозу з температурою в C і F та класифікацією
function printForecast(list) {
  console.log('Кількість днів у прогнозі: ' + list.length);
  for (const item of list) {
    const f = toFahrenheit(item.temp).toFixed(1);
    console.log(`${item.day}: ${item.temp} C = ${f} F, ${classifyTemp(item.temp)}`);
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
    desc.textContent = classifyTemp(item.temp);

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

printForecast(forecast);
console.log('Середня температура: ' + averageTemp(forecast).toFixed(1) + ' C');

console.log('--- Перевірка умови "морозно" ---');
printForecast(frostTest);