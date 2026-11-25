/**
 * Nova - AI Personal Assistant & Dynamic Training Engine
 * Features:
 * - Dynamic in-browser training with LocalStorage persistence
 * - Real-time DOM knowledge ingestion from the live portfolio page
 * - TF-IDF & Token N-gram semantic matching with confidence scoring
 * - Interactive Nova Training Studio (Form, Knowledge Graph, Test Bench, JSON Export/Import)
 * - In-chat active learning ("Teach Nova" feedback prompt for unknown topics)
 * - Voice synthesis (TTS), voice input (STT), and webpage automation commands
 */

document.addEventListener('DOMContentLoaded', () => {
    initNovaWidget();
    initNovaTrainingStudio();
});

/* ==========================================================================
   PRE-LOADED CURATED KNOWLEDGE PACKS
   ========================================================================== */
const DEFAULT_TRAINING_PACKS = {
    aiml: [
        {
            id: 'pack_aiml_0',
            intent: "Tell me about Aayush's Data & Generative AI internship at SkillCred",
            response: "From **July 2026 to September 2026**, Aayush completed a remote 2-month **Data & Generative AI Micro-Internship** with **SkillCred** in collaboration with **GLA University**. He engineered modern **Generative AI workflows and prompt engineering pipelines**, built real-world **Python and SQL** data handling pipelines, and bridged academic ML foundations with industry engineering standards.",
            category: "experience",
            tags: ["skillcred", "skill cred", "genai", "generative ai", "internship", "prompt engineering", "remote"]
        },
        {
            id: 'pack_aiml_1',
            intent: "What machine learning models did Aayush build during his internship at Jyesta Corporation?",
            response: "During his internship at **Jyesta Corporation Limited** (Dec 2025 - Jan 2026), Aayush engineered predictive models using **Python and Scikit-learn**. He performed end-to-end data preprocessing, outlier removal, and custom feature engineering to boost classification accuracy and collaborated on applied AI research workflows.",
            category: "experience",
            tags: ["jyesta", "internship", "scikit-learn", "preprocessing", "feature engineering", "models"]
        },
        {
            id: 'pack_aiml_2',
            intent: "What is Aayush's approach to feature engineering and data preprocessing?",
            response: "Aayush follows rigorous data science standards: handling missing values via imputation, standardizing numerical features using **StandardScaler/MinMaxScaler**, encoding categoricals, performing collinearity checks, and utilizing **Pandas and NumPy** for vectorized dataset transformations.",
            category: "ai-ml",
            tags: ["feature engineering", "preprocessing", "pandas", "numpy", "scaling", "imputation"]
        },
        {
            id: 'pack_aiml_3',
            intent: "How does Depth3D Studio run in-browser AI without a backend server?",
            response: "Aayush's **Depth3D Studio** runs lightweight monocular depth estimation ONNX models (such as Depth Anything V2) client-side using **Hugging Face Transformers.js and WebAssembly/WebGL**. It extracts 2D luminance/depth maps in-browser and reconstructs real-time 3D meshes and point clouds using **Three.js**.",
            category: "projects",
            tags: ["depth3d", "3d", "onnx", "transformers.js", "three.js", "client-side ai", "webgl"]
        },
        {
            id: 'pack_aiml_4',
            intent: "What are Aayush's favorite machine learning libraries and tools?",
            response: "Aayush primarily programs in **Python** using **Scikit-Learn, Pandas, NumPy, and Matplotlib/Seaborn**. For frontend deployment and interactive dashboards, he pairs Python models with modern HTML5/CSS3/ES6+ JavaScript, ApexCharts, and Supabase.",
            category: "ai-ml",
            tags: ["libraries", "python", "scikit-learn", "pandas", "numpy", "matplotlib", "tools"]
        }
    ],
    interview: [
        {
            id: 'pack_int_1',
            intent: "Is Aayush currently available for internship or junior developer roles?",
            response: "Yes! Aayush is actively **available for AI/ML Developer internships, Junior Data Science positions, and Software Engineering opportunities**. He is open to remote, hybrid, or on-site arrangements.",
            category: "interview",
            tags: ["available", "hiring", "hire", "internship", "job", "remote", "opportunity"]
        },
        {
            id: 'pack_int_2',
            intent: "What are Aayush's academic qualifications and graduation timeline?",
            response: "Aayush is pursuing his **B.Tech in Computer Science with specialization in AI & ML** at **GLA University, Mathura**, with an expected graduation in **2029**. He holds top HackerRank certifications in SQL (Advanced) and Problem Solving.",
            category: "education",
            tags: ["gla", "university", "mathura", "btech", "degree", "graduation", "2029"]
        },
        {
            id: 'pack_int_3',
            intent: "What makes Aayush stand out as a candidate?",
            response: "Aayush bridges the gap between **analytical AI research** and **polished software design**. He does not just build models in isolated notebooks; he deploys them into interactive, glassmorphic interfaces with real-time telemetry, local storage databases, and voice assistants.",
            category: "interview",
            tags: ["strengths", "standout", "why hire", "candidate", "qualities", "unique"]
        }
    ]
};

