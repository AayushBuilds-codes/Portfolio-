/**
 * Nova - AI Event Coordinator & Promotional Guide (VibeCraft Integration)
 * Processes guided event planning commands, generates descriptive templates,
 * and provides speech synthesis/recognition.
 */

document.addEventListener("DOMContentLoaded", () => {
    initNovaWidget();
});

// AI suggestions database
const brainstormTemplates = {
    taglines: {
        salsa: [
            "Feel the Rhythm, Ignite the Night: The Ultimate Salsa Masterclass!",
            "Unleash Your Passion: Step, Turn, and Shine at our Salsa Social.",
            "Spicy Beats, Smooth Steps: Connect on the Dance Floor!"
        ],
        meetup: [
            "Compile Ideas, Connect Minds: Where Technology Meets Innovation.",
            "Beyond the Code: Join the Node and Network with Specialists.",
            "Building the Future: Scalable Architecture and Cloud Coffee Chats."
        ],
        food: [
            "Spice Routes & Gastronomy: A Royal Tasting Experience.",
            "Feast of Flavors: Sizzling Clay Ovens and Sweet Cardamom Delights.",
            "From Tandoor to Table: A Culinary Journey of Heritage Spices."
        ],
        workshop: [
            "Unlock Your Creative Spark: Learn, Craft, and Inspire.",
            "Hands-On Masterclass: Acquire Verified Skills from Industry Coaches.",
            "Artisan Design & Craft: Sculpting Layouts and Visual Systems."
        ]
    },
    descriptions: {
        salsa: "Step onto the dance floor and feel the rhythm of salsa and bachata! Led by professional choreographers, this event features absolute beginner-friendly steps, a live acoustic Latin band, and refreshing craft mocktails. No partner required, bring your dancing shoes!",
        meetup: "An engaging tech meetup for web engineers, data scientists, and ML specialists. Featuring keynote presentations on generative AI, panel discussions on frontend designs, live coding hackathons, and networking sessions over food. Bring your laptop!",
        food: "Immerse your senses in an aromatic celebration of regional culinary arts. Featuring live street food counters, premium clay-oven kebab stands, artisanal spice mixing booths, and traditional desserts. An evening of food, music, and heritage!",
        workshop: "A hands-on coding and UI layout masterclass. Learn CSS Grid architectures, SVG vector creations, and micro-animation triggers under the guide of senior developers. Includes digital verification badges and workspace templates!"
    }
};

