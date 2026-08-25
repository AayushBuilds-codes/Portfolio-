/* ==========================================================================
   NOVA - DYNAMIC AI WEATHER ASSISTANT INTEGRATION (nova.js)
   ========================================================================== */

const novaState = {
    chatOpen: false,
    voiceMuted: true,
    activeCity: "Kanpur",
    weatherContext: null, // Shared from app.js
    speechSynthesis: window.speechSynthesis,
    speechRecognition: null,
    isListening: false
};

// ==========================================================================
// SYNCHRONIZATION WITH MAIN APP DATA
// ==========================================================================
window.syncNovaWeatherContext = function(weatherData, cityName) {
    novaState.weatherContext = weatherData;
    novaState.activeCity = cityName;
    
    // Periodically post an automated intro bubble from Nova about the loaded city
    console.log(`[Nova AI] Synchronized weather context for ${cityName}`);
};

// ==========================================================================
// SPEECH SYNTHESIS & RECOGNITION (WEB SPEECH APIs)
// ==========================================================================

// Speak responses aloud
function speakText(text) {
    if (novaState.voiceMuted || !novaState.speechSynthesis) return;
    
    // Stop any active utterances first
    novaState.speechSynthesis.cancel();
    
    // Clean markdown characters from text for a cleaner voice reading
    const cleanText = text.replace(/[*#`_\-]/g, '').replace(/<br\s*\/?>/gi, '. ');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Match standard female voice if available
    const voices = novaState.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes('en') && voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('natural'));
    
    if (englishVoice) {
        utterance.voice = englishVoice;
    }
    
    novaState.speechSynthesis.speak(utterance);
}

// Initialize Speech Recognition (Dictation)
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech Recognition API is not supported in this browser.");
        document.getElementById("nova-mic-btn").style.display = "none";
        return;
    }

    novaState.speechRecognition = new SpeechRecognition();
    novaState.speechRecognition.continuous = false;
    novaState.speechRecognition.lang = 'en-US';
    novaState.speechRecognition.interimResults = false;
    novaState.speechRecognition.maxAlternatives = 1;

    const micBtn = document.getElementById("nova-mic-btn");

    novaState.speechRecognition.onstart = () => {
        novaState.isListening = true;
        micBtn.classList.add("listening");
        micBtn.title = "Listening... Speak now!";
    };

    novaState.speechRecognition.onresult = (event) => {
        const textResult = event.results[0][0].transcript;
        const inputField = document.getElementById("nova-input-field");
        if (inputField) {
            inputField.value = textResult;
            // Focus on field and automatically submit form after a small lag
            inputField.focus();
            setTimeout(() => {
                document.getElementById("nova-input-form").dispatchEvent(new Event('submit'));
            }, 600);
        }
    };

    novaState.speechRecognition.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        stopListening();
    };

    novaState.speechRecognition.onend = () => {
        stopListening();
    };

    micBtn.addEventListener("click", () => {
        if (!novaState.isListening) {
            try {
                novaState.speechRecognition.start();
            } catch (e) {
                console.error(e);
            }
        } else {
            novaState.speechRecognition.stop();
        }
    });
}

function stopListening() {
    novaState.isListening = false;
    const micBtn = document.getElementById("nova-mic-btn");
    if (micBtn) {
        micBtn.classList.remove("listening");
        micBtn.title = "Speak to Nova";
    }
}

