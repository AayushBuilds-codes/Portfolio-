/**
 * VibeCraft - Dynamic Event Organiser Application Logic
 * Manages tab views, form synchronization to live promotional landing page preview,
 * interactive preset theme styling, active countdown timer, SVG ticket pass rendering,
 * and management dashboard calculations.
 */

// Application State
let eventState = {
    title: "DevCon Tech Summit 2026",
    category: "Meetup",
    location: "Royal Heights Convention Hall",
    date: "", // Initialized dynamically in init
    price: 499,
    capacity: 150,
    description: "Join us for a stellar day of keynote sessions, coding hackathons, and networking opportunities. Led by industry specialists!",
    theme: "purple",
    bannerStyle: "gradient",
    ticketStyle: "modern",
    registrations: 94,
    revenue: 46906
};

// Theme presets map
const THEMES = {
    purple: { primary: "#8b5cf6", accent: "#d946ef", rgb: "139, 92, 246" },
    saffron: { primary: "#f97316", accent: "#facc15", rgb: "249, 115, 22" },
    teal: { primary: "#14b8a6", accent: "#06b6d4", rgb: "20, 184, 166" },
    gold: { primary: "#eab308", accent: "#f97316", rgb: "234, 179, 8" }
};

// Dummy database of Indian names to pick from on registrations
const DUMMY_NAMES = [
    "Aditya Rao", "Ananya Sen", "Karan Malhotra", "Diya Mukherjee",
    "Vikram Goel", "Ishaan Joshi", "Aisha Khan", "Kabir Bhandari",
    "Neha Nair", "Siddharth Das", "Rohan Mehta", "Pooja Trivedi"
];

let countdownInterval = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    setDefaultDate();
    initTabs();
    setupFormListeners();
    setupThemeSelector();
    setupMockRegistration();
    updateDashboardMetrics();
    renderTicketPass();
    startCountdown();
});

// Set default event date to 12 days in the future
function setDefaultDate() {
    const dateInput = document.getElementById("event-date");
    if (!dateInput) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    futureDate.setHours(18, 0, 0, 0); // 6:00 PM

    // Format to yyyy-MM-ddThh:mm
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const hours = String(futureDate.getHours()).padStart(2, '0');
    const minutes = String(futureDate.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    dateInput.value = formattedDate;
    eventState.date = formattedDate;

    // Sync to preview datetime text
    updatePreviewDatetime(futureDate);
}

// Navigation Tabs Manager
function initTabs() {
    const workspaceTab = document.getElementById("btn-workspace-tab");
    const dashboardTab = document.getElementById("btn-dashboard-tab");
    const mainWorkspace = document.getElementById("main-workspace");
    const mainDashboard = document.getElementById("main-dashboard");

    if (!workspaceTab || !dashboardTab || !mainWorkspace || !mainDashboard) return;

    workspaceTab.addEventListener("click", () => {
        workspaceTab.classList.add("active");
        dashboardTab.classList.remove("active");
        mainWorkspace.classList.remove("hidden");
        mainDashboard.classList.add("hidden");
    });

    dashboardTab.addEventListener("click", () => {
        dashboardTab.classList.add("active");
        workspaceTab.classList.remove("active");
        mainWorkspace.classList.add("hidden");
        mainDashboard.classList.remove("hidden");
        updateDashboardMetrics();
    });
}

// Form listeners sync
function setupFormListeners() {
    const fields = [
        { id: "event-title", key: "title", targetId: "preview-title" },
        { id: "event-category", key: "category", targetId: "preview-category" },
        { id: "event-location", key: "location", targetId: "preview-location" },
        { id: "event-desc", key: "description", targetId: "preview-description" }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el) return;
        el.addEventListener("input", (e) => {
            const val = e.target.value;
            eventState[field.key] = val;
            
            const targetEl = document.getElementById(field.targetId);
            if (targetEl) targetEl.textContent = val;

            // Specific category badge style trigger
            if (field.key === "category") {
                renderTicketPass();
            }
        });
    });

    // Price updates
    const priceInput = document.getElementById("ticket-price");
    if (priceInput) {
        priceInput.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value) || 0;
            eventState.price = val;
            const previewPrice = document.getElementById("preview-price");
            if (previewPrice) {
                previewPrice.textContent = val === 0 ? "Free Admission" : `₹${val.toFixed(2)}`;
            }
            updateDashboardMetrics();
            renderTicketPass();
        });
    }

    // Capacity updates
    const capacityInput = document.getElementById("ticket-capacity");
    if (capacityInput) {
        capacityInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value) || 10;
            eventState.capacity = val;
            
            // Adjust registrations dynamically based on capacity ratio
            eventState.registrations = Math.round(val * 0.62); // Maintain ~62% initial bookings
            updateDashboardMetrics();
        });
    }

    // Banner Art Layout
    const bannerSelect = document.getElementById("banner-layout");
    if (bannerSelect) {
        bannerSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            eventState.bannerStyle = val;
            const banner = document.getElementById("event-banner-show");
            if (banner) {
                banner.className = `event-banner-show ${val}`;
            }
        });
    }

    // Pass layout select
    const ticketSelect = document.getElementById("ticket-style");
    if (ticketSelect) {
        ticketSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            eventState.ticketStyle = val;
            renderTicketPass();
        });
    }

    // Date & Time Change
    const dateInput = document.getElementById("event-date");
    if (dateInput) {
        dateInput.addEventListener("change", (e) => {
            const val = e.target.value;
            eventState.date = val;
            if (val) {
                const dateObj = new Date(val);
                updatePreviewDatetime(dateObj);
                startCountdown();
                renderTicketPass();
            }
        });
    }
}

