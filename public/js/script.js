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

// Читає один запис зі сховища cities за його ключем 
async function getCityByIdFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cities', 'readonly');
    const request = tx.objectStore('cities').get(id);
    request.onsuccess = () => resolve(request.result); // undefined, якщо немає
    request.onerror = () => reject(request.error);
  });
}

// Отримує список міст з локального сервера
async function fetchCitiesFromServer() {
  const response = await fetch('/api/cities');
  if (!response.ok) throw new Error('Помилка сервера: ' + response.status);
  return await response.json();
}

// Отримує одне місто з сервера. Якщо сервер відповів 404 - повертає null
async function fetchCityFromServer(id) {
  const response = await fetch('/api/cities/' + id);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Помилка сервера: ' + response.status);
  return await response.json();
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
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
        Шир: {lat}, Довг: {lon}
      </div>
      <p className={tempClass} onClick={() => setShowFahrenheit(!showFahrenheit)} style={{ cursor: 'pointer', margin: '5px 0' }}>
        {temperature > 0 ? '+' : ''}{temperature}°C
        {/* Показуємо Фаренгейти лише якщо showFahrenheit === true */}
        {showFahrenheit && <span style={{ fontSize: '20px', color: '#64748b' }}> / {tempF}°F</span>}
      </p>
      <p className="forecast-desc" style={{ margin: '5px 0' }}>{descText}</p>
      {/* Виведення часу останнього оновлення */}
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '5px 0' }}>Оновлено: {time}</p>
      <a
        href={'#/cities/' + id}
        data-link
        className="add-weather-submit"
        style={{ marginTop: '10px', marginRight: '6px', fontSize: '13px', padding: '4px 8px' }}
      >
        Показати прогноз
      </a>
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