// ==========================================================================
// DYNAMIC WEATHER ADVICE GENERATOR (The AI Response Engine)
// ==========================================================================
function generateNovaResponse(userQuery) {
    const q = userQuery.toLowerCase().trim();
    const ctx = novaState.weatherContext;
    const city = novaState.activeCity;
    
    // Standard response if weather hasn't synced
    if (!ctx) {
        return "I am currently loading local coordinates and weather metrics. Please ask again in a brief second!";
    }

    // Weather condition code mapping helper
    const weatherThemeName = ctx.code === 0 ? "clear skies" : 
                            (ctx.code <= 3 ? "partly cloudy skies" : 
                            (ctx.code <= 48 ? "foggy/misty conditions" : 
                            (ctx.code <= 82 ? "showers and rain" : "thunderstorms")));

    // 1. Weather Summary Request
    if (q.includes("summarize") || q.includes("summary") || q.includes("current weather") || q.includes("forecast") || q.includes("conditions")) {
        return `Currently in **${city}**, the weather is **${ctx.description}** with ${weatherThemeName}. <br><br>` +
               `• **Temperature**: ${ctx.temp}°C (High of ${ctx.forecast[0].tempMax}°C, Low of ${ctx.forecast[0].tempMin}°C)<br>` +
               `• **Humidity**: ${ctx.humidity}%<br>` +
               `• **Wind Speed**: ${ctx.windSpeed} km/h<br>` +
               `• **UV Index**: ${ctx.uv}<br><br>` +
               `It feels like a perfect day to check your schedule! Let me know if you need outfit or activity recommendations!`;
    }

    // 2. Clothing Advice Request
    if (q.includes("wear") || q.includes("outfit") || q.includes("clothing") || q.includes("clothes") || q.includes("umbrella")) {
        let clothesAdvice = "";
        let accessoryAdvice = "";

        if (ctx.temp >= 30) {
            clothesAdvice = "lightweight, breathable cotton clothes like t-shirts and shorts. Light colors are highly recommended to reflect heat";
            accessoryAdvice = "sunglasses, a wide-brimmed hat, and plenty of sunscreen (since the UV index is a strong " + ctx.uv + ")";
        } else if (ctx.temp >= 20) {
            clothesAdvice = "comfortable shirts, light trousers, or summer dresses. It's a very pleasant temperature";
            accessoryAdvice = "sunglasses, but keep a light layer nearby in case wind gusts pick up";
        } else if (ctx.temp >= 10) {
            clothesAdvice = "layered clothing—perhaps a long-sleeve shirt coupled with a sweater or a light cardigan";
            accessoryAdvice = "a windbreaker or light jacket, especially if you walk during evening hours";
        } else {
            clothesAdvice = "a heavy wool coat, thick thermal undershirts, trousers, and sweaters";
            accessoryAdvice = "a warm scarf, gloves, and insulated socks to combat the bite of the cold";
        }

        // Handle rain/showers/storms
        const isWet = ctx.code >= 51 && ctx.code <= 82 || ctx.code >= 95;
        if (isWet) {
            accessoryAdvice += " — and definitely bring an **umbrella** or a high-quality **waterproof raincoat** and wear water-resistant shoes!";
        }

        return `Based on **${city}**'s temperature of **${ctx.temp}°C** and **${ctx.description}** conditions, here is your outfit layout:<br><br>` +
               `👔 **Clothing**: Wear ${clothesAdvice}.<br>` +
               `🕶️ **Accessories**: Grab ${accessoryAdvice}.`;
    }

    // 3. Outdoor Travel & Activities Advice
    if (q.includes("outdoor") || q.includes("activity") || q.includes("activities") || q.includes("travel") || q.includes("outside") || q.includes("go out")) {
        const isBadWeather = (ctx.code >= 61 && ctx.code <= 82) || ctx.code >= 95 || ctx.uv >= 8 || ctx.windSpeed > 35;
        
        if (isBadWeather) {
            let reason = "";
            if (ctx.code >= 95) reason = "active thunderstorms";
            else if (ctx.code >= 61) reason = "heavy rain showers";
            else if (ctx.uv >= 8) reason = "dangerously high solar UV radiation levels";
            else if (ctx.windSpeed > 35) reason = "high wind gusts";

            return `⚠️ **Outdoor Alert for ${city}**:<br>` +
                   `It is **not recommended** to plan extensive outdoor activities right now due to **${reason}**. <br><br>` +
                   `Instead, I suggest scheduling indoor work, visiting a local museum, or enjoying some coffee inside. Safety first!`;
        } else {
            return `✅ **Outdoor Recommendation for ${city}**:<br>` +
                   `The conditions are **great** for outdoor activities! With ${ctx.temp}°C and ${ctx.description}, it's an excellent day for a run, a jog, cycling, or visiting a park. Enjoy the fresh air!`;
        }
    }

    // 4. Metric Explanations
    if (q.includes("humidity")) {
        return `**Relative Humidity** is currently **${ctx.humidity}%** in ${city}.<br><br>` +
               `Humidity represents the percentage of water vapor held in the air relative to the maximum amount the air could hold at this temperature. <br>` +
               `• **Below 30%**: Very dry air (leads to dry skin/chapped lips).<br>` +
               `• **30% - 60%**: The ideal comfortable range.<br>` +
               `• **Above 60%**: High humidity (feels warm, muggy, and sweat evaporates slowly).`;
    }

    if (q.includes("uv index") || q.includes("uv")) {
        return `The **UV Index** is currently **${ctx.uv}** in ${city}.<br><br>` +
               `This is a standard scale measuring the strength of sunburn-producing solar ultraviolet radiation. <br>` +
               `• **0-2 (Low)**: Safe. Minimal protection required.<br>` +
               `• **3-5 (Moderate)**: Wear sunscreen, sunglasses, and a hat.<br>` +
               `• **6-7 (High)**: Protect skin; reduce time in midday sun.<br>` +
               `• **8+ (Very High/Extreme)**: Severe risk. Wear double sunscreen, seek shade, and avoid direct exposure.`;
    }

    if (q.includes("barometer") || q.includes("pressure")) {
        return `The **Atmospheric Pressure** is **${ctx.pressure} hPa** in ${city}.<br><br>` +
               `Average sea-level barometric pressure is **1013.25 hPa**. <br>` +
               `• **Falling pressure (<1009 hPa)** signals approaching cloud cover, rain, or stormy weather.<br>` +
               `• **Rising pressure (>1022 hPa)** indicates calm, dry, and clear sunny conditions.`;
    }

    // 5. Help / Greeting Commands
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("who are you") || q.includes("help")) {
        return `Hello! I am **Nova**, your personal AI Weather Companion. I'm connected directly to the dashboard sensors.<br><br>` +
               `You can click the suggestion chips or ask me questions like:<br>` +
               `• *"What should I wear today?"*<br>` +
               `• *"Summarize this weather"*<br>` +
               `• *"Is it good for outdoor activities?"*<br>` +
               `• *"Explain relative humidity or UV index"*`;
    }

    // 6. Conversational fallbacks
    return `That's an interesting question about ${city}! Currently, it's ${ctx.temp}°C and ${ctx.description}. ` +
           `Although I specialize in weather metrics (humidity, wind, pressure, UV index), clothing advice, and outdoor travel forecasts, ` +
           `let me know how I can help you with those specifically!`;
}

