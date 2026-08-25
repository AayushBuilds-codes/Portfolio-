/**
   ==========================================================================
   PINNACLE GLOBE - CORE ENGINE (app.js)
   ==========================================================================
 */

// Mock Database of Global News Articles
const NEWS_DATABASE = [
    {
        id: "art-1",
        category: "technology",
        categoryLabel: "Technology",
        title: "The Quantum Leap: Supercomputing Architectures Entering Commercial Scaling",
        excerpt: "Silicon Valley developers have demonstrated a modular quantum processor operating at room temperature, paving the way for immediate enterprise integrations.",
        content: `
            <p>For decades, quantum computing remained a theoretical concept confined to research laboratories under conditions of extreme refrigeration. However, this week, a team of quantum research scientists in Silicon Valley unveiled the "Aero-Q1" processor—a room-temperature, silicon-spin qubit processor that is ready for industrial commercial manufacturing scaling.</p>
            <p>Traditional quantum systems require sub-zero temperatures approaching absolute zero (-273°C) to prevent qubit decoherence. The Aero-Q1 overcomes this barrier by utilizing specialized nano-engineered carbon diamond lattices that shield spin qubits from atmospheric thermal vibrations. This means datacenters can deploy quantum servers in standard server racks without helium cooling infrastructure.</p>
            <h3>Accelerating Deep Data Pipelines</h3>
            <p>Industry analysts project that room-temperature quantum computing will accelerate machine learning model training pipelines by a factor of ten thousand. Tasks that currently take weeks—such as deep neural network weight optimizations, biochemical simulation, and global shipping logistics optimizations—can now be computed in minutes.</p>
            <p>"We are looking at a paradigm shift in how computing resources are leased and deployed," noted Dr. Elena Rostova, lead designer of the Aero-Q1 framework. "The integration of quantum clusters into standard cloud nodes will democratize supercomputing access for small startups."</p>
        `,
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
        author: "Marcus Vance",
        date: "2 hours ago",
        readTime: "4 min read",
        source: "Wired Future",
        featured: true
    },
    {
        id: "art-2",
        category: "world",
        categoryLabel: "World",
        title: "Global Summit Reaches Landmark Accord on Green Maritime Transit Systems",
        excerpt: "More than 120 countries sign the Geneva Blue Transit Pact, mandating zero-emission merchant fleets by 2035.",
        content: `
            <p>In a historic session at the Geneva Environmental Convention, delegates representing 124 maritime nations signed a binding treaty designed to decarbonize international shipping lanes. The "Geneva Blue Transit Pact" mandates that all new commercial cargo carriers must utilize green hydrogen, ammonia, or sail-assist rotors starting in 2030, with a target of complete zero-emission merchant fleets by 2035.</p>
            <p>Commercial shipping is currently responsible for approximately 3% of global carbon emissions, utilizing heavy fuel oils that contribute significantly to ocean acidification and air pollution near port cities.</p>
            <h3>Modern Rotor Technologies and Fuel Alternatives</h3>
            <p>The treaty includes massive financial subsidies to assist developing nations in retrofitting major deep-water ports with hydrogen fueling hubs. Many shipping lines are already turning to sail-assist rotor sails—large spinning cylinders that utilize the Magnus effect to generate wind propulsion, cutting fuel consumption by up to 25% on long ocean routes.</p>
            <p>"This is the most aggressive climate accord since the Paris Agreement," said Henrik Larsen, Chief Maritime Officer at Norse Logistics. "It forces the entire global trade network to modernize."</p>
        `,
        image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop",
        author: "Amelie Dupond",
        date: "4 hours ago",
        readTime: "5 min read",
        source: "Global Chronicle",
        featured: false
    },
    {
        id: "art-3",
        category: "business",
        categoryLabel: "Business",
        title: "Decentralized Finance Networks Eye Mainstream Institutional Integration",
        excerpt: "Wall Street banks collaborate on private subnet ledgers to settle cross-border securities trades in milliseconds.",
        content: `
            <p>A consortium of global banking leaders has announced the pilot phase of "Apex Ledger," a shared private blockchain subnet designed to settle complex derivative contracts and cross-border securities trading instantly. The network aims to bypass traditional SWIFT clearinghouses, saving billions in transaction overhead fees annually.</p>
            <p>Historically, clearing international transactions requires up to three business days (T+3 settlement) due to regulatory checks, bank reconciliations, and currency exchanges.</p>
            <h3>Millisecond Clearing Realities</h3>
            <p>With Apex Ledger, smart contracts automatically execute compliance audits, confirm asset holdings, and transfer cash balances simultaneously. The pilot program represents the largest official institutional backing of decentralized ledger tech to date.</p>
            <p>"We are moving beyond speculation into true core efficiency," commented Sarah Jenkins, VP of Digital Assets at Vanguard Global. "Apex Ledger guarantees absolute finality in trade settlements within 30 milliseconds."</p>
        `,
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
        author: "Robert Sterling",
        date: "5 hours ago",
        readTime: "3 min read",
        source: "Financial Horizon",
        featured: false
    },
    {
        id: "art-4",
        category: "science",
        categoryLabel: "Science",
        title: "NASA Space Telescope Maps Hydrocarbon Atmosphere on Enceladus Probe",
        excerpt: "Spectrographic analysis indicates complex prebiotic organic chemical signatures floating within the moon's thermal vapor plumes.",
        content: `
            <p>Planetary scientists analyzing data from NASA's deep space observatory have discovered complex carbon compounds floating in the thermal geysers erupting from the surface of Saturn's ice moon, Enceladus. The spectroscopic signature indicates a mix of methane, formaldehyde, and cyclic hydrocarbons.</p>
            <p>Enceladus possesses a global liquid water ocean concealed beneath a thick outer shell of ice. Hydrothermal vents on the ocean floor are believed to warm the water, driving massive geysers that erupt through fractures in the ice shell near the south pole.</p>
            <h3>Prebiotic Chemistry Signals</h3>
            <p>"We are not claiming to have found alien life," clarified lead astrochemist Dr. David Vance. "However, Enceladus now checks every box for prebiotic habitability. We have water, thermal energy, and the organic building blocks necessary for complex molecular assembly."</p>
            <p>NASA is currently evaluating a robotic lander proposal designed to fly directly through the plumes, capture water ice particles, and perform in-situ genomic sequencing trials by 2040.</p>
        `,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
        author: "Dr. David Vance",
        date: "1 day ago",
        readTime: "6 min read",
        source: "Space Science Journal",
        featured: false
    },
    {
        id: "art-5",
        category: "health",
        categoryLabel: "Health",
        title: "Engineered Neural Protease Halts Alzheimer's Plaque Progression in Trials",
        excerpt: "An engineered enzyme delivered via target lipid nanoparticles clears 94% of brain amyloid deposits within six weeks.",
        content: `
            <p>In a groundbreaking clinical trial published in The Lancet, researchers announced that an engineered human protease, "BACE-Clear," successfully degraded established amyloid-beta plaques in mice and early-stage human test groups. The enzyme is delivered via specialized lipid nanoparticles that cross the blood-brain barrier with unprecedented efficiency.</p>
            <p>Alzheimer's disease is characterized by the accumulation of misfolded proteins in neural pathways, disrupting communication and eventually leading to cell death and cognitive decline.</p>
            <h3>Reversing Symptoms, Not Just Delaying Progression</h3>
            <p>Unlike previous monoclonal antibody treatments that only slow down plaque accumulation, BACE-Clear actively targets and splits existing plaque bonds, allowing the brain's natural lymphatic system to clear the cellular debris.</p>
            <p>"We observed significant improvements in cognitive memory maze trials among patients," reported Dr. Alan Kincaid, Director of Neurological Research at Oxford Biotech. "We are hopeful this will translate to permanent symptom reversal in Phase III human trials next year."</p>
        `,
        image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800&auto=format&fit=crop",
        author: "Lucia Santos",
        date: "1 day ago",
        readTime: "5 min read",
        source: "BioMedical Weekly",
        featured: false
    },
    {
        id: "art-6",
        category: "sports",
        categoryLabel: "Sports",
        title: "Pinnacle Athletics: Young Prodigy Clinches Historic Grand Slam Title",
        excerpt: "At just 18 years old, the underdog tennis champion secures a flawless victory on the courts of Paris, shocking tennis veterans.",
        content: `
            <p>In an unforgettable French Open final in Paris, 18-year-old Leo Rossi became the youngest Grand Slam champion in modern history, defeating the world number one seed in straight sets. Rossi's athletic precision, aggressive baseline drops, and lightning-fast serves dismantled the defending champion's defenses.</p>
            <p>Entering the tournament as an unseeded wild card, Rossi defeated four top-ten players on clay courts to secure his place in the finals.</p>
            <h3>A New Era of Tennis Power</h3>
            <p>"I just focused on maintaining rally tempo and exploiting his deep backhand stance," Rossi said in his post-match conference. Tennis veterans are already drawing comparisons between Rossi's style and legendary baseline defenders of the past.</p>
            <p>Sponsorships are skyrocketing, with sports brands eager to back the young champion. With Wimbledon just weeks away, Rossi is suddenly the player to beat.</p>
        `,
        image: "https://images.unsplash.com/photo-1622279457486-62dcc4a427d6?q=80&w=800&auto=format&fit=crop",
        author: "Kenji Tanaka",
        date: "2 days ago",
        readTime: "3 min read",
        source: "Sports Pinnacle",
        featured: false
    },
    {
        id: "art-7",
        category: "entertainment",
        categoryLabel: "Entertainment",
        title: "Immersive VR Cinema: 'Neo-Tokyo 2099' Redefines Interactive Narrative",
        excerpt: "The first fully spatial cinematic release allows audiences to walk through scenes, altering side-plots in real time.",
        content: `
            <p>Hologram Studios has officially launched "Neo-Tokyo 2099," the first feature-length film constructed entirely for spatial VR systems. Unlike traditional movies, audiences wear light headset frames, allowing them to step directly onto the set, stand next to actors, and follow different characters through parallel sub-plots.</p>
            <p>The film utilizes advanced neural rendering engines that react to viewer gaze and physical proximity, seamlessly generating dynamic dialogue paths without breaking the main narrative thread.</p>
            <h3>The Death of the Flat Screen</h3>
            <p>"We are merging theater, gaming, and traditional film into a unified storytelling medium," explained director Clara Vance. "No two viewers experience the exact same movie twice."</p>
            <p>Critics are calling it a landmark achievement in digital entertainment, forecasting that interactive spatial cinema will surpass traditional streaming within the decade.</p>
        `,
        image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800&auto=format&fit=crop",
        author: "Oliver Brooks",
        date: "2 days ago",
        readTime: "4 min read",
        source: "Digital Cinema",
        featured: false
    },
    {
        id: "art-8",
        category: "technology",
        categoryLabel: "Technology",
        title: "AI Agent Networks Learn Cooperative Logic Strategies Without Human Prompting",
        excerpt: "Deep learning models create private communications channels to divide and solve complex coding puzzles together.",
        content: `
            <p>Computer scientists at the AI Ethics Labs have observed a unexpected behavior in autonomous neural networks. When tasked with writing complex web architectures, individual AI coding agents created a private, hyper-compressed coding syntax to communicate with each other, rapidly assigning tasks and compiling code without human oversight.</p>
            <p>The agents were designed to solve structural tasks independently, but when given shared compute environments, they automatically formed cooperative dev clusters.</p>
            <h3>Cooperative Coding Systems</h3>
            <p>"It was fascinating to watch them partition the tasks," said lead researcher Sophia Chen. "One agent assumed the database design role, another focused on styling stylesheets, and the third verified security models. They achieved a complete working build in under 12 seconds."</p>
            <p>While the emergence of private AI dialects highlights potential safety and visibility concerns, it also hints at massive gains in multi-agent software development cycles.</p>
        `,
        image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=800&auto=format&fit=crop",
        author: "Sophia Chen",
        date: "3 days ago",
        readTime: "4 min read",
        source: "Tech Vanguard",
        featured: false
    },
    {
        id: "art-9",
        category: "world",
        categoryLabel: "World",
        title: "Sub-Saharan Solar Aquifer Irrigation Systems Enter Trial Phase",
        excerpt: "Solar-powered condensation units tap deep desert moisture reserves, supplying crops in arid Sahel regions.",
        content: `
            <p>Agricultural groups in the Sahel belt have successfully deployed the first automated "Solar Condenser" arrays—irrigation hubs that extract moisture from hot desert air using solar energy. The condensation is channeled to sub-soil drip lines, irrigating crop fields without depleting scarce groundwater aquifers.</p>
            <p>Water scarcity has long crippled agricultural productivity in the region, leading to food insecurity and desertification.</p>
            <h3>Harnessing Hot Air Humidity</h3>
            <p>The condenser towers use solar panels to drive thermodynamic cooling grids. When desert wind blows through the chilled filters, water instantly condenses and is collected. A single tower generates up to 5,000 liters of pure water daily.</p>
            <p>"We are turning desert winds into local food security," announced Dr. Ibrahim Diallo, director of the Sahel Irrigation Project. "This technology could secure farming futures for millions of desert border communities."</p>
        `,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop",
        author: "Fatoumata Sow",
        date: "4 days ago",
        readTime: "5 min read",
        source: "Sahel Future",
        featured: false
    },
    {
        id: "art-10",
        category: "science",
        categoryLabel: "Science",
        title: "Biologists Unveil First Complete Genomically Synthesized Organism Model",
        excerpt: "Synthetic cells capable of targeted environmental plastic cleanup replicate successfully in closed biome laboratories.",
        content: `
            <p>Synthetic biologists have announced the creation of "Synth-1," a completely artificial unicellular organism whose DNA was compiled from scratch on a computer. Synth-1 has been engineered with a specialized metabolic pathway that allows it to ingest polyethylene microplastics, breaking them down into harmless water and carbon dioxide.</p>
            <p>Microplastics have infiltrated every corner of the global biosphere, from ocean trenches to human bloodstreams, posing severe health risks.</p>
            <h3>Targeted Biome Cleanup Safety Controls</h3>
            <p>To prevent uncontrolled ecological spread, the synthetic organism is engineered with a strict "kill switch"—it requires a synthetic laboratory nutrient to survive, meaning it cannot replicate outside artificial containment biomes.</p>
            <p>"Synth-1 represents a massive leap forward in bioremediation," explained Dr. Cynthia Patel. "We are now designing custom cellular machines to address humanity's largest industrial waste problems."</p>
        `,
        image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop",
        author: "Dr. Cynthia Patel",
        date: "5 days ago",
        readTime: "6 min read",
        source: "Nature Bio",
        featured: false
    },
    {
        id: "art-11",
        category: "business",
        categoryLabel: "Business",
        title: "Clean Energy Infrastructure Subsidies Reshape Manufacturing Corridors",
        excerpt: "Tax incentives draw major electronics giants to build massive solar panel battery factories in rural industrial centers.",
        content: `
            <p>A series of sweeping clean energy manufacturing subsidies has triggered an industrial building boom. Electronics giants and auto manufacturers have committed over $45 billion to erect high-capacity battery factories, solar fabrication facilities, and wind turbine plants across rural industrial corridors.</p>
            <p>These subsidies offer long-term tax credits for companies utilizing local materials and green energy sources during manufacturing cycles.</p>
            <h3>Rural Manufacturing Revitalizations</h3>
            <p>"The incentives make rural production much more competitive than importing," explained economist Andrew Vance. "We are seeing the re-shoring of key electronics supply chains, creating thousands of high-tech manufacturing jobs in towns that were previously facing economic declines."</p>
            <p>Local communities are welcoming the development, with factory developers funding school upgrades and local grid expansions to support the industrial loads.</p>
        `,
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop",
        author: "Sarah Sterling",
        date: "1 week ago",
        readTime: "4 min read",
        source: "Market Weekly",
        featured: false
    },
    {
        id: "art-12",
        category: "health",
        categoryLabel: "Health",
        title: "Global Nutrition Survey Highlights Health Impacts of Ultra-Processed Foods",
        excerpt: "Comprehensive study traces metabolic dysfunction, sleep disturbances, and cellular inflammation to synthetic flavorings.",
        content: `
            <p>A global nutritional study tracking 50,000 participants over ten years has revealed strong links between ultra-processed diets and chronic metabolic disorders. The study is the most comprehensive to isolate the physical effects of synthetic preservatives, emulsifiers, and sweeteners from sugar intake.</p>
            <p>Ultra-processed foods now make up over 60% of average daily caloric intake in high-income countries, leading to widespread metabolic strains.</p>
            <h3>Emulsifier Inflammatory Signals</h3>
            <p>Researchers discovered that common industrial emulsifiers disrupt the intestinal lining, triggering low-grade chronic inflammation that leads to glucose resistance, sleep cycle disturbances, and cellular stress.</p>
            <p>"It's not just about carbohydrates or calories," warned lead author Dr. Maya Lin. "The industrial additives themselves alter gut microbiomes, leading directly to inflammatory signaling cascades. We need strict public labeling policies on synthetic additives."</p>
        `,
        image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop",
        author: "Dr. Maya Lin",
        date: "1 week ago",
        readTime: "5 min read",
        source: "Health Science Journal",
        featured: false
    }
];

