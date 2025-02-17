// Функция для форматирования времени в формат HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
}

// Функция для обновления таймера
function updateTimer() {
    const currentTime = localStorage.getItem('timeSpent') ? parseInt(localStorage.getItem('timeSpent')) : 0;
    const newTime = currentTime + 1;
    localStorage.setItem('timeSpent', newTime);
}

// Функция для запуска таймера
function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}

// Функция для остановки таймера
function stopTimer() {
    clearInterval(timerInterval);
}

// Функция для сброса таймера
function resetTimer() {
    localStorage.removeItem('timeSpent');
}

// Обработчики событий для сброса таймера при закрытии или обновлении страницы
window.addEventListener('beforeunload', stopTimer);
window.addEventListener('unload', resetTimer);

// Инициализация таймера при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    startTimer();
    setActiveMenuItem();
    addNavLinkListeners();
    loadContentFromUrl();
});

// Функция для выделения активного пункта меню
function setActiveMenuItem() {
    const links = document.querySelectorAll('.HeaderDown a');
    const currentPath = window.location.pathname.split('/').pop(); // Получаем имя файла из пути
    links.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop(); // Получаем имя файла из ссылки
        // Проверяем, соответствует ли текущий путь пути ссылки
        if (currentPath === linkPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Функция для добавления слушателей событий на ссылки навигации
function addNavLinkListeners() {
    const links = document.querySelectorAll('.HeaderDown a');
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Предотвращаем стандартное поведение ссылки
            const href = link.getAttribute('href').split('/').pop(); // Получаем имя файла из ссылки
            if (href.startsWith('#')) {
                // Обработка внутренних ссылок (например, #Notes)
                window.location.hash = href;
            } else {
                // Загрузка контента динамически
                loadContent(href);
                history.pushState({ path: href }, '', href); // Обновляем URL без перезагрузки
            }
            setActiveMenuItem();
        });
    });
}

// Функция для загрузки контента динамически
async function loadContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.Main').innerHTML;
        document.querySelector('.Main').innerHTML = content;

        // Удаляем существующие скрипты
        const scripts = document.querySelectorAll('.Main script');
        scripts.forEach(script => script.remove());

        // Добавляем новые скрипты
        const newScripts = doc.querySelectorAll('.Main script');
        newScripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            document.querySelector('.Main').appendChild(newScript);
        });

        // Обновляем таймер на странице time.html
        if (url === 'time.html') {
            displayTimer();
            updateTimerDisplay();
        } else {
            // Скрываем карту и очищаем её при переходе на другие страницы
            hideAndResetMap();
        }

        // Добавляем обработчик событий для кнопки showMapButton
        addMapButtonListener();
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Функция для отображения таймера
function displayTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        const currentTime = localStorage.getItem('timeSpent') ? parseInt(localStorage.getItem('timeSpent')) : 0;
        timerElement.textContent = formatTime(currentTime);
    }
}

// Функция для обновления отображения таймера каждую секунду
function updateTimerDisplay() {
    setInterval(() => {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            const currentTime = localStorage.getItem('timeSpent') ? parseInt(localStorage.getItem('timeSpent')) : 0;
            timerElement.textContent = formatTime(currentTime);
        }
    }, 1000);
}

// Функция для загрузки контента на основе текущего URL
function loadContentFromUrl() {
    const currentPath = window.location.pathname.split('/').pop(); // Получаем имя файла из пути
    if (currentPath === 'time.html') {
        displayTimer();
        updateTimerDisplay();
    } else {
        loadContent(currentPath);
    }
}

// Обработчик события popstate для обновления контента при использовании кнопок назад/вперёд
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.path) {
        loadContent(event.state.path);
        setActiveMenuItem();
    }
});

// Функция для добавления обработчика событий на кнопку showMapButton
function addMapButtonListener() {
    const showMapButton = document.getElementById('showMapButton');
    if (showMapButton) {
        showMapButton.addEventListener('click', function() {
            // Удаляем кнопку
            this.remove();
            // Показываем карту
            document.getElementById('map').style.display = 'block';
            // Инициализируем карту
            initMap();
        });
    }
}

// Функция для карты
async function initMap() {
    if (!window.mapInitialized) {
        // Проверяем, загружена ли библиотека Leaflet
        if (typeof L === 'undefined') {
            await loadLeaflet();
        }
        var map = L.map('map').setView([55.755826, 37.6173], 10); // Координаты Москвы
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        window.mapInitialized = true;
    }
}

// Функция для динамической загрузки библиотеки Leaflet
function loadLeaflet() {
    return new Promise((resolve, reject) => {
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(leafletCss);

        const leafletJs = document.createElement('script');
        leafletJs.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        leafletJs.onload = resolve;
        leafletJs.onerror = reject;
        document.head.appendChild(leafletJs);
    });
}

// Функция для скрытия и очистки карты
function hideAndResetMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = ''; // Очищаем содержимое карты
        window.mapInitialized = false; // Сбрасываем флаг инициализации карты
    }
}