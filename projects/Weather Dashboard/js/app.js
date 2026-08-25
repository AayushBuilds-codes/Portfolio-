/* ==========================================================================
   PINNACLE WEATHER CORE APPLICATION LOGIC (app.js)
   ========================================================================== */

// Global State
const state = {
    currentCity: "Kanpur",
    currentCountry: "IN",
    coords: { lat: 26.4499, lon: 80.3319 }, // Default: Kanpur coordinates
    unit: "C", // "C" or "F"
    weatherData: null,
    weatherTheme: "clear", // clear, rainy, cloudy, snowy, stormy, foggy
    particleSystem: null
};

// Weather WMO Code Mappings
const WEATHER_CODES = {
    0: { name: "Clear sky", theme: "sunny", icon: "sunny" },
    1: { name: "Mainly clear", theme: "sunny", icon: "sunny" },
    2: { name: "Partly cloudy", theme: "cloudy", icon: "cloudy" },
    3: { name: "Overcast", theme: "cloudy", icon: "cloudy" },
    45: { name: "Fog", theme: "foggy", icon: "foggy" },
    48: { name: "Depositing rime fog", theme: "foggy", icon: "foggy" },
    51: { name: "Light drizzle", theme: "rainy", icon: "rainy" },
    53: { name: "Moderate drizzle", theme: "rainy", icon: "rainy" },
    55: { name: "Dense drizzle", theme: "rainy", icon: "rainy" },
    61: { name: "Slight rain", theme: "rainy", icon: "rainy" },
    63: { name: "Moderate rain", theme: "rainy", icon: "rainy" },
    65: { name: "Heavy rain", theme: "rainy", icon: "rainy" },
    71: { name: "Slight snowfall", theme: "snowy", icon: "snowy" },
    73: { name: "Moderate snowfall", theme: "snowy", icon: "snowy" },
    75: { name: "Heavy snowfall", theme: "snowy", icon: "snowy" },
    80: { name: "Slight rain showers", theme: "rainy", icon: "rainy" },
    81: { name: "Moderate rain showers", theme: "rainy", icon: "rainy" },
    82: { name: "Violent rain showers", theme: "rainy", icon: "rainy" },
    85: { name: "Slight snow showers", theme: "snowy", icon: "snowy" },
    86: { name: "Heavy snow showers", theme: "snowy", icon: "snowy" },
    95: { name: "Thunderstorm", theme: "stormy", icon: "stormy" },
    96: { name: "Thunderstorm with slight hail", theme: "stormy", icon: "stormy" },
    99: { name: "Thunderstorm with heavy hail", theme: "stormy", icon: "stormy" }
};

// SVG Icon Templates
const SVG_ICONS = {
    sunny: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" fill="#f59e0b" filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))"/>
        <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    cloudy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 15.35c.75-.76 1-1.85.76-2.85-.3-1.25-1.39-2.2-2.65-2.27A6 6 0 0 0 5.66 12C3.56 12.35 2 14.15 2 16.3c0 2.5 2.1 4.5 4.7 4.5h11.8c2.2 0 4-1.8 4-4 0-1.45-.75-2.65-1.9-3.2-.2-.1-.4-.25-.6-.25" fill="#cbd5e1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"/>
        <circle cx="15.5" cy="8.5" r="3.5" fill="#f59e0b" opacity="0.8"/>
    </svg>`,
    rainy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13.5c0-1.45-.75-2.65-1.9-3.2-.2-.1-.4-.25-.6-.25.75-.76 1-1.85.76-2.85-.3-1.25-1.39-2.2-2.65-2.27A6 6 0 0 0 5.66 10.15C3.56 10.5 2 12.3 2 14.45c0 2.5 2.1 4.5 4.7 4.5h11.8c2.2 0 4-1.8 4-4" fill="#64748b"/>
        <path d="M7 21v2M11 21v2M15 21v2" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    snowy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13.5c0-1.45-.75-2.65-1.9-3.2-.2-.1-.4-.25-.6-.25.75-.76 1-1.85.76-2.85-.3-1.25-1.39-2.2-2.65-2.27A6 6 0 0 0 5.66 10.15C3.56 10.5 2 12.3 2 14.45c0 2.5 2.1 4.5 4.7 4.5h11.8c2.2 0 4-1.8 4-4" fill="#cbd5e1"/>
        <path d="M7 20h.01M12 20h.01M17 20h.01M9 22h.01M14 22h.01" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    stormy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13.5c0-1.45-.75-2.65-1.9-3.2-.2-.1-.4-.25-.6-.25.75-.76 1-1.85.76-2.85-.3-1.25-1.39-2.2-2.65-2.27A6 6 0 0 0 5.66 10.15C3.56 10.5 2 12.3 2 14.45c0 2.5 2.1 4.5 4.7 4.5h11.8c2.2 0 4-1.8 4-4" fill="#334155"/>
        <path d="M12 18l-3 4h4.5l-2.5 3.5" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    foggy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 11.5c0-1.45-.75-2.65-1.9-3.2-.2-.1-.4-.25-.6-.25.75-.76 1-1.85.76-2.85-.3-1.25-1.39-2.2-2.65-2.27A6 6 0 0 0 5.66 8.15C3.56 8.5 2 10.3 2 12.45c0 2.5 2.1 4.5 4.7 4.5h11.8c2.2 0 4-1.8 4-4" fill="#475569" opacity="0.6"/>
        <path d="M4 18h16M2 21h20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    </svg>`
};

