document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    initTheme();
    initMobileMenu();
    initTypingEffect();
    initProjects();
    initStatsCounter();
    initScrollAnimations();
    initContactForm();
    initBackToTop();
    updateProjectsFromGitHub();
    initDynamicAvatar();
    initTelemetryBar();
    initSkillsSearch();
    initModelPlayground();
    initDeveloperTerminal();
    initGlobalShortcuts();
});

/* ==========================================================================
   THEME TOGGLER (DARK / LIGHT)
   ========================================================================== */
function initTheme() {
    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    if (!themeToggleBtn) return;

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme = 'light';
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        currentTheme = 'dark';
    }

    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    // Toggle theme on click
    themeToggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Re-draw canvas elements if any
        triggerThemeChangeEvents(newTheme);
    });
}

function updateThemeIcon(theme) {
    // Theme toggle button styles are handled by CSS based on data-theme attribute on documentElement
}

function triggerThemeChangeEvents(theme) {
    const event = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(event);
}

/* ==========================================================================
   MOBILE NAVIGATION MENU
   ========================================================================== */
function initMobileMenu() {
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Scroll active link styling
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });

        // Navbar scrolled height effect
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ==========================================================================
   HERO TYPING EFFECT
   ========================================================================== */
function initTypingEffect() {
    const typingSpan = document.getElementById('typing-text');
    if (!typingSpan) return;

    const words = [
        "AI & ML Specialist.",
        "Python Programmer.",
        "Data Science Intern.",
        "Creative Problem Solver."
    ];
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typingSpan.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // speed up backspacing
        } else {
            typingSpan.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100; // normal typing speed
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typingSpeed = 1500; // Pause at end of word
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 500; // Pause before typing next word
        }

        setTimeout(type, typingSpeed);
    }

    // Start effect
    setTimeout(type, 1000);
}

/* ==========================================================================
   DYNAMIC PROJECTS & MODALS
   ========================================================================== */
let githubReposCached = null;
let isSyncing = false;

let currentActiveFilter = 'all';
let currentSearchQuery = '';
let currentViewMode = 'grid';

function initProjects() {
    const projectsGrid = document.getElementById('projects-grid') || document.querySelector('.projects-grid');
    const tableContainer = document.getElementById('projects-table-container');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const syncBtn = document.getElementById('github-sync-btn');
    const searchInput = document.getElementById('project-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const viewGridBtn = document.getElementById('view-grid-btn');
    const viewTableBtn = document.getElementById('view-table-btn');

    if (!projectsGrid || typeof projects === 'undefined') return;

    // Helper to refresh current project display
    window.refreshProjectDisplay = function() {
        let baseList = [];
        if (currentActiveFilter === 'github') {
            baseList = githubReposCached || [];
        } else if (currentActiveFilter === 'all') {
            baseList = [...projects];
        } else {
            baseList = projects.filter(p => p.category === currentActiveFilter);
        }

        // Apply search query filter
        let filtered = baseList;
        if (currentSearchQuery.trim() !== '') {
            const q = currentSearchQuery.toLowerCase();
            filtered = baseList.filter(p => {
                const titleMatch = (p.title || '').toLowerCase().includes(q);
                const descMatch = (p.description || '').toLowerCase().includes(q);
                const techMatch = (p.tech || []).some(t => t.toLowerCase().includes(q));
                const archMatch = (p.architecture || '').toLowerCase().includes(q);
                return titleMatch || descMatch || techMatch || archMatch;
            });
        }

        // Update count indicator
        const countBadge = document.getElementById('projects-count-indicator');
        if (countBadge) {
            countBadge.innerHTML = `Showing <strong>${filtered.length}</strong> active module${filtered.length === 1 ? '' : 's'}`;
        }

        // Toggle Views
        if (currentViewMode === 'table' && tableContainer) {
            projectsGrid.style.display = 'none';
            tableContainer.style.display = 'block';
            renderProjectsTable(filtered, tableContainer);
        } else {
            if (tableContainer) tableContainer.style.display = 'none';
            projectsGrid.style.display = 'grid';
            renderProjects(filtered, projectsGrid);
        }
    };

    // Render initially
    window.refreshProjectDisplay();

    // Bind click event to GitHub Sync Button
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncGitHubData(true);
        });
    }

    // Filter project items
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentActiveFilter = btn.getAttribute('data-filter');

            if (currentActiveFilter === 'github' && !githubReposCached) {
                renderSkeletonCards(projectsGrid, 4);
                syncGitHubData(false).then(() => {
                    if (btn.classList.contains('active')) {
                        window.refreshProjectDisplay();
                    }
                });
                return;
            }

            window.refreshProjectDisplay();
        });
    });

    // Real-Time Search Handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            if (searchClearBtn) {
                searchClearBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
            }
            window.refreshProjectDisplay();
        });

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchQuery = '';
                searchClearBtn.style.display = 'none';
                searchInput.focus();
                window.refreshProjectDisplay();
            });
        }
    }

    // View Mode Switcher
    if (viewGridBtn && viewTableBtn) {
        viewGridBtn.addEventListener('click', () => {
            viewGridBtn.classList.add('active');
            viewTableBtn.classList.remove('active');
            currentViewMode = 'grid';
            window.refreshProjectDisplay();
        });

        viewTableBtn.addEventListener('click', () => {
            viewTableBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            currentViewMode = 'table';
            window.refreshProjectDisplay();
        });
    }

    // Handle project detail modal events
    initModalEvents();
}

