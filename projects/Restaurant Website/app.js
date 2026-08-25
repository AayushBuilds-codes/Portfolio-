/**
 * Saffron Darbar - Royal Indian Gastronomy Storefront Application Logic
 * Manages active Shahi menu databases, search filtering by Veg/Non-Veg classifications,
 * table reservation requests, and background glowing particle canvas visualizers.
 */

// Shahi Menu Database
const MENU = [
    {
        id: 1,
        name: "Paneer Tikka Angare",
        category: "starters",
        price: 425.00,
        description: "Charcoal-grilled cottage cheese cubes marinated in Greek yogurt, hand-ground yellow chilies, and mustard oil.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "burrata"
    },
    {
        id: 2,
        name: "Dahi Ke Kebab",
        category: "starters",
        price: 395.00,
        description: "Velvety spiced yogurt patties infused with fresh coriander and green chilies, panko-crusted and shallow fried.",
        isVeg: true,
        isGF: false,
        isChef: true,
        vectorType: "crostini"
    },
    {
        id: 3,
        name: "Murg Malai Tikka",
        category: "starters",
        price: 475.00,
        description: "Boneless chicken tikkas marinated overnight in cream, cashew paste, cardamom dust, and flame-grilled in tandoor.",
        isVeg: false,
        isGF: true,
        isChef: false,
        vectorType: "beef"
    },
    {
        id: 4,
        name: "Royal Butter Chicken",
        category: "mains",
        price: 625.00,
        description: "Tandoori char-grilled chicken tikkas simmered in a rich tomato-cashew cream gravy with toasted fenugreek leaves.",
        isVeg: false,
        isGF: true,
        isChef: true,
        vectorType: "beef"
    },
    {
        id: 5,
        name: "Dal Makhani Bukhara",
        category: "mains",
        price: 495.00,
        description: "Black lentils slow-cooked on ash embers for 24 hours, simmered with farm butter, cream, and plum tomatoes.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "risotto"
    },
    {
        id: 6,
        name: "Paneer Darbar",
        category: "mains",
        price: 525.00,
        description: "Fresh cottage cheese blocks cooked in a smooth saffron-infused golden onion gravy with toasted almonds.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "risotto"
    },
    {
        id: 7,
        name: "Lucknowi Veg Biryani",
        category: "mains",
        price: 575.00,
        description: "Fragrant basmati rice layered with garden vegetables, kewra water, mint, and saffron, slow-cooked in handi.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "risotto"
    },
    {
        id: 8,
        name: "Saffron Shahi Tukda",
        category: "desserts",
        price: 345.00,
        description: "Ghee-fried artisanal bread soaked in cardamom rabri (thickened milk) and topped with pure edible gold leaf.",
        isVeg: true,
        isGF: false,
        isChef: true,
        vectorType: "lava"
    },
    {
        id: 9,
        name: "Gajar Halwa Crumble",
        category: "desserts",
        price: 295.00,
        description: "Warm slow-cooked carrot pudding layered with caramelized almond crumble and dustings of nutmeg.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "tart"
    },
    {
        id: 10,
        name: "Mango Cardamom Lassi",
        category: "beverages",
        price: 195.00,
        description: "Creamy churned yogurt beverage sweetened with Alphonso mango pulp and premium green cardamom dust.",
        isVeg: true,
        isGF: true,
        isChef: false,
        vectorType: "drink"
    },
    {
        id: 11,
        name: "Royal Masala Chai",
        category: "beverages",
        price: 145.00,
        description: "Strong milk tea brewed with crushed ginger, cardamom pods, cinnamon bark, and whole spices.",
        isVeg: true,
        isGF: true,
        isChef: true,
        vectorType: "drink"
    }
];

// Application State
let state = {
    categoryTab: 'all',
    searchQuery: '',
    filterVeg: false,
    filterGF: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCanvas();
    renderMenu();
    setupEventListeners();
    setInitialDate();
});

// Theme Management
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('gusto_theme');
    
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeBtn) {
            themeBtn.querySelector('.sun-icon').style.display = 'none';
            themeBtn.querySelector('.moon-icon').style.display = 'block';
        }
    }
}

