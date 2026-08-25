/* ==========================================================================
   PINNACLE TASKS - MAIN JS ENGINE (app.js)
   ========================================================================== */

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
const state = {
    tasks: [],
    categories: [],
    pomodoro: {
        isActive: false,
        duration: 25, // default minutes
        minutes: 25,
        seconds: 0,
        activeTaskId: null,
        soundType: 'none',
        timerId: null
    },
    userEnergy: 'medium', // low, medium, high
    activeFilter: 'all', // 'all', 'today', 'high', or categoryId (string)
    activeSort: 'order', // 'order', 'date', 'priority', 'name'
    theme: 'nebula'
};

// ==========================================================================
// WEB AUDIO SOUND SYNTHESIS ENGINE (High Performance, No files loaded)
// ==========================================================================
let audioContext = null;
let soundNodes = [];

function startFocusSound(type) {
    stopFocusSound();
    if (type === 'none') return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioContext = new AudioContext();
        
        if (type === 'white') {
            // White / Pink Noise Synthesis (Deep Focus Masking)
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Pink Noise approximation coefficients
            let b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616  * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.07; // scale gain for safety
                b6 = white * 0.115926;
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;
            
            const lowpass = audioContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 800; // soft rumble
            
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.25;
            
            source.connect(lowpass).connect(gainNode).connect(audioContext.destination);
            source.start();
            soundNodes.push(source);
            
        } else if (type === 'rain') {
            // Rain Synth: Pink noise base + randomly generated high pitch triangle drop envelopes
            // 1. Soft rumble base (Filtered noise)
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const source = audioContext.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;
            
            const filter = audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 450;
            
            const baseGain = audioContext.createGain();
            baseGain.gain.value = 0.3;
            
            source.connect(filter).connect(baseGain).connect(audioContext.destination);
            source.start();
            soundNodes.push(source);
            
            // 2. Randomized Drop Synthesizer
            const dropInterval = setInterval(() => {
                if (!audioContext || audioContext.state === 'closed') {
                    clearInterval(dropInterval);
                    return;
                }
                const osc = audioContext.createOscillator();
                const dropGain = audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600 + Math.random() * 1200, audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.03);
                
                dropGain.gain.setValueAtTime(0.005 + Math.random() * 0.015, audioContext.currentTime);
                dropGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.03);
                
                osc.connect(dropGain).connect(audioContext.destination);
                osc.start();
                osc.stop(audioContext.currentTime + 0.04);
            }, 75);
            
            soundNodes.push({ stop: () => clearInterval(dropInterval) });
            
        } else if (type === 'binaural') {
            // Binaural Beats: 100Hz Left Ear, 108Hz Right Ear. Generates an 8Hz Alpha state.
            const oscL = audioContext.createOscillator();
            const oscR = audioContext.createOscillator();
            const panL = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;
            const panR = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;
            const masterGain = audioContext.createGain();
            
            oscL.frequency.value = 100;
            oscR.frequency.value = 108; // 8Hz offset
            masterGain.gain.value = 0.05;
            
            if (panL && panR) {
                panL.pan.setValueAtTime(-1, audioContext.currentTime);
                panR.pan.setValueAtTime(1, audioContext.currentTime);
                oscL.connect(panL).connect(masterGain);
                oscR.connect(panR).connect(masterGain);
            } else {
                oscL.connect(masterGain);
                oscR.connect(masterGain);
            }
            
            masterGain.connect(audioContext.destination);
            oscL.start();
            oscR.start();
            
            soundNodes.push(oscL, oscR);
        }
    } catch (e) {
        console.error("Audio Context initialization failed:", e);
    }
}

function stopFocusSound() {
    soundNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
    });
    soundNodes = [];
    if (audioContext) {
        try { audioContext.close(); } catch(e) {}
        audioContext = null;
    }
}

// ==========================================================================
// LOCAL STORAGE PERSISTENCE & DATA BOOTSTRAP
// ==========================================================================
const DEFAULT_CATEGORIES = [
    { id: 'cat-work', name: 'Work', color: '#3b82f6', icon: '💻' },
    { id: 'cat-personal', name: 'Personal', color: '#ec4899', icon: '🏠' },
    { id: 'cat-wellness', name: 'Wellness', color: '#10b981', icon: '🧘' },
    { id: 'cat-study', name: 'Study', color: '#8b5cf6', icon: '📚' }
];