function renderSkeletonCards(container, count = 4) {
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-tags">
                    <div class="skeleton-tag"></div>
                </div>
                <div class="skeleton-title"></div>
                <div class="skeleton-desc"></div>
                <div class="skeleton-links"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

function getProjectIconSVG(projectId, language = '') {
    // Dynamic vector SVGs matching project types or programming languages
    const langLower = (language || '').toLowerCase();

    // Check languages first for live GitHub repos
    if (langLower === 'python') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/></svg>`; // Pie Chart/Data
    }
    if (langLower === 'jupyter notebook') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 9H3M21 15H3M12 3v18"/></svg>`; // Code cells grid
    }
    if (langLower === 'javascript' || langLower === 'typescript') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6M8 6L2 12l6 6"/></svg>`; // Code Brackets
    }
    if (langLower === 'html' || langLower === 'css') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/></svg>`; // Layout Screen
    }
    if (langLower === 'c') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14 9a2 2 0 0 0-2-2 3 3 0 0 0-3 3v4a3 3 0 0 0 3 3 2 2 0 0 0 2-2"/></svg>`; // C Letter
    }
    if (projectId.startsWith('github-') || projectId === 'raw-github') {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`; // Octocat
    }

    switch(projectId) {
        case 'weather-dashboard':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="4"/><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/></svg>`;
        case 'calculator':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>`;
        case 'pinnacle-portfolio':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
        case 'aura-tech':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
        case 'saffron-darbar':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8v12M15 8v3a3 3 0 0 0 6 0V8M6 12v8M6 8c0-3.3 4-3.3 4 0v4H4V8c0-3.3 2-3.3 2 0z"/></svg>`;
        case 'vibe-craft':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>`;
        case 'pinnacle-tasks':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        case 'pinnacle-globe':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/></svg>`;
        case 'keyfs':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
        case 'depth3d-studio':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
        case 'sales-dashboard':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
        default:
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
    }
}

function renderProjects(projectsArray, container) {
    if (projectsArray.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No projects found matching this category.</div>`;
        return;
    }

    container.innerHTML = projectsArray.map(project => {
        const tagsHTML = project.tech.map(t => `<span class="project-tag">${t}</span>`).join('');
        const projectIcon = getProjectIconSVG(project.id, project.tech[0]);
        
        const badgeHTML = project.isRawGitHub ? `
            <div class="github-live-badge">
                <span></span>GitHub Live
            </div>
        ` : '';

        const statsHTML = (project.stars !== undefined) ? `
            <div class="project-github-stats" style="display: flex; gap: 0.8rem; font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 0.8rem; align-items: center;">
                <span style="display: flex; align-items: center; gap: 0.25rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ${project.stars}
                </span>
                <span style="display: flex; align-items: center; gap: 0.25rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9"/></svg>
                    ${project.forks}
                </span>
                ${project.lastUpdated ? `<span style="font-size: 0.75rem;">Updated: ${project.lastUpdated}</span>` : ''}
            </div>
        ` : '';

        return `
            <article class="project-card" data-id="${project.id}">
                <div class="project-img-container">
                    ${badgeHTML}
                    <div class="project-card-graphic">
                        <div class="graphic-header">
                            <span></span><span></span><span></span>
                        </div>
                        <div class="graphic-body">
                            ${projectIcon}
                        </div>
                    </div>
                    <div class="project-img-overlay">
                        <button class="btn-view-details" data-id="${project.id}">
                            View Specs
                            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="project-info">
                    <div class="project-tags">${tagsHTML}</div>
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-desc">${project.description}</p>
                    ${statsHTML}
                    <div class="project-links">
                        <a href="${project.demoUrl}" class="project-link" target="_blank" rel="noopener">
                            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                            Live Demo
                        </a>
                        <a href="${project.repoUrl}" class="project-link" target="_blank" rel="noopener">
                            <svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                            Code
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Bind click events on the newly rendered cards
    const cards = container.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // If click was not on an anchor tag, open modal
            if (!e.target.closest('.project-link')) {
                const projectId = card.getAttribute('data-id');
                openProjectModal(projectId);
            }
        });
    });
}

function initModalEvents() {
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalCloseBtn = document.querySelector('.modal-close-btn');

    if (!modalOverlay || !modalCloseBtn) return;

    // Close button click
    modalCloseBtn.addEventListener('click', closeModal);

    // Click outside modal card to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // ESC key close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
            closeModal();
        }
    });
}

function openProjectModal(projectId) {
    let project = projects.find(p => p.id === projectId);
    if (!project && githubReposCached) {
        project = githubReposCached.find(p => p.id === projectId);
    }
    if (!project) return;

    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Populate Modal Content
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-category').textContent = project.category;
    document.getElementById('modal-desc').textContent = project.longDescription;
    
    // Render features list
    const featuresList = document.getElementById('modal-features');
    featuresList.innerHTML = project.features.map(f => `<li>${f}</li>`).join('');
    
    // Render tags
    const tagsContainer = document.getElementById('modal-tags');
    let tagsHTML = project.tech.map(t => `<span class="project-tag">${t}</span>`).join('');
    if (project.stars !== undefined) {
        tagsHTML += `
            <span class="project-tag" style="background: rgba(20, 184, 166, 0.15); color: var(--primary); display: inline-flex; align-items: center; gap: 0.25rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ${project.stars} Stars
            </span>
            <span class="project-tag" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-light); display: inline-flex; align-items: center; gap: 0.25rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9"/></svg>
                ${project.forks} Forks
            </span>
        `;
    }
    tagsContainer.innerHTML = tagsHTML;
    
    // Render links
    document.getElementById('modal-demo-link').setAttribute('href', project.demoUrl);
    document.getElementById('modal-repo-link').setAttribute('href', project.repoUrl);
    
    // Set banner icon
    const bannerGraphic = document.getElementById('modal-banner-graphic');
    const projectIcon = getProjectIconSVG(project.id, project.tech[0]);
    bannerGraphic.innerHTML = `
        <div class="graphic-header">
            <span></span><span></span><span></span>
        </div>
        <div class="graphic-body" style="display:flex; justify-content:center; align-items:center; flex-grow:1;">
            ${projectIcon}
        </div>
    `;

    // Open Modal
    modalOverlay.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    modalOverlay.classList.remove('open');
    document.body.classList.remove('modal-open');
}

/* ==========================================================================
   STATISTICS COUNT UP ANIMATION
   ========================================================================== */
function initStatsCounter() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Setup intersection observer to start counter when visible
    const observerOptions = {
        threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberEl = entry.target.querySelector('.stat-number');
                const targetNumber = parseInt(numberEl.getAttribute('data-target'));
                const suffix = numberEl.getAttribute('data-suffix') || '';
                
                animateCount(numberEl, targetNumber, suffix);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statCards.forEach(card => counterObserver.observe(card));
}