/* ==========================================================================
   PERSISTENT KNOWLEDGE STORE & DOM SCRAPER
   ========================================================================== */
class NovaKnowledgeStore {
    constructor() {
        this.storageKey = 'nova_dynamic_knowledge_v2';
        this.customItems = this.loadCustomItems();
        this.domItems = [];
        
        // Seed default training packs if newly initialized
        if (this.customItems.length === 0) {
            this.customItems = [...DEFAULT_TRAINING_PACKS.aiml, ...DEFAULT_TRAINING_PACKS.interview];
            this.saveCustomItems();
        }

        // Auto-scrape page DOM for up-to-date portfolio context
        this.ingestDOMKnowledge();
    }

    loadCustomItems() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn("Failed to load Nova custom knowledge:", e);
            return [];
        }
    }

    saveCustomItems() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customItems));
        } catch (e) {
            console.error("Failed to save Nova custom knowledge:", e);
        }
    }

    addCustomItem(intent, response, category = 'general', tags = []) {
        const newItem = {
            id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            intent: intent.trim(),
            response: response.trim(),
            category: category,
            tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
            timestamp: new Date().toISOString()
        };
        this.customItems.unshift(newItem);
        this.saveCustomItems();
        return newItem;
    }

    deleteCustomItem(id) {
        this.customItems = this.customItems.filter(item => item.id !== id);
        this.saveCustomItems();
    }

    resetCustomItems() {
        this.customItems = [];
        this.saveCustomItems();
    }

    loadPack(packKey) {
        if (!DEFAULT_TRAINING_PACKS[packKey]) return 0;
        const pack = DEFAULT_TRAINING_PACKS[packKey];
        let addedCount = 0;
        pack.forEach(item => {
            if (!this.customItems.some(c => c.intent.toLowerCase() === item.intent.toLowerCase())) {
                this.customItems.push({ ...item, id: 'pack_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5) });
                addedCount++;
            }
        });
        this.saveCustomItems();
        return addedCount;
    }

    exportJSON() {
        return JSON.stringify(this.customItems, null, 2);
    }

    importJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) throw new Error("Invalid format: expected JSON array");
            
            let count = 0;
            parsed.forEach(item => {
                if (item.intent && item.response) {
                    this.customItems.push({
                        id: item.id || 'imp_' + Date.now() + '_' + count,
                        intent: item.intent,
                        response: item.response,
                        category: item.category || 'general',
                        tags: item.tags || [],
                        timestamp: item.timestamp || new Date().toISOString()
                    });
                    count++;
                }
            });
            this.saveCustomItems();
            return count;
        } catch (err) {
            console.error("Import error:", err);
            throw err;
        }
    }

    // Real-time DOM Scraper: Ingests all project cards, timeline, skills, and credentials dynamically
    ingestDOMKnowledge() {
        this.domItems = [];

        // 1. Projects Scraped from DOM or global window.projects array
        if (typeof window.projects !== 'undefined' && Array.isArray(window.projects)) {
            window.projects.forEach(p => {
                const tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
                this.domItems.push({
                    id: 'dom_proj_' + (p.id || p.title),
                    intent: `Tell me about the ${p.title} project`,
                    response: `**[${p.title}](${p.liveDemo || p.githubUrl || '#'})**: ${p.description}<br><br>• **Tech Stack**: ${tags}<br>• **Source Code**: [GitHub Repository](${p.githubUrl || '#'})<br>• **Live Demo**: [Launch Project Demo](${p.liveDemo || '#'})`,
                    category: 'projects',
                    tags: ['project', p.title.toLowerCase(), ...(p.tags || []).map(t => t.toLowerCase())]
                });
            });
        }

        // 2. Timeline Experience Items
        document.querySelectorAll('.timeline-item').forEach((item, idx) => {
            const title = item.querySelector('.timeline-title')?.textContent?.trim() || '';
            const company = item.querySelector('.timeline-company')?.textContent?.trim() || '';
            const date = item.querySelector('.timeline-date')?.textContent?.trim() || '';
            const desc = item.querySelector('.timeline-desc')?.textContent?.trim() || '';
            if (title) {
                this.domItems.push({
                    id: 'dom_time_' + idx,
                    intent: `Tell me about Aayush's experience as ${title} at ${company}`,
                    response: `**${title}** at **${company}** (${date}):<br>${desc}`,
                    category: 'experience',
                    tags: ['experience', 'internship', title.toLowerCase(), company.toLowerCase(), 'timeline']
                });
            }
        });

        // 3. Skills Items
        const skills = [];
        document.querySelectorAll('.skill-item').forEach(item => {
            const name = item.querySelector('.skill-name')?.textContent?.trim();
            const pct = item.querySelector('.skill-pct')?.textContent?.trim();
            if (name) skills.push(`${name} (${pct || 'Proficient'})`);
        });
        if (skills.length > 0) {
            this.domItems.push({
                id: 'dom_skills_all',
                intent: "What are all of Aayush's technical competencies and skills?",
                response: `Here is Aayush's verified competencies list from his portfolio:<br><br>• ${skills.join('<br>• ')}`,
                category: 'skills',
                tags: ['skills', 'stack', 'technologies', 'proficiencies', 'competencies']
            });
        }

        // 4. Certifications
        document.querySelectorAll('.credential-card').forEach((card, idx) => {
            const title = card.querySelector('.cred-title')?.textContent?.trim() || '';
            const desc = card.querySelector('.cred-desc')?.textContent?.trim() || '';
            const link = card.getAttribute('href') || '#';
            if (title) {
                this.domItems.push({
                    id: 'dom_cred_' + idx,
                    intent: `Tell me about the ${title} certification`,
                    response: `**[${title}](${link})**: ${desc}<br>You can verify this directly via [HackerRank Credentials](${link}).`,
                    category: 'certifications',
                    tags: ['certification', 'certificate', 'credential', 'hackerrank', title.toLowerCase()]
                });
            }
        });
    }

    getAllKnowledgeNodes() {
        return [...this.customItems, ...this.domItems];
    }
}

