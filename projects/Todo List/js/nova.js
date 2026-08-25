/* ==========================================================================
   NOVA - TASK COMPANION AI ENGINE (nova.js)
   ========================================================================== */

const novaState = {
    chatOpen: false,
    voiceMuted: true,
    speechSynthesis: window.speechSynthesis,
    speechRecognition: null,
    isListening: false,
    orbAnimationId: null,
    orbPhase: 0,
    orbStatus: 'idle' // 'idle', 'thinking', 'listening', 'speaking'
};

// ==========================================================================
// REAL-TIME NATURAL LANGUAGE PARSING ENGINE (NLP)
// ==========================================================================
window.parseNLPTaskText = function(text) {
    let title = text;
    let category = null;
    let priority = null;
    let dueDate = null;
    let dueTime = null;
    
    // 1. Parse priority (!high, !medium, !low, priority critical)
    const priorityMatch = title.match(/!(high|medium|low|urgent|critical)/i);
    if (priorityMatch) {
        const val = priorityMatch[1].toLowerCase();
        priority = (val === 'urgent' || val === 'critical') ? 'high' : val;
        title = title.replace(priorityMatch[0], '');
    } else {
        // Keyword fallback
        const kwPriority = title.match(/\b(high|medium|low)\s+priority\b/i);
        if (kwPriority) {
            priority = kwPriority[1].toLowerCase();
            title = title.replace(kwPriority[0], '');
        }
    }
    
    // 2. Parse category (/work, /personal, /wellness, /study, etc.)
    const categoryMatch = title.match(/\/([a-z0-9\-]+)/i);
    if (categoryMatch) {
        const label = categoryMatch[1].toLowerCase();
        // Match existing categories
        if (label === 'work') category = 'cat-work';
        else if (label === 'personal') category = 'cat-personal';
        else if (label === 'wellness' || label === 'fitness' || label === 'health') category = 'cat-wellness';
        else if (label === 'study' || label === 'learn') category = 'cat-study';
        else {
            // Find in current categories list
            const currentCtx = window.novaGetTasksState ? window.novaGetTasksState() : null;
            if (currentCtx && currentCtx.categories) {
                const found = currentCtx.categories.find(c => c.name.toLowerCase() === label);
                if (found) category = found.id;
            }
        }
        title = title.replace(categoryMatch[0], '');
    }
    
    // 3. Parse Time (@5pm, @14:30, at 9 am)
    const timeMatch = title.match(/@(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i) || title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
        let hrs = parseInt(timeMatch[1]);
        const mins = timeMatch[2] ? timeMatch[2] : '00';
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
        
        if (ampm === 'pm' && hrs < 12) hrs += 12;
        if (ampm === 'am' && hrs === 12) hrs = 0;
        
        dueTime = `${String(hrs).padStart(2, '0')}:${mins}`;
        title = title.replace(timeMatch[0], '');
    }
    
    // 4. Parse Dates (today, tomorrow, next mon, by friday, on 12 june)
    const today = new Date();
    
    const resolveDayOfWeek = (targetDay) => {
        const resultDate = new Date();
        const currentDay = resultDate.getDay();
        let distance = targetDay - currentDay;
        if (distance <= 0) distance += 7; // next week's day
        resultDate.setDate(resultDate.getDate() + distance);
        return resultDate.toISOString().split('T')[0];
    };
    
    const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    
    // Keyword match
    if (title.match(/\btoday\b/i)) {
        dueDate = today.toISOString().split('T')[0];
        title = title.replace(/\btoday\b/gi, '');
    } else if (title.match(/\btomorrow\b/i)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString().split('T')[0];
        title = title.replace(/\btomorrow\b/gi, '');
    } else {
        // Day of week match (e.g. "by friday", "next monday")
        const dayMatch = title.match(/\b(?:by|next|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
        if (dayMatch) {
            const dayNum = daysMap[dayMatch[1].toLowerCase()];
            dueDate = resolveDayOfWeek(dayNum);
            title = title.replace(dayMatch[0], '');
        }
        
        // Month/date match (e.g. "on 12 june", "june 12th")
        const monthMatch = title.match(/\b(?:on)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i);
        if (monthMatch) {
            const dayVal = parseInt(monthMatch[1]);
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const monthStr = monthMatch[2].toLowerCase().substring(0, 3);
            const monthIndex = monthNames.indexOf(monthStr);
            if (monthIndex !== -1) {
                const targetDate = new Date(today.getFullYear(), monthIndex, dayVal);
                if (targetDate < today) targetDate.setFullYear(today.getFullYear() + 1); // next year
                dueDate = targetDate.toISOString().split('T')[0];
                title = title.replace(monthMatch[0], '');
            }
        }
    }
    
    // Clean up multiple spaces and trailing commas/dashes
    title = title.replace(/\s+/g, ' ').replace(/[,-\s]+$/, '').trim();
    
    return {
        title: title || 'New parsed task',
        category: category || 'cat-personal',
        priority: priority || 'medium',
        dueDate,
        dueTime
    };
};

// ==========================================================================
// SPEECH SYNTHESIS & RECOGNITION (WEB SPEECH APIs)
// ==========================================================================

function speakText(text) {
    if (novaState.voiceMuted || !novaState.speechSynthesis) return;
    
    // Cancel any ongoing speaking immediately
    novaState.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#`_\-]/g, '').replace(/<br\s*\/?>/gi, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Dynamic voice selection
    const voices = novaState.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.includes('en') && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('natural')));
    
    if (naturalVoice) {
        utterance.voice = naturalVoice;
    }
    
    utterance.onstart = () => {
        setOrbState('speaking');
    };
    
    utterance.onend = () => {
        setOrbState('idle');
    };
    
    utterance.onerror = () => {
        setOrbState('idle');
    };
    
    novaState.speechSynthesis.speak(utterance);
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech Recognition API is not supported in this browser.");
        const mic = document.getElementById("nova-mic-btn");
        if (mic) mic.style.display = "none";
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
        setOrbState('listening');
    };
    
    novaState.speechRecognition.onresult = (event) => {
        const textResult = event.results[0][0].transcript;
        const inputField = document.getElementById("nova-input-field");
        if (inputField) {
            inputField.value = textResult;
            inputField.focus();
            setTimeout(() => {
                document.getElementById("nova-input-form").dispatchEvent(new Event('submit'));
            }, 500);
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
    setOrbState('idle');
}

// External hook for alert sound reading
window.triggerNovaAlert = function(msg) {
    if (!novaState.chatOpen) {
        toggleChat();
    }
    appendMessage(msg, true);
    speakText(msg);
};

// ==========================================================================
// DYNAMIC AI ORB ANIMATOR (HTML5 Canvas Plasma Orb)
// ==========================================================================
function setOrbState(stateString) {
    novaState.orbStatus = stateString;
    const statusText = document.getElementById('nova-status-text');
    if (statusText) {
        if (stateString === 'idle') statusText.textContent = 'Task Companion';
        else if (stateString === 'listening') statusText.textContent = 'Listening...';
        else if (stateString === 'thinking') statusText.textContent = 'Thinking...';
        else if (stateString === 'speaking') statusText.textContent = 'Speaking...';
    }
}

function animateOrb() {
    const canvas = document.getElementById('nova-orb-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    
    // Math configuration based on state status
    let speed = 0.04;
    let amplitude = 4;
    let ringsCount = 3;
    let colorTheme = { r: 168, g: 85, b: 247 }; // Purple
    
    if (novaState.orbStatus === 'listening') {
        speed = 0.09;
        amplitude = 6;
        ringsCount = 4;
        colorTheme = { r: 239, g: 68, b: 68 }; // Red alert listening
    } else if (novaState.orbStatus === 'thinking') {
        speed = 0.12;
        amplitude = 5;
        ringsCount = 5;
        colorTheme = { r: 6, g: 182, b: 212 }; // Cyan pulsing
    } else if (novaState.orbStatus === 'speaking') {
        speed = 0.07;
        amplitude = 8;
        ringsCount = 4;
        colorTheme = { r: 16, g: 185, b: 129 }; // Green speaking
    }
    
    novaState.orbPhase += speed;
    
    // Draw plasma rings
    for (let r = 0; r < ringsCount; r++) {
        const currentRadius = 13 - (r * 2) + Math.sin(novaState.orbPhase + (r * 1.5)) * 1.5;
        
        ctx.beginPath();
        for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.1) {
            // Add noise displacements
            const offset = Math.sin(a * 4 + novaState.orbPhase + r) * amplitude;
            const x = centerX + (currentRadius + offset * 0.4) * Math.cos(a);
            const y = centerY + (currentRadius + offset * 0.4) * Math.sin(a);
            
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        // Gradient styling
        ctx.lineWidth = 1.5;
        const opacity = (1 - (r / ringsCount)) * 0.8;
        ctx.strokeStyle = `rgba(${colorTheme.r}, ${colorTheme.g}, ${colorTheme.b}, ${opacity})`;
        ctx.stroke();
    }
    
    // Core glow node
    const glowRad = 6 + Math.sin(novaState.orbPhase * 2) * 1.5;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRad);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, `rgba(${colorTheme.r}, ${colorTheme.g}, ${colorTheme.b}, 0.8)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRad, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    novaState.orbAnimationId = requestAnimationFrame(animateOrb);
}

// ==========================================================================
// TASK CHECKLIST BREAKDOWN BLUEPRINTS DATABASE
// ==========================================================================
const BREAKDOWN_BLUEPRINTS = {
    write: [
        "Gather reference logs and structural requirements",
        "Draft main outline and headings",
        "Write initial rough draft details",
        "Edit typography, grammar rules and readability"
    ],
    design: [
        "Collect moodboard references and palettes",
        "Sketch preliminary layouts/wireframes",
        "Assemble style guide tokens (fonts, spacing, sizing)",
        "Build high-fidelity user interface prototypes"
    ],
    code: [
        "Outline architectural design & schema requirements",
        "Set up folder structures and workspace configs",
        "Write logic core files & API hooks",
        "Debug syntax anomalies & optimize function runtimes"
    ],
    build: [
        "Compile system models and build pipelines",
        "Resolve deployment dependency warning errors",
        "Optimize bundle payloads & assets scripts",
        "Upload build distributions to production server"
    ],
    learn: [
        "Research tutorials, courses or documentation sheets",
        "Read core introductory materials",
        "Practice simple code blocks in isolation",
        "Refactor study samples to cement understanding"
    ],
    clean: [
        "De-clutter materials and vacuum floor sheets",
        "Dust appliances, cabinets and tables",
        "Scrub wet surfaces with detergent layers",
        "Wipe mirrors, polish screens and wash towels"
    ],
    plan: [
        "Identify ultimate goals and time limits",
        "Divide milestones into logical steps",
        "Set completion checkpoints",
        "Formulate mitigation sheets for risks"
    ],
    buy: [
        "Compare competitor pricing rates",
        "Review client feedback ratings",
        "Finalize item choice & quantity counts",
        "Checkout purchase and verify receipt bills"
    ],
    cook: [
        "Inspect recipe manuals & check pantry stocks",
        "Purchase missing ingredients",
        "Prep kitchen counters & chop raw materials",
        "Execute cooking steps and clean plates"
    ],
    study: [
        "Select targeted chapter sections",
        "Summarize core formulas & flash cards",
        "Work out sample tests/problems",
        "Compile review worksheets for exam weeks"
    ]
};

window.triggerNovaTaskBreakdown = function(taskId) {
    const data = window.novaGetTasksState ? window.novaGetTasksState() : null;
    if (!data) return;
    
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setOrbState('thinking');
    
    // Simulate thinking delay
    setTimeout(() => {
        const titleLower = task.title.toLowerCase();
        let subtasksList = null;
        
        // Match blueprint keywords
        for (const [key, list] of Object.entries(BREAKDOWN_BLUEPRINTS)) {
            if (titleLower.includes(key)) {
                subtasksList = list;
                break;
            }
        }
        
        // Fallback checklist
        if (!subtasksList) {
            subtasksList = [
                `Define core milestone goals for "${task.title}"`,
                "Break milestones into 1-hour action tasks",
                "Execute focus sprints (25-minute Pomodoro)",
                "Verify outputs and check completed results"
            ];
        }
        
        if (window.novaAddSubtasksDirect) {
            window.novaAddSubtasksDirect(taskId, subtasksList);
        }
        
        const feedback = `I analyzed **"${task.title}"** and generated a structured checklist with **${subtasksList.length} subtasks**! You can check progress directly on the card now.`;
        
        if (!novaState.chatOpen) {
            toggleChat();
        }
        
        appendMessage(feedback, true);
        speakText(`I have broken down the task into logical checklist steps.`);
        setOrbState('idle');
    }, 750);
};

// ==========================================================================
// CONVERSATIONAL AI CHAT RESPONSE GENERATOR
// ==========================================================================
function generateNovaResponse(query) {
    const q = query.toLowerCase().trim();
    const ctx = window.novaGetTasksState ? window.novaGetTasksState() : { tasks: [], energy: 'medium', categories: [] };
    
    // Greeting commands
    if (q === 'hello' || q === 'hi' || q === 'hey' || q.includes('who are you') || q.includes('help')) {
        return `Hello! I am **Nova**, your personal AI Productivity Coach. I am connected directly to your Pinnacle dashboard. <br><br>` +
               `Here are some things I can do for you:<br>` +
               `• **NLP Parsing**: Add tasks instantly using tags, e.g., *"Add Prepare presentation /work tomorrow !high"*<br>` +
               `• **Checklist Breakdown**: Ask *"Break down task review presentation"* or click the list icon on any task card.<br>` +
               `• **Voice Commands**: Click the mic and speak commands like *"Add wash the car"* or *"Show work category"*.<br>` +
               `• **Productivity Advice**: Ask *"What should I do next?"* or *"Motivate me!"*`;
    }
    
    // Productivity / Motivation Quotes
    if (q.includes('motivate') || q.includes('motivation') || q.includes('quote') || q.includes('inspiration')) {
        const quotes = [
            "Action is the foundational key to all success. Start with a 5-minute task to build momentum!",
            "Your energy flows where your attention goes. Focus on your top priority today.",
            "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
            "You do not have to see the whole staircase, just take the first step. Pick an item and start!",
            "Great things are done by a series of small things brought together. Check off your subtasks one by one!"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return `✨ **Nova Motivation**:<br>"${randomQuote}"`;
    }
    
    // Task breakdown voice command
    if (q.includes('break down') || q.includes('checklist') || q.includes('subtasks')) {
        // Try to find which task to break down
        const cleanedQuery = q.replace('break down', '').replace('checklist', '').replace('subtasks', '').replace('task', '').replace(/'/g, '').trim();
        if (cleanedQuery) {
            const matchedTask = ctx.tasks.find(t => t.title.toLowerCase().includes(cleanedQuery) && !t.completed);
            if (matchedTask) {
                setTimeout(() => {
                    window.triggerNovaTaskBreakdown(matchedTask.id);
                }, 50);
                return `Analyzing task **"${matchedTask.title}"** to generate subtask list checkpoints...`;
            }
        }
        return "Which task would you like me to break down? E.g., say *" + `Break down ${ctx.tasks.find(t => !t.completed)?.title || 'report'}` + "*";
    }
    
    // Focus coaching ("what should I do next?")
    if (q.includes('do next') || q.includes('recommend') || q.includes('focus') || q.includes('schedule') || q.includes('suggest')) {
        const activeTasks = ctx.tasks.filter(t => !t.completed);
        
        if (activeTasks.length === 0) {
            return "Your task board is completely clear! What a wonderful place to be. Take a deep breath and relax, or add a new goal when you're ready.";
        }
        
        // Priority high goes first
        let recommended = activeTasks.find(t => t.priority === 'high');
        
        // Match with user energy levels
        if (!recommended && ctx.energy === 'high') {
            // High energy wants study or work category tasks
            recommended = activeTasks.find(t => t.category === 'cat-work' || t.category === 'cat-study');
        } else if (!recommended && ctx.energy === 'low') {
            // Low energy wants wellness or low priority items
            recommended = activeTasks.find(t => t.priority === 'low' || t.category === 'cat-wellness');
        }
        
        // General fallback: first active task
        if (!recommended) recommended = activeTasks[0];
        
        const cat = ctx.categories.find(c => c.id === recommended.category) || { name: 'Inbox', icon: '📁' };
        
        // Option to voice trigger focus Pomodoro
        setTimeout(() => {
            const select = document.getElementById('pomo-task-select');
            if (select) select.value = recommended.id;
        }, 100);
        
        return `Based on your current **${ctx.energy} energy** state, I highly recommend focusing on:<br><br>` +
               `🎯 **${recommended.title}** (${cat.icon} ${cat.name})<br>` +
               `Priority: **${recommended.priority.toUpperCase()}** ${recommended.dueDate ? `• Due: ${recommended.dueDate}` : ''}<br><br>` +
               `I have loaded this task into your Focus Timer. Press **Start** to begin a 25-minute Pomodoro sprint!`;
    }
    
    // Clear completed tasks voice command helper
    if (q.includes('clear done') || q.includes('delete completed') || q.includes('purge done') || q.includes('clean up')) {
        const completedCount = ctx.tasks.filter(t => t.completed).length;
        if (completedCount > 0) {
            if (window.novaDeleteCompletedDirect) {
                window.novaDeleteCompletedDirect();
            }
            return `Successfully purged **${completedCount} completed task${completedCount > 1 ? 's' : ''}** from local storage. Your board is decluttered!`;
        }
        return "There are no completed tasks to clear right now.";
    }
    
    // Voice set energy state command
    if (q.includes('energy')) {
        if (q.includes('low')) {
            if (window.novaSetEnergyDirect) window.novaSetEnergyDirect('low');
            return "Set energy coach level to **LOW**. Easy, low-effort tasks will be prioritized for suggestions.";
        } else if (q.includes('high')) {
            if (window.novaSetEnergyDirect) window.novaSetEnergyDirect('high');
            return "Set energy coach level to **HIGH**. Challenging Deep Focus study/work tasks will be recommended.";
        } else if (q.includes('medium') || q.includes('normal')) {
            if (window.novaSetEnergyDirect) window.novaSetEnergyDirect('medium');
            return "Set energy coach level to **MEDIUM**. A balanced priority route has been activated.";
        }
    }
    
    // Voice set filter views command
    if (q.includes('show') || q.includes('filter') || q.includes('view')) {
        if (q.includes('today')) {
            if (window.novaSetFilterDirect) window.novaSetFilterDirect('today');
            return "Switched list view to **Today's** scheduled tasks.";
        } else if (q.includes('high') || q.includes('urgent') || q.includes('important')) {
            if (window.novaSetFilterDirect) window.novaSetFilterDirect('high');
            return "Switched list view to **High Priority** tasks.";
        } else if (q.includes('all') || q.includes('everything')) {
            if (window.novaSetFilterDirect) window.novaSetFilterDirect('all');
            return "Switched list view to **All Tasks** overview.";
        } else {
            // Check categories keyword
            for (const cat of ctx.categories) {
                if (q.includes(cat.name.toLowerCase())) {
                    if (window.novaSetFilterDirect) window.novaSetFilterDirect(cat.id);
                    return `Switched list view to category list **${cat.icon} ${cat.name}**.`;
                }
            }
        }
    }
    
    // Voice add task trigger command
    if (q.startsWith('add ') || q.startsWith('create ') || q.includes('remind me to')) {
        let taskText = q.replace('add ', '').replace('create ', '').replace('remind me to ', '').replace('task ', '').trim();
        if (taskText) {
            const parsed = window.parseNLPTaskText(taskText);
            if (window.novaAddTaskDirect) {
                window.novaAddTaskDirect(parsed);
            }
            
            const cat = ctx.categories.find(c => c.id === parsed.category) || { name: 'Inbox', icon: '📁' };
            return `Successfully added task **"${parsed.title}"**!<br>` +
                   `• Category: **${cat.icon} ${cat.name}**<br>` +
                   `• Priority: **${parsed.priority.toUpperCase()}**` +
                   `${parsed.dueDate ? `<br>• Due: **${parsed.dueDate} ${parsed.dueTime || ''}**` : ''}`;
        }
    }
    
    // Fallback: conversational NLP mock
    return `I've analyzed your query regarding **"${query}"**.<br><br>` +
           `I can add tasks if you say *"Add wash dishes"* or help you organize. ` +
           `Let me know if you want focus advice or motivational suggestions!`;
}

// ==========================================================================
// CHAT UI CONTROL PANEL
// ==========================================================================
function toggleChat() {
    const chatWindow = document.getElementById("nova-chat-window");
    const launcher = document.getElementById("nova-launcher");
    
    novaState.chatOpen = !novaState.chatOpen;
    chatWindow.classList.toggle("show", novaState.chatOpen);
    
    if (novaState.chatOpen) {
        launcher.style.transform = "scale(0.85) rotate(15deg)";
        const msgContainer = document.getElementById("nova-messages");
        msgContainer.scrollTop = msgContainer.scrollHeight;
        
        // Start Canvas animate orb loop
        if (!novaState.orbAnimationId) {
            animateOrb();
        }
    } else {
        launcher.style.transform = "";
        if (novaState.speechSynthesis) {
            novaState.speechSynthesis.cancel();
        }
        
        // Stop Orb animation loop
        if (novaState.orbAnimationId) {
            cancelAnimationFrame(novaState.orbAnimationId);
            novaState.orbAnimationId = null;
        }
    }
}

function appendMessage(text, isAssistant = false) {
    const msgContainer = document.getElementById("nova-messages");
    
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
    
    // Add before suggestions chips if they exist
    const chips = document.getElementById("nova-chips-container");
    if (chips) {
        msgContainer.insertBefore(bubble, chips);
    } else {
        msgContainer.appendChild(bubble);
    }
    
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function appendTypingIndicator() {
    const msgContainer = document.getElementById("nova-messages");
    const chips = document.getElementById("nova-chips-container");
    
    const bubble = document.createElement("div");
    bubble.className = "nova-message-bubble assistant typing";
    bubble.id = "nova-typing-indicator";
    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    if (chips) {
        msgContainer.insertBefore(bubble, chips);
    } else {
        msgContainer.appendChild(bubble);
    }
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById("nova-typing-indicator");
    if (indicator) {
        indicator.remove();
    }
}

function handleUserMessage(messageText) {
    if (!messageText.trim()) return;
    
    // Render user bubble
    appendMessage(messageText, false);
    
    setOrbState('thinking');
    appendTypingIndicator();
    
    // Simulated coach lag delay
    setTimeout(() => {
        removeTypingIndicator();
        const reply = generateNovaResponse(messageText);
        appendMessage(reply, true);
        speakText(reply);
        
        // Return orb to idle unless speaking is active
        if (novaState.orbStatus === 'thinking') {
            setOrbState('idle');
        }
    }, 900);
}

// Sync context to Nova state
window.syncNovaTodoContext = function(tasks, energy, categories) {
    console.log(`[Nova AI] Synchronized context: ${tasks.length} active tasks.`);
};

// ==========================================================================
// VOICE AND FORM TRIGGERS AT STARTUP
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Launcher Orb trigger click
    const launcher = document.getElementById("nova-launcher");
    const closeBtn = document.getElementById("nova-close-btn");
    
    launcher.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);
    
    // Submit query form
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
    
    // Speech synthesis toggle button
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
            
            speakText("Nova voice coaching activated.");
        }
    });
    
    // Suggestion chips listeners
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const promptText = chip.textContent;
            handleUserMessage(promptText);
        });
    });
    
    // Init speech recognition
    initSpeechRecognition();
    
    // Pre-warm Speech synthesis voices load list (Chromium browser rule)
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
    }
});