// ==========================================================================
// CHAT UI FUNCTIONS
// ==========================================================================

function toggleChat() {
    const chatWindow = document.getElementById("nova-chat-window");
    const launcher = document.getElementById("nova-launcher");
    
    novaState.chatOpen = !novaState.chatOpen;
    chatWindow.classList.toggle("show", novaState.chatOpen);
    
    if (novaState.chatOpen) {
        launcher.style.transform = "scale(0.9) rotate(-15deg)";
        // Scroll messages to bottom
        const msgContainer = document.getElementById("nova-messages");
        msgContainer.scrollTop = msgContainer.scrollHeight;
    } else {
        launcher.style.transform = "";
        if (novaState.speechSynthesis) {
            novaState.speechSynthesis.cancel();
        }
    }
}

// Add bubble message to the UI
function appendMessage(text, isAssistant = false) {
    const msgContainer = document.getElementById("nova-messages");
    
    // Create Bubble
    const bubble = document.createElement("div");
    bubble.className = `nova-message-bubble ${isAssistant ? 'assistant' : 'user'}`;
    
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = text;
    bubble.appendChild(content);

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);

    msgContainer.appendChild(bubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

// Render temporary animated loading typing dots
function appendTypingIndicator() {
    const msgContainer = document.getElementById("nova-messages");
    
    const bubble = document.createElement("div");
    bubble.className = "nova-message-bubble assistant typing";
    bubble.id = "nova-typing-indicator";
    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    msgContainer.appendChild(bubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById("nova-typing-indicator");
    if (indicator) {
        indicator.remove();
    }
}

// Submit User Message handler
function handleUserMessage(messageText) {
    if (!messageText.trim()) return;

    // 1. Render User Bubble
    appendMessage(messageText, false);

    // 2. Render Typing Bubble
    appendTypingIndicator();

    // 3. Generate answer after simulated delay
    setTimeout(() => {
        removeTypingIndicator();
        const reply = generateNovaResponse(messageText);
        appendMessage(reply, true);
        speakText(reply);
    }, 1000);
}

// ==========================================================================
// VOICE AND TRIGGER INITIALIZERS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Launcher Orb trigger click
    const launcher = document.getElementById("nova-launcher");
    const closeBtn = document.getElementById("nova-close-btn");
    
    launcher.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);

    // Form submit text listener
    const form = document.getElementById("nova-input-form");
    const inputField = document.getElementById("nova-input-field");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = inputField.value.trim();
        if (text) {
            inputField.value = "";
            handleUserMessage(text);
        }
    });

    // Voice Toggle Button
    const voiceBtn = document.getElementById("nova-voice-btn");
    const volUp = voiceBtn.querySelector(".volume-up-icon");
    const volMute = voiceBtn.querySelector(".volume-mute-icon");

    voiceBtn.addEventListener("click", () => {
        novaState.voiceMuted = !novaState.voiceMuted;
        
        if (novaState.voiceMuted) {
            volUp.style.display = "none";
            volMute.style.display = "block";
            voiceBtn.title = "Unmute Voice Narration";
            if (novaState.speechSynthesis) {
                novaState.speechSynthesis.cancel();
            }
        } else {
            volUp.style.display = "block";
            volMute.style.display = "none";
            voiceBtn.title = "Mute Voice Narration";
            
            // Speak a small test phrase
            speakText("Nova voice activated!");
        }
    });

    // Suggestion chips listeners
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const promptText = chip.textContent;
            handleUserMessage(promptText);
        });
    });

    // Initialize Dictation Mic listener
    initSpeechRecognition();

    // Trigger voice recognition list preheat (Web Speech requirement)
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
    }
});