function animateCount(element, target, suffix) {
    let current = 0;
    const duration = 2000; // 2 seconds
    const start = performance.now();

    function updateCount(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (outQuad)
        const easeProgress = progress * (2 - progress);
        
        current = Math.floor(easeProgress * target);
        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = target + suffix;
        }
    }

    requestAnimationFrame(updateCount);
}

/* ==========================================================================
   SCROLL TRIGGERS & REVEAL ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-reveal');

    const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                
                // If it is a skill category, trigger bar growth
                if (entry.target.classList.contains('skill-category')) {
                    const bars = entry.target.querySelectorAll('.skill-bar-fill');
                    for (let i = 0; i < bars.length; i++) {
                        const fillEl = bars[i];
                        if (fillEl) {
                            const widthVal = fillEl.getAttribute('data-width');
                            fillEl.style.width = widthVal;
                        }
                    }
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before element enters viewport
    });

    scrollElements.forEach(el => elementObserver.observe(el));
}

/* ==========================================================================
   CONTACT FORM VALIDATION & SIMULATION
   ========================================================================== */
function initContactForm() {
    const contactForm = document.getElementById('portfolio-contact-form');
    const terminalStatus = document.getElementById('terminal-status');

    if (!contactForm || !terminalStatus) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('form-name');
        const emailInput = document.getElementById('form-email');
        const messageInput = document.getElementById('form-message');
        
        if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
            showFormStatus('Please complete all form fields.', 'error');
            return;
        }

        // Show terminal state simulation
        terminalStatus.style.display = 'block';
        terminalStatus.innerHTML = '';
        
        const steps = [
            { text: '> Initiating communication gateway...', delay: 200 },
            { text: `> Packaging contact parameters for "${nameInput.value}"...`, delay: 600 },
            { text: '> Routing payload through SMTP secure nodes...', delay: 1100 },
            { text: '> Performing handshakes with cloud host API...', delay: 1500 },
            { text: '> Connection established. Port: 587. Status: 200 OK.', delay: 2000 },
            { text: '> Sending encrypted transmission package...', delay: 2400 },
            { text: '> Success! Message sent successfully.', delay: 2900 }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                const line = document.createElement('p');
                line.textContent = step.text;
                terminalStatus.appendChild(line);
                terminalStatus.scrollTop = terminalStatus.scrollHeight;
            }, step.delay);
        });

        // Finalize form submission state
        setTimeout(() => {
            showFormStatus('Thank you! Your message has been routed successfully.', 'success');
            contactForm.reset();
            
            // Fade out terminal status after 5 seconds
            setTimeout(() => {
                terminalStatus.style.display = 'none';
            }, 5000);
        }, 3200);
    });
}

function showFormStatus(msg, type) {
    const statusMsg = document.getElementById('form-status');
    if (!statusMsg) return;

    statusMsg.textContent = msg;
    statusMsg.className = 'form-status show ' + type;

    setTimeout(() => {
        statusMsg.classList.remove('show');
    }, 4000);
}

/* ==========================================================================
   BACK TO TOP ACTION
   ========================================================================== */
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ==========================================================================
   DYNAMIC GITHUB API INTEGRATION
   ========================================================================== */
async function updateProjectsFromGitHub() {
    // Initial silent load check
    await syncGitHubData(false);
}

async function syncGitHubData(forceSync = false) {
    if (typeof projects === 'undefined' || isSyncing) return;
    
    const syncStatusText = document.getElementById('sync-status-text');
    const syncStatusDot = document.getElementById('sync-status-dot');
    const syncBtn = document.getElementById('github-sync-btn');
    const syncIcon = document.getElementById('sync-btn-icon');
    
    isSyncing = true;
    
    if (syncBtn) syncBtn.disabled = true;
    if (syncIcon) syncIcon.classList.add('spinning');
    if (syncStatusDot) {
        syncStatusDot.className = 'status-dot syncing';
    }
    if (syncStatusText) syncStatusText.textContent = 'Syncing...';

    // Helper: clean local state update
    function finishSync(statusMsg, isSuccess) {
        isSyncing = false;
        if (syncBtn) syncBtn.disabled = false;
        if (syncIcon) syncIcon.classList.remove('spinning');
        if (syncStatusDot) {
            syncStatusDot.className = 'status-dot pulsing';
        }
        if (syncStatusText) syncStatusText.textContent = statusMsg;
        if (isSuccess && forceSync) {
            showToast('GitHub repositories synced successfully!', 'success');
        }
    }

    try {
        let repos = null;
        
        // 1. Try local session cache if not force syncing
        if (!forceSync) {
            const cached = sessionStorage.getItem('github_repos');
            const cachedTime = sessionStorage.getItem('github_sync_time');
            // Cache valid for 30 minutes
            if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 30 * 60 * 1000)) {
                repos = JSON.parse(cached);
            }
        }
        
        // 2. Fetch from GitHub API if no valid cache
        if (!repos) {
            const response = await fetch('https://api.github.com/users/AayushBuilds-codes/repos');
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            repos = await response.json();
            
            // Cache details
            sessionStorage.setItem('github_repos', JSON.stringify(repos));
            sessionStorage.setItem('github_sync_time', Date.now().toString());
        }
        
        // 3. Process matches and update hardcoded project metrics
        repos.forEach(repo => {
            const matchedProject = projects.find(p => p.repoUrl && p.repoUrl.toLowerCase().includes(repo.name.toLowerCase()));
            if (matchedProject) {
                if (repo.description && !matchedProject.description) {
                    matchedProject.description = repo.description;
                }
                matchedProject.stars = repo.stargazers_count;
                matchedProject.forks = repo.forks_count;
                matchedProject.lastUpdated = new Date(repo.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });
            }
        });

        // 4. Map raw repositories into explorer objects
        githubReposCached = repos.map(repo => {
            return {
                id: `github-${repo.id}`,
                title: repo.name.replace(/-/g, ' ').replace(/_/g, ' '),
                category: 'github',
                description: repo.description || "Public GitHub repository showcasing AI, ML, or web software codebases.",
                longDescription: `A live repository hosted on GitHub named "${repo.name}". ${repo.description || "This project is part of Aayush Agarwal's open source developer package."}`,
                image: '', // Graphic fallback
                tech: repo.language ? [repo.language] : ['Codebase'],
                demoUrl: repo.homepage || repo.html_url,
                repoUrl: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                lastUpdated: new Date(repo.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                }),
                features: [
                    `Development Language: ${repo.language || 'Multi-language'}`,
                    `Open Issues: ${repo.open_issues_count}`,
                    `Stars Gained: ${repo.stargazers_count}`,
                    `Forks Counted: ${repo.forks_count}`
                ],
                isRawGitHub: true
            };
        });

        // 5. Update Statistics elements in About section dynamically
        const statsReposCard = document.querySelector('.stat-number[data-target="6"]');
        if (statsReposCard) {
            statsReposCard.setAttribute('data-target', repos.length.toString());
            // Trigger a re-count if visible
            const countText = statsReposCard.textContent;
            if (countText && countText.includes('+') || parseInt(countText) > 0) {
                // Already animated, run custom animation
                animateCount(statsReposCard, repos.length, '+');
            }
        }
        
        // 6. Refresh current display with active filter/search/view mode
        if (typeof window.refreshProjectDisplay === 'function') {
            window.refreshProjectDisplay();
        }
        
        finishSync('Synced: Live', true);
    } catch (e) {
        console.error("Error fetching GitHub repos:", e);
        finishSync('GitHub API: Rate Limited / Offline', false);
        if (forceSync) {
            showToast('Unable to connect to GitHub. Using offline data.', 'error');
        }
    }
}

