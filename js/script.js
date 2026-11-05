// Для виконання практичної роботи було обрано бібліотеку React. 
// Причиною вибору є те, що вона дозволяє легко та швидко підключитись через CDN без необхідності налаштування складних інструментів збірки, 
// пропонує зручний компонентний підхід і має наочний синтаксис JSX для побудови декларативних інтерфейсів.

console.log('script.js підключено');

// Функція для відкриття бази даних або її створення якщо ще не існує
function openDB() {
  return new Promise((resolve, reject) => {
    // Відкриваємо БД з назвою 'WeatherDB' версії 1
    const request = indexedDB.open('WeatherDB', 1);

    // Спрацьовує при першому створенні БД
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Створюємо об'єктне сховище (таблицю) 'cities', де ключем буде поле 'id'
      if (!db.objectStoreNames.contains('cities')) {
        db.createObjectStore('cities', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Функція для додавання або оновлення міста в БД (CREATE / UPDATE)
async function addCityToDB(city) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cities', 'readwrite'); // Транзакція на запис
    tx.objectStore('cities').put(city); // put додає новий або оновлює існуючий запис
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Функція для отримання всіх міст з БД (READ)
async function getCitiesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cities', 'readonly'); // Транзакція тільки на читання
    const request = tx.objectStore('cities').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Функція для видалення міста з БД за його id (DELETE)
async function deleteCityFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cities', 'readwrite');
    tx.objectStore('cities').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function WeatherCard({ id, day, tempC, description, onDelete }) {
  // Локальний реактивний стан для відображення Фаренгейтів
  const [showFahrenheit, setShowFahrenheit] = React.useState(false);

  // Похідне значення: обчислення Фаренгейтів
  const tempF = Math.round(tempC * 9 / 5 + 32);

  // Стилізація картки та температури
  const cardClass = `card ${tempC < 0 ? 'cold' : ''}`;
  const tempClass = `temp-value ${tempC > 18 ? 'temp-warm' : 'temp-cold'}`;
  const descText = description ? description : classifyTemp(tempC);

  return (
    <article className={cardClass}>
      <h3 onClick={() => setShowFahrenheit(!showFahrenheit)} style={{ cursor: 'pointer' }}>{day}</h3>
      <p className={tempClass} onClick={() => setShowFahrenheit(!showFahrenheit)} style={{ cursor: 'pointer' }}>
        {tempC > 0 ? '+' : ''}{tempC}°C
        {/* Показуємо Фаренгейти лише якщо showFahrenheit === true */}
        {showFahrenheit && <span style={{ fontSize: '20px', color: '#64748b' }}> / {tempF}°F</span>}
      </p>
      <p className="forecast-desc">{descText}</p>

      {/* Кнопка видалення запису, яка викликає функцію onDelete з передачею id */}
      <button
        className="add-weather-submit"
        style={{ marginTop: '10px', fontSize: '13px', padding: '4px 8px' }}
        onClick={() => onDelete(id)}
      >
        Видалити
      </button>
    </article>
  );
}

// Класифікує день за температурою: морозно, прохолодно або тепло
function classifyTemp(temp) {
  if (temp < 0) return 'морозно';
  if (temp <= 18) return 'прохолодно';
  return 'тепло';
}

// Функція для збереження даних у localStorage
function saveToLocalStorage(items) {
  localStorage.setItem('appItems', JSON.stringify(items));
}

// Функція для читання даних з localStorage із захистом від помилок
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('appItems');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return []; // Якщо дані зламані, повертаємо порожній масив
  }
}

function App() {
  // Стан для списку міст (спочатку порожній, завантажиться з БД)
  const [items, setItems] = React.useState([]);

  // Стан для форми
  const [dayInput, setDayInput] = React.useState('');
  const [tempInput, setTempInput] = React.useState('');
  const [descInput, setDescInput] = React.useState('');

  // Стан для результату найтеплішого дня
  const [warmestResult, setWarmestResult] = React.useState('');

  // Завантаження даних з IndexedDB та міграція з localStorage
  React.useEffect(() => {
    async function loadData() {
      try {
        let dbItems = await getCitiesFromDB();

        // Якщо база порожня, перевіряємо чи є щось у localStorage для міграції
        if (dbItems.length === 0) {
          const localItems = loadFromLocalStorage();
          if (localItems.length > 0) {
            console.log('Виконується міграція даних з localStorage в IndexedDB...');
            for (let item of localItems) {
              await addCityToDB(item);
            }
            dbItems = localItems;
            localStorage.setItem('migrated', 'true');
          }
        }

        // Оновлюємо стан React завантаженими даними
        setItems(dbItems);
      } catch (error) {
        console.error('Помилка роботи з IndexedDB:', error);
      }
    }
    loadData();
  }, []); // Порожній масив означає, що це виконається лише 1 раз при завантаженні сторінки

  // Похідне значення: середня температура
  const averageTemp = items.length
    ? (items.reduce((sum, item) => sum + item.temp, 0) / items.length).toFixed(1)
    : 0;

  // Асинхронний обробник додавання нового міста
  const handleAddWeather = async (e) => {
    e.preventDefault();
    if (!dayInput || tempInput === '') return;

    const newItem = {
      id: Date.now(), // Унікальний ID на основі поточного часу
      day: dayInput.trim(),
      temp: Number(tempInput),
      description: descInput.trim()
    };

    // Зберігаємо запис у базу даних IndexedDB
    await addCityToDB(newItem);

    // Оновлюємо масив у React
    const updatedItems = [...items, newItem];
    setItems(updatedItems);

    // Також дублюємо в localStorage для історії міграцій/надійності
    saveToLocalStorage(updatedItems);
    // Очищаємо форму
    setDayInput('');
    setTempInput('');
    setDescInput('');
  };

  // Асинхронний обробник видалення міста
  const handleDelete = async (id) => {
    // Видаляємо запис з бази даних IndexedDB за його id
    await deleteCityFromDB(id);

    // Оновлюємо масив у React (залишаємо всі елементи, крім видаленого)
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);

    // Оновлюємо localStorage
    saveToLocalStorage(updatedItems);
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
    setWarmestResult(`Найтепліший запис: ${maxItem.day} (+${maxItem.temp} C)`);
  };

  return (
    <React.Fragment>
      {/* Рендер карток */}
      {items.map(item => (
        <WeatherCard
          key={item.id}
          id={item.id}
          day={item.day}
          tempC={item.temp}
          description={item.description}
          onDelete={handleDelete} // Передаємо функцію видалення в кожну картку
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
            <input type="text" className="add-weather-input" placeholder="День (напр. Пн)" value={dayInput} onChange={e => setDayInput(e.target.value)} required />            <input type="number" className="add-weather-input" placeholder="Температура C" value={tempInput} onChange={e => setTempInput(e.target.value)} min="-50" max="50" required />
            <input type="text" className="add-weather-input" placeholder="Опис (необов'язково)" value={descInput} onChange={e => setDescInput(e.target.value)} />
            <button type="submit" className="add-weather-submit" onClick={handleAddWeather}>Додати запис</button>
          </div>
        </React.Fragment>,
        document.getElementById('add-weather-form')
      )}

      {/* Передаємо кнопку пошуку через портал */}
      {ReactDOM.createPortal(
        <React.Fragment>
          <button type="button" className="warmest-btn" onClick={findWarmest}>Знайти найтепліший запис</button>
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