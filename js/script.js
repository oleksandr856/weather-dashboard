// Для виконання практичної роботи було обрано бібліотеку React. 
// Причиною вибору є те, що вона дозволяє легко та швидко підключитись через CDN без необхідності налаштування складних інструментів збірки, 
// пропонує зручний компонентний підхід і має наочний синтаксис JSX для побудови декларативних інтерфейсів.

console.log('script.js підключено');

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

// Класифікує день за температурою: морозно, прохолодно або тепло
function classifyTemp(temp) {
  if (temp < 0) return 'морозно';
  if (temp <= 18) return 'прохолодно';
  return 'тепло';
}

function App() {
  // Переносимо масив у реактивний стан з додаванням id
  const [items, setItems] = React.useState([
    { id: 1, day: 'Пн', temp: 19, description: 'сонячно' },
    { id: 2, day: 'Вт', temp: 18, description: 'хмарно з проясненнями' },
    { id: 3, day: 'Ср', temp: 16, description: 'невеликий дощ' },
    { id: 4, day: 'Чт', temp: 13, description: 'мінлива хмарність' },
    { id: 5, day: 'Пт', temp: 9, description: 'ясно, без опадів' },
    { id: 6, day: 'Сб', temp: 5, description: 'малохмарно' },
    { id: 7, day: 'Нд', temp: -2, description: 'короткочасний дощ' }
  ]);

  // Стан для форми
  const [dayInput, setDayInput] = React.useState('');
  const [tempInput, setTempInput] = React.useState('');
  const [descInput, setDescInput] = React.useState('');

  // Стан для результату найтеплішого дня
  const [warmestResult, setWarmestResult] = React.useState('');

  // Похідне значення: середня температура
  const averageTemp = items.length 
    ? (items.reduce((sum, item) => sum + item.temp, 0) / items.length).toFixed(1) 
    : 0;

  // Обробник додавання
  const handleAddWeather = (e) => {
    e.preventDefault();
    if (!dayInput || tempInput === '') return;

    const newItem = {
      id: Date.now(), // Унікальний ID на основі часу
      day: dayInput.trim(),
      temp: Number(tempInput),
      description: descInput.trim()
    };

    setItems([...items, newItem]);
    
    setDayInput('');
    setTempInput('');
    setDescInput('');
  };

  // Обробник пошуку найтеплішого дня
  const findWarmest = () => {
    if (items.length === 0) return;
    let maxItem = items[0];
    items.forEach(item => {
      if (item.temp > maxItem.temp) {
        maxItem = item;
      }
    });
    setWarmestResult(`Найтепліший день: ${maxItem.day} (+${maxItem.temp} C)`);
  };

  return (
    <React.Fragment>
      {/* Рендер карток з унікальним key */}
      {items.map(item => (
        <WeatherCard
          key={item.id}
          day={item.day}
          tempC={item.temp}
          description={item.description}
        />
      ))}
      
      {/* Передаємо середню температуру через портал у існуючий DOM-елемент */}
      {ReactDOM.createPortal(
        `Середня температура за період: ${averageTemp} C`,
        document.getElementById('avg-temp')
      )}
      
      {/* Передаємо форму через портал у існуючий DOM-елемент */}
      {ReactDOM.createPortal(
        <React.Fragment>
          <h3 className="add-weather-title">Додати новий прогноз</h3>
          <div className="form-inputs">
            <input type="text" className="add-weather-input" placeholder="День (напр. Пн)" value={dayInput} onChange={e => setDayInput(e.target.value)} required />
            <input type="number" className="add-weather-input" placeholder="Температура C" value={tempInput} onChange={e => setTempInput(e.target.value)} min="-50" max="50" required />
            <input type="text" className="add-weather-input" placeholder="Опис (необов'язково)" value={descInput} onChange={e => setDescInput(e.target.value)} />
            <button type="submit" className="add-weather-submit">Додати запис</button>
          </div>
        </React.Fragment>,
        document.getElementById('add-weather-form')
      )}

      {/* Передаємо кнопку пошуку через портал */}
      {ReactDOM.createPortal(
        <React.Fragment>
           <button type="button" className="warmest-btn" onClick={findWarmest}>Знайти найтепліший день</button>
           <p className="warmest-result-text">{warmestResult}</p>
        </React.Fragment>,
        document.querySelector('.warmest-action')
      )}
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