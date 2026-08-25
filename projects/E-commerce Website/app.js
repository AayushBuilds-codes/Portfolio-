/**
 * Aura Tech - E-commerce Store Application Logic
 * Manages product listings, filtering, sorting, shopping cart operations,
 * checkout workflow, and the behavior-based recommendation system.
 */

// Product Database
const PRODUCTS = [
    {
        id: 1,
        name: "Nova Ring",
        category: "smart-wearables",
        categoryName: "Smart Wearables",
        price: 199.00,
        rating: 4.9,
        description: "Elegant biocompatible titanium ring tracking heart rate, sleep quality, and active metabolic cycles in real-time.",
        vectorType: "ring"
    },
    {
        id: 2,
        name: "Aura Glass",
        category: "smart-wearables",
        categoryName: "Smart Wearables",
        price: 499.00,
        rating: 4.8,
        description: "Ultralight augmented reality smart glasses with transparent micro-LED projection and neural eye-tracking focus.",
        vectorType: "glass"
    },
    {
        id: 3,
        name: "Neural Link v1",
        category: "neural-gear",
        categoryName: "Neural Gear",
        price: 799.00,
        rating: 4.7,
        description: "Non-invasive brain-computer interface headband translating focus levels into customizable machine actions.",
        vectorType: "neural"
    },
    {
        id: 4,
        name: "Holo Projector",
        category: "holograms",
        categoryName: "Holograms",
        price: 299.00,
        rating: 4.6,
        description: "Pocket-sized ambient light holographic emitter rendering interactive 3D desktop workspaces and widgets.",
        vectorType: "holo"
    },
    {
        id: 5,
        name: "Cyber Band",
        category: "smart-wearables",
        categoryName: "Smart Wearables",
        price: 149.00,
        rating: 4.5,
        description: "Haptic feedback fitness band delivering specialized frequency patterns for biological task reminders.",
        vectorType: "band"
    },
    {
        id: 6,
        name: "Zen Pods",
        category: "audio-gear",
        categoryName: "Audio Gear",
        price: 249.00,
        rating: 4.9,
        description: "Advanced active noise-cancellation earbuds utilizing sensory isolation frequency algorithms.",
        vectorType: "pods"
    },
    {
        id: 7,
        name: "Quantum Drive",
        category: "neural-gear",
        categoryName: "Neural Gear",
        price: 349.00,
        rating: 4.8,
        description: "Decentralized storage vault powered by local bio-encryption keys and molecular solid-state drives.",
        vectorType: "drive"
    },
    {
        id: 8,
        name: "Bio Watch",
        category: "smart-wearables",
        categoryName: "Smart Wearables",
        price: 299.00,
        rating: 4.7,
        description: "Futuristic health watch featuring galvanic skin response sensors to monitor cellular hydration and cortisol levels.",
        vectorType: "watch"
    },
    {
        id: 9,
        name: "Aura Band v2",
        category: "smart-wearables",
        categoryName: "Smart Wearables",
        price: 179.00,
        rating: 4.6,
        description: "Advanced fitness tracker with specialized bio-sensors tracking muscle tension and skin responses.",
        vectorType: "band"
    },
    {
        id: 10,
        name: "Apex Pods",
        category: "audio-gear",
        categoryName: "Audio Gear",
        price: 279.00,
        rating: 4.8,
        description: "Bone-conduction active audio gear with atmospheric dynamic noise protection and deep bass response.",
        vectorType: "pods"
    },
    {
        id: 11,
        name: "Cognitive Node",
        category: "neural-gear",
        categoryName: "Neural Gear",
        price: 699.00,
        rating: 4.9,
        description: "Advanced neural node stabilizer designed to induce cognitive relaxation, active focusing, and sleep sync.",
        vectorType: "neural"
    },
    {
        id: 12,
        name: "Holo Desk",
        category: "holograms",
        categoryName: "Holograms",
        price: 599.00,
        rating: 4.7,
        description: "Desktop holographic workstation project deck rendering high-resolution interactive screen interfaces.",
        vectorType: "holo"
    }
];