const DEFAULT_TASKS = [
    {
        id: 't-1',
        title: 'Review landing page copy',
        category: 'cat-work',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '17:00',
        completed: false,
        subtasks: [
            { id: 's-1', title: 'Edit header text', completed: true },
            { id: 's-2', title: 'Draft CTA section values', completed: false }
        ],
        order: 0
    },
    {
        id: 't-2',
        title: '30-minute meditation run',
        category: 'cat-wellness',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '',
        completed: true,
        subtasks: [],
        order: 1
    },
    {
        id: 't-3',
        title: 'Practice speech recognition commands with Nova',
        category: 'cat-study',
        priority: 'low',
        dueDate: '',
        dueTime: '',
        completed: false,
        subtasks: [],
        order: 2
    }
];

function loadData() {
    const savedTasks = localStorage.getItem('pinnacle_tasks');
    const savedCategories = localStorage.getItem('pinnacle_categories');
    const savedTheme = localStorage.getItem('pinnacle_theme');
    const savedEnergy = localStorage.getItem('pinnacle_energy');
    
    state.tasks = savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS;
    state.categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
    state.theme = savedTheme || 'nebula';
    state.userEnergy = savedEnergy || 'medium';
    
    // Set theme and energy DOM
    document.documentElement.setAttribute('data-theme', state.theme);
    const activeDot = document.querySelector(`.theme-dot[data-theme="${state.theme}"]`);
    if (activeDot) {
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        activeDot.classList.add('active');
    }
    
    const activeEnergyBtn = document.querySelector(`.energy-btn[data-energy="${state.userEnergy}"]`);
    if (activeEnergyBtn) {
        document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
        activeEnergyBtn.classList.add('active');
    }
}

function saveData() {
    localStorage.setItem('pinnacle_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('pinnacle_categories', JSON.stringify(state.categories));
    localStorage.setItem('pinnacle_theme', state.theme);
    localStorage.setItem('pinnacle_energy', state.userEnergy);
    
    // Sync context to Nova AI global listener
    if (window.syncNovaTodoContext) {
        window.syncNovaTodoContext(state.tasks, state.userEnergy, state.categories);
    }
}

// ==========================================================================
// HIGH PERFORMANCE RENDERING ENGINE & EVENT DELEGATION
// ==========================================================================

// Render Category Sidebar list
function renderCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';
    
    state.categories.forEach(cat => {
        const count = state.tasks.filter(t => t.category === cat.id && !t.completed).length;
        const li = document.createElement('li');
        li.setAttribute('data-filter', cat.id);
        if (state.activeFilter === cat.id) {
            li.style.background = 'rgba(255, 255, 255, 0.06)';
            li.style.boxShadow = `inset 3px 0 0 ${cat.color}`;
        }
        
        li.innerHTML = `
            <span class="cat-indicator" style="background-color: ${cat.color}"></span>
            <span>${cat.icon} ${cat.name}</span>
            <span class="cat-badge">${count}</span>
        `;
        list.appendChild(li);
    });
}