// Global Knowledge Store Instance
const novaStore = new NovaKnowledgeStore();

/* ==========================================================================
   SEMANTIC MATCHING & CONFIDENCE EVALUATION ENGINE (TF-IDF + TOKENS)
   ========================================================================== */
class NovaMatcherEngine {
    constructor(store) {
        this.store = store;
        this.stopwords = new Set([
            'a', 'about', 'an', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in',
            'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when',
            'where', 'who', 'will', 'with', 'do', 'does', 'did', 'can', 'could', 'tell', 'me'
        ]);
    }

    tokenize(text) {
        return (text || '')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1 && !this.stopwords.has(t));
    }

    evaluate(query) {
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) {
            return {
                response: "I'm listening! You can ask me anything about Aayush's ML models, background, internship, or train me with new facts!",
                confidence: 1.0,
                source: 'System Greeting',
                matchedItem: null
            };
        }

        const nodes = this.store.getAllKnowledgeNodes();
        let bestMatch = null;
        let highestScore = 0;

        nodes.forEach(node => {
            const intentTokens = this.tokenize(node.intent);
            const tagTokens = Array.isArray(node.tags) ? node.tags.map(t => t.toLowerCase()) : [];
            const responseTokens = this.tokenize(node.response);

            let score = 0;
            let matchedKeywords = 0;

            queryTokens.forEach(qt => {
                // Exact tag match (High weight)
                if (tagTokens.includes(qt)) {
                    score += 3.0;
                    matchedKeywords++;
                } else if (tagTokens.some(t => t.includes(qt) || qt.includes(t))) {
                    score += 1.5;
                    matchedKeywords++;
                }

                // Intent token match
                if (intentTokens.includes(qt)) {
                    score += 2.0;
                    matchedKeywords++;
                } else if (intentTokens.some(it => it.includes(qt) || qt.includes(it))) {
                    score += 0.8;
                }

                // Response body match (lower weight)
                if (responseTokens.includes(qt)) {
                    score += 0.4;
                }
            });

            // Normalization against query length
            const normalizedScore = score / (queryTokens.length * 2.5);

            if (normalizedScore > highestScore) {
                highestScore = normalizedScore;
                bestMatch = node;
            }
        });

        // Cap confidence between 0% and 99%
        const confidence = Math.min(0.99, Math.max(0.05, highestScore));

        if (bestMatch && confidence >= 0.40) {
            return {
                response: bestMatch.response,
                confidence: confidence,
                source: bestMatch.id.startsWith('dom_') ? 'Portfolio Dynamic Graph' : 'Dynamic Trained Memory',
                matchedItem: bestMatch
            };
        }

        // Unknown / Low-confidence fallback
        return {
            response: `I haven't been trained on that specific topic yet! As Aayush's dynamic AI assistant, I can learn instantly. You can teach me the answer right now using the button below or the **TRAIN** studio in the header!`,
            confidence: confidence,
            source: 'Fallback Knowledge',
            isUntrained: true,
            userQuery: query
        };
    }
}

