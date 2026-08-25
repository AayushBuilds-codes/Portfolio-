/**
 * Nova - AI Royal Concierge & Dining Companion (Saffron Darbar Indian Integration)
 * Provides responses regarding operating hours, royal valet, Sufi events, and Shahi dishes.
 * Features an intelligent voice/text table reservation parser, dynamic menu filtering,
 * and standard Text-to-Speech (TTS) + Speech-to-Text (STT) voice controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaWidget();
});

// Interactive Indian dishes descriptions for Nova Q&A matching
const dishDescriptions = {
    "paneer tikka": "The **Paneer Tikka Angare** (₹425.00) features charcoal-grilled cottage cheese cubes marinated in spiced yogurt, yellow chilies, and mustard oil. It is vegetarian and gluten-free!",
    "kebab": "Our **Dahi Ke Kebab** (₹395.00) are velvety spiced yogurt patties, panko-crusted and shallow fried. A signature chef selection starter!",
    "tikka": "The **Murg Malai Tikka** (₹475.00) features tender chicken pieces marinated in cream, cashew paste, and cardamom, flame-roasted in the tandoor.",
    "butter chicken": "Our legendary **Royal Butter Chicken** (₹625.00) consists of tandoori grilled chicken tikkas simmered in a velvety sweet tomato-cashew cream gravy. Best paired with Garlic Naan!",
    "dal makhani": "The famous **Dal Makhani Bukhara** (₹495.00) is black lentils slow-simmered on clay embers for 24 hours with churned butter and fresh cream. Rich, smoky, and gluten-free.",
    "paneer darbar": "Our **Paneer Darbar** (₹525.00) is soft fresh cottage cheese blocks simmered in a rich, smooth golden cashew gravy infused with saffron.",
    "biryani": "The **Lucknowi Veg Biryani** (₹575.00) is an aromatic masterpiece of basmati rice layered with garden vegetables, saffron, mint, and kewra water, slow-cooked under dum.",
    "shahi tukda": "The **Saffron Shahi Tukda** (₹345.00) is a royal bread pudding soaked in saffron cardamom rabri (condensed milk) and adorned with pure silver/gold leaf.",
    "halwa": "Our **Gajar Halwa Crumble** (₹295.00) is a warm, slow-cooked red carrot pudding layered with caramelized almond crumble.",
    "lassi": "The **Mango Cardamom Lassi** (₹195.00) is a thick, churned yogurt drink sweetened with fresh mango pulp and dusted with green cardamom.",
    "chai": "Our **Royal Masala Chai** (₹145.00) is strong black tea brewed with crushed ginger, cardamom pods, cinnamon bark, and farm-fresh whole milk."
};

// Conversational Q&A database for general queries
const responseDatabase = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'namaste', 'welcome', 'swagat', 'assistant', 'concierge'],
        responses: [
            "Namaste! Welcome to **Saffron Darbar**! I am **Nova**, your royal concierge. I can guide you through our Shahi recipes, filter vegetarian dishes, or book your seating ticket. Try saying *'Book a table for 4 tomorrow at 7 PM'*!",
            "Namaste! Nova here, your Saffron Darbar dining companion. Ready to experience the finest Indian heritage recipes? Let me know how I can help!",
            "Namaste! How may I assist your royal dining experience today? I can filters the menu or secure your Diwan cabin reservation."
        ]
    },
    hours: {
        keywords: ['hours', 'open', 'close', 'times', 'schedule', 'sunday', 'monday', 'days', 'weekend'],
        responses: [
            "Saffron Darbar welcomes guests **Tuesday through Sunday, from 5:00 PM to 12:00 AM**. We are closed on Mondays for private royal banquets and menu development."
        ]
    },
    valet: {
        keywords: ['valet', 'parking', 'park', 'car', 'garage', 'drive'],
        responses: [
            "We provide **complimentary royal valet parking** for all dining guests directly at the front entrance of the Darbar vestibule."
        ]
    },
    dresscode: {
        keywords: ['dress', 'code', 'wear', 'casual', 'formal', 'sherwani', 'outfit'],
        responses: [
            "Our dress code is **smart casual**. While formal or traditional Indian wear is welcomed, we simply request no athletic wear or beachwear in our main dining salon."
        ]
    },
    private: {
        keywords: ['private', 'events', 'catering', 'party', 'banquet', 'monday', 'rent', 'hall', 'venue'],
        responses: [
            "Our main dining salon and royal verandas are available for **private banqueting bookings on Mondays**. For reservations and custom catering packages, please email our events coordinator at [events@saffrondarbar.com](mailto:events@saffrondarbar.com)."
        ]
    },
    location: {
        keywords: ['location', 'address', 'find', 'map', 'where', 'city', 'street'],
        responses: [
            "Saffron Darbar is located at **742 Culinary Boulevard, Royal Heights**, right opposite the botanical gardens veranda."
        ]
    }
};

// Intelligent Dialog State for voice/text guided bookings
let bookingState = {
    inProgress: false,
    name: '',
    guests: '4',
    date: '',
    time: '19:00',
    notes: '',
    lastAsked: '' // Track what parameter Nova just asked for
};

function initNovaWidget() {
    const launcher = document.getElementById('nova-launcher');
    const chatWindow = document.getElementById('nova-chat-window');
    const closeBtn = document.getElementById('nova-close-btn');
    const voiceBtn = document.getElementById('nova-voice-btn');
    const micBtn = document.getElementById('nova-mic-btn');
    const inputForm = document.getElementById('nova-input-form');
    const inputField = document.getElementById('nova-input-field');
    const messagesContainer = document.getElementById('nova-messages');
    const suggestionsContainer = document.getElementById('nova-suggestions');

    if (!launcher || !chatWindow || !closeBtn || !inputForm || !messagesContainer) return;

    let isSpeechMuted = true; // start muted for standard browser policies
    let currentUtterance = null;
    let hasWelcomed = false;

    // Toggle Voice Output Speech
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isSpeechMuted = !isSpeechMuted;
            if (isSpeechMuted) {
                voiceBtn.classList.add('muted');
                voiceBtn.querySelector('.volume-up-icon').style.display = 'none';
                voiceBtn.querySelector('.volume-mute-icon').style.display = 'block';
                cancelSpeech();
            } else {
                voiceBtn.classList.remove('muted');
                voiceBtn.querySelector('.volume-up-icon').style.display = 'block';
                voiceBtn.querySelector('.volume-mute-icon').style.display = 'none';
                speak("Voice output enabled.");
            }
        });
    }

    // Speech-to-Text Recognition setup
    let recognition = null;
    let isRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            if (micBtn) micBtn.classList.add('recording');
            inputField.placeholder = "Listening... Speak now!";
            cancelSpeech();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            setTimeout(() => {
                inputForm.dispatchEvent(new Event('submit'));
            }, 300);
        };

        recognition.onerror = () => {
            stopRecordingState();
        };

        recognition.onend = () => {
            stopRecordingState();
        };

        if (micBtn) {
            micBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isRecording) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
        }
    } else {
        if (micBtn) micBtn.style.display = 'none';
    }

    function stopRecordingState() {
        isRecording = false;
        if (micBtn) micBtn.classList.remove('recording');
        inputField.placeholder = "Ask Nova for royal table bookings...";
    }

    // Toggle widget window open
    launcher.addEventListener('click', () => {
        chatWindow.classList.add('open');
        launcher.style.transform = 'scale(0) translateY(20px)';
        launcher.style.opacity = '0';
        launcher.style.pointerEvents = 'none';
        
        setTimeout(() => {
            inputField.focus();
        }, 300);
        
        if (!hasWelcomed) {
            appendMessage("Namaste! I am Nova, your royal concierge. Ask me to recommend dishes, filter vegetarian options, or book a table. Try saying: *'Book a table for 4'*!", 'assistant');
            setTimeout(() => {
                speak("Namaste! I am Nova, your royal concierge. Ask me to recommend dishes, filter vegetarian options, or book a table.");
            }, 600);
            hasWelcomed = true;
        }
    });

    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
            closeChat();
        }
    });

    function closeChat() {
        chatWindow.classList.remove('open');
        launcher.style.transform = 'scale(1) translateY(0)';
        launcher.style.opacity = '1';
        launcher.style.pointerEvents = 'auto';
        cancelSpeech();
        stopRecordingState();
    }

    // Submit user message
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        appendMessage(userText, 'user');
        inputField.value = '';

        respondAsNova(userText);
    });

    // Suggestions click handler
    if (suggestionsContainer) {
        suggestionsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (!chip) return;
            const query = chip.textContent;
            
            appendMessage(query, 'user');
            respondAsNova(query);
        });
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `nova-message-bubble ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'assistant') {
            contentDiv.innerHTML = parseSimpleMarkdown(text);
        } else {
            contentDiv.textContent = text;
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(contentDiv);
        bubble.appendChild(timeSpan);
        messagesContainer.appendChild(bubble);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function respondAsNova(userQuery) {
        const typingBubble = document.createElement('div');
        typingBubble.className = 'nova-message-bubble assistant typing';
        typingBubble.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingBubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        let responseText = null;

        // 1. Process guided conversational table bookings if active
        if (bookingState.inProgress) {
            responseText = parseBookingDialog(userQuery);
        }
        
        // 2. Look for triggers starting a new booking
        if (!responseText) {
            responseText = checkForNewBookingTriggers(userQuery);
        }

        // 3. Process direct storefront commands (menu filters, scroll triggers)
        if (!responseText) {
            responseText = checkForStorefrontCommands(userQuery);
        }

        // 4. Look for dish recommendations matching menu items
        if (!responseText) {
            responseText = checkForDishDescriptions(userQuery);
        }

        // 5. Fallback to general conversational Q&A database
        if (!responseText) {
            responseText = findBestResponse(userQuery);
        }

        const delay = 500 + Math.random() * 500;
        setTimeout(() => {
            typingBubble.remove();
            appendMessage(responseText, 'assistant');
            speak(responseText);
        }, delay);
    }

    // Guided Booking Dialog handler
    function parseBookingDialog(query) {
        const clean = query.toLowerCase().trim();
        
        if (bookingState.lastAsked === 'name') {
            const capitalizedName = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            bookingState.name = capitalizedName;
            bookingState.lastAsked = '';
            return checkBookingStateComplete();
        }

        if (bookingState.lastAsked === 'guests') {
            const numMatch = clean.match(/(\d+)/);
            if (numMatch) {
                bookingState.guests = numMatch[1];
                bookingState.lastAsked = '';
                return checkBookingStateComplete();
            }
            return "Please provide the party size as a number (e.g. 2, 4, 6).";
        }

        if (bookingState.lastAsked === 'date') {
            const parsedDate = parseDateHelper(clean);
            if (parsedDate) {
                bookingState.date = parsedDate;
                bookingState.lastAsked = '';
                return checkBookingStateComplete();
            }
            return "Could you specify the date? You can say *'today'*, *'tomorrow'*, or a date like *'2026-06-15'*.";
        }

        if (bookingState.lastAsked === 'time') {
            const parsedTime = parseTimeHelper(clean);
            if (parsedTime) {
                bookingState.time = parsedTime;
                bookingState.lastAsked = '';
                return checkBookingStateComplete();
            }
            return "Please specify the dining hour (e.g., *'7 PM'*, *'8:30 PM'*, or *'20:00'*). We serve from 5 PM to 12 AM.";
        }

        return null;
    }

    // Parse queries starting a booking session
    function checkForNewBookingTriggers(query) {
        const clean = query.toLowerCase();
        
        if (clean.includes('book') || clean.includes('reserve') || clean.includes('reservation') || clean.includes('table') || clean.includes('seat')) {
            bookingState.inProgress = true;
            
            // Extract parameters out of initial prompt if provided
            // Guests count
            const guestMatch = clean.match(/for\s+(\d+)\s+(guests|people|person)/) || clean.match(/table\s+for\s+(\d+)/);
            if (guestMatch) {
                bookingState.guests = guestMatch[1];
            }

            // Name
            const nameMatch = clean.match(/under\s+([a-z\s]+)/) || clean.match(/for\s+([a-z\s]+)/);
            if (nameMatch && !nameMatch[1].includes('guest') && !nameMatch[1].includes('people') && !nameMatch[1].includes('tomorrow') && !nameMatch[1].includes('today')) {
                bookingState.name = nameMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            // Date
            const dateMatch = parseDateHelper(clean);
            if (dateMatch) {
                bookingState.date = dateMatch;
            }

            // Time
            const timeMatch = parseTimeHelper(clean);
            if (timeMatch) {
                bookingState.time = timeMatch;
            }

            return checkBookingStateComplete();
        }
        return null;
    }

    // Verify booking state details and prompt next question
    function checkBookingStateComplete() {
        if (!bookingState.name) {
            bookingState.lastAsked = 'name';
            return "I can help you reserve a Darbar cabin table. Under what **guest name** should I make the reservation ticket?";
        }
        if (!bookingState.guests) {
            bookingState.lastAsked = 'guests';
            return `Aapka Swagat Hai, **${bookingState.name} Ji**. **How many guests** will be dining in your royal party?`;
        }
        if (!bookingState.date) {
            bookingState.lastAsked = 'date';
            return `Noted. A table for **${bookingState.guests}** guests under **${bookingState.name} Ji**. **Which date** would you like to book?`;
        }
        if (!bookingState.time) {
            bookingState.lastAsked = 'time';
            return `Booking date set to **${bookingState.date}**. **What time** would you prefer (e.g. 7 PM or 8 PM)? We are open from 5 PM to 12 AM.`;
        }

        // All fields filled! Submit table booking
        window.GustoStore.processReservation(
            bookingState.name,
            bookingState.guests,
            bookingState.date,
            bookingState.time,
            bookingState.notes
        );

        const summaryStr = `Dhanyawad! I am processing your reservation under **${bookingState.name}** for **${bookingState.guests} guests** on **${bookingState.date}** at **${bookingState.time}**. Your digital Diwan ticket is loading now!`;
        
        // Reset dialog state
        bookingState = {
            inProgress: false,
            name: '',
            guests: '4',
            date: '',
            time: '19:00',
            notes: '',
            lastAsked: ''
        };

        return summaryStr;
    }

    // Date parser helper
    function parseDateHelper(str) {
        const today = new Date();
        
        if (str.includes('today')) {
            return formatDateStr(today);
        }
        if (str.includes('tomorrow')) {
            const tom = new Date(today);
            tom.setDate(today.getDate() + 1);
            return formatDateStr(tom);
        }
        
        const dateMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) return dateMatch[0];

        return null;
    }

    function formatDateStr(d) {
        const yyyy = d.getFullYear();
        let mm = d.getMonth() + 1;
        let dd = d.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        return `${yyyy}-${mm}-${dd}`;
    }

    // Time parser helper (e.g. 7 PM -> 19:00)
    function parseTimeHelper(str) {
        const timeMatch = str.match(/at\s+(\d+)\s*(pm|am|PM|AM)?/) || str.match(/(\d+)\s*(pm|am|PM|AM)/);
        if (timeMatch) {
            let hr = parseInt(timeMatch[1]);
            const ampm = timeMatch[2] ? timeMatch[2].toLowerCase() : 'pm';
            
            if (ampm === 'pm' && hr < 12) hr += 12;
            if (ampm === 'am' && hr === 12) hr = 0;
            
            const hrStr = hr < 10 ? '0' + hr : hr;
            return `${hrStr}:00`;
        }
        
        const colonMatch = str.match(/(\d{2}):(\d{2})/);
        if (colonMatch) return colonMatch[0];

        return null;
    }

    // Direct interface command mapping
    function checkForStorefrontCommands(query) {
        if (!window.GustoStore) return null;
        const clean = query.toLowerCase().trim();

        // Menu category switches
        if (clean.includes('show ') || clean.includes('filter ') || clean.includes('category ') || clean.includes('menu ')) {
            if (clean.includes('starter') || clean.includes('appetizer') || clean.includes('shorba') || clean.includes('paneer tikka')) {
                window.GustoStore.filterCategory('starters');
                scrollToSection('menu-section');
                return "Showing our delicious selection of gourmet tandoori **Starters**.";
            }
            if (clean.includes('main') || clean.includes('course') || clean.includes('curry') || clean.includes('chicken') || clean.includes('dal')) {
                window.GustoStore.filterCategory('mains');
                scrollToSection('menu-section');
                return "Displaying our signature royal **Darbar Mains**.";
            }
            if (clean.includes('dessert') || clean.includes('sweet') || clean.includes('halwa') || clean.includes('tukda')) {
                window.GustoStore.filterCategory('desserts');
                scrollToSection('menu-section');
                return "Revealing our decadent Shahi desserts.";
            }
            if (clean.includes('drink') || clean.includes('beverage') || clean.includes('lassi') || clean.includes('chai')) {
                window.GustoStore.filterCategory('beverages');
                scrollToSection('menu-section');
                return "Showing our hand-crafted botanical lassis and masala chais.";
            }
            if (clean.includes('all') || clean.includes('reset') || clean.includes('clear filter')) {
                window.GustoStore.filterCategory('all');
                window.GustoStore.toggleDietaryFilter('veg', false);
                window.GustoStore.toggleDietaryFilter('gf', false);
                return "All menu filters have been reset.";
            }
        }

        // Dietary vegetarian/gluten-free filters
        if (clean.includes('vegetarian') || clean.includes('veg only') || clean.includes('pure veg')) {
            window.GustoStore.toggleDietaryFilter('veg', true);
            scrollToSection('menu-section');
            return "Applying **Vegetarian** menu filter options.";
        }
        if (clean.includes('gluten') || clean.includes('gf')) {
            window.GustoStore.toggleDietaryFilter('gf', true);
            scrollToSection('menu-section');
            return "Applying **Gluten-Free** menu filter options.";
        }

        // Search query catalog
        if (clean.includes('search ') || clean.includes('find ')) {
            const searchTerm = clean.replace('search ', '').replace('search for ', '').replace('find ', '').trim();
            if (searchTerm.length > 0) {
                window.GustoStore.searchMenu(searchTerm);
                scrollToSection('menu-section');
                return `Searching the menu for **"${searchTerm}"**.`;
            }
        }

        // Theme visual toggles
        if (clean.includes('theme') || clean.includes('dark mode') || clean.includes('light mode') || clean.includes('toggle mode')) {
            const btn = document.getElementById('theme-toggle');
            if (btn) {
                btn.click();
                return "Toggling website design theme layout.";
            }
        }

        // Scroll navigations
        if (clean.includes('scroll') || clean.includes('go to') || clean.includes('navigate')) {
            if (clean.includes('menu')) {
                scrollToSection('menu-section');
                return "Navigating to the Shahi Menu.";
            }
            if (clean.includes('event')) {
                scrollToSection('events-section');
                return "Scrolling to our upcoming Darbar cultural events.";
            }
            if (clean.includes('reserve') || clean.includes('reservation') || clean.includes('booking')) {
                scrollToSection('reservation-section');
                return "Scrolling to the Table Reservation Desk.";
            }
        }

        return null;
    }

    function scrollToSection(id) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Dish details mapper
    function checkForDishDescriptions(query) {
        const clean = query.toLowerCase();
        for (const [dish, desc] of Object.entries(dishDescriptions)) {
            if (clean.includes(dish)) {
                return desc;
            }
        }
        return null;
    }

    function findBestResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ');
        const tokens = cleanMsg.split(/\s+/).filter(t => t.length > 0);
        
        if (tokens.length === 0) {
            return "I am listening! What would you like to ask about Saffron Darbar?";
        }

        let bestCategory = null;
        let highestScore = 0;
        
        for (const [category, data] of Object.entries(responseDatabase)) {
            let score = 0;
            tokens.forEach(token => {
                if (data.keywords.includes(token)) {
                    score += 1.5;
                }
                data.keywords.forEach(keyword => {
                    if (keyword.length > 3) {
                        if (token.includes(keyword) || keyword.includes(token)) {
                            score += 0.5;
                        }
                    }
                });
            });
            
            if (score > highestScore) {
                highestScore = score;
                bestCategory = category;
            }
        }
        
        if (highestScore >= 1 && bestCategory) {
            const categoryResponses = responseDatabase[bestCategory].responses;
            const randomIndex = Math.floor(Math.random() * categoryResponses.length);
            return categoryResponses[randomIndex];
        }
        
        return "I am Nova, your royal concierge. I can recommend Shahi menu items, check valet parking, Sufi live music, or guide you through a table reservation ticket. Try booking a table now!";
    }

    function parseSimpleMarkdown(text) {
        let parsed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return parsed;
    }

    // Web Speech Synthesis (TTS)
    function speak(text) {
        if (isSpeechMuted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            let cleanText = text.replace(/<[^>]*>/g, '');
            cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
            cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');
            cleanText = cleanText.replace(/•/g, '-');

            currentUtterance = new SpeechSynthesisUtterance(cleanText);
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft')));
            if (voice) {
                currentUtterance.voice = voice;
            }

            window.speechSynthesis.speak(currentUtterance);
        }
    }

    // External hooks for window events
    window.Nova = {
        onReservationConfirm: (msg) => {
            console.log("Nova recorded reservation event:", msg);
        },
        submitQuery: (query) => {
            appendMessage(query, 'user');
            respondAsNova(query);
        }
    };

    function cancelSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
}