function CitiesPage() {
  // Стан для списку міст (спочатку порожній, завантажиться з БД)
  const [items, setItems] = React.useState([]);

  // Стан для відображення помилки бази даних в інтерфейсі
  const [dbError, setDbError] = React.useState('');

  // Нова модель даних для форми (місто, координати, температура, код погоди)
  const [nameInput, setNameInput] = React.useState('');
  const [latInput, setLatInput] = React.useState('');
  const [lonInput, setLonInput] = React.useState('');

  // Стан для результату найтеплішого дня
  const [warmestResult, setWarmestResult] = React.useState('');

  // Завантаження даних з IndexedDB та міграція з localStorage
  React.useEffect(() => {
    async function loadCities() {
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
    loadCities();
  }, []); // Порожній масив означає, що це виконається лише 1 раз при завантаженні сторінки

  // Похідне значення: середня температура
  const averageTemp = items.length
    ? (items.reduce((sum, item) => sum + item.temperature, 0) / items.length).toFixed(1)
    : 0;

  // Асинхронний обробник додавання нового міста.
  // Температуру і код погоди беремо з API за координатами
  const handleAddWeather = async (e) => {
    e.preventDefault();
    if (!nameInput || !latInput || !lonInput) return;

    const lat = Number(latInput);
    const lon = Number(lonInput);

    try {
      // Запит до API (buildApiUrl оголошена нижче у файлі, але підіймається)
      const response = await fetch(buildApiUrl(lat, lon));
      if (!response.ok) throw new Error('Помилка сервера: ' + response.status);
      const data = await response.json();

      // Створюємо об'єкт за моделлю даних (температура і код - з API)
      const newItem = {
        id: Date.now(), // Унікальний ID на основі поточного часу
        name: nameInput.trim(),
        lat: lat,
        lon: lon,
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        time: new Date().toLocaleTimeString() // час, на який зафіксована температура
      };

      // Зберігаємо запис у базу даних IndexedDB
      await addCityToDB(newItem);

      // Оновлюємо масив у React і дублюємо в localStorage
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      saveToLocalStorage(updatedItems);

      // Очищаємо форму
      setNameInput('');
      setLatInput('');
      setLonInput('');
      setDbError('');
    } catch (error) {
      console.error('Помилка додавання міста:', error);
      setDbError('Не вдалося додати місто: перевірте координати та з\'єднання.');
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

  // Стан для повідомлення про результат завантаження із сервера
  const [serverMsg, setServerMsg] = React.useState('');

  // Завантажує міста з локального сервера й додає ті, яких ще немає в базі
  const handleLoadFromServer = async () => {
    try {
      const serverCities = await fetchCitiesFromServer();
      const added = [];
      for (const c of serverCities) {
        if (items.some(item => item.id === c.id)) continue;
        // Сервер віддає лише id, name, lat, lon - погоду беремо з Open-Meteo
        const response = await fetch(buildApiUrl(c.lat, c.lon));
        if (!response.ok) throw new Error('Помилка сервера: ' + response.status);
        const data = await response.json();
        const newItem = {
          id: c.id,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          time: new Date().toLocaleTimeString()
        };
        await addCityToDB(newItem);
        added.push(newItem);
      }
      const updatedItems = [...items, ...added];
      setItems(updatedItems);
      saveToLocalStorage(updatedItems);
      setDbError('');
      setServerMsg('Додано міст із сервера: ' + added.length);
    } catch (error) {
      console.error('Помилка завантаження з сервера:', error);
      setServerMsg('');
      setDbError('Не вдалося завантажити міста із сервера. ' +
        'Перевірте, чи запущено сервер.');
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

  // Повертається розмітка сторінки "/cities".
  return (
    <React.Fragment>
      {/* Виведення помилки IndexedDB прямо на сторінці */}
      {dbError && <div className="db-error">{dbError}</div>}

      {/* Форма додавання міста */}
      <form className="add-weather-form" onSubmit={handleAddWeather}>
        <h3 className="add-weather-title">Зберегти нове місто</h3>
        <div className="form-inputs" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input type="text" className="add-weather-input" placeholder="Місто (напр. Київ)" value={nameInput} onChange={e => setNameInput(e.target.value)} required />
          <input type="number" step="0.01" className="add-weather-input" placeholder="Широта (lat)" value={latInput} onChange={e => setLatInput(e.target.value)} required style={{ width: '120px' }} />
          <input type="number" step="0.01" className="add-weather-input" placeholder="Довгота (lon)" value={lonInput} onChange={e => setLonInput(e.target.value)} required style={{ width: '120px' }} />
          {/* Кнопка submit, відправка форми викликає handleAddWeather */}
          <button type="submit" className="add-weather-submit">Додати запис</button>
        </div>
      </form>

      {/* Кнопка завантаження списку міст з локального сервера */}
      <div className="warmest-action">
        <button type="button" className="add-weather-submit" onClick={handleLoadFromServer}>
          Завантажити міста із сервера
        </button>
        <p className="warmest-result-text">{serverMsg}</p>
      </div>

      {/* Кнопка пошуку найтеплішого запису і текст результату */}
      <div className="warmest-action">
        <button type="button" className="warmest-btn" onClick={findWarmest}>
          Знайти найтепліший запис
        </button>
        <p className="warmest-result-text">{warmestResult}</p>
      </div>

      {/* Секція зі збереженими містами */}
      <section className="content-section forecast-section">
        <h2>Збережені міста</h2>

        {/* Середня температура */}
        <p className="avg-temp-info">Середня температура за період: {averageTemp} C</p>

        {/* Повідомлення, якщо в базі ще немає жодного міста */}
        {items.length === 0 && (
          <p>Збережених міст ще немає. Додайте перше місто у формі вище.</p>
        )}

        {/* Рендер карток: {...item} передає id, name, lat, lon, temperature,
            weatherCode і time; onDelete викликає видалення з IndexedDB */}
        <div className="forecast-grid">
          {items.map(item => (
            <WeatherCard key={item.id} {...item} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    </React.Fragment>
  );
}

let weatherCanvas = null;
let wctx = null;
let iconCaption = null;
let toggleAnimBtn = null;

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

// Зупиняємо анімацію, коли полотно прокручено за межі екрана
const canvasObserver = new IntersectionObserver((entries) => {
  canvasVisible = entries[0].isIntersecting;
  if (canvasVisible && animationRunning) startAnimation();
  else stopAnimation();
});

// Обробник кнопки старт/стоп 
function onToggleAnimation() {
  animationRunning = !animationRunning;
  toggleAnimBtn.textContent =
    animationRunning ? 'Зупинити анімацію' : 'Запустити анімацію';
  if (animationRunning && canvasVisible) startAnimation();
  else stopAnimation();
}

// Підключає canvas і запускає анімацію
function initWeatherCanvas() {
  weatherCanvas = document.querySelector('#weather-canvas');
  wctx = weatherCanvas.getContext('2d');
  iconCaption = document.querySelector('#icon-caption');
  toggleAnimBtn = document.querySelector('#toggle-anim-btn');
  toggleAnimBtn.textContent =
    animationRunning ? 'Зупинити анімацію' : 'Запустити анімацію';
  toggleAnimBtn.addEventListener('click', onToggleAnimation);
  canvasVisible = true;
  canvasObserver.observe(weatherCanvas);
  if (animationRunning) startAnimation();
}

let requestCounter = 0; // захист від застарілих відповідей

function buildApiUrl(lat, lon) {
  const safeLat = Number(lat);
  const safeLon = Number(lon);
  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) {
    throw new Error('Некоректні координати');
  }
  return 'https://api.open-meteo.com/v1/forecast?latitude=' + safeLat +
    '&longitude=' + safeLon +
    '&current=temperature_2m,weather_code&timezone=auto';
}

async function loadData(city) {
  const myRequest = ++requestCounter;
  // Елементи шукаються на кожному виклику, бо сторінка щоразу створюється заново
  const updateBtn = document.querySelector('#update-btn');
  const apiStatus = document.querySelector('#api-status');
  const tempValue = document.querySelector('.current-weather .temp-value');
  const weatherCond = document.querySelector('.current-weather .weather-cond');

  apiStatus.textContent = 'Завантаження...';
  apiStatus.style.color = '#fbbf24';
  updateBtn.disabled = true;

  try {
    const response = await fetch(buildApiUrl(city.lat, city.lon));
    if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
    const data = await response.json();
    if (myRequest !== requestCounter) return;

    const temp = data.current.temperature_2m;
    const code = data.current.weather_code;
    tempValue.textContent = `${temp > 0 ? '+' : ''}${temp}\u00B0C`; 
    weatherCond.textContent = weatherCodes[code] || 'невідомо';
    setWeatherIcon(code, `${city.name}, поточна погода`);
    apiStatus.textContent = '';
  } catch (error) {
    if (myRequest !== requestCounter) return;
    apiStatus.textContent = 'Не вдалося отримати прогноз погоди';
    apiStatus.style.color = '#f87171';
    console.error('Помилка API:', error);
  } finally {
    updateBtn.disabled = false;
  }
}

// innerHTML безпечний: статичний шаблон без даних користувача
function forecastTemplate() {
  return `
    <div class="top-wrapper">
      <section id="current" class="content-section current-weather">
        <h2>Поточна погода</h2>
        <button id="update-btn" class="add-weather-submit"
                style="margin-bottom: 10px;">Оновити погоду</button>
        <p id="api-status"
           style="font-weight: 600; color: #fbbf24; margin: 0 0 15px 0;"></p>
        <div class="current-weather-info">
          <div class="weather-icon-box">
            <canvas id="weather-canvas" class="weather-canvas"
                    width="120" height="120"></canvas>
            <p id="icon-caption" class="icon-caption"></p>
          </div>
          <div class="current-details">
            <p id="city-name" class="city-name"></p>
            <p class="temp-display">
              <span class="temp-value temp-warm">--</span>,
              <span class="weather-cond">--</span>
            </p>
          </div>
        </div>
        <div class="anim-controls">
          <button id="toggle-anim-btn" class="add-weather-submit">Зупинити анімацію</button>
        </div>
      </section>
      <aside class="daily-tip">
        <h2>Порада дня</h2>
        <p>Що вдягнути: сьогодні очікується сонячна погода, але ввечері можливе похолодання. Візьміть із собою легку куртку!</p>
      </aside>
    </div>`;
}

const DEFAULT_CITY = { name: 'Київ', lat: 50.45, lon: 30.52 };

function saveLastCity(city) {
  const short = { name: city.name, lat: city.lat, lon: city.lon };
  localStorage.setItem('lastCity', JSON.stringify(short));
}

function getLastCity() {
  try {
    const raw = localStorage.getItem('lastCity');
    return raw ? JSON.parse(raw) : DEFAULT_CITY;
  } catch (error) {
    console.error('Пошкоджені дані lastCity:', error);
    return DEFAULT_CITY;
  }
}

// Маршрути:
// / прогноз для останнього обраного міста 
// /cities список збережених міст зі сховища "cities" 
// /cities/:i прогноз для одного міста, :id - ключ запису в IndexedDB
const routes = [
  { path: '/', view: renderHome },
  { path: '/cities', view: renderCities },
  { path: '/cities/:id', view: renderCityDetail }
];

function matchRoute(path) {
  const pathParts = path.split('/').filter(Boolean);
  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    const isMatch = routeParts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = pathParts[i];
        return true;
      }
      return part === pathParts[i];
    });
    if (isMatch) return { view: route.view, params };
  }
  return null;
}

const app = document.querySelector('#app');
let currentRoot = null;
let renderCounter = 0;

function clearApp() {
  stopAnimation();
  canvasObserver.disconnect();
  requestCounter++;
  if (currentRoot) {
    currentRoot.unmount();
    currentRoot = null;
  }
  app.innerHTML = '';
}

function render() {
  const myRender = ++renderCounter;
  const path = location.hash.slice(1) || '/';
  const match = matchRoute(path);
  clearApp();
  if (match) match.view(match.params, myRender);
  else renderNotFound('Адреси ' + path + ' не існує.');
  highlightActiveLink(path);
}

function renderHome() {
  renderForecastPage(getLastCity());
}

function renderCities() {
  currentRoot = ReactDOM.createRoot(app);
  currentRoot.render(<CitiesPage />);
}

// Спільна сторінка прогнозу: її використовують і "/", і "/cities/:id"
function renderForecastPage(city, savedCode) {
  app.innerHTML = forecastTemplate();
  // Показуємо й координати, щоб одразу видно було, для якої точки прогноз
  document.querySelector('#city-name').textContent =
    city.name + ' (' + city.lat + ', ' + city.lon + ')';
  initWeatherCanvas();

  if (savedCode !== undefined) {
    setWeatherIcon(savedCode, city.name + ', збережені дані');

    // До відповіді API показуємо температуру й опис, збережені в базі
    const savedTemp = city.temperature;
    const savedDesc = weatherCodes[savedCode] || 'невідомо';
    document.querySelector('.current-weather .temp-value').textContent =
      (savedTemp > 0 ? '+' : '') + savedTemp + '\u00B0C';
    document.querySelector('.current-weather .weather-cond').textContent = savedDesc;

    // Окремий рядок: що саме збережено в базі (не зникає після відповіді API)
    const note = document.createElement('p');
    note.className = 'icon-caption';
    note.textContent = 'Збережено в базі на момент додавання: ' +
      (savedTemp > 0 ? '+' : '') + savedTemp + ' C, ' + savedDesc;
    document.querySelector('.current-details').appendChild(note);
  } else {
    setWeatherIcon(0, city.name + ', початкове значення');
  }

  // Кнопка "Оновити погоду" повторно запитує прогноз за координатами міста
  document.querySelector('#update-btn')
    .addEventListener('click', () => loadData(city));
  loadData(city);
}

async function renderCityDetail(params, myRender) {
  const id = Number(params.id); // параметр - рядок, а ключі в IndexedDB - числа
  if (Number.isNaN(id)) {
    renderNotFound('Некоректний id міста: ' + params.id);
    return;
  }
  try {
    let city = await getCityByIdFromDB(id);
    // Якщо в базі міста немає питаємо локальний сервер
    if (!city) city = await fetchCityFromServer(id);
    if (myRender !== renderCounter) return; // користувач уже пішов зі сторінки
    if (!city) {
      renderNotFound('Місто з id ' + id +
        ' не знайдено ні в базі даних, ні на сервері.');
      return;
    }
    saveLastCity(city);
    renderForecastPage(city, city.weatherCode);
  } catch (error) {
    console.error('Помилка отримання міста:', error);
    if (myRender === renderCounter) {
      renderNotFound('Не вдалося отримати дані міста.');
    }
  }
}

function renderNotFound(message) {
  app.innerHTML = `
    <section class="content-section not-found">
      <h2>Сторінку не знайдено</h2>
      <p id="not-found-text"></p>
      <a href="#/" data-link class="add-weather-submit">На головну</a>
    </section>`;
  document.querySelector('#not-found-text').textContent = message;
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute('href').slice(1));
});

// Зміна хеша додає запис в історію і викликає hashchange
function navigate(path) {
  location.hash = path;
}

// Підсвічує пункт меню, що відповідає поточному маршруту
function highlightActiveLink(path) {
  document.querySelectorAll('.main-nav a[data-link]').forEach(link => {
    const target = link.getAttribute('href').slice(1);
    const isActive = target === '/'
      ? path === '/'
      : path === target || path.startsWith(target + '/');
    link.classList.toggle('active', isActive);
  });
}

document.querySelector('.search-form').addEventListener('submit', (event) => {
  event.preventDefault();
});

window.addEventListener('hashchange', render);
render();