function updatePreviewDatetime(dateObj) {
    const previewDatetime = document.getElementById("preview-datetime");
    if (!previewDatetime) return;

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateString = dateObj.toLocaleDateString('en-US', options);
    
    // Format Time readable
    let hours = dateObj.getHours();
    let minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // keying 0 as 12
    const timeString = `${hours}:${minutes} ${ampm}`;

    previewDatetime.textContent = `${dateString} at ${timeString}`;
}

// Accent Color Theme Preset manager
function setupThemeSelector() {
    const dots = document.querySelectorAll(".theme-dot");
    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            dots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            
            const themeKey = dot.getAttribute("data-theme");
            applyThemePreset(themeKey);
        });
    });
}

function applyThemePreset(themeKey) {
    const theme = THEMES[themeKey] || THEMES.purple;
    eventState.theme = themeKey;

    // Update CSS Custom properties on root document
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-primary-rgb", theme.rgb);
    root.style.setProperty("--theme-glow", `rgba(${theme.rgb}, 0.4)`);

    // Redraw SVG pass with new accent colors
    renderTicketPass();
}

// Live Countdown widget Clock logic
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    const timerDays = document.getElementById("timer-days");
    const timerHours = document.getElementById("timer-hours");
    const timerMins = document.getElementById("timer-mins");
    const timerSecs = document.getElementById("timer-secs");

    if (!timerDays || !timerHours || !timerMins || !timerSecs) return;

    function updateClock() {
        if (!eventState.date) return;
        const targetTime = new Date(eventState.date).getTime();
        const now = new Date().getTime();
        const difference = targetTime - now;

        if (difference <= 0) {
            clearInterval(countdownInterval);
            timerDays.textContent = "00";
            timerHours.textContent = "00";
            timerMins.textContent = "00";
            timerSecs.textContent = "00";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        timerDays.textContent = String(days).padStart(2, '0');
        timerHours.textContent = String(hours).padStart(2, '0');
        timerMins.textContent = String(minutes).padStart(2, '0');
        timerSecs.textContent = String(seconds).padStart(2, '0');
    }

    updateClock();
    countdownInterval = setInterval(updateClock, 1000);
}