// Background Canvas (Interactive Glowing Golden Ember Particles)
function initCanvas() {
    const canvas = document.getElementById('bistro-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 40;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height + height,
            vy: -(Math.random() * 0.4 + 0.1),
            vx: (Math.random() - 0.5) * 0.2,
            radius: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        const isDark = document.body.classList.contains('dark-theme');
        ctx.fillStyle = isDark ? 'rgba(255, 153, 51, ' : 'rgba(140, 114, 78, '; // Saffron orange glowing embers

        particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;

            // Reset when floating out of top screen
            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = (isDark ? 'rgba(255, 153, 51, ' : 'rgba(140, 114, 78, ') + p.alpha + ')';
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// Set Minimum & Default Date on Reservation input
function setInitialDate() {
    const dateInput = document.getElementById('res-date');
    if (!dateInput) return;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    
    const minDateStr = `${yyyy}-${mm}-${dd}`;
    dateInput.min = minDateStr;
    
    // Set default to tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tyyyy = tomorrow.getFullYear();
    let tmm = tomorrow.getMonth() + 1;
    let tdd = tomorrow.getDate();
    if (tdd < 10) tdd = '0' + tdd;
    if (tmm < 10) tmm = '0' + tmm;
    
    dateInput.value = `${tyyyy}-${tmm}-${tdd}`;
}

// Render Culinary Menu Grid
function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    const emptyMsg = document.getElementById('menu-empty-msg');
    if (!menuGrid) return;

    // Apply Filter controls
    let filtered = MENU.filter(p => {
        const matchesCategory = state.categoryTab === 'all' || p.category === state.categoryTab;
        const matchesSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                              p.description.toLowerCase().includes(state.searchQuery.toLowerCase());
        const matchesVeg = !state.filterVeg || p.isVeg;
        const matchesGF = !state.filterGF || p.isGF;
        
        return matchesCategory && matchesSearch && matchesVeg && matchesGF;
    });

    menuGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        filtered.forEach(p => {
            const card = document.createElement('article');
            card.className = 'menu-card glass';
            
            // Build dietary tags html (Indian Veg green dot vs Non-Veg brown dot indicator)
            let dotHTML = p.isVeg 
                ? `<span class="diet-indicator veg" title="Vegetarian"><span class="dot"></span></span>`
                : `<span class="diet-indicator non-veg" title="Non-Vegetarian"><span class="dot"></span></span>`;
            
            let tagsHTML = '';
            if (p.isGF) tagsHTML += `<span class="diet-tag gf">GF</span>`;

            card.innerHTML = `
                <div class="plate-box">
                    <span class="veg-non-veg-badge">${dotHTML}</span>
                    ${p.isChef ? `<span class="chef-badge">Royal Choice</span>` : ''}
                    <div class="diet-tags">${tagsHTML}</div>
                    <div class="plate-art ${p.vectorType}-plate">
                        ${renderPlateVector(p.vectorType)}
                    </div>
                </div>
                <div class="menu-info">
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div class="menu-footer">
                        <span class="price">₹${p.price.toFixed(2)}</span>
                        <button class="taste-recommend-btn" title="Ask Nova's recommendation notes" onclick="askNovaDish('${p.name}')">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    }
}

// Generate dynamic vector graphics for plates to load instantly
function renderPlateVector(type) {
    switch (type) {
        case 'soup':
            return `<div class="soup-liquid"></div>`;
        case 'crostini':
            return `<div class="bread"></div>`;
        case 'burrata':
            return `<div class="cheese"></div>`;
        case 'beef':
            return `<div class="steak"></div>`;
        case 'salmon':
            return `<div class="salmon"></div>`;
        case 'risotto':
            return `<div class="risotto"></div>`;
        case 'lava':
            return `<div class="cake"></div>`;
        case 'tart':
            return `<div class="tart"></div>`;
        case 'drink':
            return `<div class="glass-rim"></div>`;
        default:
            return '';
    }
}

// Event Listeners setup
function setupEventListeners() {
    const searchInput = document.getElementById('menu-search-input');
    const categoryBtns = document.querySelectorAll('.tab-btn');
    const vegCheckbox = document.getElementById('diet-veg');
    const gfCheckbox = document.getElementById('diet-gf');
    const themeBtn = document.getElementById('theme-toggle');
    const reservationForm = document.getElementById('reservation-form');
    const ticketResetBtn = document.getElementById('ticket-reset-btn');

    // Search bar filter
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderMenu();
        });
    }

    // Category Tabs click
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.categoryTab = btn.getAttribute('data-category');
            renderMenu();
        });
    });

    // Dietary checkers
    if (vegCheckbox) {
        vegCheckbox.addEventListener('change', (e) => {
            state.filterVeg = e.target.checked;
            renderMenu();
        });
    }
    if (gfCheckbox) {
        gfCheckbox.addEventListener('change', (e) => {
            state.filterGF = e.target.checked;
            renderMenu();
        });
    }

    // Theme Toggle Toggler
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const body = document.body;
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('gusto_theme', 'light');
                themeBtn.querySelector('.sun-icon').style.display = 'none';
                themeBtn.querySelector('.moon-icon').style.display = 'block';
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('gusto_theme', 'dark');
                themeBtn.querySelector('.sun-icon').style.display = 'block';
                themeBtn.querySelector('.moon-icon').style.display = 'none';
            }
        });
    }

    // Form submission reservation ticket
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processReservation();
        });
    }

    if (ticketResetBtn) {
        ticketResetBtn.addEventListener('click', () => {
            document.getElementById('reservation-success').classList.add('hidden');
            reservationForm.reset();
            setInitialDate();
        });
    }
}

// Perform table reservation processing
function processReservation(nameVal, guestsVal, dateVal, timeVal, notesVal) {
    const processingEl = document.getElementById('reservation-processing');
    const successEl = document.getElementById('reservation-success');
    
    // Read directly from form inputs if arguments are missing
    const name = nameVal || document.getElementById('res-name').value.trim();
    const guests = guestsVal || document.getElementById('res-guests').value;
    const date = dateVal || document.getElementById('res-date').value;
    const time = timeVal || document.getElementById('res-time').value;
    const notes = notesVal !== undefined ? notesVal : document.getElementById('res-notes').value.trim();

    // Set form input visual representations if booking was triggered via voice/Nova
    if (nameVal) document.getElementById('res-name').value = name;
    if (guestsVal) document.getElementById('res-guests').value = guests;
    if (dateVal) document.getElementById('res-date').value = date;
    if (timeVal) document.getElementById('res-time').value = time;
    if (notesVal !== undefined) document.getElementById('res-notes').value = notes;

    processingEl.classList.remove('hidden');

    // Simulate table assignment delay (2.5 seconds)
    setTimeout(() => {
        processingEl.classList.add('hidden');
        successEl.classList.remove('hidden');

        // Populate digital ticket details
        const randomRef = `#GB-${Math.floor(10000 + Math.random() * 90000)}`;
        const randomTableNum = Math.floor(10 + Math.random() * 25);
        const section = guests > 4 ? "Darbar Salon" : "Royal Divani Veranda";
        
        document.getElementById('ticket-id').textContent = randomRef;
        document.getElementById('ticket-name').textContent = name;
        document.getElementById('ticket-guests').textContent = `${guests} Guests`;
        
        // Format Date readable
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        // Format Time readable
        const [hr, min] = time.split(':');
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const formattedHour = hr % 12 || 12;
        const timeStr = `${formattedHour}:${min} ${ampm}`;

        document.getElementById('ticket-schedule').textContent = `${dateStr} at ${timeStr}`;
        document.getElementById('ticket-table').textContent = `${section} Cabin ${randomTableNum}`;
        document.getElementById('ticket-notes').textContent = notes || "None specified";

        // Notify Nova chatbot of successful table booking
        notifyNova(`Reservation confirmed under ${name} for ${guests} guests on ${dateStr} at ${timeStr}. Table assigned: Table ${randomTableNum}.`);
    }, 2500);
}

// Ask Nova details about a specific dish
window.askNovaDish = function(dishName) {
    const launcher = document.getElementById('nova-launcher');
    if (!launcher) return;
    
    // open widget if closed
    const chatOpen = document.getElementById('nova-chat-window').classList.contains('open');
    if (!chatOpen) launcher.click();
    
    const query = `Tell me about ${dishName}`;
    notifyNovaInput(query);
};

// Mute booking special event links
window.bookEvent = function(eventName) {
    const resSection = document.getElementById('reservation-section');
    if (resSection) {
        resSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Fill custom note in booking
    const notesInput = document.getElementById('res-notes');
    if (notesInput) {
        notesInput.value = `Reserving seat for event: "${eventName}"`;
    }
    
    notifyNova(`Booking seats for event: ${eventName}`);
};

function notifyNova(eventMsg) {
    if (window.Nova && typeof window.Nova.onReservationConfirm === 'function') {
        window.Nova.onReservationConfirm(eventMsg);
    }
}

function notifyNovaInput(query) {
    if (window.Nova && typeof window.Nova.submitQuery === 'function') {
        window.Nova.submitQuery(query);
    }
}

// Export functions to window namespace for Nova mappings
window.GustoStore = {
    MENU,
    processReservation,
    filterCategory: (cat) => {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => {
            if (t.getAttribute('data-category') === cat) t.click();
        });
    },
    searchMenu: (query) => {
        const inp = document.getElementById('menu-search-input');
        if (inp) {
            inp.value = query;
            inp.dispatchEvent(new Event('input'));
        }
    },
    toggleDietaryFilter: (dietType, checkVal) => {
        if (dietType === 'veg') {
            const chk = document.getElementById('diet-veg');
            if (chk) {
                chk.checked = checkVal;
                chk.dispatchEvent(new Event('change'));
            }
        }
        if (dietType === 'gf') {
            const chk = document.getElementById('diet-gf');
            if (chk) {
                chk.checked = checkVal;
                chk.dispatchEvent(new Event('change'));
            }
        }
    }
};