// Complementary category mapping for recommendation logic
const CROSS_SELL_MAP = {
    "smart-wearables": ["audio-gear", "neural-gear"],
    "neural-gear": ["smart-wearables", "holograms"],
    "audio-gear": ["smart-wearables"],
    "holograms": ["neural-gear", "audio-gear"]
};

// Global Store State
let state = {
    cart: JSON.parse(localStorage.getItem('auratech_cart')) || [],
    categoryFilter: 'all',
    searchQuery: '',
    sortBy: 'popular',
    userCategoryInterests: {
        "smart-wearables": 0,
        "neural-gear": 0,
        "audio-gear": 0,
        "holograms": 0
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCanvas();
    renderProducts();
    updateCartUI();
    updateRecommendations();
    setupEventListeners();
});

// Theme Configuration
function initTheme() {
    const isLight = localStorage.getItem('auratech_theme') === 'light';
    if (isLight) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

// Background Particle Visualizer (Interactive Neural Network)
function initCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Color based on theme mode variables
        const isDarkMode = document.body.classList.contains('dark-mode');
        ctx.fillStyle = isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.15)';
        ctx.strokeStyle = isDarkMode ? 'rgba(6, 182, 212, 0.05)' : 'rgba(8, 145, 178, 0.04)';

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// Render Products Catalog Grid
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    const noProductsMsg = document.getElementById('no-products-msg');
    const statCountEl = document.getElementById('items-count-stat');
    if (!productsGrid) return;

    // Apply Filter and Search
    let filtered = PRODUCTS.filter(p => {
        const matchesCategory = state.categoryFilter === 'all' || p.category === state.categoryFilter;
        const matchesSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                              p.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                              p.categoryName.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Apply Sort
    if (state.sortBy === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else {
        // default sorting by popularity/rating
        filtered.sort((a, b) => b.rating - a.rating);
    }

    // Render cards
    productsGrid.innerHTML = '';
    if (filtered.length === 0) {
        noProductsMsg.classList.remove('hidden');
    } else {
        noProductsMsg.classList.add('hidden');
        filtered.forEach(p => {
            const card = document.createElement('article');
            card.className = 'product-card glass';
            card.innerHTML = `
                <div class="product-img-box">
                    <span class="product-category-tag">${p.categoryName}</span>
                    <span class="rating-badge">${p.rating} ★</span>
                    <div class="vector-art ${p.vectorType}-art">
                        ${renderVectorSVG(p.vectorType)}
                    </div>
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div class="product-footer">
                        <span class="price">$${p.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" aria-label="Add ${p.name} to cart" onclick="addToCart(${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </button>
                    </div>
                </div>
            `;

            // Track category view interest on hover
            card.addEventListener('mouseenter', () => {
                trackUserInterest(p.category, 1);
            });

            productsGrid.appendChild(card);
        });
    }

    if (statCountEl) {
        statCountEl.textContent = filtered.length;
    }
}

// Generate dynamic HTML SVGs for premium design feel instead of image assets
function renderVectorSVG(type) {
    switch (type) {
        case 'ring':
            return `<div class="outer-ring"></div><div class="inner-glow"></div>`;
        case 'glass':
            return `<div class="lens"></div><div class="beam"></div>`;
        case 'neural':
            return `<div class="core"></div><div class="node node-1"></div><div class="node node-2"></div>`;
        case 'holo':
            return `<div class="emitter"></div><div class="projection"></div>`;
        case 'band':
            return `<div class="strap"></div><div class="screen"></div>`;
        case 'pods':
            return `<div class="pod pod-l"></div><div class="pod pod-r"></div>`;
        case 'drive':
            return `<div class="case"><div class="led"></div></div>`;
        case 'watch':
            return `<div class="bezel"><div class="screen-face"></div></div>`;
        default:
            return '';
    }
}

// Event Listeners Setup
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const themeBtn = document.getElementById('theme-toggle');
    const cartToggle = document.getElementById('cart-toggle-btn');
    const cartClose = document.getElementById('cart-close-btn');
    const cartOverlay = document.querySelector('.cart-drawer-overlay');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutClose = document.getElementById('checkout-close-btn');
    const checkoutOverlay = document.querySelector('.modal-overlay');
    const checkoutForm = document.getElementById('checkout-form');
    const successClose = document.getElementById('success-close-btn');

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim();
            renderProducts();
            updateRecommendations();
        });
    }

    // Category button filters
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.categoryFilter = btn.getAttribute('data-category');
            renderProducts();
            trackUserInterest(state.categoryFilter, 5); // Higher interest for active filtering
        });
    });

    // Sorting
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderProducts();
        });
    }

    // Theme Toggle
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const body = document.body;
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                localStorage.setItem('auratech_theme', 'light');
            } else {
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                localStorage.setItem('auratech_theme', 'dark');
            }
        });
    }

    // Cart Drawer Toggle
    if (cartToggle) {
        cartToggle.addEventListener('click', openCart);
    }
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // Clear Cart
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            clearCart();
            // Nova feedback trigger
            notifyNova("Cart cleared.");
        });
    }

    // Checkout Dialog
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }
            closeCart();
            openCheckout();
        });
    }
    if (checkoutClose) {
        checkoutClose.addEventListener('click', closeCheckout);
    }
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', closeCheckout);
    }

    // Submit Checkout Form
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processOrder();
        });
    }

    if (successClose) {
        successClose.addEventListener('click', () => {
            closeCheckout();
            resetCheckoutSteps();
        });
    }
}

