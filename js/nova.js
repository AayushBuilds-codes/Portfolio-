/**
 * Nova - AI Personal Assistant Logic
 * Provides responses regarding Aayush Agarwal's biography, skills, projects, experience, and contact details.
 * Features Text-to-Speech (TTS) narration, Speech-to-Text (STT) recognition, and website control commands.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaWidget();
});

// Database of answers with matching keywords
const responseDatabase = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'hola', 'wassup', 'status', 'online'],
        responses: [
            "Hello! I am **Nova**, Aayush's personal AI assistant. How can I help you today? You can ask me about his ML projects, skills, education, or internship experience.",
            "Hi there! Nice to meet you. I'm **Nova**, here to answer questions about Aayush's background, skills, and projects. What would you like to know?",
            "Hey! Nova here. I'm Aayush's personal digital assistant. Feel free to ask me anything about his technical journey!"
        ]
    },
    biography: {
        keywords: ['who', 'about', 'aayush', 'agarwal', 'biography', 'bio', 'profile', 'background', 'student', 'developer', 'person', 'himself'],
        responses: [
            "Aayush Agarwal is a Computer Science student specializing in **Artificial Intelligence & Machine Learning** at GLA University, Mathura. He builds predictive models, analyzes complex datasets, and designs responsive developer interfaces. He is passionate about combination of robust data science pipelines and modern frontend designs."
        ]
    },
    skills: {
        keywords: ['skills', 'skill', 'toolkit', 'languages', 'programming', 'python', 'scikit', 'sklearn', 'pandas', 'numpy', 'libraries', 'frontend', 'html', 'css', 'javascript', 'js', 'coding', 'c', 'git', 'github', 'jupyter'],
        responses: [
            "Aayush's technical toolkit includes:<br><br>" +
            "• **AI & ML**: Python, Scikit-Learn, Pandas, NumPy, Feature Engineering, and Statistical Modeling.<br>" +
            "• **Software Engineering**: HTML5, CSS3 (Flexbox/Grid), ES6+ JavaScript, and C Programming.<br>" +
            "• **Workflows & Tools**: Git, GitHub, Jupyter Notebooks, and Data Visualization."
        ]
    },
    experience: {
        keywords: ['experience', 'internship', 'jyesta', 'corporation', 'intern', 'work', 'job', 'journey', 'milestones', 'role'],
        responses: [
            "Aayush completed a **Machine Learning Internship** at **Jyesta Corporation Limited** (Dec 2025 - Jan 2026). During this period, he developed and trained ML models using Python and Scikit-learn, performed data cleaning & feature engineering, and analyzed datasets to drive AI/ML research tasks."
        ]
    },
    projects: {
        keywords: ['projects', 'project', 'works', 'recent', 'calculator', 'weather', 'dashboard', 'pinnacle', 'showcase', 'built', 'created', 'made', 'commerce', 'aura tech', 'restaurant', 'saffron', 'darbar', 'event', 'organiser', 'vibe', 'craft', 'todo', 'tasks', 'task', 'list', 'news', 'globe', 'aggregator', 'keyfs', 'wealth', 'advisor', 'finance', 'financial', 'p1', 'depth3d', 'depth3d studio', 'depth3d-studio', '3d reconstruction', 'sales', 'sales dashboard', 'sales intelligence', 'telemetry'],
        responses: [
            "Here are Aayush's recent projects:<br><br>" +
            "1. **[Weather Dashboard](https://aayushbuilds-codes.github.io/Weather-Dashboard/)**: A dynamic, glassmorphic interface displaying real-time weather conditions and forecasts using global weather APIs.<br>" +
            "2. **[Interactive Web Calculator](https://aayushbuilds-codes.github.io/Calculator/)**: A sleek utility supporting core arithmetic calculations, responsive grid layouts, and keyboard integrations.<br>" +
            "3. **Pinnacle Portfolio Workspace**: The website you are currently browsing! Features advanced scroll triggers, glassmorphic layout elements, and direct terminal sending animations.<br>" +
            "4. **[Aura Tech E-commerce](https://aayushbuilds-codes.github.io/E-commerce-Website/)**: A high-end, glassmorphic e-commerce storefront with local storage cart databases and voice-controlled Nova assistant integration.<br>" +
            "5. **[Saffron Darbar Indian Dining](https://aayushbuilds-codes.github.io/Saffron-Darbar/)**: A premium Indian restaurant website with custom Veg/Non-Veg menu filters, special event tables, and a voice guided table reservation chatbot.<br>" +
            "6. **[VibeCraft Event Organiser](https://aayushbuilds-codes.github.io/VibeCraft/)**: A dynamic event planning and management dashboard with real-time landing page previews, custom SVG ticket pass generators, and integrated AI assistant coordination.<br>" +
            "7. **[Pinnacle Tasks](https://github.com/AayushBuilds-codes/Todo-List)**: A premium AI productivity dashboard featuring real-time natural language task parsing, Pomodoro focus mode, and weekly performance completion statistics.<br>" +
            "8. **[Pinnacle Globe News](https://aayushbuilds-codes.github.io/News-Website/)**: A premium news aggregator featuring local storage bookmark drawers, TTS article narrators, and voice/text Nova AI assistant integration.<br>" +
            "9. **[KEYFS Financial Portal](https://aayushbuilds-codes.github.io/Keyfs/)**: A premium wealth advisor portal featuring interactive financial calculators, simulated real-time index tickers, and client/partner dashboards.<br>" +
            "10. **[Depth3D Studio (P1)](https://aayushbuilds-codes.github.io/2D-to-3D-image-coverter-/)**: Local AI monocular depth estimation and 3D reconstruction studio converting 2D images to interactive 3D scenes directly in the browser.<br>" +
            "11. **[Nova Sales Intelligence Dashboard](https://aayushbuilds-codes.github.io/Sales-Dashboard/)**: Enterprise sales intelligence workspace featuring live Supabase database connections and Nova AI voice integration."
        ]
    },
    contact: {
        keywords: ['contact', 'email', 'connect', 'reach', 'social', 'github', 'linkedin', 'phone', 'mail', 'location', 'kanpur', 'india', 'address'],
        responses: [
            "You can reach and connect with Aayush here:<br><br>" +
            "• **Direct Email**: [aayushagarwaltech@gmail.com](mailto:aayushagarwaltech@gmail.com)<br>" +
            "• **GitHub Profile**: [github.com/AayushBuilds-codes](https://github.com/AayushBuilds-codes)<br>" +
            "• **LinkedIn**: [linkedin.com/in/aayush-agarwal-64a461284](https://www.linkedin.com/in/aayush-agarwal-64a461284/)<br>" +
            "• **Location**: Kanpur, India 208013"
        ]
    },
    education: {
        keywords: ['education', 'degree', 'university', 'gla', 'mathura', 'college', 'school', 'qualification', 'qualifications'],
        responses: [
            "Aayush is pursuing his **Bachelor of Technology in Computer Science (specializing in AI & ML)** at **GLA University, Mathura** (Expected graduation 2029). He has a solid foundation in Python programming, C programming, data analysis, and predictive model architectures."
        ]
    },
    resume: {
        keywords: ['resume', 'cv', 'resume pdf', 'cv pdf', 'credentials pdf'],
        responses: [
            "You can [Download Aayush's Resume here](Aayush%20Agarwal%20Resume.pdf) to view his complete experience, skills, and qualifications. You can also simply ask me to **'download resume'** or **'download cv'** and I will trigger the file download for you immediately!"
        ]
    },
    certifications: {
        keywords: ['certifications', 'certification', 'certificates', 'certificate', 'credentials', 'credential', 'hackerrank', 'rank', 'verified', 'problemsolving', 'problem solving', 'sql', 'javascript', 'python'],
        responses: [
            "Aayush has earned several verified **HackerRank Certifications**:<br><br>" +
            "• **SQL (Advanced)**: Advanced querying, analytical functions, query tuning, and database optimization.<br>" +
            "• **Problem Solving (Intermediate)**: Tested skills in algorithms, data structures (heaps, trees), and space complexity analysis.<br>" +
            "• **SQL (Intermediate & Basic)**: Multi-table joins, aggregates, and filtering query sets.<br>" +
            "• **JavaScript (Basic) & Python (Basic)**: Dynamic DOM triggers, scoping, loops, and Object-Oriented design.<br><br>" +
            "All badges are verified! You can view and click them directly in the **Certifications** section on this webpage to verify their official HackerRank credentials links."
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
    let isSpeechMuted = false;
    let currentUtterance = null;
    let hasWelcomed = false;

    // Initialize voice settings
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop launcher closing on clicks inside header
            isSpeechMuted = !isSpeechMuted;
            if (isSpeechMuted) {
                voiceBtn.classList.add('muted');
                cancelSpeech();
            } else {
                voiceBtn.classList.remove('muted');
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
        
        // Speak welcome greeting on first open (unlocks speech synthesis via click gesture)
        if (!hasWelcomed) {
            setTimeout(() => {
                speak("Hello! I am Nova, Aayush's personal AI assistant. Ask me anything about his skills, machine learning projects, internship experience, or how to contact him!");
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

        // 1. Check for interactive site control commands first
        let responseText = checkForWebsiteCommands(userQuery);
        
        // 2. Fall back to conversational response matching if no commands triggered
        if (!responseText) {
            responseText = findBestResponse(userQuery);
        }

        // Simulated thinking delay (800ms - 1500ms)
        const delay = 800 + Math.random() * 700;
        setTimeout(() => {
            // Remove typing bubble
            typingBubble.remove();
            appendMessage(responseText, 'assistant');
            
            // Narrate message aloud
            speak(responseText);
        }, delay);
    }

    function checkForWebsiteCommands(query) {
        const clean = query.toLowerCase().trim();
        
        // Command: Download Resume
        if ((clean.includes('download') && (clean.includes('resume') || clean.includes('cv'))) || (clean.includes('get') && (clean.includes('resume') || clean.includes('cv')))) {
            const link = document.createElement('a');
            link.href = 'Aayush%20Agarwal%20Resume.pdf';
            link.download = 'Aayush_Agarwal_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return "Certainly! I have initiated the download for Aayush Agarwal's Resume PDF.";
        }
        
        // Command: Sync GitHub
        if ((clean.includes('sync') && clean.includes('github')) || (clean.includes('load') && clean.includes('github')) || (clean.includes('refresh') && clean.includes('github')) || clean.includes('sync repo') || clean.includes('sync project')) {
            const githubFilterBtn = document.querySelector('.filter-btn[data-filter="github"]');
            const syncBtn = document.getElementById('github-sync-btn');
            
            // Scroll to the work section
            scrollToElement('work');
            
            // Switch filter tab to GitHub
            if (githubFilterBtn) {
                setTimeout(() => {
                    githubFilterBtn.click();
                }, 300);
            }
            
            // Trigger the sync button click
            if (syncBtn) {
                setTimeout(() => {
                    syncBtn.click();
                }, 600);
            }
            
            return "Certainly! Initiating live synchronization with your GitHub repositories. I've scrolled you to the project showcase and activated the Live GitHub Explorer.";
        }

        // Command: Toggle dark/light theme
        if (clean.includes('theme') || clean.includes('dark mode') || clean.includes('light mode') || clean.includes('toggle mode')) {
            const themeBtn = document.querySelector('.theme-toggle-btn');
            if (themeBtn) {
                themeBtn.click();
                return "Sure, toggling the website theme display mode!";
            }
        }
        
        // Command: Smooth scroll viewport navigation
        if (clean.includes('scroll') || clean.includes('go to') || clean.includes('navigate to') || clean.includes('show section') || clean.includes('show about') || clean.includes('show skill') || clean.includes('show contact') || clean.includes('show work') || clean.includes('show journey') || clean.includes('show credentials') || clean.includes('show certifications') || clean.includes('show achievements')) {
            if (clean.includes('contact')) {
                scrollToElement('contact');
                return "Scrolling to the Connect with Me section.";
            }
            if (clean.includes('about') || clean.includes('biography') || clean.includes('bio')) {
                scrollToElement('about');
                return "Navigating to the Biography and About Me section.";
            }
            if (clean.includes('skills') || clean.includes('skill') || clean.includes('toolkit')) {
                scrollToElement('skills');
                return "Moving down to the Skills and Toolkit category.";
            }
            if (clean.includes('certifications') || clean.includes('certificate') || clean.includes('credentials') || clean.includes('achievements') || clean.includes('hackerrank')) {
                scrollToElement('certifications');
                return "Scrolling to the Verified Certifications and Achievements section.";
            }
            if (clean.includes('journey') || clean.includes('experience') || clean.includes('timeline')) {
                scrollToElement('journey');
                return "Scrolling to the Journey Timeline.";
            }
            if (clean.includes('work') || clean.includes('project') || clean.includes('recent')) {
                scrollToElement('work');
                return "Opening Aayush's Recent Works projects filter.";
            }
            if (clean.includes('home') || clean.includes('hero') || clean.includes('top')) {
                scrollToElement('home');
                return "Scrolling back to the top of the homepage.";
            }
        }
        
        // Command: Launch Project Specs Modals
        if (clean.includes('open') || clean.includes('show details') || clean.includes('show project') || clean.includes('view project') || clean.includes('view spec') || clean.includes('open modal')) {
            if (clean.includes('weather') || clean.includes('forecast')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('weather-dashboard');
                    return "Opening the specs sheet for the Weather Dashboard.";
                }
            }
            if (clean.includes('calculator') || clean.includes('math')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('calculator');
                    return "Opening the detail specs sheet for the Interactive Web Calculator.";
                }
            }
            if (clean.includes('portfolio') || clean.includes('pinnacle')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('pinnacle-portfolio');
                    return "Opening the specs layout for the Pinnacle Portfolio Workspace.";
                }
            }
            if (clean.includes('commerce') || clean.includes('aura') || clean.includes('shop') || clean.includes('store')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('aura-tech');
                    return "Opening the specs sheet for Aura Tech E-commerce & Nova AI.";
                }
            }
            if (clean.includes('restaurant') || clean.includes('saffron') || clean.includes('darbar') || clean.includes('dining') || clean.includes('food')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('saffron-darbar');
                    return "Opening the specs sheet for Saffron Darbar Indian Dining & Nova AI.";
                }
            }
            if (clean.includes('event') || clean.includes('organiser') || clean.includes('vibe') || clean.includes('craft')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('vibe-craft');
                    return "Opening the specs sheet for VibeCraft Event Organiser & Nova AI.";
                }
            }
            if (clean.includes('todo') || clean.includes('task') || clean.includes('tasks') || clean.includes('list')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('pinnacle-tasks');
                    return "Opening the specs sheet for Pinnacle Tasks & Nova AI.";
                }
            }
            if (clean.includes('news') || clean.includes('globe') || clean.includes('aggregator')) {
                if (typeof openProjectModal === 'function') {
                    openProjectModal('pinnacle-globe');
                    return "Opening the specs sheet for Pinnacle Globe News & Nova AI.";
                }
            }
        }
        
        // Command: Close active overlays / project modals
        if (clean.includes('close') && (clean.includes('modal') || clean.includes('popup') || clean.includes('project') || clean.includes('details'))) {
            if (typeof closeModal === 'function') {
                closeModal();
                return "Closing the details modal window.";
            }
        }
        
        return null;
    }

    function scrollToElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function findBestResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ');
        const tokens = cleanMsg.split(/\s+/).filter(t => t.length > 0);
        
        if (tokens.length === 0) {
            return "I am listening! What would you like to ask about Aayush?";
        }

        // 1. Direct Targeted Contact Detail Queries
        if (tokens.some(t => ['email', 'mail', 'gmail', 'write'].includes(t))) {
            return "You can email Aayush directly at **[aayushagarwaltech@gmail.com](mailto:aayushagarwaltech@gmail.com)**. He usually responds within 24 hours.";
        }
        if (tokens.some(t => ['github', 'git', 'repo', 'repos', 'codebase'].includes(t)) && !tokens.some(t => ['sync', 'load', 'refresh'].includes(t))) {
            return "You can check out Aayush's code and repositories on GitHub at **[github.com/AayushBuilds-codes](https://github.com/AayushBuilds-codes)**.";
        }
        if (tokens.some(t => ['linkedin', 'profile', 'connect', 'social'].includes(t)) && !tokens.some(t => ['git', 'github'].includes(t))) {
            return "You can connect with Aayush professionally on LinkedIn at **[linkedin.com/in/aayush-agarwal-64a461284](https://www.linkedin.com/in/aayush-agarwal-64a461284/)**.";
        }
        if (tokens.some(t => ['location', 'live', 'address', 'city', 'kanpur', 'india'].includes(t))) {
            return "Aayush is located in **Kanpur, India 208013**.";
        }
        if (tokens.some(t => ['phone', 'call', 'number', 'mobile', 'whatsapp'].includes(t))) {
            return "Aayush prefers initial communications via email at **[aayushagarwaltech@gmail.com](mailto:aayushagarwaltech@gmail.com)** or professional messaging on **[LinkedIn](https://www.linkedin.com/in/aayush-agarwal-64a461284/)**.";
        }

        // 2. Direct Targeted Project Queries
        if (tokens.some(t => ['weather', 'forecast'].includes(t))) {
            return "Aayush's **[Weather Dashboard](https://aayushbuilds-codes.github.io/Weather-Dashboard/)** is a modern, responsive interface showing real-time atmospheric conditions and forecasts using global weather APIs. Features glassmorphic cards and dynamic background transitions. Explore the source on **[GitHub](https://github.com/AayushBuilds-codes/Weather-Dashboard)**.";
        }
        if (tokens.some(t => ['calculator', 'math'].includes(t))) {
            return "The **[Interactive Web Calculator](https://aayushbuilds-codes.github.io/Calculator/)** is a beautifully styled, fully functional web utility supporting core arithmetic calculations, keyboard inputs, division error handling, and clean responsive CSS grid layouts.";
        }
        if (tokens.some(t => ['portfolio', 'pinnacle'].includes(t)) && tokens.some(t => ['website', 'work', 'workspace', 'this'].includes(t))) {
            return "The **Pinnacle Portfolio Workspace** is the current website you are browsing! Features advanced scroll triggers, glassmorphic layout components, custom dark/light theme toggle, and an interactive terminal simulator for contact transmissions.";
        }
        if (tokens.some(t => ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'aura'].includes(t))) {
            return "The **[Aura Tech E-commerce](https://aayushbuilds-codes.github.io/E-commerce-Website/)** is a futuristic storefront featuring local storage cart databases and a slide-out voice-controlled Nova AI assistant supporting speech controls (STT/TTS).";
        }
        if (tokens.some(t => ['restaurant', 'dining', 'saffron', 'darbar', 'food'].includes(t))) {
            return "The **[Saffron Darbar](https://aayushbuilds-codes.github.io/Saffron-Darbar/)** is a premium Indian dining web application with Veg/Non-Veg indicators, Sufiyana events calendars, and a voice guided table reservation chatbot.";
        }
        if (tokens.some(t => ['event', 'organiser', 'vibecraft', 'vibe', 'craft'].includes(t))) {
            return "The **[VibeCraft Event Organiser](https://aayushbuilds-codes.github.io/VibeCraft/)** is a dynamic planning dashboard. It includes real-time customizer previews, countable progress gauges, and a printable custom SVG ticket pass generator.";
        }
        if (tokens.some(t => ['todo', 'todo-list', 'tasks', 'task', 'pomodoro', 'productivity'].includes(t))) {
            return "The **[Pinnacle Tasks](https://github.com/AayushBuilds-codes/Todo-List)** is a premium AI productivity dashboard featuring real-time natural language task parsing (e.g. tomorrow @2pm !high), an integrated Pomodoro Focus Timer with ambient sound generator, and performance gauge trackers.";
        }
        if (tokens.some(t => ['news', 'globe', 'aggregator', 'reader'].includes(t))) {
            return "The **[Pinnacle Globe News](https://aayushbuilds-codes.github.io/News-Website/)** is a news aggregator platform. It features local storage bookmarking drawers, typography scale adjustment, an audio reading narrator, and an integrated Nova AI news summarizer.";
        }
        if (tokens.some(t => ['keyfs', 'wealth', 'advisory', 'finance', 'financial', 'sip', 'lumpsum'].includes(t))) {
            return "The **[KEYFS Financial Portal](https://aayushbuilds-codes.github.io/Keyfs/)** is a wealth advisory and mutual fund distribution platform. Features interactive SIP/Lumpsum calculators, real-time stock index tickers, and client/partner console portals.";
        }
        if (tokens.some(t => ['depth3d', '3d', 'onnx', 'monocular', 'reconstruction', 'transformers', 'three.js', 'threejs', 'p1'].includes(t))) {
            return "Aayush's **[Depth3D Studio (P1)](https://aayushbuilds-codes.github.io/2D-to-3D-image-coverter-/)** is a monocular depth estimation reconstruction studio that runs lightweight ONNX models (like Depth Anything V2) directly in-browser using Hugging Face's Transformers.js, generating interactive 3D meshes, wireframes, and point clouds in Three.js.";
        }
        if (tokens.some(t => ['sales', 'sales-dashboard', 'telemetry', 'supabase', 'apexcharts'].includes(t))) {
            return "The **[Nova Sales Intelligence Dashboard](https://aayushbuilds-codes.github.io/Sales-Dashboard/)** is an enterprise-grade sales telemetry dashboard featuring real-time database connections using Supabase, dynamic financial metrics charts powered by ApexCharts, and integrated voice recognition controls.";
        }

        // 3. Direct Targeted Biography / Journey / Skills / Education / Resume
        if (tokens.some(t => ['education', 'degree', 'university', 'gla', 'mathura', 'college', 'school'].includes(t))) {
            return responseDatabase.education.responses[0];
        }
        if (tokens.some(t => ['internship', 'experience', 'jyesta', 'intern', 'work', 'job'].includes(t))) {
            return responseDatabase.experience.responses[0];
        }
        if (tokens.some(t => ['certifications', 'certification', 'certificates', 'hackerrank', 'verified'].includes(t))) {
            return responseDatabase.certifications.responses[0];
        }
        if (tokens.some(t => ['resume', 'cv', 'pdf'].includes(t))) {
            return responseDatabase.resume.responses[0];
        }

        // 4. Keyword Score Matching Fallback
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
            const categoryResponses = responseDatabase[bestCategory].responses;
            const randomIndex = Math.floor(Math.random() * categoryResponses.length);
            return categoryResponses[randomIndex];
        }
        
        // 5. Intelligent Dynamic Fallback
        if (tokens.some(t => ['how', 'help', 'what', 'do', 'features', 'capabilities', 'assistant', 'nova'].includes(t))) {
            return "I am Nova, Aayush's personal assistant! I can tell you about his Biography, ML Skills, Projects (like the Depth3D Studio, Sales Dashboard, or Aura Tech E-commerce), Internship Experience, or Certification details. I can also control this webpage! Try saying: 'show skills', 'scroll to work', 'open weather project', 'toggle dark theme', or 'download resume'.";
        }

        return "I'm not quite sure about that specific query. However, I am trained to answer questions about Aayush's ML biography, skills, projects (such as the monocular 3D studio, e-commerce site, and sales dashboard), credentials, or his direct contact details. Feel free to use one of the quick suggestion chips below!";
    }

    function parseSimpleMarkdown(text) {
        // Convert [text](url) to anchor tags
        let parsed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // Convert **text** to bold tags
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return parsed;
    }

    /* Web Speech Synthesis */
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
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;

            // Load speech voices
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
}
