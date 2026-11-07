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
function WeatherCard({ id, name, lat, lon, temperature, weatherCode, time, onDelete }) {
  // Локальний реактивний стан для відображення Фаренгейтів
  const [showFahrenheit, setShowFahrenheit] = React.useState(false);

  // Похідне значення: обчислення Фаренгейтів
  const tempF = Math.round(temperature * 9 / 5 + 32);

  // Стилізація картки та температури
  const cardClass = `card ${temperature < 0 ? 'cold' : ''}`;
  const tempClass = `temp-value ${temperature > 18 ? 'temp-warm' : 'temp-cold'}`;
  
  // Отримуємо опис з об'єкта weatherCodes
  const descText = weatherCodes[weatherCode] || 'невідомо';

  return (
    <article className={cardClass}>
      <h3 onClick={() => setShowFahrenheit(!showFahrenheit)} style={{ cursor: 'pointer', margin: '0 0 5px 0' }}>
        {name}
      </h3>
      {/* Виведення координат міста */}
      <div style={{fontSize: '12px', color: '#64748b', marginBottom: '8px'}}>
        Шир: {lat}, Довг: {lon}
      </div>
      <p className={tempClass} onClick={() => setShowFahrenheit(!showFahrenheit)} style={{ cursor: 'pointer', margin: '5px 0' }}>
        {temperature > 0 ? '+' : ''}{temperature}°C
        {/* Показуємо Фаренгейти лише якщо showFahrenheit === true */}
        {showFahrenheit && <span style={{ fontSize: '20px', color: '#64748b' }}> / {tempF}°F</span>}
      </p>
      <p className="forecast-desc" style={{margin: '5px 0'}}>{descText}</p>
      {/* Виведення часу останнього оновлення */}
      <p style={{fontSize: '11px', color: '#94a3b8', margin: '5px 0'}}>Оновлено: {time}</p>
      <button
        className="add-weather-submit"
        style={{ marginTop: '10px', marginRight: '6px', fontSize: '13px', padding: '4px 8px' }}
        onClick={() => setWeatherIcon(weatherCode, name)}
      >
        Показати на іконці
      </button>
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
  
  // Стан для відображення помилки бази даних в інтерфейсі
  const [dbError, setDbError] = React.useState(''); 

  // Нова модель даних для форми (місто, координати, температура, код погоди)
  const [nameInput, setNameInput] = React.useState('');
  const [latInput, setLatInput] = React.useState('');
  const [lonInput, setLonInput] = React.useState('');
  const [tempInput, setTempInput] = React.useState('');
  const [codeInput, setCodeInput] = React.useState('0');

  // Стан для результату найтеплішого дня
  const [warmestResult, setWarmestResult] = React.useState('');

  // Завантаження даних з IndexedDB та міграція з localStorage
  React.useEffect(() => {
    async function loadData() {
      try {
        let dbItems = await getCitiesFromDB();

        // Якщо база порожня, перевіряємо чи є щось у localStorage для міграції та чи не була вона вже виконана
        if (dbItems.length === 0 && localStorage.getItem('migrated') !== 'true') {
          const localItems = loadFromLocalStorage();
          if (localItems.length > 0) {
            console.log('Виконується міграція даних з localStorage в IndexedDB...');
            for (let item of localItems) {
              await addCityToDB(item);
            }
            // Отримуємо актуальні дані після міграції
            dbItems = await getCitiesFromDB();
          }
          // Встановлюємо прапорець після успішної міграції
          localStorage.setItem('migrated', 'true');
        }

        // Оновлюємо стан React завантаженими даними
        setItems(dbItems);
      } catch (error) {
        console.error('Помилка роботи з IndexedDB:', error);
        // Виводимо помилку в інтерфейс, якщо БД недоступна
        setDbError('Помилка бази даних: не вдалося завантажити збережені міста.');
      }
    }
    loadData();
  }, []); // Порожній масив означає, що це виконається лише 1 раз при завантаженні сторінки

  // Похідне значення: середня температура
  const averageTemp = items.length
    ? (items.reduce((sum, item) => sum + item.temperature, 0) / items.length).toFixed(1)
    : 0;

  // Асинхронний обробник додавання нового міста
  const handleAddWeather = async (e) => {
    e.preventDefault();
    if (!nameInput || !latInput || !lonInput || tempInput === '') return;

    // Створюємо об'єкт за новою моделлю даних
    const newItem = {
      id: Date.now(), // Унікальний ID на основі поточного часу
      name: nameInput.trim(),
      lat: Number(latInput),
      lon: Number(lonInput),
      temperature: Number(tempInput),
      weatherCode: Number(codeInput),
      time: new Date().toLocaleTimeString() // фіксуємо час створення/оновлення
    };

    try {
      // Зберігаємо запис у базу даних IndexedDB
      await addCityToDB(newItem);

      // Оновлюємо масив у React
      const updatedItems = [...items, newItem];
      setItems(updatedItems);

      // Також дублюємо в localStorage для історії міграцій/надійності
      saveToLocalStorage(updatedItems);
      
      // Очищаємо форму
      setNameInput('');
      setLatInput('');
      setLonInput('');
      setTempInput('');
      setCodeInput('0');
      setDbError(''); // очищаємо помилку, якщо запис пройшов успішно
    } catch (error) {
      setDbError('Помилка бази даних: не вдалося зберегти нове місто.');
    }
  };

  // Асинхронний обробник видалення міста
  const handleDelete = async (id) => {
    try {
      // Видаляємо запис з бази даних IndexedDB за його id
      await deleteCityFromDB(id);

      // Оновлюємо масив у React (залишаємо всі елементи, крім видаленого)
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);

      // Оновлюємо localStorage
      saveToLocalStorage(updatedItems);
      setDbError('');
    } catch (error) {
      setDbError('Помилка бази даних: не вдалося видалити запис.');
    }
  };

  // Обробник пошуку найтеплішого дня
  const findWarmest = () => {
    if (items.length === 0) return;
    let maxItem = items[0];
    items.forEach(item => {
      if (item.temperature > maxItem.temperature) maxItem = item;
    });
    setWarmestResult(`Найтепліше: ${maxItem.name} (+${maxItem.temperature} C)`);
  };

  return (
    <React.Fragment>
      {/* Виведення помилки IndexedDB на екран */}
      {dbError && ReactDOM.createPortal(
        <div style={{backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontWeight: 'bold'}}>
          {dbError}
        </div>,
        document.querySelector('.top-wrapper') // або інший існуючий контейнер
      )}

      {/* Рендер карток */}
      {items.map(item => (
        <WeatherCard
          key={item.id}
          id={item.id}
          name={item.name}
          lat={item.lat}
          lon={item.lon}
          temperature={item.temperature}
          weatherCode={item.weatherCode}
          time={item.time}
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
          <h3 className="add-weather-title">Зберегти нове місто</h3>
          <div className="form-inputs" style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            <input type="text" className="add-weather-input" placeholder="Місто (напр. Київ)" value={nameInput} onChange={e => setNameInput(e.target.value)} required />
            <input type="number" step="0.01" className="add-weather-input" placeholder="Широта (lat)" value={latInput} onChange={e => setLatInput(e.target.value)} required style={{width: '120px'}}/>
            <input type="number" step="0.01" className="add-weather-input" placeholder="Довгота (lon)" value={lonInput} onChange={e => setLonInput(e.target.value)} required style={{width: '120px'}}/>
            <input type="number" className="add-weather-input" placeholder="Темп. C" value={tempInput} onChange={e => setTempInput(e.target.value)} min="-50" max="50" required style={{width: '100px'}}/>
            <select className="add-weather-input" value={codeInput} onChange={e => setCodeInput(e.target.value)}>
              {Object.entries(weatherCodes).map(([code, desc]) => (
                <option key={code} value={code}>{desc}</option>
              ))}
            </select>
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

const weatherCanvas = document.querySelector('#weather-canvas');
const wctx = weatherCanvas.getContext('2d'); // 2D-контекст для малювання
const iconCaption = document.querySelector('#icon-caption');
const toggleAnimBtn = document.querySelector('#toggle-anim-btn');
 
let iconType = 'sun';        // тип іконки: sun, partly, cloud, rain, snow, storm
let sunAngle = 0;            // поточний кут обертання сонця
let particles = [];          // краплі дощу або сніжинки
let flashFrames = 0;         // скільки кадрів ще триває спалах блискавки
let animationId = null;      // id запиту requestAnimationFrame
let animationRunning = true; // чи ввімкнена анімація користувачем
let canvasVisible = true;    // чи видно полотно на екрані
let cloudPhase = 0;          // фаза коливання хмари

// Кількість частинок залежить від коду погоди (інтенсивність опадів)
const particleCount = { 51: 10, 61: 22, 71: 18, 95: 36 };

// Перетворює код погоди з API або з бази даних на тип іконки
function getIconType(code) {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2) return 'partly';
  if (code === 51 || code === 61) return 'rain';
  if (code === 71) return 'snow';
  if (code === 95) return 'storm';
  return 'cloud'; // коди 3, 45, 48 та невідомі коди
}

// Створює краплі або сніжинки під хмарою
function createParticles(code) {
  const count = particleCount[code] || 0;
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: 25 + Math.random() * 70,
      y: 58 + Math.random() * 55,
      speed: iconType === 'snow' ? 0.4 + Math.random() * 0.5 : 2 + Math.random() * 2
    });
  }
}

// Головна функція: бере код погоди з даних і налаштовує стан анімації
function setWeatherIcon(code, label) {
  iconType = getIconType(code);
  createParticles(code);
  iconCaption.textContent =
    `Іконка: ${weatherCodes[code] || 'невідомо'} (${label})`;
  if (!animationRunning) drawFrame(); // на паузі малюємо один статичний кадр
}

// Заповнене коло
function fillCircle(x, y, r, color) {
  wctx.fillStyle = color;
  wctx.beginPath();
  wctx.arc(x, y, r, 0, Math.PI * 2);
  wctx.fill();
}

// Сонце: диск і 8 променів, які обертаються навколо центру
function drawSun(cx, cy, r) {
  wctx.save();               // зберігаємо систему координат
  wctx.translate(cx, cy);
  wctx.rotate(sunAngle);
  wctx.strokeStyle = '#fbbf24';
  wctx.lineWidth = 3;
  wctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    wctx.beginPath();
    wctx.moveTo(r + 6, 0);
    wctx.lineTo(r + 15, 0);
    wctx.stroke();
    wctx.rotate(Math.PI / 4);
  }
  wctx.restore();            // повертаємо координати до початкових
  fillCircle(cx, cy, r, '#fbbf24');
}