// Shopping Cart Core Logic
window.addToCart = function(productId, silent = false) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.product.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    trackUserInterest(product.category, 10); // Heavy interest weight on adding to cart
    updateRecommendations();

    if (!silent) {
        openCart();
        notifyNova(`Added ${product.name} to the shopping cart.`);
    }
};

window.updateQty = function(productId, delta) {
    const item = state.cart.find(i => i.product.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.product.id !== productId);
    }

    saveCart();
    updateCartUI();
    updateRecommendations();
};

window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    saveCart();
    updateCartUI();
    updateRecommendations();
    notifyNova("Item removed from cart.");
};

function clearCart() {
    state.cart = [];
    saveCart();
    updateCartUI();
    updateRecommendations();
}

function saveCart() {
    localStorage.setItem('auratech_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const cartItemsEl = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const checkoutTotalEl = document.getElementById('checkout-total');
    const cartSubtotalEl = document.getElementById('cart-subtotal');

    // Update count badge
    const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.textContent = totalQty;

    // Render items
    if (cartItemsEl) {
        if (state.cart.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="empty-cart-view">
                    <svg viewBox="0 0 24 24"><path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.88 1.46h13.08c.88 0 1.65-.62 1.88-1.46l2.54-9.27L23 10c0-.55-.45-1-1-1h-4.79zM9 9l3-4.5L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/></svg>
                    <p>Your biometric cart is empty</p>
                </div>
            `;
        } else {
            cartItemsEl.innerHTML = '';
            state.cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-img">
                        <div class="vector-art ${item.product.vectorType}-art">
                            ${renderVectorSVG(item.product.vectorType)}
                        </div>
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.product.name}</h4>
                        <span class="price">$${item.product.price.toFixed(2)}</span>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQty(${item.product.id}, -1)">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQty(${item.product.id}, 1)">+</button>
                    </div>
                    <button class="cart-remove-btn" aria-label="Remove item" onclick="removeFromCart(${item.product.id})">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                `;
                cartItemsEl.appendChild(itemEl);
            });
        }
    }

    // Calculate Subtotal
    const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (checkoutTotalEl) checkoutTotalEl.textContent = `$${subtotal.toFixed(2)}`;
}

// Interest Tracking (Behavior-Driven engine)
function trackUserInterest(category, weight) {
    if (state.userCategoryInterests[category] !== undefined) {
        state.userCategoryInterests[category] += weight;
    }
}