function showToast(message, type = 'success') {
    // Check if toast already exists
    let toast = document.getElementById('github-sync-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'github-sync-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '2rem';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.padding = '0.8rem 1.5rem';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        toast.style.zIndex = '1000';
        toast.style.fontWeight = '700';
        toast.style.fontSize = '0.95rem';
        toast.style.backdropFilter = 'blur(5px)';
        toast.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
        toast.style.opacity = '0';
        document.body.appendChild(toast);
    }
    
    toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    toast.style.color = '#ffffff';
    toast.textContent = message;
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    
    // Clear previous timeout
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    toast.timeoutId = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.opacity = '0';
    }, 3000);
}

/* ==========================================================================
   DYNAMIC HOLOGRAPHIC AVATAR STAGE & 3D PARALLAX
   ========================================================================== */
function initDynamicAvatar() {
    const card = document.getElementById('avatar-card-3d');
    const container = document.getElementById('hero-showcase');
    const cutoutImg = document.getElementById('hero-cutout-img');
    const glare = document.querySelector('.holo-glare');
    const hudLayer = document.getElementById('ai-hud-layer');
    const toggleHudBtn = document.getElementById('toggle-hud-btn');
    const auraDots = document.querySelectorAll('.aura-dot');
    const greetingBtn = document.getElementById('avatar-greeting-btn');
    const ripple = document.getElementById('avatar-ripple');

    if (!card || !container) return;

    // Load saved aura if exists
    const savedAura = localStorage.getItem('portfolio_aura') || 'teal';
    setAura(savedAura);

    // 1. Mouse 3D Parallax Tilt Effect
    let isHovered = false;
    const maxTilt = 15; // maximum degrees of tilt

    card.addEventListener('mouseenter', () => {
        isHovered = true;
        card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
    });

    card.addEventListener('mousemove', (e) => {
        if (!isHovered) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
        
        if (cutoutImg) {
            const imgShiftX = ((x - centerX) / centerX) * 8;
            const imgShiftY = ((y - centerY) / centerY) * 8;
            cutoutImg.style.transform = `translate3d(${imgShiftX.toFixed(1)}px, ${(imgShiftY - 4).toFixed(1)}px, 30px) scale(1.06)`;
        }

        if (glare) {
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            glare.style.background = `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`;
        }
    });

    card.addEventListener('mouseleave', () => {
        isHovered = false;
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        
        if (cutoutImg) {
            cutoutImg.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease';
            cutoutImg.style.transform = 'translateY(4px) scale(1.02)';
        }

        if (glare) {
            glare.style.background = 'linear-gradient(125deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 70%)';
        }
    });

    // 2. Interactive Click Ripple & Greeting Trigger
    function triggerGreetingInteraction(e) {
        if (ripple) {
            let clientX, clientY;
            if (e && e.clientX) {
                const rect = card.getBoundingClientRect();
                clientX = e.clientX - rect.left;
                clientY = e.clientY - rect.top;
            } else {
                clientX = card.offsetWidth / 2;
                clientY = card.offsetHeight / 2;
            }
            ripple.style.left = `${clientX}px`;
            ripple.style.top = `${clientY}px`;
            ripple.classList.remove('animate');
            void ripple.offsetWidth; // trigger reflow
            ripple.classList.add('animate');
        }

        // Open Nova if launcher exists
        const launcher = document.getElementById('nova-launcher');
        const chatWindow = document.getElementById('nova-chat-window');
        if (chatWindow && !chatWindow.classList.contains('open') && launcher) {
            launcher.click();
        }

        // Trigger greeting speech
        if (window.NovaEngine && typeof window.NovaEngine.speakGreeting === 'function') {
            window.NovaEngine.speakGreeting();
        } else if ('speechSynthesis' in window) {
            const greetings = [
                "Hello! Welcome to Aayush Agarwal's portfolio. I'm Nova, his personal AI assistant. How can I help you explore his work?",
                "Hi there! Glad you stopped by. Feel free to explore Aayush's machine learning models and web projects!"
            ];
            const msg = new SpeechSynthesisUtterance(greetings[Math.floor(Math.random() * greetings.length)]);
            msg.rate = 1.0;
            window.speechSynthesis.speak(msg);
        }

        showToast("Nova: Hello! Welcome to Aayush's portfolio.", "success");
    }

    card.addEventListener('click', triggerGreetingInteraction);
    if (greetingBtn) {
        greetingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerGreetingInteraction(e);
        });
    }

    // 3. AI HUD Mode Toggle
    if (toggleHudBtn && hudLayer) {
        toggleHudBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isDisabled = hudLayer.classList.toggle('disabled');
            toggleHudBtn.classList.toggle('active', !isDisabled);
            showToast(isDisabled ? "AI Vision HUD: Offline" : "AI Vision HUD: Online & Tracking", "success");
        });
    }

    // 4. Aura Palette Picker
    auraDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const aura = dot.getAttribute('data-aura');
            setAura(aura);
            localStorage.setItem('portfolio_aura', aura);
            showToast(`Aura Switched: ${aura.toUpperCase()}`, "success");
        });
    });

    function setAura(aura) {
        container.classList.remove('aura-teal', 'aura-violet', 'aura-emerald', 'aura-solar');
        if (aura !== 'teal') {
            container.classList.add(`aura-${aura}`);
        }
        auraDots.forEach(d => {
            d.classList.toggle('active', d.getAttribute('data-aura') === aura);
        });
    }
}