// Хмара з трьох кіл і прямокутника, повільно коливається вліво-вправо
function drawCloud(cx, cy, color) {
  const x = cx + Math.sin(cloudPhase) * 5; // зсув хмари
  fillCircle(x - 18, cy + 4, 14, color);
  fillCircle(x, cy - 6, 18, color);
  fillCircle(x + 18, cy + 4, 14, color);
  wctx.fillStyle = color;
  wctx.fillRect(x - 18, cy + 4, 36, 14);
}

// Блискавка для грози
function drawLightning() {
  wctx.fillStyle = '#fde047';
  wctx.beginPath();
  wctx.moveTo(64, 52);
  wctx.lineTo(52, 80);
  wctx.lineTo(60, 80);
  wctx.lineTo(54, 106);
  wctx.lineTo(74, 72);
  wctx.lineTo(65, 72);
  wctx.closePath();
  wctx.fill();
}

// Краплі дощу (лінії) або сніжинки (кола)
function drawParticles() {
  particles.forEach(p => {
    if (iconType === 'snow') {
      fillCircle(p.x, p.y, 2.5, '#ffffff');
    } else {
      wctx.strokeStyle = '#38bdf8';
      wctx.lineWidth = 2;
      wctx.beginPath();
      wctx.moveTo(p.x, p.y);
      wctx.lineTo(p.x - 2, p.y + 8);
      wctx.stroke();
    }
  });
}