// Draw Canvas Analytics Gauge
function drawGaugeChart() {
    const canvas = document.getElementById('gauge-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const completed = state.tasks.filter(t => t.completed).length;
    const total = state.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update numerical text inside DOM
    document.getElementById('completion-pct').textContent = percentage;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 5;
    const radius = 45;
    
    // 1. Draw base semi-circle track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();
    
    // 2. Draw fill progress (only if greater than 0)
    if (percentage > 0) {
        ctx.beginPath();
        const endAngle = Math.PI + (Math.PI * (percentage / 100));
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
        ctx.lineWidth = 6;
        
        // Grab primary/accent color values based on computed theme style
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#a855f7';
        ctx.strokeStyle = primaryColor;
        
        ctx.stroke();
    }
}

// Format date badge helpers
function getRelativeDateLabel(dateStr) {
    if (!dateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrow = tomorrowObj.toISOString().split('T')[0];
    
    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Core Task Card renderer
function renderTasks() {
    const listContainer = document.getElementById('task-list-container');
    const emptyState = document.getElementById('empty-state');
    
    // Filter logic
    let filteredTasks = [...state.tasks];
    
    if (state.activeFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(t => t.dueDate === todayStr);
    } else if (state.activeFilter === 'high') {
        filteredTasks = filteredTasks.filter(t => t.priority === 'high');
    } else if (state.activeFilter !== 'all') {
        // Must be category filter ID
        filteredTasks = filteredTasks.filter(t => t.category === state.activeFilter);
    }
    
    // Sort logic
    if (state.activeSort === 'date') {
        filteredTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
        });
    } else if (state.activeSort === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        filteredTasks.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    } else if (state.activeSort === 'name') {
        filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        // Manual sorting: fallback order key
        filteredTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Update summary labels
    const totalRemaining = state.tasks.filter(t => !t.completed).length;
    const highPriorityRemaining = state.tasks.filter(t => !t.completed && t.priority === 'high').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = state.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
    
    document.getElementById('welcome-message').textContent = totalRemaining === 0 
        ? "All caught up! Dynamic job!" 
        : `You've got ${totalRemaining} task${totalRemaining > 1 ? 's' : ''} remaining`;
        
    document.getElementById('summary-metrics').innerHTML = `
        ${highPriorityRemaining > 0 ? `<span style="color:var(--priority-high)">${highPriorityRemaining} High Priority</span>` : '0 critical'} • 
        ${overdueCount > 0 ? `<span style="color:#ef4444">${overdueCount} Overdue</span>` : 'no delays'} • 
        Energy level matches <strong>${state.userEnergy}</strong>
    `;
    
    // Update filter counts
    document.getElementById('count-all').textContent = state.tasks.filter(t => !t.completed).length;
    document.getElementById('count-today').textContent = state.tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
    document.getElementById('count-high').textContent = state.tasks.filter(t => t.priority === 'high' && !t.completed).length;
    document.getElementById('list-total-count').textContent = filteredTasks.length;
    
    if (filteredTasks.length === 0) {
        listContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    listContainer.style.display = 'flex';
    emptyState.style.display = 'none';
    
    // Fragment creation for optimal DOM performance
    const fragment = document.createDocumentFragment();
    
    filteredTasks.forEach(task => {
        const cat = state.categories.find(c => c.id === task.category) || { name: 'Inbox', color: '#9ca3af', icon: '📁' };
        
        let priorityColor = 'var(--primary)';
        if (task.priority === 'high') priorityColor = 'var(--priority-high)';
        else if (task.priority === 'medium') priorityColor = 'var(--priority-medium)';
        else if (task.priority === 'low') priorityColor = 'var(--priority-low)';
        
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''} ${state.pomodoro.activeTaskId === task.id ? 'focusing' : ''}`;
        card.setAttribute('data-id', task.id);
        card.style.setProperty('--priority-color', priorityColor);
        card.style.setProperty('--card-border-glow', priorityColor + '15'); // 15 is hex opacity alpha 8%
        
        // Due Date overdue check
        const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
        const relativeDate = getRelativeDateLabel(task.dueDate);
        
        // Subtasks completion metric
        const subCount = task.subtasks.length;
        const subCompleted = task.subtasks.filter(s => s.completed).length;
        const pctDone = subCount > 0 ? Math.round((subCompleted / subCount) * 100) : 0;
        
        // Assemble subtask markup
        let subtasksHTML = '';
        if (subCount > 0) {
            subtasksHTML = `
                <div class="task-subtasks-container">
                    <div class="subtasks-progress-wrapper">
                        <div class="subtasks-progress-bar">
                            <div class="subtasks-progress-fill" style="width: ${pctDone}%"></div>
                        </div>
                        <span class="subtasks-pct">${subCompleted}/${subCount} (${pctDone}%)</span>
                    </div>
                    <ul class="subtasks-list">
                        ${task.subtasks.map(sub => `
                            <li class="subtask-item ${sub.completed ? 'completed' : ''}" data-sub-id="${sub.id}">
                                <div class="subtask-checkbox">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span>${sub.title}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="task-card-main">
                <div class="task-checkbox-wrapper">
                    <div class="task-checkbox">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
                
                <div class="task-details">
                    <div class="task-title-row">
                        <span class="task-title">${task.title}</span>
                        
                        <div class="task-actions">
                            <button class="task-act-btn edit" title="Edit Task Name">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="task-act-btn nova-break" title="Nova AI: Break down into checklists">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </button>
                            <button class="task-act-btn delete" title="Delete Task">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="task-meta-row">
                        ${task.priority ? `<span class="meta-badge priority" style="--priority-color: ${priorityColor}">${task.priority}</span>` : ''}
                        <span class="meta-badge category" style="--cat-color: ${cat.color}">${cat.icon} ${cat.name}</span>
                        ${task.dueDate ? `
                            <span class="meta-badge due ${isOverdue ? 'overdue' : ''}">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                <span>${relativeDate} ${task.dueTime ? `@ ${task.dueTime}` : ''}</span>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            ${subtasksHTML}
        `;
        
        fragment.appendChild(card);
    });
    
    listContainer.innerHTML = '';
    listContainer.appendChild(fragment);
    
    // Sync Pomodoro target selector dropdown options
    updatePomodoroDropdown();
    drawGaugeChart();
}

// Refresh Pomodoro target options selector
function updatePomodoroDropdown() {
    const select = document.getElementById('pomo-task-select');
    if (!select) return;
    const currentVal = select.value;
    
    select.innerHTML = '<option value="">-- Choose Focus Task --</option>';
    state.tasks.filter(t => !t.completed).forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        if (task.id === currentVal) option.selected = true;
        select.appendChild(option);
    });
}

// ==========================================================================
// POMODORO FOCUS TIMER OPERATION
// ==========================================================================
function updateTimerDisplay() {
    const mins = String(state.pomodoro.minutes).padStart(2, '0');
    const secs = String(state.pomodoro.seconds).padStart(2, '0');
    document.getElementById('pomo-time').textContent = `${mins}:${secs}`;
}

function startPomodoro() {
    if (state.pomodoro.isActive) return;
    
    const taskSelect = document.getElementById('pomo-task-select');
    state.pomodoro.activeTaskId = taskSelect.value || null;
    
    state.pomodoro.isActive = true;
    document.getElementById('pomo-status').textContent = 'Focusing';
    document.getElementById('pomo-toggle-btn').textContent = 'Pause';
    document.getElementById('pomo-toggle-btn').classList.replace('primary', 'secondary');
    
    // Highlight task card if selected
    renderTasks();
    
    // Trigger synthesized audio stream
    startFocusSound(state.pomodoro.soundType);
    
    state.pomodoro.timerId = setInterval(() => {
        if (state.pomodoro.seconds === 0) {
            if (state.pomodoro.minutes === 0) {
                // Focus complete!
                clearInterval(state.pomodoro.timerId);
                state.pomodoro.isActive = false;
                stopFocusSound();
                
                // Ring sound synthesis (gong synth)
                playCompletionBeep();
                
                // Conversational prompt trigger
                if (window.triggerNovaAlert) {
                    window.triggerNovaAlert("Focus timer complete! Excellent job staying focused. You've earned a short 5-minute break!");
                }
                
                resetPomodoro();
                return;
            }
            state.pomodoro.minutes--;
            state.pomodoro.seconds = 59;
        } else {
            state.pomodoro.seconds--;
        }
        updateTimerDisplay();
    }, 1000);
}

function playCompletionBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime); // C5 note
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.6);
    } catch(e) {}
}

function pausePomodoro() {
    if (!state.pomodoro.isActive) return;
    clearInterval(state.pomodoro.timerId);
    state.pomodoro.isActive = false;
    document.getElementById('pomo-status').textContent = 'Paused';
    document.getElementById('pomo-toggle-btn').textContent = 'Resume';
    document.getElementById('pomo-toggle-btn').classList.replace('secondary', 'primary');
    
    stopFocusSound();
}

function resetPomodoro() {
    clearInterval(state.pomodoro.timerId);
    state.pomodoro.isActive = false;
    state.pomodoro.minutes = state.pomodoro.duration;
    state.pomodoro.seconds = 0;
    state.pomodoro.activeTaskId = null;
    
    document.getElementById('pomo-status').textContent = 'Ready';
    document.getElementById('pomo-toggle-btn').textContent = 'Start';
    document.getElementById('pomo-toggle-btn').className = 'pomo-btn primary';
    
    updateTimerDisplay();
    renderTasks();
    stopFocusSound();
}

// Hook speech commands to focus session
window.voiceStartPomodoro = function(taskId = null) {
    if (taskId) {
        document.getElementById('pomo-task-select').value = taskId;
    }
    startPomodoro();
};

// ==========================================================================
// TASK & CATEGORY ACTION DISPATCHERS
// ==========================================================================
function createTask(parsedDetails) {
    const newTask = {
        id: 't-' + Date.now(),
        title: parsedDetails.title || 'Untitled Task',
        category: parsedDetails.category || 'cat-personal',
        priority: parsedDetails.priority || 'medium',
        dueDate: parsedDetails.dueDate || '',
        dueTime: parsedDetails.dueTime || '',
        completed: false,
        subtasks: [],
        order: state.tasks.length
    };
    
    state.tasks.push(newTask);
    saveData();
    renderTasks();
    renderCategories();
}

function deleteCompletedTasks() {
    state.tasks = state.tasks.filter(t => !t.completed);
    saveData();
    renderTasks();
    renderCategories();
}

// Hook category creators
document.getElementById('category-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    const color = document.querySelector('input[name="cat-color"]:checked').value;
    const icon = document.getElementById('cat-icon').value.trim() || '📁';
    
    const id = 'cat-' + Date.now();
    state.categories.push({ id, name, color, icon });
    
    // Close modal
    document.getElementById('category-modal').style.display = 'none';
    document.getElementById('category-form').reset();
    
    saveData();
    renderCategories();
    renderTasks();
});

// Real-time parsed chip viewer
const taskInput = document.getElementById('task-input');
const previewContainer = document.getElementById('nlp-preview-container');

taskInput.addEventListener('input', () => {
    const val = taskInput.value.trim();
    if (!val) {
        previewContainer.innerHTML = '<span class="preview-helper">Nova AI is parsing text in real-time...</span>';
        return;
    }
    
    if (window.parseNLPTaskText) {
        const parsed = window.parseNLPTaskText(val);
        previewContainer.innerHTML = '';
        
        // Render helper tags
        if (parsed.title) {
            const tag = document.createElement('span');
            tag.className = 'nlp-tag';
            tag.innerHTML = `✍️ ${parsed.title}`;
            previewContainer.appendChild(tag);
        }
        
        if (parsed.category) {
            const cat = state.categories.find(c => c.id === parsed.category) || DEFAULT_CATEGORIES.find(c => c.id === parsed.category);
            if (cat) {
                const tag = document.createElement('span');
                tag.className = 'nlp-tag category';
                tag.style.setProperty('--tag-color', cat.color);
                tag.innerHTML = `${cat.icon} ${cat.name}`;
                previewContainer.appendChild(tag);
            }
        }
        
        if (parsed.priority) {
            let color = 'var(--priority-medium)';
            if (parsed.priority === 'high') color = 'var(--priority-high)';
            if (parsed.priority === 'low') color = 'var(--priority-low)';
            
            const tag = document.createElement('span');
            tag.className = 'nlp-tag priority';
            tag.style.setProperty('--tag-color', color);
            tag.innerHTML = `⚠️ ${parsed.priority}`;
            previewContainer.appendChild(tag);
        }
        
        if (parsed.dueDate) {
            const tag = document.createElement('span');
            tag.className = 'nlp-tag date';
            tag.innerHTML = `📅 ${getRelativeDateLabel(parsed.dueDate)} ${parsed.dueTime ? `@ ${parsed.dueTime}` : ''}`;
            previewContainer.appendChild(tag);
        }
    }
});

// Submit Task Form
document.getElementById('task-add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = taskInput.value.trim();
    if (!val) return;
    
    let parsedDetails = { title: val, category: 'cat-personal', priority: 'medium' };
    if (window.parseNLPTaskText) {
        parsedDetails = window.parseNLPTaskText(val);
    }
    
    createTask(parsedDetails);
    
    taskInput.value = '';
    previewContainer.innerHTML = '<span class="preview-helper">Nova AI is parsing text in real-time...</span>';
    
    // Smooth scroll to newly added task card
    setTimeout(() => {
        const container = document.getElementById('task-list-container');
        container.scrollTop = container.scrollHeight;
    }, 50);
});

// ==========================================================================
// DOM SETUP & GLOBAL EVENT DELEGATORS (Optimal Memory, Ultra Fast)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderCategories();
    renderTasks();
    updateTimerDisplay();
    
    // 1. Sidebar Nav Filters click delegations
    document.querySelector('.sidebar').addEventListener('click', (e) => {
        const filterItem = e.target.closest('[data-filter]');
        if (filterItem) {
            const filterVal = filterItem.getAttribute('data-filter');
            state.activeFilter = filterVal;
            
            // Toggle active classes in sidebar lists
            document.querySelectorAll('.sidebar li').forEach(item => item.classList.remove('active'));
            filterItem.classList.add('active');
            
            // Update Title text
            const titleEl = document.getElementById('current-view-title');
            if (filterVal === 'all') titleEl.textContent = 'All Tasks';
            else if (filterVal === 'today') titleEl.textContent = 'Today\'s Focus';
            else if (filterVal === 'high') titleEl.textContent = 'High Priority Tasks';
            else {
                const cat = state.categories.find(c => c.id === filterVal);
                titleEl.textContent = cat ? `${cat.icon} ${cat.name}` : 'Category list';
            }
            
            renderTasks();
            renderCategories();
        }
        
        // Add Category Modal toggle
        if (e.target.closest('#open-cat-modal')) {
            document.getElementById('category-modal').style.display = 'flex';
        }
    });
    
    // Close category modal button listeners
    document.getElementById('close-cat-modal').addEventListener('click', () => {
        document.getElementById('category-modal').style.display = 'none';
    });
    document.getElementById('category-modal').addEventListener('click', (e) => {
        if (e.target.id === 'category-modal') {
            document.getElementById('category-modal').style.display = 'none';
        }
    });
    
    // 2. Pomodoro widget interactions
    document.getElementById('pomo-toggle-btn').addEventListener('click', () => {
        if (state.pomodoro.isActive) {
            pausePomodoro();
        } else {
            startPomodoro();
        }
    });
    
    document.getElementById('pomo-reset-btn').addEventListener('click', () => {
        resetPomodoro();
    });
    
    document.querySelector('.sound-chips').addEventListener('click', (e) => {
        const chip = e.target.closest('.sound-chip');
        if (chip) {
            document.querySelectorAll('.sound-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.pomodoro.soundType = chip.getAttribute('data-sound');
            
            if (state.pomodoro.isActive) {
                // Restart sound stream immediately
                startFocusSound(state.pomodoro.soundType);
            }
        }
    });
    
    // 3. Main Board sorting & purging completions
    document.getElementById('sort-select').addEventListener('change', (e) => {
        state.activeSort = e.target.value;
        renderTasks();
    });
    
    document.getElementById('purge-completed-btn').addEventListener('click', () => {
        deleteCompletedTasks();
    });
    
    // Theme Dots clicks
    document.querySelector('.theme-selector').addEventListener('click', (e) => {
        const dot = e.target.closest('.theme-dot');
        if (dot) {
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            
            state.theme = dot.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', state.theme);
            saveData();
            
            // Re-render task border colors and gauge colors
            renderTasks();
        }
    });
    
    // Energy level selection click listener
    document.querySelector('.energy-selector').addEventListener('click', (e) => {
        const btn = e.target.closest('.energy-btn');
        if (btn) {
            document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.userEnergy = btn.getAttribute('data-energy');
            saveData();
            renderTasks();
        }
    });
    
    // 4. Task card event delegation (Click checkboxes, deletes, subtasks, edits)
    const listContainer = document.getElementById('task-list-container');
    
    listContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        
        const taskId = card.getAttribute('data-id');
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        // A. Main Task Checkbox click
        if (e.target.closest('.task-checkbox-wrapper')) {
            state.tasks[taskIndex].completed = !state.tasks[taskIndex].completed;
            
            // Synthesize completion bubble click sound dynamically! (micro synth)
            if (state.tasks[taskIndex].completed) {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const c = new AudioContext();
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.frequency.setValueAtTime(600, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.08, c.currentTime);
                    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.08);
                    osc.connect(gain).connect(c.destination);
                    osc.start();
                    osc.stop(c.currentTime + 0.1);
                } catch(err) {}
            }
            
            saveData();
            renderTasks();
            renderCategories();
            return;
        }
        
        // B. Delete Button click
        if (e.target.closest('.task-act-btn.delete')) {
            // Anim out card before splice for gorgeous responsive feel
            card.style.transition = 'transform 0.2s, opacity 0.2s';
            card.style.transform = 'scale(0.9) translateX(30px)';
            card.style.opacity = '0';
            
            setTimeout(() => {
                state.tasks.splice(taskIndex, 1);
                saveData();
                renderTasks();
                renderCategories();
            }, 200);
            return;
        }
        
        // C. Edit title button click
        if (e.target.closest('.task-act-btn.edit')) {
            const titleEl = card.querySelector('.task-title');
            const originalTitle = state.tasks[taskIndex].title;
            
            // Replace with input field
            titleEl.innerHTML = `<input type="text" class="edit-task-input" value="${originalTitle.replace(/"/g, '&quot;')}">`;
            const inputEl = titleEl.querySelector('input');
            inputEl.focus();
            inputEl.select();
            
            // Save on blur or enter
            const saveEdit = () => {
                const newVal = inputEl.value.trim();
                if (newVal) {
                    state.tasks[taskIndex].title = newVal;
                    saveData();
                }
                renderTasks();
            };
            
            inputEl.addEventListener('blur', saveEdit);
            inputEl.addEventListener('keydown', (ke) => {
                if (ke.key === 'Enter') {
                    saveEdit();
                } else if (ke.key === 'Escape') {
                    renderTasks();
                }
            });
            return;
        }
        
        // D. Ask Nova to break down task
        if (e.target.closest('.task-act-btn.nova-break')) {
            if (window.triggerNovaTaskBreakdown) {
                window.triggerNovaTaskBreakdown(taskId);
            }
            return;
        }
        
        // E. Subtask Checklist item toggle click
        const subItem = e.target.closest('.subtask-item');
        if (subItem) {
            const subId = subItem.getAttribute('data-sub-id');
            const subtask = state.tasks[taskIndex].subtasks.find(s => s.id === subId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                saveData();
                renderTasks();
            }
        }
    });
});

