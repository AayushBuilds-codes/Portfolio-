/**
 * Nova AI - Specialized Mathematical Assistant Logic
 * Provides helpful mathematical explanations and handles direct calculator automation commands.
 * Supports voice recognition (Speech-to-Text) and audio responses (Text-to-Speech).
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaCalculatorAssistant();
});

// Math/Calculator-focused keyword-response database
const mathDatabase = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'who', 'nova', 'assistant'],
        responses: [
            "Hello! I am **Nova**, your dedicated AI math assistant. You can ask me to solve calculations (e.g., 'calculate 25 * 40'), explain math concepts (e.g., 'what is calculus?'), or toggle display drawers!",
            "Hi! Nova here. I'm ready to help you with mathematics and calculations. What equation or math topic are we exploring today?",
            "Greetings! I'm Nova, your AI assistant. Type a math question, or speak to me via the microphone to command the calculator!"
        ]
    },
    constants: {
        keywords: ['pi', 'euler', 'constant', 'golden ratio', 'speed of light', 'infinity', 'constants'],
        responses: [
            "Here are some vital mathematical constants:<br><br>" +
            "• **Pi (π)**: ≈ `3.14159265` - Ratio of circle's circumference to diameter.<br>" +
            "• **Euler's Number (e)**: ≈ `2.71828182` - Base of natural logarithms.<br>" +
            "• **Golden Ratio (φ)**: ≈ `1.61803398` - Proportion providing structural harmony.<br><br>" +
            "You can type constants directly on the calculator using the scientific panel!"
        ]
    },
    calculus: {
        keywords: ['calculus', 'derivative', 'integral', 'limits', 'differentiation', 'integration'],
        responses: [
            "**Calculus** is the mathematical study of continuous change. It has two major branches:<br><br>" +
            "1. **Differential Calculus**: Studies rates of change (slopes of curves, derivatives).<br>" +
            "2. **Integral Calculus**: Studies accumulation of quantities (areas under curves, integration).<br><br>" +
            "Both branches are connected by the Fundamental Theorem of Calculus."
        ]
    },
    trigonometry: {
        keywords: ['trig', 'trigonometry', 'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'radians', 'degrees'],
        responses: [
            "**Trigonometry** studies relationships between side lengths and angles of triangles.<br><br>" +
            "• **Sin(x)**: Opposite side over Hypotenuse.<br>" +
            "• **Cos(x)**: Adjacent side over Hypotenuse.<br>" +
            "• **Tan(x)**: Opposite side over Adjacent side.<br><br>" +
            "Make sure to check the **DEG/RAD** toggle. DEG evaluates angles in degrees, while RAD evaluates them in radians."
        ]
    },
    algebra: {
        keywords: ['algebra', 'equation', 'matrix', 'quadratic', 'vector', 'linear'],
        responses: [
            "**Algebra** is the study of mathematical symbols and the rules for manipulating them. It generalizes arithmetic by using variables (like $x$ or $y$) to represent numbers in equations, allowing us to solve for unknowns."
        ]
    },
    logarithms: {
        keywords: ['log', 'logarithm', 'ln', 'exponential', 'natural log'],
        responses: [
            "A **logarithm** is the inverse operation to exponentiation. It asks: *To what power must we raise a base to get this number?*<br><br>" +
            "• **log(x)**: Base-10 logarithm.<br>" +
            "• **ln(x)**: Natural logarithm (base $e$ ≈ `2.718`)."
        ]
    },
    help: {
        keywords: ['help', 'commands', 'how to', 'use', 'features', 'abilities'],
        responses: [
            "Here is how you can command me:<br><br>" +
            "• **Direct calculations**: Say *'calculate 150 * 5'* or *'solve sqrt(144)'* to run the math.<br>" +
            "• **Calculator actions**: Say *'clear calculator'*, *'delete last'*, *'toggle scientific'*, or *'show history'*.<br>" +
            "• **Definitions**: Ask *'what is a matrix?'* or *'explain golden ratio'*."
        ]
    },
    jokes: {
        keywords: ['joke', 'funny', 'laugh', 'math joke'],
        responses: [
            "Why did the student get upset when their calculator stopped working? They couldn't *count* on it!",
            "Parallel lines have so much in common... It’s a shame they’ll never meet!",
            "There are three kinds of people in this world: Those who can count, and those who can't.",
            "Why was the math book sad? Because it had too many problems!"
        ]
    }
};

function initNovaCalculatorAssistant() {
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

    let isSpeechMuted = false;
    let currentUtterance = null;
    let hasWelcomed = false;

    // TTS voice toggler
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isSpeechMuted = !isSpeechMuted;
            if (isSpeechMuted) {
                voiceBtn.classList.add('muted');
                cancelSpeech();
            } else {
                voiceBtn.classList.remove('muted');
                speak("Voice feedback active.");
            }
        });
    }

    // STT speech recognition
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

        recognition.onerror = (e) => {
            console.error("Speech Recognition Error", e);
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
    } else if (micBtn) {
        micBtn.style.display = 'none';
    }

    function stopRecordingState() {
        isRecording = false;
        if (micBtn) micBtn.classList.remove('recording');
        inputField.placeholder = "Ask Nova to compute or explain...";
    }

    // Open/Close chat window
    launcher.addEventListener('click', () => {
        chatWindow.classList.add('open');
        launcher.style.transform = 'scale(0) translateY(20px)';
        launcher.style.opacity = '0';
        launcher.style.pointerEvents = 'none';
        
        setTimeout(() => {
            inputField.focus();
        }, 300);

        if (!hasWelcomed) {
            setTimeout(() => {
                speak("Hello! I am Nova, your AI math assistant. Let me know what calculations we should solve today!");
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

    // Submit text messages
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = inputField.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        inputField.value = '';

        respondAsNova(text);
    });

    // Handle suggestion chips clicks
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

        const content = document.createElement('div');
        content.className = 'message-content';
        if (sender === 'assistant') {
            content.innerHTML = parseSimpleMarkdown(text);
        } else {
            content.textContent = text;
        }

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(content);
        bubble.appendChild(time);
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function respondAsNova(userQuery) {
        const typing = document.createElement('div');
        typing.className = 'nova-message-bubble assistant typing';
        typing.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typing);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 1. Process Calculator Automation command
        let responseText = processCalculatorCommands(userQuery);

        // 2. Process conversation query if no command was identified
        if (!responseText) {
            responseText = findBestResponse(userQuery);
        }

        const delay = 700 + Math.random() * 600;
        setTimeout(() => {
            typing.remove();
            appendMessage(responseText, 'assistant');
            speak(responseText);
        }, delay);
    }

    // Automates direct calculator UI elements from assistant text commands
    function processCalculatorCommands(query) {
        const clean = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        
        // Command: Clear Calculator
        if (clean.includes('clear calculator') || clean.includes('reset calculator') || clean.startsWith('clear screen') || clean === 'clear') {
            const btn = document.querySelector('.calc-btn[data-action="clear"]');
            if (btn) {
                btn.click();
                return "I've cleared the calculator display.";
            }
        }

        // Command: Delete / Backspace
        if (clean.includes('delete last') || clean.includes('backspace') || clean === 'delete') {
            const btn = document.querySelector('.calc-btn[data-action="delete"]');
            if (btn) {
                btn.click();
                return "Deleted the last character.";
            }
        }

        // Command: Toggle Drawers
        if (clean.includes('scientific panel') || clean.includes('toggle scientific') || clean.includes('scientific drawer')) {
            const btn = document.getElementById('btn-sci-toggle');
            if (btn) {
                btn.click();
                const isOpen = document.getElementById('sci-drawer').classList.contains('open');
                return `I've ${isOpen ? 'opened' : 'closed'} the scientific operators drawer.`;
            }
        }

        if (clean.includes('show history') || clean.includes('open history') || clean.includes('history panel')) {
            const panel = document.getElementById('history-panel');
            if (panel) {
                panel.classList.add('open');
                return "Opened your calculation history panel.";
            }
        }

        if (clean.includes('close history') || clean.includes('hide history')) {
            const panel = document.getElementById('history-panel');
            if (panel) {
                panel.classList.remove('open');
                return "Closed the calculation history panel.";
            }
        }

        // Command: Evaluate Expression
        // Matches "calculate 12 * 5", "solve 50 / 2", "compute sin(30)", etc.
        const mathCommandPattern = /^(calculate|solve|evaluate|compute|type)\s+(.+)$/i;
        const match = query.match(mathCommandPattern);
        
        if (match) {
            const cmdType = match[1].toLowerCase();
            let rawMath = match[2];

            // Convert spoken mathematical words to operators
            rawMath = rawMath.toLowerCase()
                .replace(/plus/g, '+')
                .replace(/minus/g, '-')
                .replace(/times/g, '×')
                .replace(/multiplied by/g, '×')
                .replace(/divided by/g, '÷')
                .replace(/over/g, '÷')
                .replace(/percent/g, '%')
                .replace(/square root of/g, 'sqrt(')
                .replace(/open parenthesis/g, '(')
                .replace(/close parenthesis/g, ')')
                .replace(/to the power of/g, '^')
                .replace(/power/g, '^')
                .replace(/\s+/g, ''); // strip spaces

            // If we opened a sqrt(, make sure brackets match
            if (rawMath.includes('sqrt(') && !rawMath.endsWith(')')) {
                rawMath += ')';
            }

            // Find main calculator instance
            const calc = window.calculatorInstance;
            if (calc) {
                // If it is just typing, load into display
                if (cmdType === 'type') {
                    calc.formula += rawMath;
                    calc.updateDisplay();
                    return `I've typed \`${rawMath}\` into the calculator display.`;
                }

                // Inject and solve
                calc.formula = rawMath;
                calc.updateDisplay();
                
                // Trigger visual click animation on '=' button
                const equalBtn = document.querySelector('.calc-btn[data-action="calculate"]');
                if (equalBtn) {
                    equalBtn.style.transform = 'scale(0.9)';
                    setTimeout(() => equalBtn.style.transform = '', 100);
                }

                calc.evaluateFormula();
                const result = calc.outputDisplay.textContent;

                if (result === 'Error') {
                    return `I attempted to solve \`${rawMath}\` but the calculator returned an Error. Please check the equation.`;
                }
                return `Solving \`${rawMath}\`. The result is **${result}**.`;
            }
        }

        return null;
    }

    function findBestResponse(query) {
        const clean = query.toLowerCase().replace(/[^\w\s]/g, ' ');
        const tokens = clean.split(/\s+/).filter(t => t.length > 0);

        if (tokens.length === 0) {
            return "I'm listening! What math problem are we solving?";
        }

        let bestCategory = null;
        let highestScore = 0;

        for (const [category, data] of Object.entries(mathDatabase)) {
            let score = 0;
            tokens.forEach(token => {
                // Exact match
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

        if (highestScore >= 1 && bestCategory) {
            const list = mathDatabase[bestCategory].responses;
            return list[Math.floor(Math.random() * list.length)];
        }

        return "I'm not sure how to solve that specific query. Try asking me to explain a math concept like *'what is calculus'* or command me by saying *'calculate 5! * 10'*!";
    }

    function parseSimpleMarkdown(text) {
        // [text](url) -> anchor
        let parsed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // **text** -> bold
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // `code` -> monospace code tags
        parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
        return parsed;
    }

    function speak(text) {
        if (isSpeechMuted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            let clean = text.replace(/<[^>]*>/g, ''); // strip html
            clean = clean.replace(/`([^`]+)`/g, '$1'); // strip backticks
            clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1'); // strip bold
            clean = clean.replace(/•/g, '-');

            currentUtterance = new SpeechSynthesisUtterance(clean);
            currentUtterance.rate = 1.05;
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
}