// Local Weather Mock Fallbacks
const WEATHER_MOCKS = {
    "Kanpur": {
        temp: 34, description: "Sunny with clear conditions", code: 0,
        humidity: 45, windSpeed: 10, windDirection: 45, pressure: 1008, uv: 9,
        forecast: [
            { day: "Mon", code: 0, tempMax: 36, tempMin: 25 },
            { day: "Tue", code: 1, tempMax: 35, tempMin: 24 },
            { day: "Wed", code: 2, tempMax: 33, tempMin: 23 },
            { day: "Thu", code: 61, tempMax: 30, tempMin: 22 },
            { day: "Fri", code: 95, tempMax: 29, tempMin: 21 }
        ]
    },
    "London": {
        temp: 16, description: "Light drizzle and overcast skies", code: 51,
        humidity: 82, windSpeed: 18, windDirection: 220, pressure: 1014, uv: 3,
        forecast: [
            { day: "Mon", code: 51, tempMax: 17, tempMin: 11 },
            { day: "Tue", code: 3, tempMax: 18, tempMin: 12 },
            { day: "Wed", code: 61, tempMax: 15, tempMin: 10 },
            { day: "Thu", code: 2, tempMax: 19, tempMin: 12 },
            { day: "Fri", code: 1, tempMax: 20, tempMin: 13 }
        ]
    },
    "Tokyo": {
        temp: 22, description: "Partly cloudy", code: 2,
        humidity: 60, windSpeed: 8, windDirection: 180, pressure: 1010, uv: 5,
        forecast: [
            { day: "Mon", code: 2, tempMax: 23, tempMin: 16 },
            { day: "Tue", code: 0, tempMax: 25, tempMin: 17 },
            { day: "Wed", code: 3, tempMax: 21, tempMin: 15 },
            { day: "Thu", code: 63, tempMax: 19, tempMin: 14 },
            { day: "Fri", code: 95, tempMax: 20, tempMin: 15 }
        ]
    },
    "New York": {
        temp: 24, description: "Passing thunderstorm showers", code: 95,
        humidity: 78, windSpeed: 24, windDirection: 280, pressure: 1005, uv: 4,
        forecast: [
            { day: "Mon", code: 95, tempMax: 26, tempMin: 18 },
            { day: "Tue", code: 3, tempMax: 22, tempMin: 16 },
            { day: "Wed", code: 2, tempMax: 25, tempMin: 17 },
            { day: "Thu", code: 0, tempMax: 28, tempMin: 19 },
            { day: "Fri", code: 1, tempMax: 27, tempMin: 19 }
        ]
    },
    "Paris": {
        temp: 19, description: "Mostly clear", code: 1,
        humidity: 55, windSpeed: 12, windDirection: 120, pressure: 1016, uv: 6,
        forecast: [
            { day: "Mon", code: 1, tempMax: 21, tempMin: 13 },
            { day: "Tue", code: 2, tempMax: 20, tempMin: 14 },
            { day: "Wed", code: 3, tempMax: 18, tempMin: 12 },
            { day: "Thu", code: 51, tempMax: 17, tempMin: 11 },
            { day: "Fri", code: 0, tempMax: 22, tempMin: 13 }
        ]
    }
};