/* ==========================================================================
   IT OPS TABLE VIEW RENDERER
   ========================================================================== */
function renderProjectsTable(projectsArray, container) {
    if (!container) return;
    if (projectsArray.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-secondary); font-family: var(--font-mono);">No active modules found matching the current search parameters.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="it-ops-table">
            <thead>
                <tr>
                    <th>Module / System</th>
                    <th>Status</th>
                    <th>Architecture</th>
                    <th>Tech Stack</th>
                    <th>Latency</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${projectsArray.map(p => {
                    const status = p.status || (p.isRawGitHub ? 'Live GitHub' : 'Production');
                    const arch = p.architecture || (p.category === 'frontend' ? 'Client UI' : 'Full-Stack Service');
                    const latency = p.latency || '< 25ms';
                    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="table-tech-chip">${t}</span>`).join('');
                    
                    return `
                        <tr data-id="${p.id}">
                            <td>
                                <div class="table-project-name">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px; color: var(--primary); flex-shrink: 0;"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                    <span>${p.title}</span>
                                </div>
                            </td>
                            <td>
                                <span class="table-status-pill">
                                    <span class="status-led green" style="width:6px;height:6px;"></span>
                                    ${status}
                                </span>
                            </td>
                            <td>
                                <span class="table-arch-tag">${arch}</span>
                            </td>
                            <td>
                                <div class="table-tech-chips">${techChips}</div>
                            </td>
                            <td>
                                <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--primary-light); font-weight: 600;">${latency}</span>
                            </td>
                            <td>
                                <div class="table-actions-cell">
                                    <button type="button" class="table-btn table-btn-primary btn-table-specs" data-id="${p.id}">
                                        Specs
                                    </button>
                                    <a href="${p.demoUrl}" class="table-btn table-btn-secondary" target="_blank" rel="noopener">
                                        Live
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Bind click events on table spec buttons
    container.querySelectorAll('.btn-table-specs').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pid = btn.getAttribute('data-id');
            openProjectModal(pid);
        });
    });
}

/* ==========================================================================
   LIVE IT TELEMETRY BAR & CLOCK
   ========================================================================== */