const novaMatcher = new NovaMatcherEngine(novaStore);

/* ==========================================================================
   NOVA CHAT WIDGET CONTROLLER
   ========================================================================== */
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

    let isSpeechMuted = false;
    let currentUtterance = null;
    let hasWelcomed = false;

    // Initialize voice settings
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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

    // Speech-to-Text Setup
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

        recognition.onerror = () => stopRecordingState();
        recognition.onend = () => stopRecordingState();

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
        
        setTimeout(() => inputField.focus(), 300);

        if (!hasWelcomed) {
            setTimeout(() => {
                speak("Hello! I am Nova, Aayush's personal AI assistant. Feel free to ask me anything or click Train in the header to teach me dynamically!");
            }, 500);
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

    // Handle Form Submit
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        appendMessage(userText, 'user');
        inputField.value = '';
        respondAsNova(userText);
    });

    // Handle Suggestion Chips
    if (suggestionsContainer) {
        suggestionsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (!chip) return;
            const query = chip.textContent;
            appendMessage(query, 'user');
            respondAsNova(query);
        });
    }

    function appendMessage(text, sender, meta = null) {
        const bubble = document.createElement('div');
        bubble.className = `nova-message-bubble ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'assistant') {
            contentDiv.innerHTML = parseSimpleMarkdown(text);
            
            // Add Confidence pill if available
            if (meta && meta.confidence && !meta.isUntrained) {
                const pct = Math.round(meta.confidence * 100);
                const pill = document.createElement('div');
                pill.className = 'nova-confidence-pill';
                pill.innerHTML = `<span>✨</span> ${pct}% Match • ${meta.source}`;
                contentDiv.appendChild(pill);
            }

            // Add Inline "Teach Nova" Active Learning trigger if untrained
            if (meta && meta.isUntrained) {
                const teachCard = document.createElement('div');
                teachCard.className = 'nova-inline-teach-card';
                teachCard.innerHTML = `
                    <p>💡 Know what Nova should say for this question?</p>
                    <button type="button" class="teach-action-btn" data-query="${escapeHtml(meta.userQuery || '')}">
                        <span>⚡</span> Teach Nova This Answer
                    </button>
                `;
                contentDiv.appendChild(teachCard);
            }
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

    // In-Chat Active Learning button click
    messagesContainer.addEventListener('click', (e) => {
        const teachBtn = e.target.closest('.teach-action-btn');
        if (!teachBtn) return;
        const queryToTeach = teachBtn.getAttribute('data-query');
        openTrainingStudioWithQuery(queryToTeach);
    });

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

        // 1. Check for interactive website control commands
        const commandResponse = checkForWebsiteCommands(userQuery);
        
        // 2. Fall back to dynamic semantic matching
        const result = commandResponse 
            ? { response: commandResponse, confidence: 1.0, source: 'Website Automation Command' }
            : novaMatcher.evaluate(userQuery);

        const delay = 600 + Math.random() * 500;
        setTimeout(() => {
            typingBubble.remove();
            appendMessage(result.response, 'assistant', result);
            speak(result.response);
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
            scrollToElement('work');
            if (githubFilterBtn) setTimeout(() => githubFilterBtn.click(), 300);
            if (syncBtn) setTimeout(() => syncBtn.click(), 600);
            return "Certainly! Initiating live synchronization with your GitHub repositories. I've scrolled you to the project showcase and activated the Live GitHub Explorer.";
        }

        // Command: Toggle theme
        if (clean.includes('theme') || clean.includes('dark mode') || clean.includes('light mode') || clean.includes('toggle mode')) {
            const themeBtn = document.querySelector('.theme-toggle-btn');
            if (themeBtn) {
                themeBtn.click();
                return "Sure, toggling the website theme display mode!";
            }
        }
        
        // Command: Smooth scroll viewport navigation
        if (clean.includes('scroll') || clean.includes('go to') || clean.includes('navigate to') || clean.includes('show section') || clean.includes('show about') || clean.includes('show skill') || clean.includes('show contact') || clean.includes('show work') || clean.includes('show journey') || clean.includes('show credentials') || clean.includes('show certifications') || clean.includes('show achievements')) {
            if (clean.includes('contact')) { scrollToElement('contact'); return "Scrolling to the Connect with Me section."; }
            if (clean.includes('about') || clean.includes('biography') || clean.includes('bio')) { scrollToElement('about'); return "Navigating to the Biography and About Me section."; }
            if (clean.includes('skills') || clean.includes('skill') || clean.includes('toolkit')) { scrollToElement('skills'); return "Moving down to the Skills and Toolkit category."; }
            if (clean.includes('certifications') || clean.includes('certificate') || clean.includes('credentials') || clean.includes('achievements') || clean.includes('hackerrank')) { scrollToElement('certifications'); return "Scrolling to the Verified Certifications section."; }
            if (clean.includes('journey') || clean.includes('experience') || clean.includes('timeline')) { scrollToElement('journey'); return "Scrolling to the Journey Timeline."; }
            if (clean.includes('work') || clean.includes('project') || clean.includes('recent')) { scrollToElement('work'); return "Opening Aayush's Recent Works projects filter."; }
            if (clean.includes('home') || clean.includes('hero') || clean.includes('top')) { scrollToElement('home'); return "Scrolling back to the top of the homepage."; }
        }
        
        // Command: Launch Project Specs Modals
        if (clean.includes('open') || clean.includes('show details') || clean.includes('show project') || clean.includes('view project') || clean.includes('view spec') || clean.includes('open modal')) {
            if (typeof openProjectModal === 'function') {
                if (clean.includes('weather') || clean.includes('forecast')) { openProjectModal('weather-dashboard'); return "Opening the specs sheet for the Weather Dashboard."; }
                if (clean.includes('calculator') || clean.includes('math')) { openProjectModal('calculator'); return "Opening the detail specs sheet for the Interactive Web Calculator."; }
                if (clean.includes('portfolio') || clean.includes('pinnacle')) { openProjectModal('pinnacle-portfolio'); return "Opening the specs layout for the Pinnacle Portfolio Workspace."; }
                if (clean.includes('commerce') || clean.includes('aura') || clean.includes('shop')) { openProjectModal('aura-tech'); return "Opening the specs sheet for Aura Tech E-commerce & Nova AI."; }
                if (clean.includes('restaurant') || clean.includes('saffron') || clean.includes('darbar')) { openProjectModal('saffron-darbar'); return "Opening the specs sheet for Saffron Darbar Indian Dining."; }
                if (clean.includes('event') || clean.includes('organiser') || clean.includes('vibe')) { openProjectModal('vibe-craft'); return "Opening the specs sheet for VibeCraft Event Organiser."; }
                if (clean.includes('todo') || clean.includes('task')) { openProjectModal('pinnacle-tasks'); return "Opening the specs sheet for Pinnacle Tasks."; }
                if (clean.includes('news') || clean.includes('globe')) { openProjectModal('pinnacle-globe'); return "Opening the specs sheet for Pinnacle Globe News."; }
            }
        }
        
        // Command: Close active overlays
        if (clean.includes('close') && (clean.includes('modal') || clean.includes('popup') || clean.includes('project') || clean.includes('details'))) {
            if (typeof closeModal === 'function') {
                closeModal();
                return "Closing the details modal window.";
            }
        }

        // Command: Train Nova trigger
        if (clean.includes('train nova') || clean.includes('teach nova') || clean.includes('training studio') || clean.includes('open studio')) {
            openTrainingStudio();
            return "Opening the Nova AI Training Studio! You can teach me new skills, Q&A pairs, or test model confidence.";
        }
        
        return null;
    }

    function scrollToElement(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function parseSimpleMarkdown(text) {
        let parsed = (text || '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return parsed;
    }

    function speak(text) {
        if (isSpeechMuted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let cleanText = text.replace(/<[^>]*>/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/•/g, '-');

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

    // Expose engine API
    window.NovaEngine = {
        speakGreeting: () => speak("Hello! I am Nova, Aayush's personal AI assistant. Ask me anything about his skills, machine learning projects, or train me with new facts!"),
        train: (intent, response, cat, tags) => novaStore.addCustomItem(intent, response, cat, tags),
        query: (q) => novaMatcher.evaluate(q),
        openStudio: () => openTrainingStudio(),
        getKnowledgeStats: () => ({
            customCount: novaStore.customItems.length,
            domCount: novaStore.domItems.length,
            total: novaStore.getAllKnowledgeNodes().length
        })
    };
}

/* ==========================================================================
   NOVA DYNAMIC TRAINING STUDIO CONTROLLER
   ========================================================================== */
function initNovaTrainingStudio() {
    const trainHeaderBtn = document.getElementById('nova-train-btn');
    const modal = document.getElementById('nova-training-modal');
    const closeBtn = document.getElementById('training-close-btn');
    const tabBtns = document.querySelectorAll('.training-tab-btn');
    const tabPanes = document.querySelectorAll('.training-tab-pane');
    
    // Forms & Controls
    const trainForm = document.getElementById('nova-train-form');
    const trainIntent = document.getElementById('train-intent');
    const trainResponse = document.getElementById('train-response');
    const trainCategory = document.getElementById('train-category');
    const trainTags = document.getElementById('train-tags');
    const statusMsg = document.getElementById('training-status-msg');
    
    // Knowledge list controls
    const knowledgeList = document.getElementById('knowledge-items-list');
    const knowledgeCountSpan = document.getElementById('knowledge-count');
    const knowledgeSearch = document.getElementById('knowledge-search');
    const reloadDomBtn = document.getElementById('reload-dom-knowledge-btn');
    
    // Test bench controls
    const testInput = document.getElementById('test-query-input');
    const runTestBtn = document.getElementById('run-test-btn');
    const testResults = document.getElementById('test-results-panel');
    const testConfidencePct = document.getElementById('test-confidence-pct');
    const testConfidenceFill = document.getElementById('test-confidence-fill');
    const testSourceTag = document.getElementById('test-matched-source');
    const testPredictedResponse = document.getElementById('test-predicted-response');

    // Data mgmt controls
    const loadAimlBtn = document.getElementById('load-pack-aiml');
    const loadInterviewBtn = document.getElementById('load-pack-interview');
    const exportBtn = document.getElementById('export-knowledge-btn');
    const importInput = document.getElementById('import-knowledge-file');
    const resetBtn = document.getElementById('reset-knowledge-btn');

    if (!modal) return;

    // 1. Open / Close Modal Handlers
    if (trainHeaderBtn) {
        trainHeaderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTrainingStudio();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeTrainingStudio);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTrainingStudio();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeTrainingStudio();
        }
    });

    // 2. Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetId = `tab-${btn.getAttribute('data-tab')}`;
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');

            if (btn.getAttribute('data-tab') === 'knowledge') {
                renderKnowledgeList();
            }
        });
    });

    // 3. Dynamic Training Form Submission
    if (trainForm) {
        trainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const intent = trainIntent.value.trim();
            const response = trainResponse.value.trim();
            const category = trainCategory.value;
            const tags = trainTags.value.trim();

            if (!intent || !response) return;

            novaStore.addCustomItem(intent, response, category, tags);

            // Visual feedback
            if (statusMsg) {
                statusMsg.textContent = "✨ Nova successfully trained on this topic!";
                statusMsg.className = "training-status-msg success";
                setTimeout(() => { statusMsg.textContent = ""; }, 3000);
            }

            // Clear inputs
            trainIntent.value = '';
            trainResponse.value = '';
            trainTags.value = '';

            updateKnowledgeCount();
            if (typeof showToast === 'function') {
                showToast("Nova Dynamic Memory Updated!", "success");
            }
        });
    }

    // 4. Render Knowledge List with Search & Delete
    function renderKnowledgeList(filterQuery = '') {
        if (!knowledgeList) return;
        knowledgeList.innerHTML = '';
        
        const allNodes = novaStore.getAllKnowledgeNodes();
        const filtered = filterQuery 
            ? allNodes.filter(n => 
                n.intent.toLowerCase().includes(filterQuery.toLowerCase()) ||
                n.response.toLowerCase().includes(filterQuery.toLowerCase()) ||
                (n.tags || []).some(t => t.toLowerCase().includes(filterQuery.toLowerCase()))
              )
            : allNodes;

        if (filtered.length === 0) {
            knowledgeList.innerHTML = `<p style="color: var(--text-tertiary); font-size: 0.88rem; text-align: center; padding: 2rem 0;">No knowledge nodes found.</p>`;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'knowledge-item-card';
            const isCustom = !item.id.startsWith('dom_');
            
            card.innerHTML = `
                <div class="k-header">
                    <span class="k-badge">${escapeHtml(item.category || 'general')} • ${isCustom ? 'Custom Trained' : 'Scraped from DOM'}</span>
                    ${isCustom ? `<button type="button" class="k-delete-btn" data-id="${item.id}" title="Delete node">🗑️ Delete</button>` : ''}
                </div>
                <div class="k-intent">Q: ${escapeHtml(item.intent)}</div>
                <div class="k-response">${escapeHtml(item.response.replace(/<[^>]*>/g, ''))}</div>
            `;
            knowledgeList.appendChild(card);
        });

        updateKnowledgeCount();
    }

    if (knowledgeSearch) {
        knowledgeSearch.addEventListener('input', (e) => {
            renderKnowledgeList(e.target.value);
        });
    }

    if (knowledgeList) {
        knowledgeList.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.k-delete-btn');
            if (!delBtn) return;
            const id = delBtn.getAttribute('data-id');
            novaStore.deleteCustomItem(id);
            renderKnowledgeList(knowledgeSearch ? knowledgeSearch.value : '');
            if (typeof showToast === 'function') showToast("Knowledge node removed", "success");
        });
    }

    if (reloadDomBtn) {
        reloadDomBtn.addEventListener('click', () => {
            novaStore.ingestDOMKnowledge();
            renderKnowledgeList();
            if (typeof showToast === 'function') showToast("DOM Knowledge Re-synced!", "success");
        });
    }

    // 5. Live Test Bench Evaluation
    function runLiveEvaluation() {
        if (!testInput || !testResults) return;
        const query = testInput.value.trim();
        if (!query) return;

        const evalResult = novaMatcher.evaluate(query);
        testResults.style.display = 'flex';
        
        const pct = Math.round(evalResult.confidence * 100);
        if (testConfidencePct) testConfidencePct.textContent = `${pct}%`;
        if (testConfidenceFill) {
            testConfidenceFill.style.width = `${pct}%`;
            if (pct >= 75) {
                testConfidenceFill.style.background = 'linear-gradient(90deg, #10b981, #14b8a6)';
            } else if (pct >= 45) {
                testConfidenceFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                testConfidenceFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }
        }

        if (testSourceTag) {
            testSourceTag.textContent = `${evalResult.source} ${evalResult.isUntrained ? '(Below Threshold)' : ''}`;
        }

        if (testPredictedResponse) {
            testPredictedResponse.innerHTML = evalResult.response;
        }
    }

    if (runTestBtn) runTestBtn.addEventListener('click', runLiveEvaluation);
    if (testInput) {
        testInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runLiveEvaluation();
            }
        });
    }

    // 6. Dataset Pack Loading
    if (loadAimlBtn) {
        loadAimlBtn.addEventListener('click', () => {
            const count = novaStore.loadPack('aiml');
            updateKnowledgeCount();
            if (typeof showToast === 'function') showToast(`Loaded ${count} new AI/ML knowledge nodes!`, "success");
        });
    }

    if (loadInterviewBtn) {
        loadInterviewBtn.addEventListener('click', () => {
            const count = novaStore.loadPack('interview');
            updateKnowledgeCount();
            if (typeof showToast === 'function') showToast(`Loaded ${count} new Interview FAQ nodes!`, "success");
        });
    }

    // 7. Backup & Export / Import
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(novaStore.exportJSON());
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "nova_trained_knowledge.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            if (typeof showToast === 'function') showToast("Exported trained knowledge JSON!", "success");
        });
    }

    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const count = novaStore.importJSON(event.target.result);
                    updateKnowledgeCount();
                    if (typeof showToast === 'function') showToast(`Imported ${count} knowledge nodes successfully!`, "success");
                } catch (err) {
                    alert("Failed to import JSON: " + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all custom dynamic training? Pre-loaded DOM knowledge will remain active.")) {
                novaStore.resetCustomItems();
                updateKnowledgeCount();
                renderKnowledgeList();
                if (typeof showToast === 'function') showToast("Custom training reset.", "success");
            }
        });
    }

    function updateKnowledgeCount() {
        if (knowledgeCountSpan) {
            knowledgeCountSpan.textContent = novaStore.getAllKnowledgeNodes().length;
        }
    }

    updateKnowledgeCount();
}

function openTrainingStudio() {
    const modal = document.getElementById('nova-training-modal');
    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeTrainingStudio() {
    const modal = document.getElementById('nova-training-modal');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function openTrainingStudioWithQuery(query) {
    openTrainingStudio();
    const teachTabBtn = document.querySelector('.training-tab-btn[data-tab="teach"]');
    if (teachTabBtn) teachTabBtn.click();
    
    const intentInput = document.getElementById('train-intent');
    const responseInput = document.getElementById('train-response');
    if (intentInput) {
        intentInput.value = query || '';
    }
    if (responseInput) {
        setTimeout(() => responseInput.focus(), 300);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