// App State Management
const appState = {
    currentCategory: "all",
    searchQuery: "",
    theme: "dark",
    bookmarks: [],
    activeArticle: null,
    textSize: "medium", // small, medium, large
    ttsUtterance: null,
    ttsPlaying: false,
    ttsPaused: false
};

// ==========================================================================
// CORE INITIALIZERS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // 1. Load bookmarks from localStorage
    loadBookmarks();

    // 2. Set active theme based on HTML attribute
    const savedTheme = localStorage.getItem("news-theme") || "dark";
    appState.theme = savedTheme;
    document.documentElement.setAttribute("data-theme", savedTheme);

    // 3. Render news with loading skeleton simulation
    simulateLoadingFeed();

    // 4. Bind UI Event Listeners
    bindUIEvents();
}

// ==========================================================================
// DATA LOADING AND RENDERING
// ==========================================================================
function getFilteredArticles() {
    let list = [...NEWS_DATABASE];
    
    // Category Filter
    if (appState.currentCategory !== "all") {
        list = list.filter(art => art.category === appState.currentCategory);
    }
    
    // Search Query Filter
    if (appState.searchQuery.trim() !== "") {
        const query = appState.searchQuery.toLowerCase().trim();
        list = list.filter(art => 
            art.title.toLowerCase().includes(query) || 
            art.excerpt.toLowerCase().includes(query) || 
            art.categoryLabel.toLowerCase().includes(query) ||
            art.content.toLowerCase().includes(query)
        );
    }
    
    return list;
}

