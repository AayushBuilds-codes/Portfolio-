/**
 * Nova - AI Shopping Assistant Logic (E-commerce Integration)
 * Provides responses regarding products, return policies, shipping, and discounts.
 * Features Text-to-Speech (TTS) voice narration, Speech-to-Text (STT) voice recognition,
 * and direct storefront control commands (adding to cart, searching, filtering, checkout).
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaWidget();
});

// Database of answers with matching keywords for shopping support
const responseDatabase = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'hola', 'wassup', 'status', 'online', 'nova', 'assistant'],
        responses: [
            "Hello! I am **Nova**, your Aura Tech AI shopping assistant. How can I help you today? You can ask me to search for products, add items to your cart, or answer store policy questions.",
            "Hi there! Nice to meet you. I'm **Nova**, here to help you navigate Aura Tech. Ask me to 'show wearables' or 'add Aura Glass to cart' to see me in action!",
            "Hey! Nova here. Ready to upgrade your lifestyle? Feel free to ask about our futuristic smart gear or store policies!"
        ]
    },
    returns: {
        keywords: ['return', 'returns', 'refund', 'refunds', 'exchange', 'warranty', 'guarantee', 'policy'],
        responses: [
            "Aura Tech offers a **30-day hassle-free return policy**. If you are not fully satisfied with your tech gear, return it in its original packaging for a full refund. Return shipping is completely free!"
        ]
    },
    shipping: {
        keywords: ['shipping', 'delivery', 'ship', 'send', 'days', 'time', 'arrive', 'order tracking', 'delivery time'],
        responses: [
            "We provide **free carbon-neutral worldwide shipping** on all orders. Delivery typically takes **1 to 2 business days** via our premium logistics drone network."
        ]
    },
    discounts: {
        keywords: ['discount', 'discounts', 'coupon', 'coupons', 'code', 'codes', 'promo', 'offer', 'offers', 'sale', 'cheap'],
        responses: [
            "You can use the promo code **AURA20** at checkout to get an exclusive **20% off** on your first purchase today!"
        ]
    },
    payment: {
        keywords: ['payment', 'pay', 'credit card', 'card', 'cards', 'paypal', 'crypto', 'biosig', 'bitcoin', 'buy'],
        responses: [
            "We support major credit cards (Visa, Mastercard, Amex), PayPal, and secure decentralized **biosig payments** directly through our authorized checkout gateway."
        ]
    },
    contact: {
        keywords: ['contact', 'email', 'support', 'help', 'phone', 'mail', 'reach', 'customer service', 'officer'],
        responses: [
            "You can reach our premium customer support team via email at [support@auratech.io](mailto:support@auratech.io). We are available 24/7 to monitor your neural nodes and gear!"
        ]
    },
    products: {
        keywords: ['products', 'catalog', 'gear', 'wearables', 'holograms', 'audio', 'items', 'sell', 'store', 'devices'],
        responses: [
            "We offer a curated selection of advanced tech gadgets across four categories:<br><br>" +
            "• **Smart Wearables**: Nova Ring, Aura Glass, Cyber Band, Bio Watch.<br>" +
            "• **Neural Gear**: Neural Link v1, Quantum Drive.<br>" +
            "• **Audio Gear**: Zen Pods.<br>" +
            "• **Holograms**: Holo Projector.<br><br>" +
            "Tell me what you are looking for, or say *'show neural gear'* to filter the catalog!"
        ]
    },
    about: {
        keywords: ['who are you', 'what is this', 'about aura', 'aura tech', 'company', 'brand'],
        responses: [
            "**Aura Tech** is a leading developer of futuristic wearables and sensory gear. We specialize in glassmorphic interfaces, neural tracking, and ambient holograms designed to elevate your daily digital interactions."
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
    let isSpeechMuted = true; // Start muted to comply with browser autoplay policies
    let currentUtterance = null;
    let hasWelcomed = false;

    // Initialize voice settings
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
            cancelSpeech();
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
        
        setTimeout(() => {
            inputField.focus();
        }, 300);
        
        if (!hasWelcomed) {
            appendMessage("Hello! I am Nova, your Aura Tech AI assistant. Ask me to find products, add them to your cart, or check out!", 'assistant');
            setTimeout(() => {
                speak("Hello! I am Nova, your Aura Tech AI assistant. Ask me to find products, add them to your cart, or check out!");
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

    // Handle form submit
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        appendMessage(userText, 'user');
        inputField.value = '';

        respondAsNova(userText);
    });

    // Handle suggestion chips click
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

        // 1. Process interactive storefront commands
        let responseText = checkForStorefrontCommands(userQuery);
        
        // 2. Fall back to Q&A matching database
        if (!responseText) {
            responseText = findBestResponse(userQuery);
        }

        const delay = 600 + Math.random() * 500;
        setTimeout(() => {
            typingBubble.remove();
            appendMessage(responseText, 'assistant');
            speak(responseText);
        }, delay);
    }

    // Direct interface integration mapping voice/text queries to window.AuraStore functions
    function checkForStorefrontCommands(query) {
        if (!window.AuraStore) return null;
        
        const clean = query.toLowerCase().trim();
        
        // Command: Add product to cart (e.g. "add nova ring", "add pods to cart")
        if (clean.includes('add ') || clean.includes('buy ')) {
            // Find closest matching product name
            const matchingProduct = window.AuraStore.PRODUCTS.find(p => {
                const nameClean = p.name.toLowerCase();
                return clean.includes(nameClean) || nameClean.includes(clean.replace('add ', '').replace('buy ', '').replace('to cart', '').trim());
            });

            if (matchingProduct) {
                window.AuraStore.addToCart(matchingProduct.id);
                return `Done! I've added **${matchingProduct.name}** ($${matchingProduct.price.toFixed(2)}) to your shopping cart.`;
            }
        }

        // Command: Remove product from cart
        if (clean.includes('remove ') || clean.includes('delete ')) {
            const matchingProduct = window.AuraStore.PRODUCTS.find(p => {
                const nameClean = p.name.toLowerCase();
                return clean.includes(nameClean);
            });

            if (matchingProduct) {
                window.AuraStore.removeFromCart(matchingProduct.id);
                return `I've removed **${matchingProduct.name}** from your cart.`;
            }
        }

        // Command: Category Filtering
        if (clean.includes('filter ') || clean.includes('show ') || clean.includes('category ') || clean.includes('gear')) {
            if (clean.includes('wearable') || clean.includes('wear')) {
                window.AuraStore.filterCategory('smart-wearables');
                return "Catalog filtered to **Smart Wearables**.";
            }
            if (clean.includes('neural') || clean.includes('brain') || clean.includes('link')) {
                window.AuraStore.filterCategory('neural-gear');
                return "Catalog filtered to **Neural Gear**.";
            }
            if (clean.includes('audio') || clean.includes('earbud') || clean.includes('sound') || clean.includes('pods')) {
                window.AuraStore.filterCategory('audio-gear');
                return "Catalog filtered to **Audio Gear**.";
            }
            if (clean.includes('holo') || clean.includes('projector') || clean.includes('3d')) {
                window.AuraStore.filterCategory('holograms');
                return "Catalog filtered to **Holograms**.";
            }
            if (clean.includes('all') || clean.includes('reset') || clean.includes('clear filter')) {
                window.AuraStore.filterCategory('all');
                return "Catalog reset to show all items.";
            }
        }

        // Command: Searching
        if (clean.includes('search ') || clean.includes('find ')) {
            const searchTerm = clean.replace('search ', '').replace('search for ', '').replace('find ', '').trim();
            if (searchTerm.length > 0) {
                window.AuraStore.searchProducts(searchTerm);
                return `Searching store catalog for: **"${searchTerm}"**.`;
            }
        }

        // Command: Cart Drawer Actions
        if (clean.includes('open cart') || clean.includes('show cart') || clean.includes('view cart') || clean.includes('my cart')) {
            window.AuraStore.openCart();
            return "Opening your shopping cart drawer.";
        }
        if (clean.includes('close cart') || clean.includes('hide cart')) {
            window.AuraStore.closeCart();
            return "Closing shopping cart.";
        }
        if (clean.includes('clear cart') || clean.includes('empty cart')) {
            window.AuraStore.clearCart();
            return "Your shopping cart has been cleared.";
        }

        // Command: Checkout Trigger
        if (clean.includes('checkout') || clean.includes('pay') || clean.includes('go to checkout')) {
            if (window.AuraStore.state.cart.length === 0) {
                return "Your cart is empty! Add some devices before checking out.";
            }
            window.AuraStore.openCheckout();
            return "Opening secure bio-sig checkout portal.";
        }

        // Command: Scroll to recommendations / Suggest recommendations
        if (clean.includes('recommend') || clean.includes('what should i buy') || clean.includes('suggest')) {
            const el = document.getElementById('recommendations');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            
            // Check if cart has items to tailor recommendation dialogue
            if (window.AuraStore.state.cart.length > 0) {
                return "Based on the items currently in your cart, I've loaded matching accessories and gear below in the *Tailored For You* panel. Take a look!";
            } else {
                return "I've scrolled you to our recommendations. Try checking out the **Nova Ring** or **Zen Pods** to start your modular network!";
            }
        }

        // Command: Theme Toggle
        if (clean.includes('theme') || clean.includes('dark mode') || clean.includes('light mode') || clean.includes('toggle mode')) {
            const btn = document.getElementById('theme-toggle');
            if (btn) {
                btn.click();
                return "Toggling website visual design theme.";
            }
        }

        return null;
    }

    function findBestResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ');
        const tokens = cleanMsg.split(/\s+/).filter(t => t.length > 0);
        
        if (tokens.length === 0) {
            return "I am listening! What would you like to ask about Aura Tech?";
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
        
        return "I am Nova, your dedicated Aura Tech assistant. I can help you filter products, manage your cart, checkout, or answer return policy/shipping questions. Try using the quick links below!";
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

    function cancelSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Expose external callback hook for store events
    window.Nova = {
        onStoreEvent: (eventMsg) => {
            // Append store event message silently or speak it
            console.log("Nova received event:", eventMsg);
        }
    };
}
