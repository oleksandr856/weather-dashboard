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

function WeatherCard({ day, tempC, description }) {
  // Локальний реактивний стан для відображення Фаренгейтів
  const [showFahrenheit, setShowFahrenheit] = React.useState(false);

  // Похідне значення: обчислення Фаренгейтів
  const tempF = Math.round(tempC * 9 / 5 + 32);

  // Стилізація картки та температури
  const cardClass = `card ${tempC < 0 ? 'cold' : ''}`;
  const tempClass = `temp-value ${tempC > 18 ? 'temp-warm' : 'temp-cold'}`;

  const descText = description ? description : classifyTemp(tempC);

  return (
    <article className={cardClass} onClick={() => setShowFahrenheit(!showFahrenheit)}>
      <h3>{day}</h3>
      <p className={tempClass}>
        {tempC > 0 ? '+' : ''}{tempC}°C
        {/* Показуємо Фаренгейти лише якщо showFahrenheit === true */}
        {showFahrenheit && <span style={{ fontSize: '20px', color: '#64748b' }}> / {tempF}°F</span>}
      </p>
      <p className="forecast-desc">{descText}</p>
    </article>
  );
}

let updateReactState = null;

function App() {
  // Переносимо масив у реактивний стан, початкове значення масив forecast
  const [items, setItems] = React.useState(forecast);

  // Передаємо функцію оновлення назовні, щоб звичайна HTML-форма могла додати картку
  React.useEffect(() => {
    updateReactState = (newArray) => {
      setItems([...newArray]);
    };
  }, []);

  return (
    <React.Fragment>
      {/* Рендер циклом через map() з передачею props */}
      {items.map((item, index) => (
        <WeatherCard
          key={item.day + index}
          day={item.day}
          tempC={item.temp}
          description={item.description}
        />
      ))}
    </React.Fragment>
  );
}

// Знаходимо підготовлений контейнер і монтуємо туди React-додаток
const forecastGrid = document.querySelector('.forecast-grid');
if (forecastGrid) {
  // Видаляємо всі статичні картки, якщо вони були в HTML (React відмалює їх сам)
  const staticCards = forecastGrid.querySelectorAll('.card');
  staticCards.forEach(card => card.remove());

  const root = ReactDOM.createRoot(forecastGrid);
  root.render(<App />);
}

// Встановлюємо середню температуру одразу при завантаженні
const avgTempElement = document.querySelector('#avg-temp');
if (avgTempElement) {
  avgTempElement.textContent = 'Середня температура за період: ' + averageTemp(forecast).toFixed(1) + ' C';
}

// Вибираємо форму та її елементи
const addWeatherForm = document.querySelector('#add-weather-form');
const tempInput = document.querySelector('#temp-input');
const warmestBtn = document.querySelector('#warmest-btn');
const warmestResult = document.querySelector('#warmest-result');

// Обробка відправки форми (submit)
if (addWeatherForm) {
  addWeatherForm.addEventListener('submit', (event) => {
    // Скасувати перезавантаження сторінки
    event.preventDefault();

    // Зчитати значення полів
    const dayValue = addWeatherForm.querySelector('#day-input').value.trim();
    const tempValue = Number(tempInput.value);
    const descValue = addWeatherForm.querySelector('#desc-input').value.trim();

    // Зібрати новий об'єкт і додати в глобальний масив forecast
    forecast.push({
      day: dayValue,
      temp: tempValue,
      description: descValue
    });

    // Оновлюємо React-стан
    if (updateReactState) {
      updateReactState(forecast);
    }

    // Оновлення підсумкового елемента із середньою температурою
    if (avgTempElement) {
      avgTempElement.textContent = 'Середня температура за період: ' + averageTemp(forecast).toFixed(1) + ' C';
    }

    // Очистити форму після успішного додавання
    addWeatherForm.reset();
  });
}

// Додаткова клієнтська валідація на подію input
if (tempInput) {
  tempInput.addEventListener('input', () => {
    const val = Number(tempInput.value);
    // Валідація, якщо значення поза межами -50...50
    if (val < -50 || val > 50) {
      tempInput.setCustomValidity('Температура поза реалістичним діапазоном');
    } else {
      tempInput.setCustomValidity(''); // Скидаємо помилку
    }
  });
}

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

const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current=temperature_2m,weather_code&timezone=auto';

const weatherCodes = {
  0: 'ясно',
  1: 'переважно ясно',
  2: 'мінлива хмарність',
  3: 'хмарно',
  45: 'туман',
  48: 'туман із памороззю',
  51: 'мряка',
  61: 'невеликий дощ',
  71: 'сніг',
  95: 'гроза'
};

const updateBtn = document.querySelector('#update-btn');
const apiStatus = document.querySelector('#api-status');
const currentTempValue = document.querySelector('.current-weather .temp-value');
const currentWeatherCond = document.querySelector('.current-weather .weather-cond');

async function loadData() {
  // Вмикаємо стан завантаження
  apiStatus.textContent = 'Завантаження...';
  apiStatus.style.color = '#fbbf24'; // жовтий колір для завантаження
  updateBtn.disabled = true;

  try {
    const response = await fetch(API_URL);

    // Перевірка HTTP-статусу
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }

    const data = await response.json();

    console.log(data);

    // Отримуємо температуру та код погоди
    const temp = data.current.temperature_2m;
    const code = data.current.weather_code;

    // Оновлюємо DOM
    currentTempValue.innerHTML = `${temp > 0 ? '+' : ''}${temp}&deg;C`;
    currentWeatherCond.textContent = weatherCodes[code] || 'невідомо';

    // Очищаємо статус при успіху
    apiStatus.textContent = '';

  } catch (error) {
    // Обробка помилки 
    apiStatus.textContent = 'Не вдалося отримати прогноз погоди';
    apiStatus.style.color = '#f87171'; // червоний колір для помилки
    console.error('Помилка API:', error);
  } finally {
    // Вимикаємо стан завантаження
    updateBtn.disabled = false;
  }
}

updateBtn.addEventListener('click', loadData);

// Завантажуємо актуальні дані при відкритті сторінки
loadData();