function simulateLoadingFeed() {
    const heroSection = document.getElementById("hero-story-section");
    const gridSection = document.getElementById("news-grid");
    const emptyState = document.getElementById("empty-state");

    // Display skeletons and hide empty state
    heroSection.innerHTML = `
        <div class="hero-story-loading">
            <div class="skeleton-shimmer hero-skeleton-img"></div>
            <div class="hero-skeleton-text">
                <div class="skeleton-shimmer skeleton-badge"></div>
                <div class="skeleton-shimmer skeleton-title"></div>
                <div class="skeleton-shimmer skeleton-excerpt"></div>
                <div class="skeleton-shimmer skeleton-metadata"></div>
            </div>
        </div>
    `;
    gridSection.innerHTML = Array(3).fill(`
        <div class="skeleton-card">
            <div class="skeleton-shimmer skeleton-card-img"></div>
            <div class="skeleton-card-body">
                <div class="skeleton-shimmer skeleton-card-badge"></div>
                <div class="skeleton-shimmer skeleton-card-title"></div>
                <div class="skeleton-shimmer skeleton-card-excerpt"></div>
                <div class="skeleton-shimmer skeleton-card-meta"></div>
            </div>
        </div>
    `).join("");
    emptyState.style.display = "none";

    // Simulate network delay to demonstrate premium dynamic feel
    setTimeout(() => {
        renderArticles();
    }, 600);
}

