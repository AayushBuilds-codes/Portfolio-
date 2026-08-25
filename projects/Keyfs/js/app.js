// KEYFS Global App Script

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initLiveTicker();
    initStatsCounter();
    highlightActiveLink();
    initLeadForms();
    updateHeaderSession();
});

// 1. Mobile Menu Toggle
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
            
            // Toggle hamburger animation state
            const spans = hamburger.querySelectorAll('span');
            if (hamburger.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// 2. Simulated Live Ticker Ticks
function initLiveTicker() {
    const tickerContainer = document.querySelector('.ticker');
    if (!tickerContainer) return;

    // Initial realistic mock values for Indian markets & key assets
    const tickerAssets = [
        { name: 'NIFTY 50', value: 23516.45, change: 82.35, pct: 0.35 },
        { name: 'SENSEX', value: 77310.10, change: 275.40, pct: 0.36 },
        { name: 'NIFTY MIDCAP', value: 55420.30, change: -110.15, pct: -0.20 },
        { name: 'GOLD (10g)', value: 72150.00, change: 320.00, pct: 0.45 },
        { name: 'USD/INR', value: 83.56, change: 0.04, pct: 0.05 },
        { name: 'KEYFS Dynamic Fund', value: 142.18, change: 1.84, pct: 1.31 },
        { name: 'Nifty Bank', value: 51660.80, change: -190.50, pct: -0.37 },
        { name: 'S&P 500', value: 5468.20, change: 18.50, pct: 0.34 }
    ];

    // Populate ticker
    function renderTicker() {
        tickerContainer.innerHTML = '';
        // Duplicate items to ensure smooth infinite carousel looping
        const doubleAssets = [...tickerAssets, ...tickerAssets];
        
        doubleAssets.forEach((asset, idx) => {
            const isUp = asset.change >= 0;
            const changeSign = isUp ? '+' : '';
            const caret = isUp ? '▲' : '▼';
            const changeClass = isUp ? 'up' : 'down';

            const item = document.createElement('div');
            item.className = 'ticker-item';
            item.id = `ticker-asset-${idx}`;
            item.innerHTML = `
                <span class="name">${asset.name}</span>
                <span class="value">${formatNumber(asset.value, asset.name === 'USD/INR' ? 2 : 2)}</span>
                <span class="change ${changeClass}">${caret} ${changeSign}${asset.change.toFixed(2)} (${changeSign}${asset.pct.toFixed(2)}%)</span>
            `;
            tickerContainer.appendChild(item);
        });
    }

    renderTicker();

    // Trigger tick updates every 3 seconds for visual realism
    setInterval(() => {
        tickerAssets.forEach(asset => {
            // Random fractional walk
            const multiplier = asset.name.includes('SENSEX') ? 15 : asset.name.includes('NIFTY') ? 5 : 0.1;
            const delta = (Math.random() - 0.48) * multiplier; // slightly positive bias
            
            asset.value += delta;
            asset.change += delta;
            asset.pct = (asset.change / (asset.value - asset.change)) * 100;
        });
        
        // Re-render
        renderTicker();
    }, 3000);
}

// 3. Counter Animation for Home Page Stats
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;

    const countOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetVal = parseFloat(target.getAttribute('data-target'));
                const speed = 2000; // duration in ms
                const increment = targetVal / (speed / 16); // ~60fps
                
                let current = 0;

                const updateCount = () => {
                    current += increment;
                    if (current < targetVal) {
                        target.innerText = formatStatValue(current, targetVal);
                        requestAnimationFrame(updateCount);
                    } else {
                        target.innerText = formatStatValue(targetVal, targetVal);
                    }
                };

                updateCount();
                observer.unobserve(target);
            }
        });
    }, countOptions);

    stats.forEach(stat => counterObserver.observe(stat));
}

function formatStatValue(val, targetVal) {
    if (targetVal >= 100000) {
        return (val / 100000).toFixed(1) + 'L+';
    }
    if (targetVal >= 1000) {
        // Years or small numbers
        return Math.floor(val).toString();
    }
    return Math.floor(val).toString();
}

// 4. Highlight Nav Link active state
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Simple matching logic
        if (currentPath.includes(href) && href !== 'index.html' && href !== './') {
            link.classList.add('active');
        } else if (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
        }
    });
}

// 5. Shared Lead Signups Forms & Notifications
function initLeadForms() {
    const forms = document.querySelectorAll('.lead-form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const alertSuccess = form.querySelector('.alert-success');
            const submitBtn = form.querySelector('button[type="submit"]');

            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Processing...';

                // Simulate API call
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    
                    if (alertSuccess) {
                        alertSuccess.style.display = 'block';
                        form.reset();
                        
                        setTimeout(() => {
                            alertSuccess.style.display = 'none';
                        }, 5000);
                    } else {
                        alert('Thank you! Our KEYFS Financial Advisor will connect with you shortly.');
                        form.reset();
                    }
                }, 1200);
            }
        });
    });
}

// 6. Dynamic Header Updates based on active session
function updateHeaderSession() {
    if (typeof dbGetActiveUser !== 'function') return;

    const user = dbGetActiveUser();
    const navActions = document.querySelector('.nav-actions');

    if (user && navActions) {
        // Re-write action buttons to show user greetings, dashboard link and sign-out
        navActions.innerHTML = `
            <div style="display:flex; align-items:center; gap:1rem;">
                <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:500;">Hello, <strong>${user.name.split(' ')[0]}</strong></span>
                <a href="dashboard.html" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">Dashboard</a>
                <button class="btn btn-primary" id="btn-header-signout" style="padding: 0.5rem 1.2rem; font-size: 0.85rem; background:#EF4444; box-shadow:none;">Sign Out</button>
            </div>
        `;

        // Bind Sign-out listener
        const signoutBtn = document.getElementById('btn-header-signout');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', () => {
                dbEndSession();
                alert('You have logged out of your E-Wealth session.');
                window.location.href = 'index.html';
            });
        }
    }
}

// Formatters
function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCurrency(val) {
    if (val >= 10000000) {
        return '₹' + (val / 10000000).toFixed(2) + ' Cr';
    }
    if (val >= 100000) {
        return '₹' + (val / 100000).toFixed(2) + ' Lakh';
    }
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
