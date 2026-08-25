/**
   ==========================================================================
   NOVA - AI NEWS ASSISTANT INTEGRATION (nova.js)
   ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaWidget();
});

// Database of answers with matching keywords for global news support
const responseDatabase = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'hola', 'wassup', 'status', 'online', 'nova', 'assistant'],
        responses: [
            "Hello! I am **Nova**, your Pinnacle Globe AI news assistant. How can I help you navigate the news desk today? You can ask me to search reports, filter categories, or read articles.",
            "Hi there! Nice to meet you. I'm **Nova**, here to help you browse global headlines. Ask me to 'show technology news' or 'summarize article' to see me in action!",
            "Hey! Nova here. Ready to catch up on global events? Feel free to ask about tech, science, business reports, or how to control the reader modal!"
        ]
    },
    help: {
        keywords: ['help', 'rules', 'guide', 'commands', 'what can you do', 'menu', 'options', 'features', 'instructions'],
        responses: [
            "I can assist you with multiple commands:<br><br>" +
            "• **Navigate Feed**: Say *'show technology news'* or *'filter business'*.<br>" +
            "• **Search**: Say *'search for room-temperature'* or *'find quantum'*.<br>" +
            "• **Theme Toggle**: Say *'toggle dark mode'*.<br>" +
            "• **Article Summaries**: Open a report and say *'summarize this article'*.<br>" +
            "• **Listen Aloud**: Open a report and say *'read this article'*.<br>" +
            "• **Bookmarks**: Say *'save this article'* or *'how many bookmarks do I have?'*."
        ]
    },
    bookmarks: {
        keywords: ['bookmarks', 'bookmark', 'saved', 'saved list', 'saved stories', 'how many bookmarks', 'read later'],
        responses: [
            "You can save any article to read later by clicking the bookmark tab or saying *'bookmark this article'* while reading. Currently, you have **{count}** stories saved in your dashboard."
        ]
    },
    recommendations: {
        keywords: ['recommend', 'recommendations', 'suggest', 'what should i read', 'interesting reports', 'related'],
        responses: [
            "Let me check your active feed category interest metrics... I will compile a list of suggested reports for you."
        ]
    }
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

    // Speech Output Config
    let isSpeechMuted = true; // Start muted to comply with browser autoplay gesture requirements
    let currentUtterance = null;
    let hasWelcomed = false;

    // Initialize voice settings
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop launcher closing on clicks inside header
            isSpeechMuted = !isSpeechMuted;
            
            const volUp = voiceBtn.querySelector('.volume-up-icon');
            const volMute = voiceBtn.querySelector('.volume-mute-icon');

            if (isSpeechMuted) {
                voiceBtn.classList.add('muted');
                volUp.style.display = 'none';
                volMute.style.display = 'block';
                cancelSpeech();
            } else {
                voiceBtn.classList.remove('muted');
                volUp.style.display = 'block';
                volMute.style.display = 'none';
                speak("Voice output enabled.");
            }
        });
    }

    // Speech Input (Speech-to-Text) Config
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
            cancelSpeech(); // Stop Nova speaking if you start talking
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            
            // Automatically submit query
            setTimeout(() => {
                inputForm.dispatchEvent(new Event('submit'));
            }, 300);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
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
        // Hide mic button if browser doesn't support speech recognition
        if (micBtn) micBtn.style.display = 'none';
    }

    function stopRecordingState() {
        isRecording = false;
        if (micBtn) micBtn.classList.remove('recording');
        inputField.placeholder = "Ask Nova a question...";
    }

    // Toggle Chat Window
    launcher.addEventListener('click', () => {
        chatWindow.classList.add('open');
        launcher.style.transform = 'scale(0) translateY(20px)';
        launcher.style.opacity = '0';
        launcher.style.pointerEvents = 'none';
        
        // Focus input after opening transition
        setTimeout(() => {
            inputField.focus();
        }, 300);
        
        // Speak welcome greeting on first open
        if (!hasWelcomed) {
            appendMessage("Hello! I am Nova, your Pinnacle Globe AI news assistant. Ask me to find reports, filter channels, read stories, or summarize active reports!", 'assistant');
            setTimeout(() => {
                speak("Hello! I am Nova, your Pinnacle Globe AI news assistant. Ask me to find reports, filter channels, read stories, or summarize active reports!");
            }, 600);
            hasWelcomed = true;
        }
    });

    closeBtn.addEventListener('click', closeChat);

    // Close on escape key
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

    // Handle form submit
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        // Append User Message
        appendMessage(userText, 'user');
        inputField.value = '';

        // Generate response with simulated thinking state
        respondAsNova(userText);
    });

    // Handle suggestion chips
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
        
        // Parse simple links and bold elements
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

        // Auto Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function respondAsNova(userQuery) {
        // Show Typing Indicator
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

        // 1. Check for interactive page control commands first
        let responseText = checkForNewsAppCommands(userQuery);
        
        // 2. Fall back to conversational response matching if no commands triggered
        if (!responseText) {
            responseText = findBestResponse(userQuery);
        }

        // Simulated thinking delay (600ms - 1000ms)
        const delay = 600 + Math.random() * 400;
        setTimeout(() => {
            // Remove typing bubble
            typingBubble.remove();
            appendMessage(responseText, 'assistant');
            
            // Narrate message aloud
            speak(responseText);
        }, delay);
    }

    function checkForNewsAppCommands(query) {
        if (!window.NewsApp) return null;

        const clean = query.toLowerCase().trim();
        
        // Command Theme Toggle
        if (clean.includes('theme') || clean.includes('dark mode') || clean.includes('light mode') || clean.includes('toggle mode') || clean.includes('style mode')) {
            return window.NewsApp.toggleTheme();
        }
        
        // Command Category Filtering
        if (clean.includes('show ') || clean.includes('filter ') || clean.includes('switch to ') || clean.includes('go to ')) {
            if (clean.includes('tech') || clean.includes('technology')) {
                return window.NewsApp.filterCategory('technology');
            }
            if (clean.includes('world')) {
                return window.NewsApp.filterCategory('world');
            }
            if (clean.includes('business') || clean.includes('finance') || clean.includes('market')) {
                return window.NewsApp.filterCategory('business');
            }
            if (clean.includes('science') || clean.includes('space')) {
                return window.NewsApp.filterCategory('science');
            }
            if (clean.includes('health') || clean.includes('medical')) {
                return window.NewsApp.filterCategory('health');
            }
            if (clean.includes('sports') || clean.includes('tennis')) {
                return window.NewsApp.filterCategory('sports');
            }
            if (clean.includes('entertainment') || clean.includes('movie') || clean.includes('cinema')) {
                return window.NewsApp.filterCategory('entertainment');
            }
            if (clean.includes('latest') || clean.includes('all') || clean.includes('headlines')) {
                return window.NewsApp.filterCategory('all');
            }
        }
        
        // Command Search Actions
        if (clean.includes('search ') || clean.includes('find ') || clean.includes('look up ')) {
            // Extract search keyword
            let searchKeyword = "";
            if (clean.includes('search for ')) {
                searchKeyword = clean.split('search for ')[1];
            } else if (clean.includes('search ')) {
                searchKeyword = clean.split('search ')[1];
            } else if (clean.includes('find ')) {
                searchKeyword = clean.split('find ')[1];
            } else if (clean.includes('look up ')) {
                searchKeyword = clean.split('look up ')[1];
            }
            
            if (searchKeyword && searchKeyword.trim().length > 0) {
                return window.NewsApp.search(searchKeyword.trim());
            }
        }

        // Command: Bookmark active open article
        if (clean.includes('bookmark this') || clean.includes('save this') || clean.includes('save article') || clean.includes('add bookmark')) {
            return window.NewsApp.bookmarkActiveArticle();
        }

        // Command: Narrate summary highlights
        if (clean.includes('summarize') || clean.includes('summary') || clean.includes('core highlights') || clean.includes('explain this')) {
            return window.NewsApp.getActiveArticleSummary();
        }

        // Command: Play narration aloud
        if (clean.includes('read this') || clean.includes('speak') || clean.includes('narrate') || clean.includes('listen to')) {
            if (clean.includes('stop') || clean.includes('cancel') || clean.includes('pause')) {
                return window.NewsApp.stopActiveArticleNarration();
            }
            return window.NewsApp.speakActiveArticle();
        }

        // Command: Close active modal details
        if (clean.includes('close') || clean.includes('back to feed') || clean.includes('hide reader') || clean.includes('exit reader')) {
            const closeBtn = document.getElementById("reader-close-btn");
            if (closeBtn && window.NewsApp.isArticleOpen()) {
                closeBtn.click();
                return "Closed reader view. Back to news highlights grid.";
            }
        }

        return null;
    }

    function findBestResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ');
        const tokens = cleanMsg.split(/\s+/).filter(t => t.length > 0);
        
        if (tokens.length === 0) {
            return "I am listening! What would you like to ask about global reports?";
        }

        let bestCategory = null;
        let highestScore = 0;
        
        for (const [category, data] of Object.entries(responseDatabase)) {
            let score = 0;
            tokens.forEach(token => {
                // Exact matches
                if (data.keywords.includes(token)) {
                    score += 1.5;
                }
                
                // Partial keyword matches
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
        
        // Threshold check for category matchmaking
        if (highestScore >= 1 && bestCategory) {
            if (bestCategory === 'bookmarks' && window.NewsApp) {
                const count = window.NewsApp.getSavedCount();
                return responseDatabase.bookmarks.responses[0].replace('{count}', count);
            }
            if (bestCategory === 'recommendations' && window.NewsApp) {
                return window.NewsApp.getRecommendations();
            }

            const categoryResponses = responseDatabase[bestCategory].responses;
            const randomIndex = Math.floor(Math.random() * categoryResponses.length);
            return categoryResponses[randomIndex];
        }
        
        return "I am Nova, your dedicated news companion. I can search the archive database, filter news tabs, bookmark stories, or read article summaries. Try using the recommendation button or chips below!";
    }

    function parseSimpleMarkdown(text) {
        // Convert [text](url) to anchor tags
        let parsed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // Convert **text** to bold tags
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return parsed;
    }

    /* Web Speech Synthesis (TTS) */
    function speak(text) {
        if (isSpeechMuted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Terminate existing voices

            // Sanitize text formatting for natural TTS pronunciation
            let cleanText = text.replace(/<[^>]*>/g, ''); // Strip html
            cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Parse brackets
            cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1'); // Parse bold
            cleanText = cleanText.replace(/•/g, '-'); // Replace bullets

            currentUtterance = new SpeechSynthesisUtterance(cleanText);
            currentUtterance.rate = 1.05;
            currentUtterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            // Match standard English narrator voice
            const voice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft')));
            if (voice) {
                currentUtterance.voice = voice;
            }

            window.speechSynthesis.speak(currentUtterance);
        }
    }

    function cancelSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Expose external callback hooks for app events to notify assistant
    window.Nova = {
        onFeedEvent: (event, arg) => {
            console.log(`[Nova AI] Received feed event: ${event} -> ${arg}`);
            
            // Speak subtle confirmation depending on widget visual focus
            if (chatWindow.classList.contains('open') && !isSpeechMuted) {
                if (event === "theme_toggle") {
                    speak(`Switching site theme to ${arg} mode.`);
                }
            }
        },
        
        syncArticleContext: (article) => {
            if (article) {
                console.log(`[Nova AI] Active article synchronized: ${article.title}`);
                // Dynamic suggestions update based on active article
                if (suggestionsContainer) {
                    suggestionsContainer.innerHTML = `
                        <button class="suggestion-chip">Summarize article</button>
                        <button class="suggestion-chip">Read article aloud</button>
                        <button class="suggestion-chip">Bookmark story</button>
                        <button class="suggestion-chip">Recommend stories</button>
                    `;
                }
            } else {
                // Reset standard chips if no article is active
                if (suggestionsContainer) {
                    suggestionsContainer.innerHTML = `
                        <button class="suggestion-chip">Show Tech news</button>
                        <button class="suggestion-chip">Toggle theme</button>
                        <button class="suggestion-chip">Recommend stories</button>
                        <button class="suggestion-chip">What can you do?</button>
                    `;
                }
            }
        }
    };
}
