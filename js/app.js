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

function initProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const syncBtn = document.getElementById('github-sync-btn');

    if (!projectsGrid || typeof projects === 'undefined') return;

    // Render all projects initially
    renderProjects(projects, projectsGrid);

    // Bind click event to GitHub Sync Button
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncGitHubData(true);
        });
    }

    // Filter project items
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from other buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            
            // Handle filtering
            let filteredProjects = [];
            if (filterValue === 'github') {
                if (githubReposCached) {
                    filteredProjects = githubReposCached;
                } else {
                    // Show skeleton screens while fetching
                    renderSkeletonCards(projectsGrid, 4);
                    syncGitHubData(false).then(() => {
                        if (btn.classList.contains('active')) {
                            renderProjects(githubReposCached, projectsGrid);
                        }
                    });
                    return;
                }
            } else {
                filteredProjects = filterValue === 'all' 
                    ? projects 
                    : projects.filter(p => p.category === filterValue);
            }

            // Animate grid change
            projectsGrid.style.opacity = '0';
            projectsGrid.style.transform = 'translateY(10px)';

            setTimeout(() => {
                renderProjects(filteredProjects, projectsGrid);
                projectsGrid.style.opacity = '1';
                projectsGrid.style.transform = 'translateY(0)';
            }, 300);
        });
    });

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
        
        // 6. Refresh current grid if active filter is github
        const projectsGrid = document.querySelector('.projects-grid');
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (projectsGrid && activeFilterBtn) {
            const filterValue = activeFilterBtn.getAttribute('data-filter');
            if (filterValue === 'github') {
                renderProjects(githubReposCached, projectsGrid);
            } else {
                const filteredProjects = filterValue === 'all' 
                    ? projects 
                    : projects.filter(p => p.category === filterValue);
                renderProjects(filteredProjects, projectsGrid);
            }
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
