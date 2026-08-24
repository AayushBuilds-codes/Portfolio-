/**
 * Projects database for dynamic portfolio rendering
 */
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');

const projects = [
    {
        id: "weather-dashboard",
        title: "Weather Dashboard",
        category: "frontend",
        description: "Interactive weather dashboard showing real-time atmospheric conditions and forecasts by location.",
        longDescription: "A modern, responsive weather dashboard built with HTML, CSS, and Vanilla JavaScript. It leverages global weather API integrations to fetch real-time weather details including temperature, humidity, wind speed, and weather conditions by city name or user geolocation.",
        image: "assets/project-weather.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Fetch API", "Weather API"],
        demoUrl: isLocal ? "../Weather Dashboard/index.html" : "https://aayushbuilds-codes.github.io/Weather-Dashboard/",
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
        description: "A beautifully styled, fully functional web calculator supporting core arithmetic calculations.",
        longDescription: "A sleek, responsive calculator application implementing clean grid layouts and interactive button animations. Supports standard arithmetic operations, decimal entries, and error handling for mathematical boundary conditions.",
        image: "assets/project-calculator.png",
        tech: ["HTML5", "CSS Grid", "CSS Variables", "JavaScript"],
        demoUrl: isLocal ? "../Calculator basic/index.html" : "https://aayushbuilds-codes.github.io/Calculator/",
        repoUrl: "https://github.com/AayushBuilds-codes/Calculator",
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
        description: "A premium personal portfolio website showcasing ML certifications, internships, and engineering skills.",
        longDescription: "The website you are currently browsing! Features advanced scroll triggers, glassmorphic layout components, direct terminal sending animations, and theme state management. Integrates his resume data and github repositories directly.",
        image: "assets/project-portfolio.png",
        tech: ["HTML5", "CSS3", "Vanilla JS", "ScrollObserver", "GitHub API"],
        demoUrl: "./index.html",
        repoUrl: "https://github.com/AayushBuilds-codes/Pinnacle",
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
        description: "Futuristic e-commerce storefront with local storage cart databases and Nova AI assistant voice integration.",
        longDescription: "A high-end, glassmorphic e-commerce store featuring dynamic catalog sorting/filtering, a local storage-synchronized shopping cart, behavior-driven product recommendation carousels, and a fully integrated Nova AI shopping assistant supporting Speech-to-Text and Text-to-Speech storefront action controls.",
        image: "assets/project-ecommerce.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Local Storage", "Neural Canvas"],
        demoUrl: isLocal ? "../E-commerce Website/index.html" : "https://aayushbuilds-codes.github.io/E-commerce-Website/",
        repoUrl: "https://github.com/AayushBuilds-codes/E-commerce-Website",
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
        description: "Royal Indian fine dining website featuring conversational table booking dialogue systems and Nova AI voice integration.",
        longDescription: "A premium sandstone-saffron themed restaurant storefront featuring tandoori menu lists with Veg/Non-Veg indicators, dynamic catalog filtering, Sufiyana cultural events calendars, and a fully integrated Nova AI restaurant assistant that processes multi-step guided reservations via text/voice controls.",
        image: "assets/project-restaurant.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Glow Canvas", "Arch ClipPaths"],
        demoUrl: isLocal ? "../Restaurant Website/index.html" : "https://aayushbuilds-codes.github.io/Saffron-Darbar/",
        repoUrl: "https://github.com/AayushBuilds-codes/Saffron-Darbar",
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
        description: "Dynamic event creation and promotional dashboard featuring real-time customizable preview systems and Nova AI planning tools.",
        longDescription: "A comprehensive event planning, promoting, and coordinating dashboard featuring glassmorphic workspace designs. Allows organizers to select theme palettes, choose layouts, set schedules, and generate custom printable SVG entry passes with active countdown clocks. Integrates an AI Event Coordinator that plans and codes custom copy text via speech command algorithms.",
        image: "assets/project-event.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "SVG Generator", "Progress Gauges"],
        demoUrl: isLocal ? "../Event Organiser Website/index.html" : "https://aayushbuilds-codes.github.io/VibeCraft/",
        repoUrl: "https://github.com/AayushBuilds-codes/VibeCraft",
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
        description: "Premium AI productivity dashboard featuring real-time natural language task parsing, list management, and Pomodoro focus tools.",
        longDescription: "A sophisticated tasks dashboard that interprets scheduling commands in natural language, automatically setting due dates, priority tiers, and custom list categories. Features a custom Pomodoro Focus Timer with integrated ambient sound generator, visual weekly performance gauge trackers, and a slide-out conversational Nova AI Task Companion.",
        image: "assets/project-todo.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Local Storage", "Canvas API", "Speech API"],
        demoUrl: isLocal ? "../Todo List/index.html" : "https://aayushbuilds-codes.github.io/Todo-List/",
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
        description: "Global news aggregator platform featuring bookmark drawer systems, dynamic text size modifiers, audio narration engines, and Nova AI personal narration.",
        longDescription: "A premium glassmorphic news aggregator platform featuring real-time searching, category-based channel filtering, distraction-free reading views, dynamic typography scaling, custom local storage bookmarking drawers, and a TTS audio narrator. Includes a fully integrated Nova AI news coordinator that reads, filters, and summarizes articles via voice/text dialogues.",
        image: "assets/project-news.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Web Speech API", "Text-to-Speech", "Local Storage"],
        demoUrl: isLocal ? "../News Website/index.html" : "https://aayushbuilds-codes.github.io/News-Website/",
        repoUrl: "https://github.com/AayushBuilds-codes/News-Website",
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
        description: "A premium digital wealth advisory and mutual fund distribution platform with interactive financial engines.",
        longDescription: "A comprehensive wealth advisory and mutual fund distribution platform. Features interactive financial calculators (SIP, Lumpsum, and wealth goals), simulated real-time Indian stock index/commodity tickers, client consoles, partner registration portals, and fully paperless digital onboarding flows synchronized with local databases.",
        image: "assets/project-keyfs.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Local Storage", "Chart.js", "Financial Calculators"],
        demoUrl: isLocal ? "../Keyfs/index.html" : "https://aayushbuilds-codes.github.io/Keyfs/",
        repoUrl: "https://github.com/AayushBuilds-codes/Keyfs",
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
        description: "Local AI monocular depth estimation and 3D reconstruction studio converting 2D images to 3D scenes in the browser.",
        longDescription: "A premium, local AI-powered depth estimation and 3D visualization studio. Built with Tailwind CSS, OrbitControls, Three.js, and Hugging Face's Transformers.js, it downloads lightweight ONNX models (like Depth Anything V2) to run monocular depth estimation directly in the user's browser, generating interactive 3D meshes, wireframes, and point clouds.",
        image: "assets/project-depth3d.png",
        tech: ["Transformers.js", "Three.js", "Tailwind CSS", "ONNX Runtime", "WebGL", "OrbitControls"],
        demoUrl: isLocal ? "../2D to 3D/index.html" : "https://aayushbuilds-codes.github.io/2D-to-3D-image-coverter-/",
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
        description: "Enterprise sales intelligence workspace featuring live Supabase database connections and Nova AI voice integration.",
        longDescription: "A sophisticated sales intelligence dashboard that aggregates retail transaction telemetry in real-time. Built with a live Supabase backend, it features multi-tab navigation, custom date range filtering, responsive ApexCharts data visualizations, and an integrated Nova AI voice assistant. Users can interact with the dashboard via Speech-to-Text and receive vocal synthesized summaries (Text-to-Speech) of sales metrics, representative pipelines, and company performance statistics.",
        image: "assets/project-sales.png",
        tech: ["HTML5", "CSS3", "JavaScript", "Supabase", "ApexCharts", "Web Speech API"],
        demoUrl: isLocal ? "../sales/index.html" : "https://aayushbuilds-codes.github.io/Sales-Dashboard/",
        repoUrl: "https://github.com/AayushBuilds-codes/Sales-Dashboard",
        features: [
            "Live cloud database synchronization powered by Supabase client integration",
            "Responsive visualizations using ApexCharts for daily trend lines and revenue breakdown",
            "Nova AI Voice Assistant supporting hands-free vocal telemetry commands and feedback",
            "Custom target metrics adjustments, date comparison math, and localStorage data persistence"
        ]
    }
];