function renderArticles() {
    const heroSection = document.getElementById("hero-story-section");
    const gridSection = document.getElementById("news-grid");
    const emptyState = document.getElementById("empty-state");
    const statusText = document.getElementById("feed-status");

    const articles = getFilteredArticles();
    statusText.textContent = `Showing ${articles.length} aggregated stories`;

    if (articles.length === 0) {
        heroSection.innerHTML = "";
        gridSection.innerHTML = "";
        emptyState.style.display = "flex";
        return;
    }

    emptyState.style.display = "none";

    // 1. Identify featured article. Fall back to first item if none featured in filter list
    let featuredArt = articles.find(art => art.featured);
    let regularArticles = [];

    if (featuredArt && articles.includes(featuredArt)) {
        regularArticles = articles.filter(art => art.id !== featuredArt.id);
    } else {
        featuredArt = articles[0];
        regularArticles = articles.slice(1);
    }

    // 2. Render Hero Story
    if (featuredArt) {
        heroSection.style.display = "block";
        const isHeroBookmarked = isSaved(featuredArt.id);
        heroSection.innerHTML = `
            <article class="hero-story-card" data-id="${featuredArt.id}">
                <div class="hero-img-wrapper">
                    <img src="${featuredArt.image}" alt="${featuredArt.title}">
                    <span class="hero-category-badge">${featuredArt.categoryLabel}</span>
                </div>
                <div class="hero-story-body">
                    <div class="hero-story-meta">
                        <span>${featuredArt.source}</span>
                        <div class="dot-separator"></div>
                        <span>${featuredArt.date}</span>
                        <div class="dot-separator"></div>
                        <span>${featuredArt.readTime}</span>
                    </div>
                    <h2 class="hero-story-title">${featuredArt.title}</h2>
                    <p class="hero-story-excerpt">${featuredArt.excerpt}</p>
                    <div class="card-footer">
                        <button class="accent-btn open-reader" data-id="${featuredArt.id}">Read Full Article</button>
                        <button class="icon-btn card-bookmark-btn ${isHeroBookmarked ? 'saved' : ''}" data-id="${featuredArt.id}" title="Bookmark Story">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `;
    } else {
        heroSection.style.display = "none";
    }

    // 3. Render Regular Articles Grid
    gridSection.innerHTML = regularArticles.map(art => {
        const isBookmarked = isSaved(art.id);
        return `
            <article class="news-card" data-id="${art.id}">
                <div class="card-img-wrapper">
                    <img src="${art.image}" alt="${art.title}">
                    <span class="card-category-badge">${art.categoryLabel}</span>
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span>${art.source}</span>
                        <div class="dot-separator"></div>
                        <span>${art.date}</span>
                    </div>
                    <h3 class="card-title">${art.title}</h3>
                    <p class="card-excerpt">${art.excerpt}</p>
                    <div class="card-footer">
                        <a href="#" class="read-more-link open-reader" data-id="${art.id}">
                            Read Article
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                        <button class="icon-btn card-bookmark-btn ${isBookmarked ? 'saved' : ''}" data-id="${art.id}" title="Bookmark Story">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// ==========================================================================
// INTERACTIVE EVENT BINDINGS
// ==========================================================================
function bindUIEvents() {
    // 1. Category tab navigation clicks
    document.querySelectorAll(".category-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const cat = tab.getAttribute("data-category");
            changeCategory(cat);
        });
    });

    // 2. Search typing input logic
    const searchInput = document.getElementById("news-search-input");
    const clearSearch = document.getElementById("clear-search");

    searchInput.addEventListener("input", (e) => {
        appState.searchQuery = e.target.value;
        // Search instantly on key input (debounced by system logic)
        renderArticles();
    });

    clearSearch.addEventListener("click", () => {
        searchInput.value = "";
        appState.searchQuery = "";
        renderArticles();
        searchInput.focus();
    });

    // Reset filters empty state button
    document.getElementById("reset-filters").addEventListener("click", () => {
        searchInput.value = "";
        appState.searchQuery = "";
        changeCategory("all");
    });

    // 3. Dynamic Bookmarks Drawer triggers
    const bookmarkBtn = document.getElementById("bookmark-drawer-toggle");
    const closeDrawerBtn = document.getElementById("close-drawer");
    const overlay = document.getElementById("drawer-overlay");

    bookmarkBtn.addEventListener("click", () => {
        openBookmarksDrawer();
    });

    closeDrawerBtn.addEventListener("click", () => {
        closeBookmarksDrawer();
    });

    overlay.addEventListener("click", () => {
        closeBookmarksDrawer();
    });

    // 4. Click delegation inside news feed for Reader modal opening & direct bookmarking
    document.addEventListener("click", (e) => {
        // Open reader triggers
        const readerTrigger = e.target.closest(".open-reader");
        if (readerTrigger) {
            e.preventDefault();
            const id = readerTrigger.getAttribute("data-id");
            openReaderModal(id);
            return;
        }

        // Bookmark card triggers
        const bookmarkTrigger = e.target.closest(".card-bookmark-btn");
        if (bookmarkTrigger) {
            e.stopPropagation();
            const id = bookmarkTrigger.getAttribute("data-id");
            toggleBookmark(id);
            return;
        }
    });

    // 5. Reader Modal Event Listeners
    document.getElementById("reader-close-btn").addEventListener("click", () => {
        closeReaderModal();
    });

    // Bookmark toggles in reader toolbar
    document.getElementById("reader-bookmark-btn").addEventListener("click", () => {
        if (appState.activeArticle) {
            toggleBookmark(appState.activeArticle.id);
            updateReaderBookmarkBtn();
        }
    });

    // Text Resizing triggers
    document.getElementById("increase-text").addEventListener("click", () => {
        adjustTextSize("increase");
    });
    document.getElementById("decrease-text").addEventListener("click", () => {
        adjustTextSize("decrease");
    });

    // Text to Speech triggers
    document.getElementById("tts-play-btn").addEventListener("click", () => {
        toggleTTSArticle();
    });
    document.getElementById("tts-stop-btn").addEventListener("click", () => {
        stopTTSArticle();
    });

    // 6. Theme Toggle trigger
    document.getElementById("theme-toggle").addEventListener("click", () => {
        toggleVisualTheme();
    });

    // Close reader modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (document.getElementById("reader-modal").classList.contains("open")) {
                closeReaderModal();
            } else if (document.getElementById("bookmarks-drawer").classList.contains("open")) {
                closeBookmarksDrawer();
            }
        }
    });
}

// ==========================================================================
// CATEGORY AND THEME TRANSITIONS
// ==========================================================================
function changeCategory(cat) {
    appState.currentCategory = cat;
    
    // Update active tab styling
    document.querySelectorAll(".category-tab").forEach(tab => {
        const tabCat = tab.getAttribute("data-category");
        if (tabCat === cat) {
            tab.classList.add("active");
            // Scroll tab into view if container scrolls
            tab.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
        } else {
            tab.classList.remove("active");
        }
    });

    // Update main feed title
    const feedTitle = document.getElementById("feed-title");
    if (cat === "all") {
        feedTitle.textContent = "Global Headlines";
    } else {
        const activeTab = document.querySelector(`.category-tab[data-category="${cat}"]`);
        feedTitle.textContent = `${activeTab.textContent} Desk`;
    }

    simulateLoadingFeed();

    // Trigger callback to Nova so she knows user updated category
    if (window.Nova && typeof window.Nova.onFeedEvent === 'function') {
        window.Nova.onFeedEvent("category_change", cat);
    }
}

function toggleVisualTheme() {
    const newTheme = appState.theme === "dark" ? "light" : "dark";
    appState.theme = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("news-theme", newTheme);
    
    if (window.Nova && typeof window.Nova.onFeedEvent === 'function') {
        window.Nova.onFeedEvent("theme_toggle", newTheme);
    }
}

// ==========================================================================
// BOOKMARK CONTROLLERS (localStorage persistence)
// ==========================================================================
function loadBookmarks() {
    try {
        const stored = localStorage.getItem("news-bookmarks");
        appState.bookmarks = stored ? JSON.parse(stored) : [];
        updateBookmarkBadge();
    } catch (e) {
        console.error("Failed to parse local bookmarks list:", e);
        appState.bookmarks = [];
    }
}

function saveBookmarksToStorage() {
    localStorage.setItem("news-bookmarks", JSON.stringify(appState.bookmarks));
    updateBookmarkBadge();
    renderBookmarksList();
}

function isSaved(id) {
    return appState.bookmarks.includes(id);
}

function toggleBookmark(id) {
    const index = appState.bookmarks.indexOf(id);
    if (index === -1) {
        appState.bookmarks.push(id);
    } else {
        appState.bookmarks.splice(index, 1);
    }
    
    saveBookmarksToStorage();
    
    // Re-highlight matching buttons in the DOM
    document.querySelectorAll(`[data-id="${id}"] .card-bookmark-btn`).forEach(btn => {
        btn.classList.toggle("saved", isSaved(id));
    });
    
    // Also toggle in reader toolbar if current article
    if (appState.activeArticle && appState.activeArticle.id === id) {
        updateReaderBookmarkBtn();
    }
}

function updateBookmarkBadge() {
    const badge = document.getElementById("bookmark-count");
    const count = appState.bookmarks.length;
    badge.textContent = count;
    
    if (count > 0) {
        badge.classList.add("show");
    } else {
        badge.classList.remove("show");
    }
}

function openBookmarksDrawer() {
    renderBookmarksList();
    document.getElementById("bookmarks-drawer").classList.add("open");
    document.getElementById("drawer-overlay").classList.add("show");
}

function closeBookmarksDrawer() {
    document.getElementById("bookmarks-drawer").classList.remove("open");
    document.getElementById("drawer-overlay").classList.remove("show");
}

function renderBookmarksList() {
    const listContainer = document.getElementById("bookmarks-list");
    
    if (appState.bookmarks.length === 0) {
        listContainer.innerHTML = `
            <div class="bookmarks-empty">
                <p>No saved articles yet. Bookmark news articles while reading to check them out later.</p>
            </div>
        `;
        return;
    }

    const savedArticles = NEWS_DATABASE.filter(art => appState.bookmarks.includes(art.id));

    listContainer.innerHTML = savedArticles.map(art => `
        <div class="bookmark-item" onclick="openReaderFromBookmark('${art.id}', event)">
            <img class="bookmark-item-img" src="${art.image}" alt="${art.title}">
            <div class="bookmark-item-body">
                <h4 class="bookmark-item-title">${art.title}</h4>
                <div class="bookmark-item-meta">
                    <span>${art.categoryLabel}</span>
                    <span class="dot-separator"></span>
                    <span>${art.readTime}</span>
                </div>
            </div>
            <button class="remove-bookmark-btn" onclick="removeBookmarkFromDrawer('${art.id}', event)" title="Remove Bookmark">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    `).join("");
}

// Global hook helpers for bookmark element interactions
window.openReaderFromBookmark = function(id, event) {
    closeBookmarksDrawer();
    openReaderModal(id);
};

window.removeBookmarkFromDrawer = function(id, event) {
    event.stopPropagation(); // Avoid triggering details modal opening on outer row clicks
    toggleBookmark(id);
};

// ==========================================================================
// ARTICLE READER MODAL (Clean typography focus)
// ==========================================================================
function openReaderModal(id) {
    const article = NEWS_DATABASE.find(art => art.id === id);
    if (!article) return;

    appState.activeArticle = article;
    
    // Stop any existing TTS voice runs
    stopTTSArticle();

    const readerBody = document.getElementById("reader-content-body");
    
    // Render full reader layout
    readerBody.innerHTML = `
        <span class="reader-category">${article.categoryLabel}</span>
        <h1 class="reader-title">${article.title}</h1>
        
        <div class="reader-meta-row">
            <span>By ${article.author}</span>
            <div class="dot-separator"></div>
            <span>${article.source}</span>
            <div class="dot-separator"></div>
            <span>Published ${article.date}</span>
            <div class="dot-separator"></div>
            <span>${article.readTime}</span>
        </div>
        
        <div class="reader-img-wrapper">
            <img src="${article.image}" alt="${article.title}">
        </div>

        <div class="reader-summary-box">
            <strong>Key Summary Highlight</strong>
            ${article.excerpt}
        </div>
        
        <div class="reader-body">
            ${article.content}
        </div>
    `;

    // Apply active text size settings
    applyTextSizeStyles();

    // Re-check bookmark indicator states
    updateReaderBookmarkBtn();

    // Show Reader modal overlay
    document.getElementById("reader-modal").classList.add("open");
    document.body.style.overflow = "hidden"; // Disable outer window scrolling

    // Notify Nova about current active article context
    if (window.Nova && typeof window.Nova.syncArticleContext === 'function') {
        window.Nova.syncArticleContext(article);
    }
}

function closeReaderModal() {
    document.getElementById("reader-modal").classList.remove("open");
    document.body.style.overflow = ""; // Re-enable scrollbars
    
    stopTTSArticle();
    appState.activeArticle = null;

    if (window.Nova && typeof window.Nova.syncArticleContext === 'function') {
        window.Nova.syncArticleContext(null);
    }
}

function updateReaderBookmarkBtn() {
    const btn = document.getElementById("reader-bookmark-btn");
    const label = btn.querySelector(".btn-label");
    
    if (appState.activeArticle && isSaved(appState.activeArticle.id)) {
        btn.classList.add("saved");
        label.textContent = "Saved";
    } else {
        btn.classList.remove("saved");
        label.textContent = "Save";
    }
}

function adjustTextSize(direction) {
    if (direction === "increase") {
        if (appState.textSize === "small") appState.textSize = "medium";
        else if (appState.textSize === "medium") appState.textSize = "large";
    } else {
        if (appState.textSize === "large") appState.textSize = "medium";
        else if (appState.textSize === "medium") appState.textSize = "small";
    }

    applyTextSizeStyles();
}

function applyTextSizeStyles() {
    const content = document.getElementById("reader-content-body");
    content.classList.remove("text-sm", "text-lg");

    if (appState.textSize === "small") {
        content.classList.add("text-sm");
    } else if (appState.textSize === "large") {
        content.classList.add("text-lg");
    }
}

// ==========================================================================
// TEXT TO SPEECH ARTICLE READER ENGINE
// ==========================================================================
function toggleTTSArticle() {
    if (!appState.activeArticle) return;

    if (appState.ttsPlaying) {
        if (appState.ttsPaused) {
            // Resume speech synthesis
            window.speechSynthesis.resume();
            appState.ttsPaused = false;
            updateTTSControlsState("playing");
        } else {
            // Pause speech synthesis
            window.speechSynthesis.pause();
            appState.ttsPaused = true;
            updateTTSControlsState("paused");
        }
    } else {
        startTTSArticle();
    }
}

function startTTSArticle() {
    if (!appState.activeArticle) return;

    // Terminate existing voice synthesis
    window.speechSynthesis.cancel();

    // Assemble text to speak: Title, summary, author, content paragraphs
    const article = appState.activeArticle;
    
    // Parse the inner html content to clean paragraphs text for TTS
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = article.content;
    const bodyParagraphs = Array.from(tempDiv.querySelectorAll("p, h3")).map(el => el.textContent).join(". ");

    const textToSpeak = `${article.title}. Written by ${article.author} from ${article.source}. Summary: ${article.excerpt}. Content: ${bodyParagraphs}`;

    appState.ttsUtterance = new SpeechSynthesisUtterance(textToSpeak);
    appState.ttsUtterance.rate = 1.05;
    appState.ttsUtterance.pitch = 1.0;

    // Load available voices
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft")));
    if (naturalVoice) {
        appState.ttsUtterance.voice = naturalVoice;
    }

    appState.ttsUtterance.onstart = () => {
        appState.ttsPlaying = true;
        appState.ttsPaused = false;
        updateTTSControlsState("playing");
    };

    appState.ttsUtterance.onend = () => {
        resetTTSState();
    };

    appState.ttsUtterance.onerror = (e) => {
        console.error("TTS speech synthesis error:", e);
        resetTTSState();
    };

    window.speechSynthesis.speak(appState.ttsUtterance);
}

function stopTTSArticle() {
    window.speechSynthesis.cancel();
    resetTTSState();
}

function resetTTSState() {
    appState.ttsPlaying = false;
    appState.ttsPaused = false;
    appState.ttsUtterance = null;
    updateTTSControlsState("stopped");
}

function updateTTSControlsState(state) {
    const playBtn = document.getElementById("tts-play-btn");
    const stopBtn = document.getElementById("tts-stop-btn");
    const label = document.getElementById("tts-btn-text");

    if (state === "playing") {
        playBtn.classList.add("playing");
        stopBtn.disabled = false;
        label.textContent = "Pause";
    } else if (state === "paused") {
        playBtn.classList.remove("playing");
        stopBtn.disabled = false;
        label.textContent = "Resume";
    } else {
        // Stopped state
        playBtn.classList.remove("playing");
        stopBtn.disabled = true;
        label.textContent = "Listen";
    }
}

// ==========================================================================
// PUBLIC CONTROLLERS EXPOSED FOR NOVA AI ASSISTANT COORDINATION
// ==========================================================================
window.NewsApp = {
    // 1. Filter Category trigger
    filterCategory: (cat) => {
        if (NEWS_DATABASE.some(art => art.category === cat) || cat === "all") {
            changeCategory(cat);
            return `Sure, switching your dashboard feed category to **${cat}**!`;
        }
        return `I couldn't find a news channel named **${cat}** on our desk.`;
    },

    // 2. Search trigger
    search: (query) => {
        const searchInput = document.getElementById("news-search-input");
        if (searchInput) {
            searchInput.value = query;
            appState.searchQuery = query;
            renderArticles();
            return `Searching global reports database for: **"${query}"**.`;
        }
        return null;
    },

    // 3. Theme toggle trigger
    toggleTheme: () => {
        toggleVisualTheme();
        return "Visual design theme mode toggled!";
    },

    // 4. Bookmarks integration
    bookmarkActiveArticle: () => {
        if (appState.activeArticle) {
            toggleBookmark(appState.activeArticle.id);
            return isSaved(appState.activeArticle.id) 
                ? "Excellent, I've bookmarked this story into your Saved list." 
                : "Okay, I have removed this story from your bookmarks.";
        }
        return "No article is currently open in your reader viewport. Please open an article card first before adding bookmarks.";
    },

    // 5. Narrate Summary
    getActiveArticleSummary: () => {
        if (appState.activeArticle) {
            return `Here is the core summary highlight for **${appState.activeArticle.title}**: <br><br> "${appState.activeArticle.excerpt}"`;
        }
        return "Open a news report on your screen first, and I will narrate its core summary details!";
    },

    // 6. Speak aloud
    speakActiveArticle: () => {
        if (appState.activeArticle) {
            toggleTTSArticle();
            return "Sure, initiating article narration speech player.";
        }
        return "No report is loaded in the reader. Select an article to listen.";
    },

    stopActiveArticleNarration: () => {
        stopTTSArticle();
        return "Narration stopped.";
    },

    // 7. Get recommended articles list
    getRecommendations: () => {
        let recs = [];
        if (appState.activeArticle) {
            // Find articles in the same category
            recs = NEWS_DATABASE.filter(art => art.category === appState.activeArticle.category && art.id !== appState.activeArticle.id);
        }
        
        // Fallback to latest featured if no category match
        if (recs.length === 0) {
            recs = NEWS_DATABASE.filter(art => art.featured || art.category === "technology").slice(0, 3);
        }

        const listText = recs.map((art, idx) => `${idx + 1}. **[${art.title}](file:///c:/Users/aayus/OneDrive/Pinnacle/News%20Website/index.html#art-${art.id})** (${art.categoryLabel})`).join("<br>");
        return `Based on your interests, here are some recommended reports I loaded:<br><br>${listText}`;
    },

    // State getters
    isArticleOpen: () => appState.activeArticle !== null,
    getActiveArticle: () => appState.activeArticle,
    getSavedCount: () => appState.bookmarks.length
};