function initNovaWidget() {
    const launcher = document.getElementById("nova-launcher");
    const chatWindow = document.getElementById("nova-chat-window");
    const closeBtn = document.getElementById("nova-close-btn");
    const voiceBtn = document.getElementById("nova-voice-btn");
    const micBtn = document.getElementById("nova-mic-btn");
    const inputForm = document.getElementById("nova-input-form");
    const inputField = document.getElementById("nova-input-field");
    const messagesContainer = document.getElementById("nova-messages");
    const suggestionsContainer = document.getElementById("nova-suggestions");

    if (!launcher || !chatWindow || !closeBtn || !inputForm || !messagesContainer) return;

    let isSpeechMuted = true; // default browser mute policies
    let currentUtterance = null;
    let hasWelcomed = false;

    // Toggle speech mute state
    if (voiceBtn) {
        voiceBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            isSpeechMuted = !isSpeechMuted;
            if (isSpeechMuted) {
                voiceBtn.classList.add("muted");
                voiceBtn.querySelector('.volume-up-icon').style.display = 'none';
                voiceBtn.querySelector('.volume-mute-icon').style.display = 'block';
                cancelSpeech();
            } else {
                voiceBtn.classList.remove("muted");
                voiceBtn.querySelector('.volume-up-icon').style.display = 'block';
                voiceBtn.querySelector('.volume-mute-icon').style.display = 'none';
                speak("Voice feedback enabled.");
            }
        });
    }

    // Speech Recognition (Speech-to-Text)
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
            if (micBtn) micBtn.classList.add("recording");
            inputField.placeholder = "Listening... Speak your command!";
            cancelSpeech();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            setTimeout(() => {
                inputForm.dispatchEvent(new Event("submit"));
            }, 300);
        };

        recognition.onerror = () => {
            stopRecordingState();
        };

        recognition.onend = () => {
            stopRecordingState();
        };

        if (micBtn) {
            micBtn.addEventListener("click", (e) => {
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
        if (micBtn) micBtn.classList.remove("recording");
        inputField.placeholder = "Ask Nova to plan an event or suggest details...";
    }

    // Open/Close widget
    launcher.addEventListener("click", () => {
        chatWindow.classList.add("open");
        launcher.style.transform = 'scale(0) translateY(20px)';
        launcher.style.opacity = '0';
        launcher.style.pointerEvents = 'none';

        setTimeout(() => {
            inputField.focus();
        }, 300);

        if (!hasWelcomed) {
            appendMessage("Greetings! I am **Nova**, your AI Event Coordinator. I can brainstorm taglines, write descriptions, switch preview themes, or plan your event structures directly. Try saying: *'Plan a salsa dance class next Saturday'*!", "assistant");
            setTimeout(() => {
                speak("Greetings! I am Nova, your AI Event Coordinator. I can write descriptions, switch preview themes, or plan your event structures directly.");
            }, 500);
            hasWelcomed = true;
        }
    });

    closeBtn.addEventListener("click", closeChat);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && chatWindow.classList.contains("open")) {
            closeChat();
        }
    });

    function closeChat() {
        chatWindow.classList.remove("open");
        launcher.style.transform = 'scale(1) translateY(0)';
        launcher.style.opacity = '1';
        launcher.style.pointerEvents = 'auto';
        cancelSpeech();
        stopRecordingState();
    }

    // Input form submit
    inputForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        appendMessage(userText, "user");
        inputField.value = '';

        respondAsNova(userText);
    });

    // Suggestions chip click
    if (suggestionsContainer) {
        suggestionsContainer.addEventListener("click", (e) => {
            const chip = e.target.closest(".suggestion-chip");
            if (!chip) return;
            const query = chip.textContent;
            
            appendMessage(query, "user");
            respondAsNova(query);
        });
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement("div");
        bubble.className = `nova-message-bubble ${sender}`;
        
        const contentDiv = document.createElement("div");
        contentDiv.className = 'message-content';
        
        if (sender === 'assistant') {
            contentDiv.innerHTML = parseSimpleMarkdown(text);
        } else {
            contentDiv.textContent = text;
        }

        const timeSpan = document.createElement("span");
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(contentDiv);
        bubble.appendChild(timeSpan);
        messagesContainer.appendChild(bubble);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function respondAsNova(userQuery) {
        // Typing state bubble
        const typingBubble = document.createElement("div");
        typingBubble.className = "nova-message-bubble assistant typing";
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

        // 1. Check for planning command parsing
        responseText = parseEventPlanningCommand(userQuery);

        // 2. Check for theme modifications
        if (!responseText) {
            responseText = parseThemeCommand(userQuery);
        }

        // 3. Check for brainstorming taglines/slogans
        if (!responseText) {
            responseText = parseBrainstormCommand(userQuery);
        }

        // 4. Fallback conversation
        if (!responseText) {
            responseText = getConversationalFallback(userQuery);
        }

        const delay = 500 + Math.random() * 500;
        setTimeout(() => {
            typingBubble.remove();
            appendMessage(responseText, "assistant");
            speak(responseText);
        }, delay);
    }

    // Guided parser for natural planning requests
    function parseEventPlanningCommand(query) {
        const clean = query.toLowerCase().trim();
        
        if (clean.includes("plan") || clean.includes("create") || clean.includes("setup")) {
            let data = {};
            let logs = [];

            // Category detection
            if (clean.includes("tech") || clean.includes("code") || clean.includes("meetup") || clean.includes("dev")) {
                data.category = "Meetup";
                data.theme = "purple";
                logs.push("• Category set to **Tech Meetup** (Accent: Neon Purple)");
            } else if (clean.includes("music") || clean.includes("concert") || clean.includes("salsa") || clean.includes("dance")) {
                data.category = "Concert";
                data.theme = "teal";
                logs.push("• Category set to **Music Concert** (Accent: Electric Teal)");
            } else if (clean.includes("food") || clean.includes("spice") || clean.includes("festival") || clean.includes("feast")) {
                data.category = "Festival";
                data.theme = "saffron";
                logs.push("• Category set to **Food & Spice Festival** (Accent: Sunset Saffron)");
            } else if (clean.includes("paint") || clean.includes("art") || clean.includes("gallery") || clean.includes("exhibit")) {
                data.category = "Gallery";
                data.theme = "gold";
                logs.push("• Category set to **Art Exhibition** (Accent: Cyber Gold)");
            } else if (clean.includes("workshop") || clean.includes("class") || clean.includes("teach")) {
                data.category = "Workshop";
                data.theme = "purple";
                logs.push("• Category set to **Creative Workshop** (Accent: Neon Purple)");
            }

            // Theme override
            if (clean.includes("purple")) { data.theme = "purple"; }
            if (clean.includes("saffron") || clean.includes("orange")) { data.theme = "saffron"; }
            if (clean.includes("teal") || clean.includes("green")) { data.theme = "teal"; }
            if (clean.includes("gold") || clean.includes("yellow")) { data.theme = "gold"; }

            // Extract Title e.g., plan X or named X
            let titleMatch = query.match(/(?:plan|create|setup)\s+(?:a|an)?\s*(.*?)(?:\s+(?:next|tomorrow|at|on|under|called|named|with)|$)/i);
            if (titleMatch && titleMatch[1]) {
                let parsedTitle = titleMatch[1].trim();
                // Strip articles/words
                parsedTitle = parsedTitle.replace(/^(tech|code|music|food|art|creative|meetup|concert|festival|workshop)\s+/i, '');
                
                // Capitalize title
                parsedTitle = parsedTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                if (parsedTitle && parsedTitle.length > 2) {
                    data.title = parsedTitle;
                    logs.push(`• Title set to **"${parsedTitle}"**`);
                }
            }

            // Date parsing (next Saturday, tomorrow, next week)
            let dateVal = null;
            const today = new Date();
            if (clean.includes("tomorrow")) {
                const tom = new Date(today);
                tom.setDate(today.getDate() + 1);
                dateVal = tom;
            } else if (clean.includes("next saturday")) {
                const sat = new Date(today);
                sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
                dateVal = sat;
            } else if (clean.includes("next monday")) {
                const mon = new Date(today);
                mon.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7 || 7));
                dateVal = mon;
            } else if (clean.includes("next week")) {
                const week = new Date(today);
                week.setDate(today.getDate() + 7);
                dateVal = week;
            }

            if (dateVal) {
                dateVal.setHours(18, 0, 0, 0); // 6:00 PM
                const year = dateVal.getFullYear();
                const month = String(dateVal.getMonth() + 1).padStart(2, '0');
                const day = String(dateVal.getDate()).padStart(2, '0');
                const hours = String(dateVal.getHours()).padStart(2, '0');
                const minutes = String(dateVal.getMinutes()).padStart(2, '0');
                
                data.date = `${year}-${month}-${day}T${hours}:${minutes}`;
                logs.push(`• Schedule set to **${dateVal.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at 6:00 PM**`);
            }

            // Price extraction (e.g. at 499 or price 200 or free)
            if (clean.includes("free")) {
                data.price = 0;
                logs.push("• Pricing set to **Free Admission**");
            } else {
                const priceMatch = clean.match(/(?:price|cost|at|for|₹|\$)\s*(\d+)/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1]);
                    data.price = price;
                    logs.push(`• Pricing set to **₹${price.toFixed(2)}**`);
                }
            }

            // Description boilerplate matching category
            if (data.category) {
                const key = data.category === "Meetup" ? "meetup" : (data.category === "Concert" ? "salsa" : (data.category === "Festival" ? "food" : "workshop"));
                data.desc = brainstormTemplates.descriptions[key] || brainstormTemplates.descriptions.meetup;
                logs.push("• Template description auto-generated");
            }

            // Check if we parsed any values
            if (Object.keys(data).length > 0) {
                window.VibeStore.setValues(data);
                return `Plan generated successfully! I have configured the design workspace for you:<br><br>${logs.join("<br>")}<br><br>The landing page preview and printable ticket pass have updated in real-time.`;
            }
        }
        return null;
    }

    // Handle theme color commands
    function parseThemeCommand(query) {
        const clean = query.toLowerCase().trim();
        if (clean.includes("theme") || clean.includes("switch to") || clean.includes("change color")) {
            let colorKey = null;
            if (clean.includes("purple") || clean.includes("neon")) colorKey = "purple";
            if (clean.includes("saffron") || clean.includes("orange")) colorKey = "saffron";
            if (clean.includes("teal") || clean.includes("green")) colorKey = "teal";
            if (clean.includes("gold") || clean.includes("yellow") || clean.includes("cyber")) colorKey = "gold";

            if (colorKey) {
                window.VibeStore.applyThemePreset(colorKey);
                // Update active radio indicators in customizer form
                const dots = document.querySelectorAll(".theme-dot");
                dots.forEach(d => {
                    d.classList.remove("active");
                    if (d.getAttribute("data-theme") === colorKey) d.classList.add("active");
                });
                return `Theme preset updated to **${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}** accent across all panels.`;
            }
        }
        return null;
    }

    // Brainstorm copy text slogans
    function parseBrainstormCommand(query) {
        const clean = query.toLowerCase();
        
        if (clean.includes("slogan") || clean.includes("tagline") || clean.includes("suggest") || clean.includes("write")) {
            let category = null;
            if (clean.includes("salsa") || clean.includes("dance") || clean.includes("concert")) category = "salsa";
            if (clean.includes("meetup") || clean.includes("tech") || clean.includes("code") || clean.includes("dev")) category = "meetup";
            if (clean.includes("food") || clean.includes("spice") || clean.includes("cook")) category = "food";
            if (clean.includes("exhibit") || clean.includes("art") || clean.includes("paint") || clean.includes("workshop")) category = "workshop";

            if (category) {
                const list = brainstormTemplates.taglines[category];
                const slogan = list[Math.floor(Math.random() * list.length)];
                
                // Set as event description or title if asked
                if (clean.includes("description")) {
                    const descText = brainstormTemplates.descriptions[category];
                    window.VibeStore.setValues({ desc: descText });
                    return `Here is a custom template description for your event:<br><br>*"${descText}"*<br><br>I have pre-filled this description in your Event Planner pane!`;
                }

                return `Here are some catchy tagline ideas for your event promotion:<br><br>${list.map(s => `• *"${s}"*`).join("<br>")}`;
            }
        }
        return null;
    }

    function getConversationalFallback(userMessage) {
        const clean = userMessage.toLowerCase().trim();
        
        if (clean.includes("hello") || clean.includes("hi") || clean.includes("hey") || clean.includes("namaste")) {
            return "Hello! I am Nova, your VibeCraft assistant. I can plan tech meetups, food festivals, or salsa classes by voice command. What event shall we coordinate today?";
        }
        if (clean.includes("help") || clean.includes("command")) {
            return "You can command me to:<br>" +
                   "• **Plan events**: *'Plan a tech meetup named DevFest next Saturday at ₹299'*<br>" +
                   "• **Change colors**: *'Switch theme to saffron'*<br>" +
                   "• **Brainstorm copy**: *'Write a description for food festival'* or *'Suggest slogans for salsa class'*";
        }

        return "I am Nova, your AI Event Coordinator. Try commanding me: *'Plan a music concert called Sunset Beats next Saturday'* or ask me to *'Switch theme to gold'*!";
    }

    // Markdown converter helper
    function parseSimpleMarkdown(text) {
        let parsed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return parsed;
    }

    // Text-to-Speech voice synthesis
    function speak(text) {
        if (isSpeechMuted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            // Sanitize text tags
            let cleanText = text.replace(/<[^>]*>/g, '');
            cleanText = cleanText.replace(/•/g, '-');
            
            currentUtterance = new SpeechSynthesisUtterance(cleanText);
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft')));
            if (voice) currentUtterance.voice = voice;

            window.speechSynthesis.speak(currentUtterance);
        }
    }

    function cancelSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Hook registration into window for mock registrations
    window.Nova = {
        onMockBooking: (name, isVip) => {
            appendMessage(`New attendee registration received: **${name}** registered successfully as a **${isVip ? 'VIP' : 'Standard'}** guest! Ticket pass printed.`, 'assistant');
        }
    };
}