// ==========================================================================
// ANIMATED CANVAS PARTICLES CLASS (WeatherParticles)
// ==========================================================================
class WeatherParticles {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationFrameId = null;
        this.weatherType = 'sunny'; // sunny, rainy, cloudy, snowy, stormy, foggy
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.loop();
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    setWeatherType(type) {
        if (this.weatherType !== type) {
            this.weatherType = type;
            this.init();
        }
    }

    init() {
        this.particles = [];
        let count = 60;
        
        if (this.weatherType === 'rainy') {
            count = 100;
        } else if (this.weatherType === 'snowy') {
            count = 80;
        } else if (this.weatherType === 'stormy') {
            count = 120;
        } else if (this.weatherType === 'cloudy') {
            count = 20;
        } else if (this.weatherType === 'foggy') {
            count = 15;
        } else {
            // Sunny
            count = 25;
        }

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(true));
        }
    }

    createParticle(randomY = false) {
        const x = Math.random() * this.width;
        const y = randomY ? Math.random() * this.height : -10;
        
        switch (this.weatherType) {
            case 'rainy':
            case 'stormy':
                return {
                    x, y,
                    length: Math.random() * 20 + 15,
                    speed: Math.random() * 10 + 15,
                    opacity: Math.random() * 0.35 + 0.15,
                    weight: Math.random() * 1.5 + 0.8
                };
            case 'snowy':
                return {
                    x, y,
                    r: Math.random() * 3 + 1,
                    speed: Math.random() * 1.2 + 0.8,
                    drift: Math.random() * 1 - 0.5,
                    opacity: Math.random() * 0.6 + 0.2
                };
            case 'cloudy':
                return {
                    x, y: Math.random() * (this.height * 0.45),
                    r: Math.random() * 60 + 40,
                    speed: Math.random() * 0.15 + 0.05,
                    opacity: Math.random() * 0.08 + 0.02
                };
            case 'foggy':
                return {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    r: Math.random() * 120 + 80,
                    alpha: Math.random() * 0.04 + 0.01,
                    angle: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.1
                };
            default: // sunny
                return {
                    x, y: Math.random() * this.height,
                    r: Math.random() * 40 + 20,
                    speed: Math.random() * 0.2 + 0.1,
                    opacity: Math.random() * 0.06 + 0.02,
                    pulse: Math.random() * 0.02
                };
        }
    }

    updateAndDrawParticle(p) {
        this.ctx.beginPath();

        if (this.weatherType === 'rainy' || this.weatherType === 'stormy') {
            p.y += p.speed;
            // Slight slant to the left for wind
            p.x -= p.weight * 0.5;
            
            this.ctx.strokeStyle = `rgba(156, 163, 175, ${p.opacity})`;
            this.ctx.lineWidth = p.weight;
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x - p.weight * 2, p.y + p.length);
            this.ctx.stroke();

            if (p.y > this.height) {
                Object.assign(p, this.createParticle(false));
            }
        } 
        else if (this.weatherType === 'snowy') {
            p.y += p.speed;
            p.x += p.drift;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();

            if (p.y > this.height || p.x < 0 || p.x > this.width) {
                Object.assign(p, this.createParticle(false));
            }
        } 
        else if (this.weatherType === 'cloudy') {
            p.x += p.speed;
            
            this.ctx.fillStyle = `rgba(203, 213, 225, ${p.opacity})`;
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();

            if (p.x - p.r > this.width) {
                p.x = -p.r;
            }
        } 
        else if (this.weatherType === 'foggy') {
            p.angle += 0.005;
            p.x += Math.cos(p.angle) * p.speed;
            
            this.ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        } 
        else { // sunny
            p.y -= p.speed;
            p.opacity = Math.max(0.01, p.opacity + Math.sin(Date.now() * 0.001) * 0.002);
            
            this.ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity})`;
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();

            if (p.y + p.r < 0) {
                Object.assign(p, this.createParticle(true));
                p.y = this.height + p.r;
            }
        }
    }

    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render lightning flashes for stormy weather
        if (this.weatherType === 'stormy' && Math.random() > 0.985) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        this.particles.forEach(p => this.updateAndDrawParticle(p));
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

// ==========================================================================
// CORE METRIC CONVERSION UTILITIES
// ==========================================================================
const celsiusToFahrenheit = c => Math.round((c * 9/5) + 32);
const kmhToMph = speed => Math.round(speed / 1.609);

// ==========================================================================
// API INTEGRATION & FETCH FUNCTIONS
// ==========================================================================

// Search Cities via Geocoding API
async function fetchCities(query) {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        if (!response.ok) throw new Error("Geocoding failed");
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.warn("Geocoding API failed, utilizing local matching fallback: ", e);
        // Fallback to local mock matching keys
        return Object.keys(WEATHER_MOCKS)
            .filter(name => name.toLowerCase().includes(query.toLowerCase()))
            .map(name => ({
                name,
                country_code: name === "Kanpur" ? "IN" : (name === "Tokyo" ? "JP" : (name === "London" ? "GB" : "US")),
                latitude: name === "Kanpur" ? 26.45 : 0,
                longitude: name === "Kanpur" ? 80.33 : 0
            }));
    }
}

// Fetch Weather Metrics
async function fetchWeather(lat, lon, cityName) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        
        // Format daily forecast values
        const forecast = [];
        const today = new Date();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        
        for (let i = 0; i < 5; i++) {
            const dateObj = new Date(today);
            dateObj.setDate(today.getDate() + i);
            forecast.push({
                day: i === 0 ? "Today" : days[dateObj.getDay()],
                code: data.daily.weather_code[i],
                tempMax: Math.round(data.daily.temperature_2m_max[i]),
                tempMin: Math.round(data.daily.temperature_2m_min[i])
            });
        }

        return {
            temp: Math.round(data.current.temperature_2m),
            description: WEATHER_CODES[data.current.weather_code]?.name || "Mild conditions",
            code: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDirection: data.current.wind_direction_10m,
            pressure: Math.round(data.current.pressure_msl),
            uv: Math.round(data.daily.uv_index_max[0] || 0),
            forecast
        };

    } catch (e) {
        console.warn(`Weather API request failed. Reverting to mock database for ${cityName}:`, e);
        // Retrieve local mock fallback or construct generic data
        const mock = WEATHER_MOCKS[cityName] || WEATHER_MOCKS["Kanpur"];
        return {
            ...mock,
            temp: mock.temp,
            forecast: mock.forecast.map((f, idx) => ({
                ...f,
                day: idx === 0 ? "Today" : f.day
            }))
        };
    }
}

// Reverse Geocoding via Nominatim (OpenStreetMap)
async function getCityNameFromCoords(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
        if (!res.ok) throw new Error("Reverse geocode failed");
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.state || "Unknown City";
        const country = data.address.country_code ? data.address.country_code.toUpperCase() : "Loc";
        return { city, country };
    } catch (e) {
        console.warn("Reverse geocoding failed, returning coordinates naming format:", e);
        return { city: `${lat.toFixed(2)}N, ${lon.toFixed(2)}E`, country: "Loc" };
    }
}

// ==========================================================================
// RENDER & DOM MANIPULATIONS
// ==========================================================================

function updateUI() {
    const data = state.weatherData;
    if (!data) return;

    // Get WMO mapped values
    const mapped = WEATHER_CODES[data.code] || { name: "Clear sky", theme: "sunny", icon: "sunny" };
    state.weatherTheme = mapped.theme;
    
    // Update theme state attributes
    document.documentElement.setAttribute('data-weather-theme', state.weatherTheme);
    if (state.particleSystem) {
        state.particleSystem.setWeatherType(state.weatherTheme);
    }

    // Name & Date
    document.getElementById("city-name").textContent = `${state.currentCity}, ${state.currentCountry}`;
    
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById("current-date").textContent = today.toLocaleDateString('en-US', options);

    // Weather condition badge & description text
    document.getElementById("weather-badge").textContent = mapped.name;
    document.getElementById("weather-description").textContent = data.description;

    // Temp updates
    let renderedTemp = data.temp;
    let highTemp = data.forecast[0].tempMax;
    let lowTemp = data.forecast[0].tempMin;

    if (state.unit === "F") {
        renderedTemp = celsiusToFahrenheit(data.temp);
        highTemp = celsiusToFahrenheit(data.forecast[0].tempMax);
        lowTemp = celsiusToFahrenheit(data.forecast[0].tempMin);
    }

    document.getElementById("temp-val").textContent = renderedTemp;
    document.getElementById("temp-unit").textContent = `°${state.unit}`;
    document.getElementById("temp-high").textContent = `${highTemp}°${state.unit}`;
    document.getElementById("temp-low").textContent = `${lowTemp}°${state.unit}`;

    // Large weather illustration SVG
    const iconContainer = document.getElementById("current-icon-container");
    iconContainer.innerHTML = SVG_ICONS[mapped.icon] || SVG_ICONS.sunny;

    // Detail metrics values
    let windVal = `${data.windSpeed} <span class="metric-sub-unit">km/h</span>`;
    if (state.unit === "F") {
        windVal = `${kmhToMph(data.windSpeed)} <span class="metric-sub-unit">mph</span>`;
    }
    document.getElementById("wind-val").innerHTML = windVal;
    
    // Rotate wind arrow direction
    const arrow = document.getElementById("wind-arrow");
    if (arrow) {
        arrow.style.transform = `rotate(${data.windDirection}deg)`;
    }
    
    // Wind cardinal text helper
    const cardinalDirections = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(((data.windDirection % 360) / 22.5)) % 16;
    document.getElementById("wind-dir").textContent = cardinalDirections[index];

    // Humidity card
    document.getElementById("humidity-val").innerHTML = `${data.humidity}<span class="metric-sub-unit">%</span>`;
    document.getElementById("humidity-bar").style.width = `${data.humidity}%`;

    // UV index card
    document.getElementById("uv-val").textContent = data.uv;
    const uvBadge = document.getElementById("uv-badge");
    if (data.uv <= 2) {
        uvBadge.textContent = "LOW";
        uvBadge.style.color = "#10b981";
        uvBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
        uvBadge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
    } else if (data.uv <= 5) {
        uvBadge.textContent = "MODERATE";
        uvBadge.style.color = "#f59e0b";
        uvBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
        uvBadge.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
    } else if (data.uv <= 7) {
        uvBadge.textContent = "HIGH";
        uvBadge.style.color = "#f97316";
        uvBadge.style.borderColor = "rgba(249, 115, 22, 0.3)";
        uvBadge.style.backgroundColor = "rgba(249, 115, 22, 0.15)";
    } else {
        uvBadge.textContent = "VERY HIGH";
        uvBadge.style.color = "#ef4444";
        uvBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
        uvBadge.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
    }

    // Barometer card
    document.getElementById("pressure-val").innerHTML = `${data.pressure} <span class="metric-sub-unit">hPa</span>`;
    const pressureBadge = document.getElementById("pressure-badge");
    if (data.pressure < 1009) {
        pressureBadge.textContent = "Low Pressure (Rain/Storm)";
    } else if (data.pressure > 1022) {
        pressureBadge.textContent = "High Pressure (Dry/Sunny)";
    } else {
        pressureBadge.textContent = "Normal Pressure";
    }

    // Render Forecast Grid Cards
    const forecastGrid = document.getElementById("forecast-grid");
    forecastGrid.innerHTML = "";

    data.forecast.forEach(f => {
        const cardMap = WEATHER_CODES[f.code] || { name: "Clear sky", theme: "sunny", icon: "sunny" };
        const iconSvg = SVG_ICONS[cardMap.icon] || SVG_ICONS.sunny;
        
        let max = f.tempMax;
        let min = f.tempMin;
        if (state.unit === "F") {
            max = celsiusToFahrenheit(f.tempMax);
            min = celsiusToFahrenheit(f.tempMin);
        }

        const card = document.createElement("div");
        card.className = "card forecast-card";
        card.innerHTML = `
            <span class="forecast-date">${f.day}</span>
            <div class="forecast-icon">${iconSvg}</div>
            <div class="forecast-temp">
                <span class="forecast-temp-max">${max}°</span>
                <span class="forecast-temp-min">${min}°</span>
            </div>
            <span class="forecast-desc">${cardMap.name}</span>
        `;
        forecastGrid.appendChild(card);
    });
}

// Load Weather data wrapper
async function loadCityWeather(lat, lon, cityName, countryCode = "") {
    state.currentCity = cityName;
    state.currentCountry = countryCode || state.currentCountry;
    state.coords = { lat, lon };
    
    // Fetch from APIs
    state.weatherData = await fetchWeather(lat, lon, cityName);
    updateUI();

    // Trigger Nova context sync callback if Nova exists
    if (window.syncNovaWeatherContext) {
        window.syncNovaWeatherContext(state.weatherData, cityName);
    }
}

// ==========================================================================
// SEARCH & AUTOCOMPLETE INPUT HANDLERS
// ==========================================================================
function initSearchAutocomplete() {
    const searchInput = document.getElementById("city-search");
    const dropdown = document.getElementById("search-dropdown");
    let debounceTimer = null;

    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (query.length < 2) {
            dropdown.innerHTML = "";
            dropdown.classList.remove("show");
            return;
        }

        debounceTimer = setTimeout(async () => {
            const cities = await fetchCities(query);
            dropdown.innerHTML = "";

            if (cities.length === 0) {
                dropdown.classList.remove("show");
                return;
            }

            cities.forEach(city => {
                const li = document.createElement("li");
                const country = city.country_code ? city.country_code.toUpperCase() : "Loc";
                const adminState = city.admin1 ? `, ${city.admin1}` : "";
                
                li.textContent = `${city.name}${adminState} (${country})`;
                li.addEventListener("click", () => {
                    searchInput.value = "";
                    dropdown.classList.remove("show");
                    loadCityWeather(city.latitude, city.longitude, city.name, country);
                    
                    // Remove active tags from quick chips
                    document.querySelectorAll(".city-chip").forEach(chip => chip.classList.remove("active"));
                });
                dropdown.appendChild(li);
            });
            dropdown.classList.add("show");
        }, 300);
    });

    // Hide dropdown when clicking elsewhere
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });
}

// ==========================================================================
// EVENT LISTENERS & INITS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Start weather backdrop animation canvas
    state.particleSystem = new WeatherParticles("weather-particles");

    // 2. Initialize geocoding searches
    initSearchAutocomplete();

    // 3. Current Location queries
    const locationBtn = document.getElementById("location-btn");
    locationBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const nameData = await getCityNameFromCoords(lat, lon);
                    loadCityWeather(lat, lon, nameData.city, nameData.country);
                    
                    document.querySelectorAll(".city-chip").forEach(chip => chip.classList.remove("active"));
                },
                (err) => {
                    alert("Unable to query geolocation. Please select a chip or search manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });

    // 4. Quick select chips
    document.querySelectorAll(".city-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".city-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            
            const cityName = chip.getAttribute("data-city");
            const coordinates = {
                "Kanpur": { lat: 26.4499, lon: 80.3319, country: "IN" },
                "London": { lat: 51.5074, lon: -0.1278, country: "GB" },
                "Tokyo": { lat: 35.6762, lon: 139.6503, country: "JP" },
                "New York": { lat: 40.7128, lon: -74.0060, country: "US" },
                "Paris": { lat: 48.8566, lon: 2.3522, country: "FR" }
            };

            const data = coordinates[cityName];
            if (data) {
                loadCityWeather(data.lat, data.lon, cityName, data.country);
            }
        });
    });

    // 5. Units metric conversion toggling
    const unitToggleBtn = document.getElementById("unit-toggle");
    unitToggleBtn.addEventListener("click", () => {
        state.unit = state.unit === "C" ? "F" : "C";
        
        document.getElementById("unit-c").classList.toggle("active", state.unit === "C");
        document.getElementById("unit-f").classList.toggle("active", state.unit === "F");
        
        updateUI();
    });

    // 6. Bootstrap Initial default location (Kanpur)
    loadCityWeather(26.4499, 80.3319, "Kanpur", "IN");
});