// Printable customized SVG ticket pass generator drawing
function renderTicketPass() {
    const container = document.getElementById("ticket-visual-area");
    if (!container) return;

    const theme = THEMES[eventState.theme] || THEMES.purple;
    const cleanTitle = eventState.title.substring(0, 26) + (eventState.title.length > 26 ? '...' : '');
    const cleanLocation = eventState.location.substring(0, 26) + (eventState.location.length > 26 ? '...' : '');
    const priceText = eventState.price === 0 ? "FREE" : `₹${eventState.price}`;
    
    const formattedDate = eventState.date ? new Date(eventState.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD";
    const formattedTime = eventState.date ? new Date(eventState.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "6:00 PM";

    let svgContent = '';

    if (eventState.ticketStyle === "modern") {
        // Modern ticket vector graphic (360x160)
        svgContent = `
        <svg width="360" height="160" viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ticketGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${theme.primary}" />
                    <stop offset="100%" stop-color="${theme.accent}" />
                </linearGradient>
                <clipPath id="ticketCut">
                    <rect x="0" y="0" width="360" height="160" rx="8" />
                </clipPath>
            </defs>
            
            <!-- Ticket Base Grid Body -->
            <rect width="360" height="160" rx="8" fill="#121829" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
            
            <!-- Glow Accent Side Panel -->
            <path d="M 0 0 L 15 0 L 15 160 L 0 160 Z" fill="url(#ticketGlow)" />
            
            <!-- Details block -->
            <text x="35" y="32" fill="${theme.primary}" font-family="'Outfit', sans-serif" font-weight="700" font-size="10" letter-spacing="1.5" text-transform="uppercase">${eventState.category}</text>
            <text x="35" y="56" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="800" font-size="16" letter-spacing="-0.5">${cleanTitle}</text>
            
            <!-- Sub details (Location & Schedule) -->
            <text x="35" y="85" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="10">VENUE: ${cleanLocation}</text>
            <text x="35" y="102" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="10">DATE: ${formattedDate} at ${formattedTime}</text>
            <text x="35" y="119" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="10">ACCESS LEVEL: GENERAL ADMISSION</text>
            
            <!-- Price and seat tag -->
            <rect x="35" y="132" width="65" height="18" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
            <text x="42" y="145" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="700" font-size="10">SEAT: A-14</text>
            
            <rect x="110" y="132" width="75" height="18" rx="4" fill="rgba(var(--theme-primary-rgb), 0.1)" stroke="${theme.primary}" stroke-opacity="0.3" />
            <text x="117" y="145" fill="${theme.primary}" font-family="'Outfit', sans-serif" font-weight="700" font-size="10">${priceText}</text>

            <!-- Perforated vertical line divider -->
            <line x1="265" y1="10" x2="265" y2="150" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,4" />
            
            <!-- Stub block (Right Side) -->
            <text x="280" y="32" fill="#64748b" font-family="'Outfit', sans-serif" font-weight="700" font-size="8" letter-spacing="1">PASS STUB</text>
            
            <!-- QR code graphic mockup -->
            <g transform="translate(280, 48)">
                <rect width="60" height="60" fill="#ffffff" rx="4" />
                <!-- QR Code blocks representation -->
                <rect x="5" y="5" width="16" height="16" fill="#121829" />
                <rect x="39" y="5" width="16" height="16" fill="#121829" />
                <rect x="5" y="39" width="16" height="16" fill="#121829" />
                <rect x="9" y="9" width="8" height="8" fill="#ffffff" />
                <rect x="43" y="9" width="8" height="8" fill="#ffffff" />
                <rect x="9" y="43" width="8" height="8" fill="#ffffff" />
                <rect x="25" y="15" width="6" height="10" fill="#121829" />
                <rect x="15" y="25" width="10" height="6" fill="#121829" />
                <rect x="35" y="25" width="8" height="8" fill="#121829" />
                <rect x="25" y="35" width="10" height="15" fill="#121829" />
            </g>
            
            <text x="310" y="125" text-anchor="middle" fill="#64748b" font-family="'Inter', sans-serif" font-size="8">GATE OPEN</text>
            <text x="310" y="137" text-anchor="middle" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="700" font-size="10">5:30 PM</text>
        </svg>`;
    } else {
        // Classic Ticket layout (360x160)
        svgContent = `
        <svg width="360" height="160" viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ticketGlowClassic" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#1e293b" />
                    <stop offset="100%" stop-color="#0f172a" />
                </linearGradient>
            </defs>
            <!-- Background base -->
            <rect width="360" height="160" rx="4" fill="url(#ticketGlowClassic)" stroke="${theme.primary}" stroke-opacity="0.3" stroke-width="2" />
            
            <!-- Side Ticket notch cutouts (Mocking classic card punch) -->
            <circle cx="0" cy="80" r="10" fill="#070a13" />
            <circle cx="360" cy="80" r="10" fill="#070a13" />
            
            <!-- Perforated dotted line -->
            <line x1="270" y1="0" x2="270" y2="160" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="4,4" />
            
            <!-- Details -->
            <text x="25" y="32" fill="${theme.primary}" font-family="'Outfit', sans-serif" font-weight="700" font-size="11" letter-spacing="1">★ ADMIT ONE ENTRY ★</text>
            <text x="25" y="60" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="800" font-size="18">${cleanTitle}</text>
            
            <text x="25" y="88" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="10">WHERE: ${cleanLocation}</text>
            <text x="25" y="105" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="10">WHEN: ${formattedDate} at ${formattedTime}</text>
            
            <!-- Decorative Barcode at the bottom of stub -->
            <g transform="translate(25, 125)">
                <rect x="0" width="3" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="5" width="1" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="8" width="4" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="14" width="2" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="18" width="1" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="21" width="3" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="26" width="2" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="30" width="1" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="33" width="5" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="40" width="2" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="44" width="1" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="47" width="3" height="18" fill="rgba(255,255,255,0.4)" />
                <rect x="52" width="2" height="18" fill="rgba(255,255,255,0.4)" />
                <text x="60" y="13" fill="#64748b" font-family="monospace" font-size="8">NO. 883910</text>
            </g>
            
            <!-- Stub details (Right Column) -->
            <text x="315" y="32" text-anchor="middle" fill="${theme.primary}" font-family="'Outfit', sans-serif" font-weight="700" font-size="9">STUB</text>
            
            <!-- Rotated Ticket code -->
            <g transform="translate(325, 95) rotate(-90)">
                <text fill="#ffffff" font-family="monospace" font-size="11" letter-spacing="1">VIP-SEAT</text>
            </g>
            
            <text x="315" y="132" text-anchor="middle" fill="#94a3b8" font-family="'Outfit', sans-serif" font-size="10">${priceText}</text>
            <text x="315" y="145" text-anchor="middle" fill="#64748b" font-family="'Inter', sans-serif" font-size="7">NON-REFUNDABLE</text>
        </svg>`;
    }

    container.innerHTML = svgContent;
}

// Calculate metrics dynamically based on active capacities & prices
function updateDashboardMetrics() {
    const dashRegistrations = document.getElementById("dash-registrations");
    const dashRevenue = document.getElementById("dash-revenue");

    const capacityPct = document.getElementById("label-capacity-pct");
    const capacityBar = document.getElementById("bar-capacity-fill");
    const circularGauge = document.getElementById("satisfaction-fill-circle");

    // Calculate actual registration parameters
    const totalCapacity = eventState.capacity;
    const currentRegs = eventState.registrations;
    const price = eventState.price;
    const totalRevenue = currentRegs * price;

    eventState.revenue = totalRevenue;

    if (dashRegistrations) {
        dashRegistrations.textContent = `${currentRegs} / ${totalCapacity}`;
    }
    if (dashRevenue) {
        dashRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Capacity percentage calculation
    const ratio = Math.min((currentRegs / totalCapacity) * 100, 100);
    if (capacityPct) {
        capacityPct.textContent = `${Math.round(ratio)}%`;
    }
    if (capacityBar) {
        capacityBar.style.width = `${ratio}%`;
    }

    // Update circular gauge indicator offset: stroke-dashoffset = 377 * (1 - ratio/100)
    if (circularGauge) {
        const strokeOffset = 377 * (1 - ratio / 100);
        circularGauge.style.strokeDashoffset = strokeOffset;
    }

    // Dynamic sales categories
    const genPct = document.getElementById("label-general-pct");
    const genBar = document.getElementById("bar-general-fill");
    const vipPct = document.getElementById("label-vip-pct");
    const vipBar = document.getElementById("bar-vip-fill");

    if (genPct && genBar && vipPct && vipBar) {
        // Mock sub-ratios of ticket tiers
        const genRatio = Math.min(Math.round(ratio * 1.2), 100);
        const vipRatio = Math.max(Math.round(ratio * 0.7), 0);

        genPct.textContent = `${genRatio}%`;
        genBar.style.width = `${genRatio}%`;

        vipPct.textContent = `${vipRatio}%`;
        vipBar.style.width = `${vipRatio}%`;
    }
}

// Mock attendee booking pre-registrations action
function setupMockRegistration() {
    const registerBtn = document.getElementById("btn-mock-register");
    if (!registerBtn) return;

    registerBtn.addEventListener("click", () => {
        // Prevent exceeding capacity
        if (eventState.registrations >= eventState.capacity) {
            alert("This event has reached maximum seating capacity!");
            return;
        }

        // Increment counts
        eventState.registrations += 1;
        updateDashboardMetrics();

        // Add random attendee name
        const randomName = DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)];
        const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@example.com`;
        const seatNum = Math.floor(Math.random() * 25) + 1;
        const seatRow = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // Rows A-F
        const isVip = Math.random() > 0.6;

        const tableBody = document.getElementById("guest-table-body");
        if (tableBody) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${randomName}</td>
                <td>${randomEmail}</td>
                <td><span class="badge-status ${isVip ? 'vip' : 'standard'}">${isVip ? 'VIP' : 'Standard'}</span></td>
                <td>Row ${seatRow} - Seat ${seatNum}</td>
                <td><span style="color:#10b981;font-weight:700;">✓ Checked-In</span></td>
            `;
            // Add custom animation slide-in
            tr.style.opacity = '0';
            tr.style.transform = 'translateY(10px)';
            tableBody.prepend(tr);

            setTimeout(() => {
                tr.style.transition = 'all 0.4s ease-out';
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            }, 50);
        }

        // Animate register button
        registerBtn.textContent = "Seat Booked Successfully!";
        registerBtn.style.background = "#10b981";
        registerBtn.style.color = "#ffffff";
        registerBtn.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.4)";

        // Reset button state
        setTimeout(() => {
            registerBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:1.2rem;height:1.2rem;">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                </svg>
                Book Seating Ticket
            `;
            registerBtn.style.background = "";
            registerBtn.style.color = "";
            registerBtn.style.boxShadow = "";
        }, 1500);

        // Flash message to Nova chatbot
        if (window.Nova && typeof window.Nova.onMockBooking === 'function') {
            window.Nova.onMockBooking(randomName, isVip);
        }
    });
}

// Global hooks for Nova controller
window.VibeStore = {
    eventState,
    updateDashboardMetrics,
    renderTicketPass,
    applyThemePreset,
    setValues: (data) => {
        if (data.title) {
            document.getElementById("event-title").value = data.title;
            eventState.title = data.title;
            document.getElementById("preview-title").textContent = data.title;
        }
        if (data.category) {
            document.getElementById("event-category").value = data.category;
            eventState.category = data.category;
            document.getElementById("preview-category").textContent = data.category;
        }
        if (data.location) {
            document.getElementById("event-location").value = data.location;
            eventState.location = data.location;
            document.getElementById("preview-location").textContent = data.location;
        }
        if (data.desc) {
            document.getElementById("event-desc").value = data.desc;
            eventState.description = data.desc;
            document.getElementById("preview-description").textContent = data.desc;
        }
        if (data.price !== undefined) {
            document.getElementById("ticket-price").value = data.price;
            eventState.price = data.price;
            const previewPrice = document.getElementById("preview-price");
            if (previewPrice) {
                previewPrice.textContent = data.price === 0 ? "Free Admission" : `₹${data.price.toFixed(2)}`;
            }
        }
        if (data.theme) {
            const dots = document.querySelectorAll(".theme-dot");
            dots.forEach(d => {
                d.classList.remove("active");
                if (d.getAttribute("data-theme") === data.theme) {
                    d.classList.add("active");
                }
            });
            applyThemePreset(data.theme);
        }
        if (data.date) {
            document.getElementById("event-date").value = data.date;
            eventState.date = data.date;
            const dateObj = new Date(data.date);
            updatePreviewDatetime(dateObj);
            startCountdown();
        }
        updateDashboardMetrics();
        renderTicketPass();
    }
};
