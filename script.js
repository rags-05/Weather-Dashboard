const API_KEY = "e5a619c2999fadbe3035283d1d9f37bb";
let currentUnit = 'C';
let tempChart = null;

// DOM Elements
const searchInput = document.querySelector('.input_field');
const searchBtn = document.querySelector('.btn_search');
const unitToggleBtns = document.querySelectorAll('.temp-unit');
const cityNameEl = document.querySelector('.city-name');
const currentDateEl = document.querySelector('.current-date');
const currentTimeEl = document.querySelector('.current-time');
const temperatureEl = document.querySelector('.temperature');
const feelsLikeEl = document.querySelector('.feels-like');
const weatherImgEl = document.querySelector('.weather-img');
const weatherDescEl = document.querySelector('.weather-desc');
const humidityEl = document.querySelector('.humidity');
const windSpeedEl = document.querySelector('.wind-speed');
const pressureEl = document.querySelector('.pressure');
const visibilityEl = document.querySelector('.visibility');
const forecastContainer = document.querySelector('.forecast-container');

const weatherBackgrounds = {
    'Clear': 'https://images.unsplash.com/photo-1541119638723-c51cbe2262aa?auto=format&fit=crop&w=1920',
    'Clouds': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920',
    'Rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920',
    'Snow': 'https://images.unsplash.com/photo-1516431883659-655d88b02f89?auto=format&fit=crop&w=1920',
    'Thunderstorm': 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920',
    'Drizzle': 'https://images.unsplash.com/photo-1541919329513-35f7af297129?auto=format&fit=crop&w=1920',
    'Mist': 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&w=1920',
    'Fog': 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&w=1920',
    'Haze': 'https://images.unsplash.com/photo-1530743373890-f3c506b0b5d1?auto=format&fit=crop&w=1920',
    'Smoke': 'https://images.unsplash.com/photo-1625377855067-a0d45ff38a82?auto=format&fit=crop&w=1920',
    'default': 'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?auto=format&fit=crop&w=1920'
};

// Initialize
async function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupEventListeners();
    
    try {
        await getCurrentLocationWeather();
    } catch (error) {
        console.error('Error getting current location:', error);
        // Fallback to default location
        await handleSearch('Rudraprayag');
    }
}

function setupEventListeners() {
    // Enable input field explicitly
    searchInput.disabled = false;
    
    searchBtn.addEventListener('click', () => validateAndSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateAndSearch();
    });
    
    unitToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentUnit = btn.dataset.unit;
            unitToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (cityNameEl.textContent !== '--' && cityNameEl.textContent !== 'City not found') {
                handleSearch(cityNameEl.textContent.split(',')[0]);
            }
        });
    });
}

function validateAndSearch() {
    const searchValue = searchInput.value.trim();
    
    // Check if the input contains only numbers
    if (/^\d+$/.test(searchValue)) {
        alert('Please enter a valid city name, not numbers.');
        searchInput.value = ''; // Clear the input
        searchInput.disabled = false; // Ensure input is enabled
        searchInput.focus(); // Return focus to the input
        return;
    }
        
    // Check if the input is empty
    if (!searchValue) {
        alert('Please enter a city name.');
        searchInput.disabled = false; // Ensure input is enabled
        searchInput.focus();
        return;
    }
    
    handleSearch();
}

async function getCurrentLocationWeather() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await fetchWeatherDataByCoords(latitude, longitude);
                    const forecastData = await fetchForecastDataByCoords(latitude, longitude);
                    updateUI(weatherData, forecastData);
                    updateBackground(weatherData.weather[0].main);
                    createTemperatureChart(forecastData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            },
            
            (error) => {
                reject(error);
            },
            {
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

async function fetchWeatherDataByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit === 'C' ? 'metric' : 'imperial'}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather data not found');
    return response.json();
}

async function fetchForecastDataByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit === 'C' ? 'metric' : 'imperial'}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Forecast data not found');
    return response.json();
}

function updateDateTime() {
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    currentTimeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function handleSearch(defaultCity = '') {
    try {
        const city = defaultCity || searchInput.value.trim();
        if (!city) return;

        // Disable input during search
        searchInput.disabled = true;
        
        // Show loading state
        cityNameEl.textContent = 'Loading...';
        
        const weatherData = await fetchWeatherData(city);
        const forecastData = await fetchForecastData(city);
        
        updateUI(weatherData, forecastData);
        updateBackground(weatherData.weather[0].main);
        createTemperatureChart(forecastData);
        
        // Clear input and re-enable after successful search
        if (!defaultCity) {
            searchInput.value = '';
        }
        searchInput.disabled = false;
        searchInput.focus();
        
    } catch (error) {
        console.error('Error:', error);
        alert('City not found. Please check the spelling and try again.');
        cityNameEl.textContent = 'City not found';
        // Re-enable input after error
        searchInput.disabled = false;
        searchInput.value = '';
        searchInput.focus();
    }
}

async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit === 'C' ? 'metric' : 'imperial'}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather data not found');
    return response.json();
}

async function fetchForecastData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${currentUnit === 'C' ? 'metric' : 'imperial'}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Forecast data not found');
    return response.json();
}

function updateBackground(weatherCondition) {
    const bgUrl = weatherBackgrounds[weatherCondition] || weatherBackgrounds.default;
    
    document.body.style.backgroundImage = `url('${bgUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.transition = 'background-image 0.5s ease-in-out';
}

function updateUI(weatherData, forecastData) {
    cityNameEl.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
    temperatureEl.textContent = `${Math.round(weatherData.main.temp)}°${currentUnit}`;
    feelsLikeEl.textContent = `Feels like ${Math.round(weatherData.main.feels_like)}°${currentUnit}`;
    
    const iconCode = weatherData.weather[0].icon;
    weatherImgEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherImgEl.alt = weatherData.weather[0].description;
    
    weatherDescEl.textContent = weatherData.weather[0].description;
    humidityEl.textContent = `${weatherData.main.humidity}%`;
    windSpeedEl.textContent = `${(currentUnit === 'C' ? weatherData.wind.speed * 3.6 : weatherData.wind.speed).toFixed(1)} ${currentUnit === 'C' ? 'km/h' : 'mph'}`;
    pressureEl.textContent = `${weatherData.main.pressure} hPa`;
    visibilityEl.textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;

    updateForecast(forecastData);
}

function createTemperatureChart(forecastData) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    if (tempChart) {
        tempChart.destroy();
    }
    
    const next24Hours = forecastData.list.slice(0, 8);
    const labels = next24Hours.map(item => {
        return new Date(item.dt * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });
    });
    const temperatures = next24Hours.map(item => item.main.temp);

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (°${currentUnit})`,
                data: temperatures,
                borderColor: '#4a9eff',
                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function updateForecast(forecastData) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = {};
    
    forecastData.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = forecast;
        }
    });

    Object.values(dailyForecasts).slice(1, 6).forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p class="forecast-day">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" 
                 alt="${forecast.weather[0].description}" />
            <p class="forecast-temp">${Math.round(forecast.main.temp)}°${currentUnit}</p>
            <p class="forecast-desc">${forecast.weather[0].description}</p>
        `;
        forecastContainer.appendChild(forecastItem);
    });
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);