// Expose internal tasks API hooks to Nova assistant context
window.novaGetTasksState = function() {
    return {
        tasks: state.tasks,
        energy: state.userEnergy,
        categories: state.categories
    };
};

window.novaAddTaskDirect = function(parsedDetails) {
    createTask(parsedDetails);
};

window.novaDeleteCompletedDirect = function() {
    deleteCompletedTasks();
};

window.novaSetEnergyDirect = function(level) {
    state.userEnergy = level;
    
    const activeEnergyBtn = document.querySelector(`.energy-btn[data-energy="${level}"]`);
    if (activeEnergyBtn) {
        document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
        activeEnergyBtn.classList.add('active');
    }
    
    saveData();
    renderTasks();
};

window.novaSetFilterDirect = function(filterVal) {
    state.activeFilter = filterVal;
    
    // Toggle active classes in sidebar lists
    document.querySelectorAll('.sidebar li').forEach(item => item.classList.remove('active'));
    
    const filterItem = document.querySelector(`[data-filter="${filterVal}"]`);
    if (filterItem) {
        filterItem.classList.add('active');
    }
    
    // Update Title text
    const titleEl = document.getElementById('current-view-title');
    if (filterVal === 'all') titleEl.textContent = 'All Tasks';
    else if (filterVal === 'today') titleEl.textContent = 'Today\'s Focus';
    else if (filterVal === 'high') titleEl.textContent = 'High Priority Tasks';
    else {
        const cat = state.categories.find(c => c.id === filterVal);
        titleEl.textContent = cat ? `${cat.icon} ${cat.name}` : 'Category list';
    }
    
    renderTasks();
    renderCategories();
};

window.novaAddSubtasksDirect = function(taskId, subtasksArray) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks = subtasksArray.map((title, i) => ({
            id: `s-${Date.now()}-${i}`,
            title,
            completed: false
        }));
        saveData();
        renderTasks();
    }
};