// Update recommendations dynamically
function updateRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    // Filter out items already in the cart
    const cartItemIds = state.cart.map(i => i.product.id);
    let candidates = PRODUCTS.filter(p => !cartItemIds.includes(p.id));

    let recommended = [];

    if (state.cart.length > 0) {
        // Cross-selling: recommend items from complementary categories mapping
        const cartCategories = state.cart.map(i => i.product.category);
        let targetCategories = [];
        cartCategories.forEach(cat => {
            const complementary = CROSS_SELL_MAP[cat] || [];
            targetCategories.push(...complementary);
        });

        // Filter candidates matching target complementary categories
        recommended = candidates.filter(p => targetCategories.includes(p.category));
    }

    // Fallback: If no recommendations generated or cart is empty, use user interest tracker
    if (recommended.length === 0) {
        // Find category with highest interest score
        let favoriteCat = 'smart-wearables';
        let maxScore = -1;
        for (const [cat, score] of Object.entries(state.userCategoryInterests)) {
            if (score > maxScore) {
                maxScore = score;
                favoriteCat = cat;
            }
        }
        
        // Filter by user interest, or default to highest rated items
        recommended = candidates.filter(p => p.category === favoriteCat);
    }

    // Final fallback: just recommend top rated candidates
    if (recommended.length === 0) {
        recommended = candidates.slice(0, 3);
    } else {
        // Shuffle/sort recommendations by rating and slice to top 3
        recommended.sort((a, b) => b.rating - a.rating);
        recommended = recommended.slice(0, 3);
    }

    // Render recommendations
    container.innerHTML = '';
    recommended.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card glass';
        card.innerHTML = `
            <div class="product-img-box">
                <span class="product-category-tag">${p.categoryName}</span>
                <span class="rating-badge">${p.rating} ★</span>
                <div class="vector-art ${p.vectorType}-art">
                    ${renderVectorSVG(p.vectorType)}
                </div>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <div class="product-footer">
                    <span class="price">$${p.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" aria-label="Add ${p.name} to cart" onclick="addToCart(${p.id})">
                        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// UI Modals togglers
function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
}

function openCheckout() {
    document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('open');
}

function resetCheckoutSteps() {
    document.getElementById('step-form').classList.remove('hidden');
    document.getElementById('step-processing').classList.add('hidden');
    document.getElementById('step-success').classList.add('hidden');
    document.getElementById('checkout-form').reset();
}

// Processing order mock animation
function processOrder() {
    const stepForm = document.getElementById('step-form');
    const stepProcessing = document.getElementById('step-processing');
    const stepSuccess = document.getElementById('step-success');
    const orderIdEl = document.getElementById('order-id');

    stepForm.classList.add('hidden');
    stepProcessing.classList.remove('hidden');

    // Simulate authorization wait (2.5 seconds)
    setTimeout(() => {
        stepProcessing.classList.add('hidden');
        stepSuccess.classList.remove('hidden');
        
        // Generate random order key
        const randomKey = `#AT-${Math.floor(10000 + Math.random() * 90000)}`;
        if (orderIdEl) orderIdEl.textContent = randomKey;

        // Clear storefront state
        clearCart();
        notifyNova(`Order placed successfully! Reference code is ${randomKey}.`);
    }, 2500);
}

// Notify Nova assistant of state changes
function notifyNova(message) {
    if (window.Nova && typeof window.Nova.onStoreEvent === 'function') {
        window.Nova.onStoreEvent(message);
    }
}

// Export state and handlers to window for Nova helper calls
window.AuraStore = {
    state,
    PRODUCTS,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    clearCart,
    addToCart,
    filterCategory: (cat) => {
        const catBtns = document.querySelectorAll('.category-btn');
        catBtns.forEach(btn => {
            if (btn.getAttribute('data-category') === cat) {
                btn.click();
            }
        });
    },
    searchProducts: (query) => {
        const input = document.getElementById('search-input');
        if (input) {
            input.value = query;
            input.dispatchEvent(new Event('input'));
        }
    }
};
