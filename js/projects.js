/**
 * Projects database for dynamic portfolio rendering
 * Enhanced with IT Sector enterprise architecture metadata & telemetry
 */
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');

const projects = [
    {
        id: "weather-dashboard",
        title: "Weather Dashboard",
        category: "frontend",
        status: "Production",
        architecture: "REST Telemetry / Vanilla ES6",
        latency: "< 25ms",
        complexity: "Medium",
        version: "v1.4.2",
        description: "Interactive weather dashboard showing real-time atmospheric conditions and forecasts by location.",
        longDescription: "A modern, responsive weather dashboard built with HTML, CSS, and Vanilla JavaScript. It leverages global weather API integrations to fetch real-time weather details including temperature, humidity, wind speed, and weather conditions by city name or user geolocation.",
        image: "assets/project-weather.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Fetch API", "Weather API"],
        demoUrl: "./projects/Weather Dashboard/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Weather-Dashboard",
        features: [
            "Real-time weather query using global weather APIs",
            "Dynamic background transitions matching the weather conditions",
            "Detailed statistics for wind speed, humidity, and atmospheric pressure",
            "Fully responsive glassmorphic cards for multi-day forecast display"
        ]
    },
    {
        id: "calculator",
        title: "Interactive Web Calculator",
        category: "frontend",
        status: "Stable",
        architecture: "Client Evaluation / CSS Grid",
        latency: "< 5ms",
        complexity: "Standard",
        version: "v1.2.0",
        description: "A beautifully styled, fully functional web calculator supporting core arithmetic calculations.",
        longDescription: "A sleek, responsive calculator application implementing clean grid layouts and interactive button animations. Supports standard arithmetic operations, decimal entries, and error handling for mathematical boundary conditions.",
        image: "assets/project-calculator.png",
        tech: ["HTML5", "CSS Grid", "CSS Variables", "JavaScript"],
        demoUrl: "./projects/Calculator basic/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Calculator-",
        features: [
            "Modern glassmorphism button UI with fluid hover transitions",
            "Keyboard input support with visual feedback on keypress",
            "Error handling for division by zero and long decimal entries",
            "Clean responsive layout designed to work perfectly on mobile and desktop"
        ]
    },
    {
        id: "pinnacle-portfolio",
        title: "Pinnacle Portfolio Workspace",
        category: "fullstack",
        status: "Production",
        architecture: "Dynamic SPA / GitHub API / Neural Canvas",
        latency: "< 12ms",
        complexity: "Enterprise",
        version: "v2.5.0",
        description: "A premium personal portfolio website showcasing ML certifications, internships, and engineering skills.",
        longDescription: "The platform you are currently browsing! Features advanced scroll triggers, glassmorphic layout components, direct terminal sending animations, and theme state management. Integrates resume data and github repositories directly.",
        image: "assets/project-portfolio.png",
        tech: ["HTML5", "CSS3", "Vanilla JS", "ScrollObserver", "GitHub API"],
        demoUrl: "./index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Portfolio-",
        features: [
            "Custom dark/light theme toggle with local storage persistence",
            "Animated statistics counting elements triggered upon view",
            "Dynamic project rendering from local store and GitHub API integrations",
            "Interactive terminal simulation block for contact transmissions"
        ]
    },
    {
        id: "aura-tech",
        title: "Aura Tech E-commerce & Nova AI",
        category: "fullstack",
        status: "Production",
        architecture: "Client AI / Web Speech / Reactive Cart",
        latency: "< 30ms",
        complexity: "Enterprise",
        version: "v2.1.0",
        description: "Futuristic e-commerce storefront with local storage cart databases and Nova AI assistant voice integration.",
        longDescription: "A high-end, glassmorphic e-commerce store featuring dynamic catalog sorting/filtering, a local storage-synchronized shopping cart, behavior-driven product recommendation carousels, and a fully integrated Nova AI shopping assistant supporting Speech-to-Text and Text-to-Speech storefront action controls.",
        image: "assets/project-ecommerce.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Local Storage", "Neural Canvas"],
        demoUrl: "./projects/E-commerce Website/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/E-Commerce-Website",
        features: [
            "Voice control commands to add items to cart, clear cart, search, filter, and checkout",
            "Speech-to-Text (microphone input) and Text-to-Speech (voice narration feedback)",
            "Behavior-driven product recommendation engine based on category hovers and cart complementary items",
            "Slide-out shopping cart drawer and bio-sig secure payment checkout modal"
        ]
    },
    {
        id: "saffron-darbar",
        title: "Saffron Darbar Indian Dining & Nova AI",
        category: "fullstack",
        status: "Production",
        architecture: "Conversational Booking / Canvas Particles",
        latency: "< 28ms",
        complexity: "High",
        version: "v2.0.0",
        description: "Royal Indian fine dining website featuring conversational table booking dialogue systems and Nova AI voice integration.",
        longDescription: "A premium sandstone-saffron themed restaurant storefront featuring tandoori menu lists with Veg/Non-Veg indicators, dynamic catalog filtering, Sufiyana cultural events calendars, and a fully integrated Nova AI restaurant assistant that processes multi-step guided reservations via text/voice controls.",
        image: "assets/project-restaurant.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Glow Canvas", "Arch ClipPaths"],
        demoUrl: "./projects/Restaurant Website/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Restaurant-Website",
        features: [
            "Voice guided table booking dialogue system parsing guest counts, dates, times, and names",
            "Aromatic menu database search with custom Indian Veg/Non-Veg dot indicators",
            "Animated glowing saffron ember canvas particles background",
            "Printable perforated digital reservation confirmation ticket cards"
        ]
    },
    {
        id: "vibe-craft",
        title: "VibeCraft Event Organiser & Nova AI",
        category: "fullstack",
        status: "Production",
        architecture: "SVG Engine / AI Schedule Parser",
        latency: "< 22ms",
        complexity: "Enterprise",
        version: "v2.2.4",
        description: "Dynamic event creation and promotional dashboard featuring real-time customizable preview systems and Nova AI planning tools.",
        longDescription: "A comprehensive event planning, promoting, and coordinating dashboard featuring glassmorphic workspace designs. Allows organizers to select theme palettes, choose layouts, set schedules, and generate custom printable SVG entry passes with active countdown clocks. Integrates an AI Event Coordinator that plans and codes custom copy text via speech command algorithms.",
        image: "assets/project-event.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "SVG Generator", "Progress Gauges"],
        demoUrl: "./projects/Event Organiser Website/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Event-Orgainser-Website",
        features: [
            "Voice guided event plan parsing with automatic customizer form mapping",
            "Real-time landing page promotional preview and customized theme selectors",
            "Custom dynamic printable SVG ticket pass generator with layout options",
            "Event metrics analytical dashboard tracking guest seat tables, sales progress, and satisfaction percentages"
        ]
    },
    {
        id: "pinnacle-tasks",
        title: "Pinnacle Tasks & Nova AI",
        category: "fullstack",
        status: "Production",
        architecture: "NLP Parsing / Audio WebAPI / Local Storage",
        latency: "< 18ms",
        complexity: "High",
        version: "v1.9.0",
        description: "Premium AI productivity dashboard featuring real-time natural language task parsing, list management, and Pomodoro focus tools.",
        longDescription: "A sophisticated tasks dashboard that interprets scheduling commands in natural language, automatically setting due dates, priority tiers, and custom list categories. Features a custom Pomodoro Focus Timer with integrated ambient sound generator, visual weekly performance gauge trackers, and a slide-out conversational Nova AI Task Companion.",
        image: "assets/project-todo.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Local Storage", "Canvas API", "Speech API"],
        demoUrl: "./projects/Todo List/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Todo-List",
        features: [
            "Real-time Natural Language Parsing (NLP) for tasks (e.g. tomorrow @2pm !high)",
            "Integrated Pomodoro Timer with ambient tracks (Rain, Pink noise, Beats)",
            "Dynamic dashboard tracking completion percentages with weekly gauge graphs",
            "Interactive Nova AI assistant sidebar supporting text and voice controls"
        ]
    },
    {
        id: "pinnacle-globe",
        title: "Pinnacle Globe News & Nova AI",
        category: "fullstack",
        status: "Production",
        architecture: "TTS Voice Synthesis / Article Filter Pipeline",
        latency: "< 35ms",
        complexity: "High",
        version: "v2.0.1",
        description: "Global news aggregator platform featuring bookmark drawer systems, dynamic text size modifiers, audio narration engines, and Nova AI personal narration.",
        longDescription: "A premium glassmorphic news aggregator platform featuring real-time searching, category-based channel filtering, distraction-free reading views, dynamic typography scaling, custom local storage bookmarking drawers, and a TTS audio narrator. Includes a fully integrated Nova AI news coordinator that reads, filters, and summarizes articles via voice/text dialogues.",
        image: "assets/project-news.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Text-to-Speech", "Local Storage"],
        demoUrl: "./projects/News Website/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/News-Website-",
        features: [
            "Voice-controlled article searches, channel filtering, bookmarks, and summaries",
            "Built-in Text-to-Speech (TTS) audio narration engine inside the reader layout",
            "Slide-out bookmarks drawer synchronized with browser local storage database",
            "Distraction-free reading view overlay with real-time text resizing controls"
        ]
    },
    {
        id: "keyfs",
        title: "KEYFS Financial Portal",
        category: "fullstack",
        status: "Production",
        architecture: "Financial Math Engines / Chart.js Telemetry",
        latency: "< 20ms",
        complexity: "Enterprise",
        version: "v1.7.5",
        description: "A premium digital wealth advisory and mutual fund distribution platform with interactive financial engines.",
        longDescription: "A comprehensive wealth advisory and mutual fund distribution platform. Features interactive financial calculators (SIP, Lumpsum, and wealth goals), simulated real-time Indian stock index/commodity tickers, client consoles, partner registration portals, and fully paperless digital onboarding flows synchronized with local databases.",
        image: "assets/project-keyfs.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Local Storage", "Chart.js", "Financial Calculators"],
        demoUrl: "./projects/Keyfs/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Summer-Bootcamp",
        features: [
            "Interactive SIP, Lumpsum, and wealth goal calculation engines",
            "Simulated real-time Indian stock index and gold commodity tickers",
            "Fully responsive client console and partner portal dashboards",
            "SEBI & AMFI-compliant layout featuring paperless onboarding simulation"
        ]
    },
    {
        id: "depth3d-studio",
        title: "Depth3D Studio (P1)",
        category: "frontend",
        status: "Production",
        architecture: "Client ONNX Runtime / Three.js WebGL",
        latency: "< 40ms",
        complexity: "Cutting-Edge",
        version: "v3.0.0",
        description: "Local AI monocular depth estimation and 3D reconstruction studio converting 2D images to 3D scenes in the browser.",
        longDescription: "A premium, local AI-powered depth estimation and 3D visualization studio. Built with Tailwind CSS, OrbitControls, Three.js, and Hugging Face's Transformers.js, it downloads lightweight ONNX models (like Depth Anything V2) to run monocular depth estimation directly in the user's browser, generating interactive 3D meshes, wireframes, and point clouds.",
        image: "assets/project-depth3d.png",
        tech: ["Transformers.js", "Three.js", "Tailwind CSS", "ONNX Runtime", "WebGL", "OrbitControls"],
        demoUrl: "./projects/2D to 3D/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/2D-to-3D-image-coverter-",
        features: [
            "Local monocular depth estimation running ONNX models directly in-browser",
            "Interactive 3D scene rendering using Three.js with mesh, wireframe, and point cloud modes",
            "Customizable rendering settings including displacement scale, mesh density, and auto-rotation",
            "Instant GLTF exporter to download reconstructed 3D models and screenshot capture"
        ]
    },
    {
        id: "sales-dashboard",
        title: "Nova Sales Intelligence Dashboard",
        category: "fullstack",
        status: "Production",
        architecture: "Cloud DB Supabase / ApexCharts / AI Telemetry",
        latency: "< 32ms",
        complexity: "Enterprise",
        version: "v2.3.0",
        description: "Enterprise sales intelligence workspace featuring live Supabase database connections and Nova AI voice integration.",
        longDescription: "A sophisticated sales intelligence dashboard that aggregates retail transaction telemetry in real-time. Built with a live Supabase backend, it features multi-tab navigation, custom date range filtering, responsive ApexCharts data visualizations, and an integrated Nova AI voice assistant. Users can interact with the dashboard via Speech-to-Text and receive vocal synthesized summaries (Text-to-Speech) of sales metrics, representative pipelines, and company performance statistics.",
        image: "assets/project-sales.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Supabase", "ApexCharts", "Web Speech API"],
        demoUrl: "./projects/sales/index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Sales-Dashboard",
        features: [
            "Live cloud database synchronization powered by Supabase client integration",
            "Responsive visualizations using ApexCharts for daily trend lines and revenue breakdown",
            "Nova AI Voice Assistant supporting hands-free vocal telemetry commands and feedback",
            "Custom target metrics adjustments, date comparison math, and localStorage data persistence"
        ]
    },
    {
        id: "sast-cve-patcher",
        title: "SAST Alert Triage & Automated CVE Patcher",
        category: "fullstack",
        status: "Production",
        architecture: "DevSecOps / Call-Graph Analysis / CI/CD",
        latency: "< 45ms",
        complexity: "Enterprise",
        version: "v1.0.0",
        description: "Intelligent DevSecOps pipeline reducing SAST alert fatigue by verifying exploitability and generating automated CVE patches.",
        longDescription: "An intelligent DevSecOps security pipeline designed to sit between SAST scanners (SonarQube, Semgrep, Bandit) and developers. Analyzes call graphs and data flows to verify vulnerability reachability, suppresses non-exploitable false positives, and generates contextual code patches for legitimate CVEs within CI/CD workflows.",
        image: "assets/project-portfolio.png",
        tech: ["Python", "DevSecOps", "SAST", "Call-Graph Analysis", "GitHub Actions", "CI/CD"],
        demoUrl: "https://github.com/AayushBuilds-codes/AIML-MINI-PROJECT",
        repoUrl: "https://github.com/AayushBuilds-codes/AIML-MINI-PROJECT",
        features: [
            "Context-aware alert filtering via call-graph and data-flow reachability",
            "Smart noise reduction suppressing up to 80% false-positive SAST alerts",
            "Automated contextual code patch generation for legitimate CVEs",
            "Native integration with GitHub Actions and GitLab CI pipelines"
        ]
    },
    {
        id: "ai-portfolio-generator",
        title: "AI Resume-to-Portfolio Generator",
        category: "fullstack",
        status: "Production",
        architecture: "Python Flask / Google Gemini API / OCR",
        latency: "< 35ms",
        complexity: "High",
        version: "v1.5.0",
        description: "Flask + Google Gemini API web app transforming TXT, PDF, or image resumes into customized interactive portfolio websites.",
        longDescription: "A Python Flask application powered by the Google Gemini API that accepts TXT, PDF, or image resumes, performs AI-driven OCR and structured extraction, and automatically generates standard and advanced interactive HTML/CSS portfolio websites.",
        image: "assets/project-portfolio.png",
        tech: ["Python", "Flask", "Google Gemini API", "HTML5", "CSS3", "Vercel"],
        demoUrl: "https://ai-portfolio-generator-six-chi.vercel.app",
        repoUrl: "https://github.com/AayushBuilds-codes/AI-Portfolio-Generator-",
        features: [
            "Automated resume parsing across TXT, PDF, and image formats via Gemini OCR",
            "Dual-template generation producing both standard and advanced HTML portfolios",
            "Dynamic styling and structured section synthesis from raw resume content",
            "Deployed on Vercel with streamlined setup and model verification scripts"
        ]
    }
];
