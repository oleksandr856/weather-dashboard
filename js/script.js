console.log('script.js підключено');

// Дані прогнозу погоди на тиждень (значення з карток прогнозу на сторінці)
const forecast = [
  { day: 'Пн', temp: 19 },
  { day: 'Вт', temp: 18 },
  { day: 'Ср', temp: 16 },
  { day: 'Чт', temp: 20 },
  { day: 'Пт', temp: 22 },
  { day: 'Сб', temp: 21 },
  { day: 'Нд', temp: 17 }
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

printForecast(forecast);
console.log('Середня температура: ' + averageTemp(forecast).toFixed(1) + ' C');

console.log('--- Перевірка умови "морозно" ---');
printForecast(frostTest);