function initTelemetryBar() {
    const clockEl = document.getElementById('telemetry-clock');
    const pingEl = document.getElementById('telemetry-ping');
    const cliBtn = document.getElementById('telemetry-cli-btn');

    // Live UTC Clock
    if (clockEl) {
        function updateClock() {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');
            clockEl.textContent = `${hours}:${minutes}:${seconds} UTC`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Ping Latency Simulator
    if (pingEl) {
        setInterval(() => {
            const ping = Math.floor(Math.random() * 12) + 14; // 14ms - 25ms
            pingEl.textContent = `${ping}ms`;
        }, 4000);
    }

    // Open CLI button
    if (cliBtn) {
        cliBtn.addEventListener('click', () => {
            toggleTerminal(true);
        });
    }
}

/* ==========================================================================
   SKILLS SEARCH & REAL-TIME HIGHLIGHTING
   ========================================================================== */
function initSkillsSearch() {
    const searchInput = document.getElementById('skill-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        const skillItems = document.querySelectorAll('.skill-item');

        skillItems.forEach(item => {
            const skillName = item.querySelector('.skill-name')?.textContent.toLowerCase() || '';
            if (query === '') {
                item.classList.remove('dimmed', 'highlighted');
            } else if (skillName.includes(query)) {
                item.classList.remove('dimmed');
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
                item.classList.add('dimmed');
            }
        });
    });
}

/* ==========================================================================
   CLIENT-SIDE AI/ML MODEL PLAYGROUND (FULL EFFICIENT MODEL)
   ========================================================================== */
function initModelPlayground() {
    const paramFeatures = document.getElementById('param-features');
    const paramSamples = document.getElementById('param-samples');
    const paramReg = document.getElementById('param-reg');
    const paramNoise = document.getElementById('param-noise');

    const valFeatures = document.getElementById('val-features');
    const valSamples = document.getElementById('val-samples');
    const valReg = document.getElementById('val-reg');
    const valNoise = document.getElementById('val-noise');

    const scoreDisplay = document.getElementById('model-score-display');
    const gaugeFillArc = document.getElementById('gauge-fill-arc');
    const metricLatency = document.getElementById('metric-latency');
    const metricConfidence = document.getElementById('metric-confidence');
    const metricLoss = document.getElementById('metric-loss');
    const metricStatus = document.getElementById('metric-status');

    const featBar1 = document.getElementById('feat-bar-1');
    const featBar2 = document.getElementById('feat-bar-2');
    const featBar3 = document.getElementById('feat-bar-3');
    const featBar4 = document.getElementById('feat-bar-4');

    const featPct1 = document.getElementById('feat-pct-1');
    const featPct2 = document.getElementById('feat-pct-2');
    const featPct3 = document.getElementById('feat-pct-3');
    const featPct4 = document.getElementById('feat-pct-4');

    const presetBtns = document.querySelectorAll('.preset-btn');
    const runBenchBtn = document.getElementById('btn-run-benchmark');
    const resetBtn = document.getElementById('btn-reset-model');

    if (!paramFeatures || !gaugeFillArc) return;

    // Presets definitions
    const presets = {
        classifier: { features: 8, samples: 15000, reg: 50, noise: 8 },
        balanced: { features: 6, samples: 10000, reg: 40, noise: 12 },
        highspeed: { features: 4, samples: 4000, reg: 70, noise: 18 }
    };

    // Calculate dynamic inference state
    function evaluateModel(manualLatency = null) {
        const startTime = performance.now();

        const f = parseInt(paramFeatures.value);
        const s = parseInt(paramSamples.value);
        const r = parseInt(paramReg.value);
        const n = parseInt(paramNoise.value);

        // Update value displays
        if (valFeatures) valFeatures.textContent = `${f} / 10`;
        if (valSamples) valSamples.textContent = `${s.toLocaleString()} pts`;
        if (valReg) valReg.textContent = (r / 1000).toFixed(3);
        if (valNoise) valNoise.textContent = `${n}%`;

        // Synthetic Model Accuracy / Efficiency formulation
        let rawScore = 75.0 + (f * 1.9) + (Math.log10(s) * 2.8) - (r * 0.065) - (n * 0.48);
        const score = Math.min(99.4, Math.max(68.0, rawScore));

        // Gauge arc offset calculation (circumference of arc is 251.2)
        const circumference = 251.2;
        const fillOffset = circumference * (1 - (score / 100));
        gaugeFillArc.style.strokeDashoffset = fillOffset.toFixed(1);

        if (scoreDisplay) {
            scoreDisplay.textContent = `${score.toFixed(1)}%`;
        }

        // Feature Importance calculation
        const p1 = Math.min(98, Math.round(72 + f * 2.2 - n * 0.3));
        const p2 = Math.min(99, Math.round(68 + f * 3.0 - r * 0.12));
        const p3 = Math.min(96, Math.round(62 + Math.log10(s) * 7.0));
        const p4 = Math.min(94, Math.round(48 + r * 0.45));

        if (featBar1) featBar1.style.width = `${p1}%`;
        if (featPct1) featPct1.textContent = `${p1}%`;

        if (featBar2) featBar2.style.width = `${p2}%`;
        if (featPct2) featPct2.textContent = `${p2}%`;

        if (featBar3) featBar3.style.width = `${p3}%`;
        if (featPct3) featPct3.textContent = `${p3}%`;

        if (featBar4) featBar4.style.width = `${p4}%`;
        if (featPct4) featPct4.textContent = `${p4}%`;

        // Telemetry metrics
        const endTime = performance.now();
        const calcTime = manualLatency !== null ? manualLatency : Math.max(1.2, parseFloat((endTime - startTime + Math.random() * 0.8).toFixed(1)));
        
        if (metricLatency) metricLatency.textContent = `${calcTime} ms`;
        if (metricConfidence) metricConfidence.textContent = `${(score * 0.992).toFixed(1)}%`;
        
        const loss = Math.max(0.006, parseFloat((1 - (score / 100) * 0.98 + (n * 0.001)).toFixed(3)));
        if (metricLoss) metricLoss.textContent = loss.toFixed(3);

        if (metricStatus) {
            if (score > 92) {
                metricStatus.textContent = 'OPTIMAL';
                metricStatus.className = 'metric-value text-optimal';
            } else if (score > 80) {
                metricStatus.textContent = 'CONVERGED';
                metricStatus.className = 'metric-value text-teal';
            } else {
                metricStatus.textContent = 'SUB-OPTIMAL';
                metricStatus.className = 'metric-value text-accent';
            }
        }
    }

    // Attach slider listeners
    [paramFeatures, paramSamples, paramReg, paramNoise].forEach(slider => {
        slider.addEventListener('input', () => {
            evaluateModel();
        });
    });

    // Attach preset button listeners
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const presetKey = btn.getAttribute('data-preset');
            const p = presets[presetKey];
            if (p) {
                paramFeatures.value = p.features;
                paramSamples.value = p.samples;
                paramReg.value = p.reg;
                paramNoise.value = p.noise;
                evaluateModel();
                showToast(`Model Preset Applied: ${btn.textContent}`, "success");
            }
        });
    });

    // Benchmark button
    if (runBenchBtn) {
        runBenchBtn.addEventListener('click', () => {
            runBenchBtn.disabled = true;
            const benchLed = document.getElementById('model-engine-led');
            if (benchLed) benchLed.className = 'status-led blue';

            const startBench = performance.now();
            // Perform 25,000 synthetic vector dot-products to measure browser speed
            let accum = 0;
            for (let i = 0; i < 25000; i++) {
                accum += Math.sin(i) * Math.cos(i);
            }
            const benchDuration = Math.max(1.1, parseFloat((performance.now() - startBench).toFixed(2)));

            setTimeout(() => {
                evaluateModel(benchDuration);
                if (benchLed) benchLed.className = 'status-led green';
                runBenchBtn.disabled = false;
                showToast(`Benchmark Completed: 25k iterations in ${benchDuration}ms!`, "success");
            }, 300);
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            paramFeatures.value = 8;
            paramSamples.value = 15000;
            paramReg.value = 50;
            paramNoise.value = 8;
            presetBtns.forEach((b, idx) => b.classList.toggle('active', idx === 0));
            evaluateModel();
            showToast("Model Hyperparameters Reset to Defaults", "success");
        });
    }

    // Initial evaluation
    evaluateModel();
}

/* ==========================================================================
   DEVELOPER CLI TERMINAL (IT SECTOR CONSOLE)
   ========================================================================== */