// Малює один кадр залежно від поточного типу іконки
function drawFrame() {
  wctx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
  if (iconType === 'sun') {
    drawSun(60, 60, 20);
  } else if (iconType === 'partly') {
    drawSun(80, 42, 16);
    drawCloud(52, 72, '#e2e8f0');
  } else if (iconType === 'cloud') {
    drawCloud(60, 60, '#cbd5e1');
  } else {
    drawCloud(60, 38, iconType === 'storm' ? '#64748b' : '#94a3b8');
    if (iconType === 'storm' && flashFrames > 0) drawLightning();
    drawParticles();
  }
}

// Оновлює стан анімації (кут сонця, позиції крапель, спалахи)
function updateState() {
  cloudPhase += 0.03;
  sunAngle += 0.02;
  particles.forEach(p => {
    p.y += p.speed;
    if (p.y > weatherCanvas.height) { // частинка впала - повертаємо вгору
      p.y = 58;
      p.x = 25 + Math.random() * 70;
    }
  });
  if (iconType === 'storm') {
    if (flashFrames > 0) flashFrames--;
    else if (Math.random() < 0.01) flashFrames = 6;
  }
}

// Цикл анімації: оновити стан, перемалювати кадр, запросити наступний
function animate() {
  updateState();
  drawFrame();
  animationId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationId === null) animationId = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Кнопка старт/стоп
toggleAnimBtn.addEventListener('click', () => {
  animationRunning = !animationRunning;
  toggleAnimBtn.textContent =
    animationRunning ? 'Зупинити анімацію' : 'Запустити анімацію';
  if (animationRunning && canvasVisible) startAnimation();
  else stopAnimation();
});

// Зупиняємо анімацію, коли полотно прокручено за межі екрана
const canvasObserver = new IntersectionObserver((entries) => {
  canvasVisible = entries[0].isIntersecting;
  if (canvasVisible && animationRunning) startAnimation();
  else stopAnimation();
});
canvasObserver.observe(weatherCanvas);

// Початковий стан до відповіді API
setWeatherIcon(0, 'Київ, початкове значення');
startAnimation();

const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current=temperature_2m,weather_code&timezone=auto';

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
    // Оновлюємо Canvas-іконку за новими даними з API
    setWeatherIcon(code, 'Київ, поточна погода');

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