function initDeveloperTerminal() {
    const drawer = document.getElementById('dev-terminal-drawer');
    const backdrop = document.getElementById('terminal-backdrop');
    const closeBtn = document.getElementById('term-close-btn');
    const heroTrigger = document.getElementById('hero-cli-trigger');
    const floatingTrigger = document.getElementById('floating-cli-trigger');
    const form = document.getElementById('terminal-prompt-form');
    const input = document.getElementById('terminal-input');
    const history = document.getElementById('terminal-history');
    const screen = document.getElementById('terminal-screen');

    if (!drawer || !form || !input) return;

    let commandHistory = [];
    let historyIndex = -1;

    // Open/Close helper
    window.toggleTerminal = function(shouldOpen) {
        const isOpen = drawer.classList.contains('open');
        const nextState = shouldOpen !== undefined ? shouldOpen : !isOpen;
        
        drawer.classList.toggle('open', nextState);
        drawer.setAttribute('aria-hidden', (!nextState).toString());
        
        if (nextState) {
            setTimeout(() => input.focus(), 150);
        }
    };

    // Trigger bindings
    if (closeBtn) closeBtn.addEventListener('click', () => toggleTerminal(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleTerminal(false));
    if (heroTrigger) heroTrigger.addEventListener('click', () => toggleTerminal(true));
    if (floatingTrigger) floatingTrigger.addEventListener('click', () => toggleTerminal(true));

    // Handle interactive command chips
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.term-cmd-chip');
        if (chip) {
            const cmd = chip.getAttribute('data-cmd') || chip.textContent.trim();
            input.value = cmd;
            executeCommand(cmd);
        }
    });

    // Command submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawCmd = input.value.trim();
        input.value = '';
        if (rawCmd === '') return;

        commandHistory.push(rawCmd);
        historyIndex = commandHistory.length;

        executeCommand(rawCmd);
    });

    // Arrow navigation for command history
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex] || '';
            } else {
                historyIndex = commandHistory.length;
                input.value = '';
            }
        }
    });

    function appendOutput(contentHTML, isUserCmd = false, userCmdText = '') {
        const line = document.createElement('div');
        line.className = 'term-line';
        if (isUserCmd) {
            line.innerHTML = `<span class="term-user">guest@aayush.dev</span><span class="term-sep">:</span><span class="term-path">~$</span> <span style="color:#ffffff;">${userCmdText}</span>`;
        } else {
            line.innerHTML = contentHTML;
        }
        history.appendChild(line);
        screen.scrollTop = screen.scrollHeight;
    }

    function executeCommand(raw) {
        appendOutput('', true, raw);

        const parts = raw.toLowerCase().split(' ').filter(Boolean);
        const command = parts[0];
        const arg1 = parts[1];

        switch(command) {
            case 'help':
                appendOutput(`
                    <p class="term-highlight"><strong>Antigravity Core CLI &mdash; Available Commands:</strong></p>
                    <div style="display:grid; grid-template-columns: 160px 1fr; gap: 0.35rem 1rem; margin-top: 0.4rem; font-size: 0.82rem;">
                        <span class="term-highlight">projects</span><span>List production modules & open live prototypes</span>
                        <span class="term-highlight">skills</span><span>Print categorized tech stack & toolkit</span>
                        <span class="term-highlight">model [bench]</span><span>Inspect or benchmark in-browser ML inference model</span>
                        <span class="term-highlight">system</span><span>Print host telemetry, environment, and latency</span>
                        <span class="term-highlight">certs</span><span>List verified certifications with verify links</span>
                        <span class="term-highlight">contact</span><span>Display communication gateway channels</span>
                        <span class="term-highlight">theme [toggle]</span><span>Switch dark/light theme mode</span>
                        <span class="term-highlight">sudo hire-aayush</span><span>Execute developer onboarding protocol</span>
                        <span class="term-highlight">clear</span><span>Wipe terminal display buffer</span>
                        <span class="term-highlight">exit</span><span>Close developer console</span>
                    </div>
                `);
                break;

            case 'projects':
                if (typeof projects !== 'undefined') {
                    let out = `<p class="term-highlight"><strong>DEPLOYED PRODUCTION MODULES (${projects.length}):</strong></p><ul style="padding-left:1.2rem; margin-top:0.4rem;">`;
                    projects.forEach((p, idx) => {
                        out += `<li><strong>[${idx + 1}] ${p.title}</strong> &mdash; <span class="term-muted">${p.architecture || p.category}</span> | <a href="${p.demoUrl}" target="_blank" style="color:var(--primary-light); text-decoration:underline;">Launch Live Demo</a></li>`;
                    });
                    out += `</ul>`;
                    appendOutput(out);
                } else {
                    appendOutput(`<span class="term-warn">Projects database initializing...</span>`);
                }
                break;

            case 'skills':
                appendOutput(`
                    <p class="term-highlight"><strong>TECHNICAL COMPETENCY MATRIX:</strong></p>
                    <p>• <strong>AI, ML & GenAI:</strong> Python, LLMs, Prompt Engineering, Google Gemini API, Scikit-Learn (85%), Pandas & NumPy (88%), ONNX Runtime, Transformers.js</p>
                    <p>• <strong>Software Engineering:</strong> JavaScript (ES6+), TypeScript, React, Django, Flask, Node.js, HTML5/CSS3, Three.js WebGL, Java, C</p>
                    <p>• <strong>Cloud, DevSecOps & DBs:</strong> Azure, AWS, GCP, Supabase (PostgreSQL), MongoDB, MySQL, SAST Alert Triage, Git/GitHub Actions</p>
                `);
                break;

            case 'model':
                if (arg1 === 'run' || arg1 === 'bench' || arg1 === 'benchmark') {
                    appendOutput(`<p class="term-highlight">Executing in-browser ML model benchmark...</p>`);
                    const startBench = performance.now();
                    let accum = 0;
                    for (let i = 0; i < 20000; i++) accum += Math.sin(i);
                    const dur = Math.max(1.1, parseFloat((performance.now() - startBench).toFixed(2)));
                    appendOutput(`<p class="term-success">[SUCCESS] 20,000 algorithmic cycles completed in ${dur}ms. Status: OPTIMAL.</p>`);
                } else {
                    appendOutput(`
                        <p class="term-highlight"><strong>CLIENT-SIDE ML MODEL ENGINE:</strong></p>
                        <p>Status: ACTIVE | Framework: Client-Side Vector Math / ONNX</p>
                        <p>Run <span class="term-cmd-chip" data-cmd="model bench">model bench</span> or navigate to <a href="#model-playground" style="color:var(--primary-light); text-decoration:underline;">#model-playground</a> to adjust live hyperparameters.</p>
                    `);
                }
                break;

            case 'system':
                appendOutput(`
                    <p class="term-highlight"><strong>HOST ENVIRONMENT TELEMETRY:</strong></p>
                    <p>• Station: AAYUSH-DEV-PORTFOLIO-CORE (Kanpur, India)</p>
                    <p>• Platform: Browser JS (V8/Blink/Gecko) on ${navigator.platform || 'x86_64'}</p>
                    <p>• Screen Resolution: ${window.innerWidth}x${window.innerHeight}</p>
                    <p>• User Agent: ${navigator.userAgent.substring(0, 65)}...</p>
                    <p>• Core Architecture: Client-Side Neural Engine (v2.5)</p>
                    <p>• System Status: <span class="term-success">ALL SERVICES OPERATIONAL</span></p>
                `);
                break;

            case 'certs':
                appendOutput(`
                    <p class="term-highlight"><strong>VERIFIED CREDENTIALS:</strong></p>
                    <p>1. <a href="https://www.hackerrank.com/certificates/18029d7bacb0" target="_blank" style="color:var(--primary-light); text-decoration:underline;">SQL (Advanced)</a> &mdash; HackerRank Verified</p>
                    <p>2. <a href="https://www.hackerrank.com/certificates/becd1c7c7678" target="_blank" style="color:var(--primary-light); text-decoration:underline;">Problem Solving (Intermediate)</a> &mdash; HackerRank Verified</p>
                    <p>3. <a href="https://www.hackerrank.com/certificates/b454fb575392" target="_blank" style="color:var(--primary-light); text-decoration:underline;">SQL (Intermediate)</a> &mdash; HackerRank Verified</p>
                    <p>4. <a href="https://www.hackerrank.com/certificates/0122088d128e" target="_blank" style="color:var(--primary-light); text-decoration:underline;">JavaScript (Basic)</a> &mdash; HackerRank Verified</p>
                    <p>5. <a href="https://www.hackerrank.com/certificates/2a2de6899896" target="_blank" style="color:var(--primary-light); text-decoration:underline;">Python (Basic)</a> &mdash; HackerRank Verified</p>
                `);
                break;

            case 'contact':
                appendOutput(`
                    <p class="term-highlight"><strong>COMMUNICATION GATEWAYS:</strong></p>
                    <p>• Direct Email: <a href="mailto:aayushagarwaltech@gmail.com" style="color:var(--primary-light);">aayushagarwaltech@gmail.com</a></p>
                    <p>• GitHub: <a href="https://github.com/AayushBuilds-codes" target="_blank" style="color:var(--primary-light);">github.com/AayushBuilds-codes</a></p>
                    <p>• LinkedIn: <a href="https://www.linkedin.com/in/aayush-agarwal-64a461284/" target="_blank" style="color:var(--primary-light);">linkedin.com/in/aayush-agarwal-64a461284</a></p>
                `);
                break;

            case 'theme':
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const nextTheme = arg1 === 'light' ? 'light' : (arg1 === 'dark' ? 'dark' : (current === 'dark' ? 'light' : 'dark'));
                document.documentElement.setAttribute('data-theme', nextTheme);
                localStorage.setItem('theme', nextTheme);
                appendOutput(`<p class="term-success">Environment theme toggled to <strong>${nextTheme.toUpperCase()}</strong>.</p>`);
                break;

            case 'sudo':
                if (parts[1] === 'hire-aayush' || (parts[1] === 'hire' && parts[2] === 'aayush')) {
                    appendOutput(`
                        <p class="term-success"><strong>[ACCESS GRANTED: ROOT LEVEL PRIVILEGES ENGAGED]</strong></p>
                        <p>🎉 <strong>Congratulations! You found the Recruiter Protocol.</strong></p>
                        <p>Aayush Agarwal is actively available for <strong>AI/ML Developer Internships</strong> and <strong>Software Engineering Roles</strong>.</p>
                        <p>Direct channel: <a href="mailto:aayushagarwaltech@gmail.com?subject=Opportunity%20for%20Aayush%20Agarwal" style="color:#2dd4bf; text-decoration:underline;">Email Aayush Directly</a> or connect on <a href="https://www.linkedin.com/in/aayush-agarwal-64a461284/" target="_blank" style="color:#2dd4bf; text-decoration:underline;">LinkedIn</a>.</p>
                    `);
                    showToast("Recruiter Fast-Track Protocol Activated!", "success");
                } else {
                    appendOutput(`<p class="term-warn">sudo: user 'guest' is not in the sudoers file. This incident will be reported. Try 'sudo hire-aayush'.</p>`);
                }
                break;

            case 'clear':
            case 'cls':
                history.innerHTML = '';
                break;

            case 'exit':
            case 'quit':
                appendOutput(`<p class="term-muted">Terminating session...</p>`);
                setTimeout(() => toggleTerminal(false), 400);
                break;

            case 'echo':
                const text = parts.slice(1).join(' ');
                appendOutput(`<p>${text}</p>`);
                break;

            default:
                appendOutput(`<p class="term-error">command not found: ${command}. Type <span class="term-cmd-chip" data-cmd="help">help</span> for a list of available commands.</p>`);
                break;
        }
    }
}

/* ==========================================================================
   GLOBAL KEYBOARD SHORTCUTS
   ========================================================================== */
function initGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if user is currently typing in an input or textarea (except for escape)
        const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

        // Escape closes any open modal, terminal, or Nova drawer
        if (e.key === 'Escape') {
            const terminal = document.getElementById('dev-terminal-drawer');
            if (terminal && terminal.classList.contains('open')) {
                toggleTerminal(false);
                return;
            }
            const modal = document.querySelector('.modal-overlay.open');
            if (modal) {
                closeModal();
                return;
            }
            const nova = document.getElementById('nova-chat-window');
            if (nova && nova.classList.contains('open')) {
                nova.classList.remove('open');
                return;
            }
        }

        // Ctrl + \ or Ctrl + ` toggles Developer CLI
        if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.key === '`')) {
            e.preventDefault();
            toggleTerminal();
            return;
        }

        // Single key shortcuts when not typing
        if (!isInputFocused) {
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                toggleTerminal();
            } else if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                const launcher = document.getElementById('nova-launcher');
                if (launcher) launcher.click();
            }
        }
    });
}

