/**
 * Nova Analytics - Sales Intelligence Dashboard Application Logic
 * 
 * Manages database ingestion, relationship resolution, date comparison math,
 * localStorage simulations, ApexCharts renderings, modal navigation flows,
 * and the Nova Voice/Text AI Assistant (STT & TTS).
 */

// Supabase Configuration
const SUPABASE_URL = "https://pdcdunfwycloykpznxmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY2R1bmZ3eWNsb3lrcHpueG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODI0MzksImV4cCI6MjEwMDQ1ODQzOX0.e2PNiENjxhUqNUshrGTTlEjSZJ0d61upuVpdz05JTzY";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let databaseOrders = [];
let simulatedOrders = [];
let allOrders = [];
let allUsers = [];
let salespeople = [];
let customers = [];

let userMap = new Map();
let productMap = new Map();
let destinationMap = new Map();

let products = [];
let destinations = [];

let selectedDate = "2026-03-23";
let activeTab = "dashboard";
let monthlyTarget = 30000;

// Speech APIs State
let recognition = null;
let isListening = false;
let speechOutputActive = true;

// ApexCharts Instances
let dailyTrendChart = null;
let monthlyBarChart = null;
let compareTrendChart = null;

// Bio Templates for Salespeople
const bioTemplates = [
  "{name} is an Enterprise Sales Director with over 6 years of experience in telecom and cloud solutions. Known for scaling corporate partnerships across Southeast Asia.",
  "{name} is a Senior Account Manager specializing in global roaming packages. Has closed major corporate clients and maintains a 95% retention rate.",
  "{name} is a Sales Engineer turned Executive, blending deep technical SaaS insights with a client-centric sales approach to exceed quarterly goals.",
  "{name} manages key accounts and high-value strategic partnerships. Expert in negotiating bespoke international SLA packages."
];

// Company Name Suffixes for Customers
const companySuffixes = ["Group", "Solutions", "Technologies", "Global", "Systems", "Enterprises", "Ventures"];

/**
 * Paged database fetch utility to handle pagination limits
 */
async function fetchAllRecords(tableName, selectQuery = "*") {
  let loadedData = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select(selectQuery)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`Error loading table ${tableName}:`, error);
      throw error;
    }

    loadedData = loadedData.concat(data);
    if (data.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }
  return loadedData;
}

/**
 * App Initialization
 */
async function initApp() {
  try {
    showLoading(true, "Connecting to database...");

    // Fetch baseline tables
    const [ordersRes, usersRes, productsRes, destinationsRes] = await Promise.all([
      fetchAllRecords("orders", "*,users(*),products(*),destinations(*)"),
      fetchAllRecords("users", "*"),
      fetchAllRecords("products", "*"),
      fetchAllRecords("destinations", "*")
    ]);

    databaseOrders = ordersRes;
    allUsers = usersRes;
    products = productsRes;
    destinations = destinationsRes;

    // Build Maps
    allUsers.forEach(u => userMap.set(u.user_id, u));
    products.forEach(p => productMap.set(p.prod_id, p));
    destinations.forEach(d => destinationMap.set(d.destination_id, d));

    // Differentiate Salespeople vs Customers
    salespeople = allUsers.filter(u => u.user_role === 2);
    customers = allUsers.filter(u => u.user_role === 1);

    // Load target from settings cache
    const targetCache = localStorage.getItem("apex_target_revenue");
    if (targetCache) {
      monthlyTarget = parseInt(targetCache) || 30000;
      document.getElementById("settings-rep-target").value = monthlyTarget;
    }

    // Load simulated orders from cache
    const cachedSim = localStorage.getItem("apex_simulated_orders");
    if (cachedSim) {
      simulatedOrders = JSON.parse(cachedSim);
    }

    // Rebuild composite orders
    rebuildOrders();

    // Set Date input default based on database max date (or March 23 2026)
    const dateInput = document.getElementById("dashboard-date");
    dateInput.value = selectedDate;

    // Bind Handlers
    setupNavigation();
    setupEventHandlers();
    setupDropdowns();

    // Voice recognition initiation
    initSpeechRecognition();

    // Set active status
    document.getElementById("telemetry-pulse").classList.remove("offline");
    document.getElementById("telemetry-status-text").innerText = "Supabase Active";

    // First render
    renderAll();
    showLoading(false);
  } catch (error) {
    console.error("Redesign Initialization failed:", error);
    document.getElementById("telemetry-pulse").classList.add("offline");
    document.getElementById("telemetry-status-text").innerText = "Connection Failed";
    showLoading(true, `Failed to load dashboard: ${error.message}. Please refresh.`);
  }
}

/**
 * Combines Supabase data and Local simulated data
 */
function rebuildOrders() {
  allOrders = [...databaseOrders, ...simulatedOrders];
}

/**
 * Deterministic helper data generators for visual completeness
 */
function getRepBio(repId, name) {
  const template = bioTemplates[repId % bioTemplates.length];
  return template.replace("{name}", name.trim());
}

function getCustomerCompany(customerId, name) {
  const suffix = companySuffixes[customerId % companySuffixes.length];
  return `${name.trim()} ${suffix}`;
}

function getCustomerTier(totalSpent) {
  if (totalSpent >= 5000) return "Platinum";
  if (totalSpent >= 2000) return "Gold";
  if (totalSpent >= 800) return "Silver";
  return "Bronze";
}

function getRepPerformanceTier(progress) {
  if (progress >= 100) return "top";
  if (progress >= 75) return "ontrack";
  return "needs-attention";
}

function getRepPerformanceTierText(progress) {
  if (progress >= 100) return "Top Performer";
  if (progress >= 75) return "On Track";
  return "Needs Attention";
}

function getAvatarGradient(id) {
  const gradients = [
    "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)"
  ];
  return gradients[id % gradients.length];
}

/**
 * Main render router
 */
function renderAll() {
  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  // Global filters
  const todayOrders = allOrders.filter(o => o.order_date_time === dates.today);
  const pmsdOrders = allOrders.filter(o => o.order_date_time === dates.pmsd);
  const mtdOrders = allOrders.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);
  const pmMtdOrders = allOrders.filter(o => o.order_date_time >= dates.pmMtdStart && o.order_date_time <= dates.pmMtdEnd);

  // Render tab active panels
  if (activeTab === "dashboard") {
    renderKPIs(todayOrders, pmsdOrders, mtdOrders, pmMtdOrders);
    renderDailyTrendChart(mtdOrders, selectedDate);
    renderLeaderboard(mtdOrders, todayOrders);
  } else if (activeTab === "analytics") {
    renderMonthlyBarChart();
    renderAIInsights(mtdOrders, dates);
    updateComparisonView();
  } else if (activeTab === "sales-reps") {
    renderSalesRepsGrid();
  } else if (activeTab === "customers") {
    renderCustomersTable();
  }
}

/**
 * Computes comparative date strings (MTD, PMSD, PM MTD)
 */
function getComparisonDates(dateStr) {
  const curr = new Date(dateStr + "T00:00:00");
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const day = curr.getDate();

  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevDay = Math.min(day, prevMonthDays);

  const pmsdObj = new Date(prevYear, prevMonth, prevDay);

  const format = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayVal = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayVal}`;
  };

  return {
    today: dateStr,
    pmsd: format(pmsdObj),
    mtdStart: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    mtdEnd: dateStr,
    pmMtdStart: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`,
    pmMtdEnd: format(pmsdObj)
  };
}

function getPercentDelta(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/**
 * Card KPIs Redraw
 */
function renderKPIs(todayOrders, pmsdOrders, mtdOrders, pmMtdOrders) {
  const todayRev = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pmsdRev = pmsdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const todaySales = todayOrders.length;
  const pmsdSales = pmsdOrders.length;

  const mtdRev = mtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pmMtdRev = pmMtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const mtdSales = mtdOrders.length;
  const pmMtdSales = pmMtdOrders.length;

  // Animate values
  animateValue("val-today-revenue", todayRev, true);
  animateValue("val-today-sales", todaySales, false);
  animateValue("val-mtd-revenue", mtdRev, true);
  animateValue("val-mtd-sales", mtdSales, false);

  // Deltas logic
  updateDeltaElement("delta-today-revenue", getPercentDelta(todayRev, pmsdRev), "vs PMSD");
  updateDeltaElement("delta-today-sales", getPercentDelta(todaySales, pmsdSales), "vs PMSD");
  updateDeltaElement("delta-mtd-revenue", getPercentDelta(mtdRev, pmMtdRev), "vs PM");
  updateDeltaElement("delta-mtd-sales", getPercentDelta(mtdSales, pmMtdSales), "vs PM");
}

function updateDeltaElement(id, delta, suffix) {
  const el = document.getElementById(id);
  if (!el) return;

  const isPositive = delta >= 0;
  el.className = `kpi-delta ${isPositive ? 'positive' : 'negative'}`;
  
  const icon = isPositive ? 'trending-up' : 'trending-down';
  el.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${isPositive ? '+' : ''}${delta.toFixed(1)}% ${suffix}</span>
  `;
  lucide.createIcons();
}

function animateValue(id, endVal, isCurrency = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = isCurrency ? formatCurrency(endVal) : endVal.toLocaleString();
}

function formatCurrency(val) {
  return "$" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Cumulative Daily Trends Area Chart (ApexCharts)
 */
function renderDailyTrendChart(mtdOrders, dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const maxDay = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthShortName = d.toLocaleDateString("en-US", { month: "short" });

  const categories = [];
  const revenueSeries = [];
  const salesSeries = [];

  let cumRev = 0;
  let cumSales = 0;

  for (let i = 1; i <= maxDay; i++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayOrders = mtdOrders.filter(o => o.order_date_time === dayStr);

    const dayRev = dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const daySalesCount = dayOrders.length;

    cumRev += dayRev;
    cumSales += daySalesCount;

    categories.push(`${i} ${monthShortName}`);
    revenueSeries.push(parseFloat(cumRev.toFixed(2)));
    salesSeries.push(cumSales);
  }

  const options = {
    series: [
      { name: "Cumulative Revenue ($)", data: revenueSeries, color: "#6366f1" },
      { name: "Cumulative Sales Count", data: salesSeries, color: "#0ea5e9" }
    ],
    chart: {
      type: "area",
      height: 310,
      background: "transparent",
      fontFamily: "Plus Jakarta Sans",
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(255,255,255,0.04)",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: { colors: "#94a3b8", fontSize: "10px" },
        maxTicksLimit: 12
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: [
      {
        seriesName: "Cumulative Revenue ($)",
        labels: {
          style: { colors: "#94a3b8", fontSize: "10px" },
          formatter: (val) => "$" + Math.round(val).toLocaleString()
        }
      },
      {
        seriesName: "Cumulative Sales Count",
        opposite: true,
        labels: {
          style: { colors: "#94a3b8", fontSize: "10px" },
          formatter: (val) => Math.round(val)
        }
      }
    ],
    tooltip: {
      theme: "dark",
      x: { show: true }
    }
  };

  if (dailyTrendChart) {
    dailyTrendChart.destroy();
  }
  dailyTrendChart = new ApexCharts(document.querySelector("#daily-trend-chart"), options);
  dailyTrendChart.render();
}

/**
 * Representative Leaderboard Rendering
 */
function renderLeaderboard(mtdOrders, todayOrders) {
  const rowsContainer = document.getElementById("leaderboard-rows");
  if (!rowsContainer) return;

  rowsContainer.innerHTML = "";

  // Aggregate stats per rep
  const repStats = salespeople.map(rep => {
    const repMtdOrders = mtdOrders.filter(o => o.created_by === rep.user_id);
    const repTodayOrders = todayOrders.filter(o => o.created_by === rep.user_id);

    const mtdRevenue = repMtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const todayRevenue = repTodayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    return {
      agent: rep,
      todaySales: repTodayOrders.length,
      todayRevenue,
      mtdSales: repMtdOrders.length,
      mtdRevenue,
      progress: (mtdRevenue / monthlyTarget) * 100
    };
  });

  // Sort by revenue MTD descending
  repStats.sort((a, b) => b.mtdRevenue - a.mtdRevenue);

  repStats.forEach((stat, idx) => {
    const rank = idx + 1;
    let rankBadgeClass = "";
    if (rank === 1) rankBadgeClass = "gold";
    else if (rank === 2) rankBadgeClass = "silver";
    else if (rank === 3) rankBadgeClass = "bronze";

    const initials = stat.agent.name.trim().split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const progressLimit = Math.min(stat.progress, 100).toFixed(0);

    const row = document.createElement("tr");
    row.setAttribute("data-rep-id", stat.agent.user_id);
    row.className = "leaderboard-row";
    row.innerHTML = `
      <td class="rank-badge-cell ${rankBadgeClass}">#${rank}</td>
      <td>
        <div class="agent-cell-info">
          <div class="agent-avatar-mini" style="background: ${getAvatarGradient(stat.agent.user_id)}">${initials}</div>
          <span class="agent-name-txt">${stat.agent.name}</span>
        </div>
      </td>
      <td>${stat.todaySales}</td>
      <td style="font-weight: 700;">${formatCurrency(stat.todayRevenue)}</td>
      <td>${stat.mtdSales}</td>
      <td style="font-weight: 700; color: #fff;">${formatCurrency(stat.mtdRevenue)}</td>
      <td class="target-progress-cell">
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-fill" style="width: ${progressLimit}%"></div>
          </div>
          <span class="progress-text">${stat.progress.toFixed(0)}% of target</span>
        </div>
      </td>
    `;

    // Row deep-dive trigger
    row.addEventListener("click", () => openRepModal(stat.agent.user_id));
    rowsContainer.appendChild(row);
  });
}

/**
 * Tab 2: Monthly Bar Chart
 */
function renderMonthlyBarChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];
  const revenueData = [];

  months.forEach((m, idx) => {
    const monthNum = idx + 1;
    const prefix = `2026-0${monthNum}`;
    const monthlyOrders = allOrders.filter(o => o.order_date_time.startsWith(prefix));
    const monthlySum = monthlyOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    revenueData.push(parseFloat(monthlySum.toFixed(2)));
  });

  const options = {
    series: [{ name: "Total Volume", data: revenueData }],
    chart: {
      type: "bar",
      height: 310,
      background: "transparent",
      fontFamily: "Plus Jakarta Sans",
      toolbar: { show: false }
    },
    colors: ["#6366f1"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "45%",
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(255,255,255,0.04)",
      strokeDashArray: 4
    },
    xaxis: {
      categories: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026"],
      labels: { style: { colors: "#94a3b8", fontSize: "10px" } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "10px" },
        formatter: (val) => "$" + Math.round(val).toLocaleString()
      }
    },
    tooltip: {
      theme: "dark"
    }
  };

  if (monthlyBarChart) {
    monthlyBarChart.destroy();
  }
  monthlyBarChart = new ApexCharts(document.querySelector("#monthly-bar-chart"), options);
  monthlyBarChart.render();
}

/**
 * AI Performance Insights Engine
 */
function renderAIInsights(mtdOrders, dates) {
  const container = document.getElementById("ai-insights-container");
  if (!container) return;

  container.innerHTML = "";

  // 1. Calculate top product category MTD
  const categoryRevenue = {};
  mtdOrders.forEach(o => {
    const cat = o.products?.productName || "General Package";
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (o.amount || 0);
  });
  const sortedCategories = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]);
  const topCategoryName = sortedCategories[0]?.[0] || "No Data Available";
  const topCategoryVal = sortedCategories[0]?.[1] || 0;
  const mtdTotal = mtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const catPercentage = mtdTotal > 0 ? ((topCategoryVal / mtdTotal) * 100).toFixed(0) : 0;

  // 2. Calculate top performer MTD
  const repRevenue = {};
  salespeople.forEach(r => (repRevenue[r.user_id] = 0));
  mtdOrders.forEach(o => {
    if (repRevenue[o.created_by] !== undefined) {
      repRevenue[o.created_by] += o.amount || 0;
    }
  });
  const sortedReps = Object.entries(repRevenue).sort((a, b) => b[1] - a[1]);
  const topRepId = parseInt(sortedReps[0]?.[0] || 0);
  const topRepObj = userMap.get(topRepId);
  const topRepVal = sortedReps[0]?.[1] || 0;
  const topRepName = topRepObj ? topRepObj.name : "None";

  // 3. Peak date MTD
  const dateRevenue = {};
  mtdOrders.forEach(o => {
    dateRevenue[o.order_date_time] = (dateRevenue[o.order_date_time] || 0) + (o.amount || 0);
  });
  const sortedDates = Object.entries(dateRevenue).sort((a, b) => b[1] - a[1]);
  const peakDateStr = sortedDates[0]?.[0] || "No Day";
  const peakDateVal = sortedDates[0]?.[1] || 0;
  const formattedPeakDate = peakDateStr !== "No Day" ? new Date(peakDateStr + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "N/A";

  const insights = [
    {
      title: "Top Representative Performance",
      desc: `${topRepName} is currently leading the team MTD with ${formatCurrency(topRepVal)} in revenue, representing a solid contribution towards the company target.`,
      icon: "trophy"
    },
    {
      title: "Peak Billing Date Detected",
      desc: `High transaction volume was recorded on ${formattedPeakDate} with a peak daily revenue of ${formatCurrency(peakDateVal)}. Recommended to check product promotions running then.`,
      icon: "calendar"
    },
    {
      title: "Primary Product Contribution",
      desc: `"${topCategoryName}" is the highest generating line, contributing ${catPercentage}% (${formatCurrency(topCategoryVal)}) of all MTD revenues.`,
      icon: "bar-chart-3"
    }
  ];

  insights.forEach(item => {
    const bullet = document.createElement("div");
    bullet.className = "insight-item";
    bullet.innerHTML = `
      <div class="insight-icon-bullet">
        <i data-lucide="${item.icon}"></i>
      </div>
      <div class="insight-text-content">
        <span class="insight-title">${item.title}</span>
        <span class="insight-desc">${item.desc}</span>
      </div>
    `;
    container.appendChild(bullet);
  });
  lucide.createIcons();
}

/**
 * Tab 2: Comparison Tool
 */
function updateComparisonView() {
  const repAId = parseInt(document.getElementById("compare-rep-a").value);
  const repBId = parseInt(document.getElementById("compare-rep-b").value);

  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  const ordersA = allOrders.filter(o => o.created_by === repAId);
  const ordersB = allOrders.filter(o => o.created_by === repBId);

  // Today Stats
  const todayA = ordersA.filter(o => o.order_date_time === dates.today);
  const todayB = ordersB.filter(o => o.order_date_time === dates.today);

  const todayRevA = todayA.reduce((sum, o) => sum + (o.amount || 0), 0);
  const todayRevB = todayB.reduce((sum, o) => sum + (o.amount || 0), 0);

  document.getElementById("compare-a-today-rev").innerText = formatCurrency(todayRevA);
  document.getElementById("compare-b-today-rev").innerText = formatCurrency(todayRevB);
  document.getElementById("compare-a-today-sales").innerText = todayA.length;
  document.getElementById("compare-b-today-sales").innerText = todayB.length;

  // MTD Stats
  const mtdA = ordersA.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);
  const mtdB = ordersB.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);

  const mtdRevA = mtdA.reduce((sum, o) => sum + (o.amount || 0), 0);
  const mtdRevB = mtdB.reduce((sum, o) => sum + (o.amount || 0), 0);

  document.getElementById("compare-a-mtd-rev").innerText = formatCurrency(mtdRevA);
  document.getElementById("compare-b-mtd-rev").innerText = formatCurrency(mtdRevB);
  document.getElementById("compare-a-mtd-sales").innerText = mtdA.length;
  document.getElementById("compare-b-mtd-sales").innerText = mtdB.length;

  // Render comparison chart (daily cumulative revenue MTD)
  const d = new Date(selectedDate + "T00:00:00");
  const maxDay = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthShortName = d.toLocaleDateString("en-US", { month: "short" });

  const categories = [];
  const dataA = [];
  const dataB = [];

  let cumA = 0;
  let cumB = 0;

  const repAObj = userMap.get(repAId);
  const repBObj = userMap.get(repBId);
  const nameA = repAObj ? repAObj.name : "Agent A";
  const nameB = repBObj ? repBObj.name : "Agent B";

  for (let i = 1; i <= maxDay; i++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayRevA = mtdA.filter(o => o.order_date_time === dayStr).reduce((sum, o) => sum + (o.amount || 0), 0);
    const dayRevB = mtdB.filter(o => o.order_date_time === dayStr).reduce((sum, o) => sum + (o.amount || 0), 0);

    cumA += dayRevA;
    cumB += dayRevB;

    categories.push(`${i} ${monthShortName}`);
    dataA.push(parseFloat(cumA.toFixed(2)));
    dataB.push(parseFloat(cumB.toFixed(2)));
  }

  const options = {
    series: [
      { name: nameA, data: dataA, color: "#6366f1" },
      { name: nameB, data: dataB, color: "#0ea5e9" }
    ],
    chart: {
      type: "line",
      height: 250,
      background: "transparent",
      fontFamily: "Plus Jakarta Sans",
      toolbar: { show: false }
    },
    stroke: { curve: "smooth", width: 3 },
    grid: {
      borderColor: "rgba(255,255,255,0.04)",
      strokeDashArray: 4
    },
    xaxis: {
      categories: categories,
      labels: { style: { colors: "#94a3b8", fontSize: "10px" } }
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "10px" },
        formatter: (val) => "$" + Math.round(val).toLocaleString()
      }
    },
    tooltip: { theme: "dark" }
  };

  if (compareTrendChart) {
    compareTrendChart.destroy();
  }
  compareTrendChart = new ApexCharts(document.querySelector("#compare-trend-chart"), options);
  compareTrendChart.render();
}

/**
 * Tab 3: Sales Reps Grid Rendering
 */
function renderSalesRepsGrid() {
  const grid = document.getElementById("reps-grid");
  if (!grid) return;

  const searchQuery = document.getElementById("search-reps").value.toLowerCase().trim();
  const tierFilter = document.getElementById("filter-rep-tier").value;

  grid.innerHTML = "";

  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  // Filter
  const filteredReps = salespeople.filter(rep => {
    // Search filter
    if (searchQuery && !rep.name.toLowerCase().includes(searchQuery)) return false;

    // Performance tier filter
    if (tierFilter !== "all") {
      const mtdOrders = allOrders.filter(o => o.created_by === rep.user_id && o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);
      const mtdRevenue = mtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const progress = (mtdRevenue / monthlyTarget) * 100;
      const tier = getRepPerformanceTier(progress);
      if (tier !== tierFilter) return false;
    }
    return true;
  });

  if (filteredReps.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i data-lucide="users-slash"></i><p>No representatives match the active filters.</p></div>`;
    lucide.createIcons();
    return;
  }

  filteredReps.forEach(rep => {
    const repOrders = allOrders.filter(o => o.created_by === rep.user_id);
    const todayOrders = repOrders.filter(o => o.order_date_time === dates.today);
    const mtdOrders = repOrders.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);

    const todayRev = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const mtdRev = mtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const progress = (mtdRev / monthlyTarget) * 100;
    const progressLimit = Math.min(progress, 100).toFixed(0);

    const tier = getRepPerformanceTier(progress);
    const tierText = getRepPerformanceTierText(progress);
    const initials = rep.name.trim().split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    const card = document.createElement("div");
    card.className = "rep-card";
    card.innerHTML = `
      <div class="rep-card-header">
        <div class="rep-card-avatar" style="background: ${getAvatarGradient(rep.user_id)}">${initials}</div>
        <div class="rep-card-title-block">
          <span class="rep-card-name">${rep.name}</span>
          <span class="rep-tier-badge ${tier}">${tierText}</span>
        </div>
      </div>
      
      <div class="rep-card-stats">
        <div class="rep-card-stat-box">
          <span class="rep-card-stat-label">Today's Revenue</span>
          <span class="rep-card-stat-val">${formatCurrency(todayRev)}</span>
        </div>
        <div class="rep-card-stat-box">
          <span class="rep-card-stat-label">MTD Total</span>
          <span class="rep-card-stat-val" style="color: var(--accent-indigo);">${formatCurrency(mtdRev)}</span>
        </div>
      </div>
      
      <div class="rep-card-target-block">
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-fill" style="width: ${progressLimit}%"></div>
          </div>
          <span class="progress-text">${progress.toFixed(0)}% of monthly target</span>
        </div>
      </div>
      
      <button class="rep-card-btn" data-rep-id="${rep.user_id}">
        <i data-lucide="user-check"></i>
        <span>View Full Profile</span>
      </button>
    `;

    // View Profile Event
    card.querySelector(".rep-card-btn").addEventListener("click", () => openRepModal(rep.user_id));
    grid.appendChild(card);
  });
  lucide.createIcons();
}

/**
 * Tab 4: Customers Table Rendering
 */
function renderCustomersTable() {
  const tbody = document.getElementById("customers-rows");
  if (!tbody) return;

  const searchQuery = document.getElementById("search-customers").value.toLowerCase().trim();
  const tierFilter = document.getElementById("filter-customer-tier").value;
  const repFilter = document.getElementById("filter-customer-rep").value;

  tbody.innerHTML = "";

  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  // Build temporary array of customer statistics
  const customerList = customers.map(cust => {
    const custOrders = allOrders.filter(o => o.user_id === cust.user_id);
    const mtdCustOrders = custOrders.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);
    const totalSpent = custOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Dynamic relationship resolution (find salesperson handling most orders, or fallback)
    const repTally = {};
    custOrders.forEach(o => {
      repTally[o.created_by] = (repTally[o.created_by] || 0) + 1;
    });
    const sortedReps = Object.entries(repTally).sort((a, b) => b[1] - a[1]);
    const resolvedRepId = sortedReps[0] ? parseInt(sortedReps[0][0]) : (cust.user_id % salespeople.length + 1001);
    
    // Sort transactions to find latest date
    const sortedOrderDates = custOrders.map(o => o.order_date_time).sort();
    const lastDate = sortedOrderDates[sortedOrderDates.length - 1] || "N/A";

    return {
      profile: cust,
      company: getCustomerCompany(cust.user_id, cust.name),
      tier: getCustomerTier(totalSpent),
      assignedRepId: resolvedRepId,
      mtdPurchases: mtdCustOrders.length,
      totalSpent,
      lastDate
    };
  });

  // Filter Customer List
  const filteredCustomers = customerList.filter(cust => {
    // Search
    if (searchQuery && !cust.company.toLowerCase().includes(searchQuery) && !cust.profile.name.toLowerCase().includes(searchQuery)) return false;
    // Tier
    if (tierFilter !== "all" && cust.tier !== tierFilter) return false;
    // Representative
    if (repFilter !== "all" && cust.assignedRepId !== parseInt(repFilter)) return false;

    return true;
  });

  if (filteredCustomers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align: center; padding: 32px;"><i data-lucide="alert-circle" style="width: 24px; height: 24px; margin-bottom: 8px; color: var(--text-muted); display: block; margin-left: auto; margin-right: auto;"></i>No customer accounts match criteria.</td></tr>`;
    lucide.createIcons();
    return;
  }

  filteredCustomers.forEach(cust => {
    const repObj = userMap.get(cust.assignedRepId);
    const repName = repObj ? repObj.name : "Unassigned Rep";

    const lastDateFormatted = cust.lastDate !== "N/A" ? new Date(cust.lastDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No Purchases";

    const row = document.createElement("tr");
    row.setAttribute("data-cust-id", cust.profile.user_id);
    row.innerHTML = `
      <td style="font-weight: 700; color: #fff;">${cust.company}</td>
      <td>${cust.profile.name}</td>
      <td><span class="loyalty-badge ${cust.tier.toLowerCase()}">${cust.tier}</span></td>
      <td>
        <div class="agent-cell-info">
          <div class="agent-avatar-mini" style="background: ${getAvatarGradient(cust.assignedRepId)}; width: 22px; height: 22px; font-size: 0.65rem;">
            ${repName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <span>${repName}</span>
        </div>
      </td>
      <td>${cust.mtdPurchases}</td>
      <td style="font-weight: 700; color: var(--accent-teal);">${formatCurrency(cust.totalSpent)}</td>
      <td style="font-size: 0.8rem;">${lastDateFormatted}</td>
    `;

    // Customer Detail trigger
    row.addEventListener("click", () => openCustomerModal(cust.profile.user_id));
    tbody.appendChild(row);
  });
  lucide.createIcons();
}

/**
 * Tab Navigation Setup
 */
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      activeTab = item.getAttribute("data-tab");

      // Toggle tab panels
      document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
      document.getElementById(`tab-${activeTab}`).classList.add("active");

      // Collapsible mobile sidebar close
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
        const toggleBtn = document.getElementById("mobile-sidebar-toggle");
        if (toggleBtn) {
          toggleBtn.innerHTML = '<i data-lucide="menu"></i>';
          lucide.createIcons();
        }
      }

      // Sync titles & sub
      updateHeaderTitles();

      // Render
      renderAll();
    });
  });
}

function updateHeaderTitles() {
  const title = document.getElementById("page-title");
  const subtitle = document.getElementById("page-subtitle");

  if (activeTab === "dashboard") {
    title.innerText = "Sales Intelligence";
    subtitle.innerText = "Real-time performance metrics and insights";
  } else if (activeTab === "analytics") {
    title.innerText = "Performance Analytics";
    subtitle.innerText = "Historical performance aggregates and representative comparisons";
  } else if (activeTab === "sales-reps") {
    title.innerText = "Sales Representatives";
    subtitle.innerText = "Manage agents, set targets, and track MTD progress metrics";
  } else if (activeTab === "customers") {
    title.innerText = "Customer Accounts";
    subtitle.innerText = "Access corporate clients list, loyalty details, and invoices";
  } else if (activeTab === "settings") {
    title.innerText = "Dashboard Settings";
    subtitle.innerText = "Manage simulator, modify targets, and database configuration";
  } else if (activeTab === "nova-ai") {
    title.innerText = "Nova AI Assistant";
    subtitle.innerText = "Real-time database query processing & vocal speech interface";
  }
}

/**
 * Event Listeners & Modals
 */
function setupEventHandlers() {
  // Mobile Sidebar Toggle
  const mobToggle = document.getElementById("mobile-sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (mobToggle && sidebar) {
    mobToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      if (sidebar.classList.contains("active")) {
        mobToggle.innerHTML = '<i data-lucide="x"></i>';
      } else {
        mobToggle.innerHTML = '<i data-lucide="menu"></i>';
      }
      lucide.createIcons();
    });
  }

  // Dashboard Global Date picker
  const datePicker = document.getElementById("dashboard-date");
  datePicker.addEventListener("change", (e) => {
    selectedDate = e.target.value;
    
    // Auto-update simulate date picker default to match
    document.getElementById("sim-date").value = selectedDate;

    // Toast notice
    showToast(`Dashboard date set to ${new Date(selectedDate + "T00:00:00").toLocaleDateString()}`, "info");

    renderAll();
  });

  // Rep Leaderboard refresh
  document.getElementById("btn-refresh-data").addEventListener("click", async () => {
    try {
      showLoading(true, "Refreshing Supabase data...");
      const ordersRes = await fetchAllRecords("orders", "*,users(*),products(*),destinations(*)");
      databaseOrders = ordersRes;
      rebuildOrders();
      renderAll();
      showLoading(false);
      showToast("Data successfully synced with Supabase");
    } catch (e) {
      showLoading(false);
      showToast("Error updating database connection", "error");
    }
  });

  // Analytics Comparison changes
  document.getElementById("compare-rep-a").addEventListener("change", updateComparisonView);
  document.getElementById("compare-rep-b").addEventListener("change", updateComparisonView);

  // Sales rep search & filter
  document.getElementById("search-reps").addEventListener("input", renderSalesRepsGrid);
  document.getElementById("filter-rep-tier").addEventListener("change", renderSalesRepsGrid);

  // Customer search & filters
  document.getElementById("search-customers").addEventListener("input", renderCustomersTable);
  document.getElementById("filter-customer-tier").addEventListener("change", renderCustomersTable);
  document.getElementById("filter-customer-rep").addEventListener("change", renderCustomersTable);

  // Settings: Save target
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    const val = parseInt(document.getElementById("settings-rep-target").value);
    if (!val || val <= 0) {
      showToast("Invalid baseline target amount", "error");
      return;
    }
    monthlyTarget = val;
    localStorage.setItem("apex_target_revenue", monthlyTarget);
    showToast(`Monthly revenue target set to ${formatCurrency(monthlyTarget)}`);
    renderAll();
  });

  // Settings: Clear simulation cache
  document.getElementById("btn-clear-simulated").addEventListener("click", () => {
    localStorage.removeItem("apex_simulated_orders");
    simulatedOrders = [];
    rebuildOrders();
    showToast("Local simulated sales cache cleared successfully.");
    renderAll();
  });

  // Settings: Seed sample data
  document.getElementById("btn-seed-data").addEventListener("click", () => {
    seedSampleData();
  });

  // Simulation modal open/close binds
  document.getElementById("open-simulate-modal-btn").addEventListener("click", () => openModal("modal-simulate"));
  document.getElementById("close-simulate-modal-btn").addEventListener("click", () => closeModal("modal-simulate"));
  document.getElementById("cancel-simulate-modal-btn").addEventListener("click", () => closeModal("modal-simulate"));
  document.getElementById("close-rep-modal-btn").addEventListener("click", () => closeModal("modal-rep-detail"));
  document.getElementById("close-customer-modal-btn").addEventListener("click", () => closeModal("modal-customer-detail"));

  // Simulation form submission
  document.getElementById("simulate-sale-form").addEventListener("submit", (e) => {
    e.preventDefault();
    recordSimulatedSale();
  });

  // Close modals when clicking overlay
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // NOVA AI ASSISTANT HANDLERS
  const chatInput = document.getElementById("nova-chat-input");
  const sendBtn = document.getElementById("btn-send-chat");
  const micBtn = document.getElementById("btn-voice-input");
  const speechOutputBtn = document.getElementById("btn-speech-output");

  const sendQuery = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    submitNovaQuery(text);
    chatInput.value = "";
  };

  // Keyboard Enter key inside text input
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendQuery();
  });

  // Send button
  sendBtn.addEventListener("click", sendQuery);

  // Quick Action Chips delegation
  const chipsContainer = document.querySelector(".nova-quick-chips");
  if (chipsContainer) {
    chipsContainer.addEventListener("click", (e) => {
      const chip = e.target.closest(".quick-chip-btn");
      if (chip) {
        submitNovaQuery(chip.getAttribute("data-query"));
      }
    });
  }

  // Voice Input mic click
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!recognition) {
        showToast("Speech recognition not supported in this browser.", "warning");
        return;
      }
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  // Speech Output Toggle
  if (speechOutputBtn) {
    speechOutputBtn.addEventListener("click", () => {
      speechOutputActive = !speechOutputActive;
      speechOutputBtn.classList.toggle("active", speechOutputActive);
      showToast(speechOutputActive ? "Nova speech feedback enabled" : "Nova speech feedback muted", "info");
      
      // Stop speech immediately if muted
      if (!speechOutputActive && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const visualizer = document.getElementById("nova-visualizer");
        if (visualizer && !isListening) {
          visualizer.classList.remove("active");
        }
      }
    });
  }

  // Floating Nova AI Chat Drawer Controls
  const floatBtn = document.getElementById("nova-ai-float-btn");
  const floatPanel = document.getElementById("nova-chat-float-panel");
  const closeChatBtn = document.getElementById("close-nova-chat-btn");

  if (floatBtn && floatPanel) {
    floatBtn.addEventListener("click", () => {
      floatPanel.classList.add("active");
      floatBtn.style.display = "none";
    });
  }

  if (closeChatBtn && floatPanel && floatBtn) {
    closeChatBtn.addEventListener("click", () => {
      floatPanel.classList.remove("active");
      floatBtn.style.display = "flex";
    });
  }
}

/**
 * Dropdowns initialization (Simulation selects, filters)
 */
function setupDropdowns() {
  const simRep = document.getElementById("sim-rep");
  const simCustomer = document.getElementById("sim-customer");
  const simCategory = document.getElementById("sim-category");
  const filterCustRep = document.getElementById("filter-customer-rep");

  const compareA = document.getElementById("compare-rep-a");
  const compareB = document.getElementById("compare-rep-b");

  // Clear options
  simRep.innerHTML = "";
  simCustomer.innerHTML = "";
  simCategory.innerHTML = "";
  filterCustRep.innerHTML = '<option value="all">All Representative Contacts</option>';
  compareA.innerHTML = "";
  compareB.innerHTML = "";

  // Populate salespeople options
  salespeople.forEach((rep, idx) => {
    const opt = `<option value="${rep.user_id}">${rep.name}</option>`;
    simRep.insertAdjacentHTML("beforeend", opt);
    filterCustRep.insertAdjacentHTML("beforeend", opt);
    
    // Comparison defaults (select 1st and 2nd reps)
    const optA = `<option value="${rep.user_id}" ${idx === 0 ? 'selected' : ''}>${rep.name}</option>`;
    const optB = `<option value="${rep.user_id}" ${idx === 1 ? 'selected' : ''}>${rep.name}</option>`;
    compareA.insertAdjacentHTML("beforeend", optA);
    compareB.insertAdjacentHTML("beforeend", optB);
  });

  // Populate customer options
  customers.forEach(cust => {
    const company = getCustomerCompany(cust.user_id, cust.name);
    const opt = `<option value="${cust.user_id}">${company} (${cust.name})</option>`;
    simCustomer.insertAdjacentHTML("beforeend", opt);
  });

  // Populate products
  products.forEach((prod, idx) => {
    const opt = `<option value="${prod.prod_id}" ${idx === 0 ? 'selected' : ''}>${prod.productName} ($${prod.amount.toFixed(2)})</option>`;
    simCategory.insertAdjacentHTML("beforeend", opt);
  });

  // Add auto-amount update on product selection
  simCategory.addEventListener("change", (e) => {
    const prodId = parseInt(e.target.value);
    const prodObj = productMap.get(prodId);
    if (prodObj) {
      document.getElementById("sim-amount").value = prodObj.amount.toFixed(2);
    }
  });

  // Set default simulation amount based on first product
  if (products[0]) {
    document.getElementById("sim-amount").value = products[0].amount.toFixed(2);
  }
}

/**
 * Modal visibility utilities
 */
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

/**
 * Open Representative Profile Deep Dive
 */
function openRepModal(repId) {
  // If customer modal is open, close it
  closeModal("modal-customer-detail");

  const rep = userMap.get(repId);
  if (!rep) return;

  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  // Filter rep orders
  const repOrders = allOrders.filter(o => o.created_by === repId);
  const todayOrders = repOrders.filter(o => o.order_date_time === dates.today);
  const mtdOrders = repOrders.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd);

  const todayRev = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const mtdRev = mtdOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const progress = (mtdRev / monthlyTarget) * 100;
  const progressLimit = Math.min(progress, 100).toFixed(0);

  // Set details
  document.getElementById("rep-detail-name").innerText = rep.name;
  document.getElementById("rep-detail-avatar").innerText = rep.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  document.getElementById("rep-detail-avatar").style.background = getAvatarGradient(rep.user_id);
  document.getElementById("rep-detail-role").innerText = "Senior Sales Executive";
  
  const badge = document.getElementById("rep-detail-tier-badge");
  const tier = getRepPerformanceTier(progress);
  badge.className = `rep-detail-badge ${tier}`;
  badge.innerText = getRepPerformanceTierText(progress);

  document.getElementById("rep-detail-today-rev").innerText = formatCurrency(todayRev);
  document.getElementById("rep-detail-today-sales").innerText = todayOrders.length;
  document.getElementById("rep-detail-mtd-rev").innerText = formatCurrency(mtdRev);
  document.getElementById("rep-detail-mtd-sales").innerText = mtdOrders.length;

  document.getElementById("rep-detail-target-label").innerText = `Monthly Target Progress (${formatCurrency(monthlyTarget)})`;
  document.getElementById("rep-detail-progress-fill").style.width = `${progressLimit}%`;
  document.getElementById("rep-detail-progress-text").innerText = `${progress.toFixed(0)}% achieved`;

  document.getElementById("rep-detail-email").innerText = rep.name.trim().toLowerCase().replace(/\s+/g, ".") + "@apexanalytics.com";
  document.getElementById("rep-detail-phone").innerText = `+1 (555) 019-${(rep.user_id % 1000).toString().padStart(4, '0')}`;
  document.getElementById("rep-detail-bio").innerText = getRepBio(rep.user_id, rep.name);

  // Populate Tab 1: Assigned Clients
  const repClientsTbody = document.getElementById("rep-detail-customers-rows");
  repClientsTbody.innerHTML = "";

  // Find customers whose orders this rep created
  const clientRevenue = {};
  repOrders.forEach(o => {
    clientRevenue[o.user_id] = (clientRevenue[o.user_id] || 0) + (o.amount || 0);
  });

  const resolvedClients = Object.entries(clientRevenue).map(([custId, spend]) => {
    const custObj = userMap.get(parseInt(custId));
    if (!custObj) return null;

    const custAllOrders = allOrders.filter(o => o.user_id === custObj.user_id);
    const mtdCustOrders = custAllOrders.filter(o => o.order_date_time >= mtdStart && o.order_date_time <= mtdEnd && o.created_by === repId);
    
    const datesSorted = custAllOrders.map(o => o.order_date_time).sort();
    const lastD = datesSorted[datesSorted.length - 1] || "N/A";

    return {
      profile: custObj,
      company: getCustomerCompany(custObj.user_id, custObj.name),
      tier: getCustomerTier(spend),
      mtdPurchases: mtdCustOrders.length,
      spend,
      lastD
    };
  }).filter(Boolean);

  if (resolvedClients.length === 0) {
    repClientsTbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 16px;">No clients managed by this representative.</td></tr>`;
  } else {
    resolvedClients.forEach(c => {
      const lastDFormatted = c.lastD !== "N/A" ? new Date(c.lastD + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "N/A";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight: 700; color:#fff;">${c.company}</td>
        <td><span class="loyalty-badge ${c.tier.toLowerCase()}">${c.tier}</span></td>
        <td>${c.mtdPurchases}</td>
        <td style="font-weight: 700;">${formatCurrency(c.spend)}</td>
        <td>${lastDFormatted}</td>
      `;
      // Click client row to view client profile
      row.addEventListener("click", () => openCustomerModal(c.profile.user_id));
      repClientsTbody.appendChild(row);
    });
  }

  // Populate Tab 2: Recent Transactions
  const repTxTbody = document.getElementById("rep-detail-transactions-rows");
  repTxTbody.innerHTML = "";

  const sortedRepOrders = [...repOrders].sort((a, b) => b.order_no - a.order_no).slice(0, 30);

  if (sortedRepOrders.length === 0) {
    repTxTbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 16px;">No recent transactions for this representative.</td></tr>`;
  } else {
    sortedRepOrders.forEach(o => {
      const custObj = userMap.get(o.user_id);
      const company = custObj ? getCustomerCompany(custObj.user_id, custObj.name) : "Anonymous Client";
      const pName = o.products?.productName || "Product Suite";
      const dateFormatted = o.order_date_time ? new Date(o.order_date_time + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "N/A";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight:700;">#${o.order_no}</td>
        <td>${company}</td>
        <td>${dateFormatted}</td>
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pName}</td>
        <td style="font-weight:700; color: var(--accent-teal);">${formatCurrency(o.amount)}</td>
      `;
      repTxTbody.appendChild(row);
    });
  }

  // Rep Modal Tabs binding
  setupRepModalTabs();

  openModal("modal-rep-detail");
}

function setupRepModalTabs() {
  const tabs = document.querySelectorAll("#modal-rep-detail .rep-tab-btn");
  tabs.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true)); // remove old listeners
  });

  const freshBtns = document.querySelectorAll("#modal-rep-detail .rep-tab-btn");
  freshBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      freshBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const isTx = btn.id === "btn-rep-tab-transactions";
      document.getElementById("rep-tab-content-customers").classList.toggle("active", !isTx);
      document.getElementById("rep-tab-content-transactions").classList.toggle("active", isTx);
    });
  });
}

/**
 * Open Customer Profile Detail Modal
 */
function openCustomerModal(custId) {
  // If rep modal is open, close it
  closeModal("modal-rep-detail");

  const cust = userMap.get(custId);
  if (!cust) return;

  const dates = getComparisonDates(selectedDate);
  const mtdStart = dates.mtdStart;
  const mtdEnd = dates.mtdEnd;

  const custOrders = allOrders.filter(o => o.user_id === custId);
  const totalSpent = custOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const lastD = custOrders.map(o => o.order_date_time).sort().pop() || "N/A";

  const companyName = getCustomerCompany(cust.user_id, cust.name);
  const tier = getCustomerTier(totalSpent);

  // Find assigned executive (the rep they bought from most)
  const repTally = {};
  custOrders.forEach(o => {
    repTally[o.created_by] = (repTally[o.created_by] || 0) + 1;
  });
  const sortedReps = Object.entries(repTally).sort((a, b) => b[1] - a[1]);
  const resolvedRepId = sortedReps[0] ? parseInt(sortedReps[0][0]) : (cust.user_id % salespeople.length + 1001);
  const repObj = userMap.get(resolvedRepId);
  const repName = repObj ? repObj.name : "Sales Director";

  // Fill UI
  document.getElementById("cust-detail-company").innerText = companyName;
  document.getElementById("cust-detail-contact-name").innerText = `Contact Person: ${cust.name}`;
  document.getElementById("cust-detail-initials").innerText = cust.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  
  const badge = document.getElementById("cust-detail-tier-badge");
  badge.className = `cust-detail-badge ${tier.toLowerCase()}`;
  badge.innerText = `${tier} Tier`;

  const cleanDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  document.getElementById("cust-detail-email").innerText = `procurement@${cleanDomain}.com`;
  document.getElementById("cust-detail-phone").innerText = `+1 (555) 012-${(cust.user_id % 1000).toString().padStart(4, '0')}`;
  document.getElementById("cust-detail-website").innerText = `www.${cleanDomain}.com`;

  document.getElementById("cust-detail-rep-name").innerText = repName;
  document.getElementById("cust-detail-rep-avatar").innerText = repName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  document.getElementById("cust-detail-rep-avatar").style.background = getAvatarGradient(resolvedRepId);

  // View executive profile
  const viewRepBtn = document.getElementById("btn-view-assigned-rep");
  viewRepBtn.replaceWith(viewRepBtn.cloneNode(true));
  document.getElementById("btn-view-assigned-rep").addEventListener("click", () => openRepModal(resolvedRepId));

  document.getElementById("cust-detail-total-spend").innerText = formatCurrency(totalSpent);
  document.getElementById("cust-detail-total-orders").innerText = custOrders.length;
  document.getElementById("cust-detail-last-date").innerText = lastD !== "N/A" ? new Date(lastD + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

  // Render purchase timeline
  const timelineTbody = document.getElementById("cust-detail-history-rows");
  timelineTbody.innerHTML = "";

  const sortedCustOrders = [...custOrders].sort((a, b) => b.order_no - a.order_no);

  if (sortedCustOrders.length === 0) {
    timelineTbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align: center; padding: 16px;">No transactions recorded for this client.</td></tr>`;
  } else {
    sortedCustOrders.forEach(o => {
      const rep = userMap.get(o.created_by);
      const name = rep ? rep.name : "Salesperson";
      const pName = o.products?.productName || "Product Suite";
      const dateFormatted = o.order_date_time ? new Date(o.order_date_time + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dateFormatted}</td>
        <td>${pName}</td>
        <td>${name}</td>
        <td style="font-weight: 700; color: var(--accent-teal);">${formatCurrency(o.amount)}</td>
      `;
      timelineTbody.appendChild(row);
    });
  }

  openModal("modal-customer-detail");
}

/**
 * Record New Simulated Transaction
 */
function recordSimulatedSale() {
  const repId = parseInt(document.getElementById("sim-rep").value);
  const custId = parseInt(document.getElementById("sim-customer").value);
  const prodId = parseInt(document.getElementById("sim-category").value);
  const amount = parseFloat(document.getElementById("sim-amount").value);
  const dateVal = document.getElementById("sim-date").value;

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid positive amount", "error");
    return;
  }

  const repObj = userMap.get(repId);
  const custObj = userMap.get(custId);
  const prodObj = productMap.get(prodId);

  // Resolve maximum order ID
  const maxOrderNo = allOrders.reduce((max, o) => Math.max(max, o.order_no || 0), 0);

  const newOrder = {
    order_no: maxOrderNo + 1,
    order_date_time: dateVal,
    user_id: custId,
    product_id: prodId,
    amount: amount,
    discount_amount: 0,
    created_by: repId,
    destination_id: null,
    users: custObj,
    products: prodObj,
    destinations: null
  };

  simulatedOrders.push(newOrder);
  localStorage.setItem("apex_simulated_orders", JSON.stringify(simulatedOrders));

  rebuildOrders();
  closeModal("modal-simulate");

  // Success effects
  showToast(`Simulated sale recorded for ${formatCurrency(amount)}`);
  triggerConfetti();

  // If active selected date was the transaction date, re-render
  renderAll();
}

/**
 * Seeds random sales inside the selected date's calendar month
 */
function seedSampleData() {
  const datePickerVal = document.getElementById("dashboard-date").value;
  const d = new Date(datePickerVal + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const mockCategories = [...products];
  if (mockCategories.length === 0 || salespeople.length === 0 || customers.length === 0) {
    showToast("No database records available to seed data.", "error");
    return;
  }

  const seedsCount = 10;
  const maxOrderNo = allOrders.reduce((max, o) => Math.max(max, o.order_no || 0), 0);

  for (let i = 1; i <= seedsCount; i++) {
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
    const randomDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;

    const rep = salespeople[Math.floor(Math.random() * salespeople.length)];
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const prod = mockCategories[Math.floor(Math.random() * mockCategories.length)];
    const amountModifier = (Math.random() * 0.4) + 0.8; // +/- 20%
    const amountVal = parseFloat((prod.amount * amountModifier).toFixed(2));

    const mockOrder = {
      order_no: maxOrderNo + i,
      order_date_time: randomDayStr,
      user_id: cust.user_id,
      product_id: prod.prod_id,
      amount: amountVal,
      discount_amount: 0,
      created_by: rep.user_id,
      destination_id: null,
      users: cust,
      products: prod,
      destinations: null
    };

    simulatedOrders.push(mockOrder);
  }

  localStorage.setItem("apex_simulated_orders", JSON.stringify(simulatedOrders));
  rebuildOrders();
  showToast(`Successfully seeded 10 mock transactions for ${d.toLocaleDateString("en", { month: "long", year: "numeric" })}`);
  triggerConfetti();
  renderAll();
}

/**
 * Speech Recognition STT Integration
 */
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API Recognition is not supported by this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("btn-voice-input").classList.add("active");
    document.getElementById("nova-visualizer").classList.add("active");
    showToast("Nova is listening for voice commands...", "info");
  };

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    document.getElementById("nova-chat-input").value = voiceText;
    showToast(`Transcribed query: "${voiceText}"`, "success");
    submitNovaQuery(voiceText);
  };

  recognition.onerror = (event) => {
    console.error("Speech transcription error", event.error);
    isListening = false;
    deactivateMicUI();
    showToast(`Speech input error: ${event.error}`, "error");
  };

  recognition.onend = () => {
    isListening = false;
    deactivateMicUI();
  };
}

function deactivateMicUI() {
  const micBtn = document.getElementById("btn-voice-input");
  if (micBtn) micBtn.classList.remove("active");
  
  // Keep visualizer running if synthesized speech voice output is still active
  if (!window.speechSynthesis || !window.speechSynthesis.speaking) {
    const visualizer = document.getElementById("nova-visualizer");
    if (visualizer) visualizer.classList.remove("active");
  }
}

/**
 * Speech Synthesis TTS Integration
 */
function speakText(text) {
  if (!speechOutputActive) return;

  const SpeechSynthesis = window.speechSynthesis;
  if (!SpeechSynthesis) return;

  // Cancel current speech
  SpeechSynthesis.cancel();

  // Strip html brackets
  const textBody = text.replace(/<\/?[^>]+(>|$)/g, "");

  const utterance = new SpeechSynthesisUtterance(textBody);
  
  // Premium voice select
  const voices = SpeechSynthesis.getVoices();
  const defaultVoice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Google")) || voices.find(v => v.lang.includes("en")) || voices[0];
  if (defaultVoice) utterance.voice = defaultVoice;

  utterance.rate = 1.05;
  utterance.pitch = 1.02;

  utterance.onstart = () => {
    const visualizer = document.getElementById("nova-visualizer");
    if (visualizer) visualizer.classList.add("active");
  };

  utterance.onend = () => {
    const visualizer = document.getElementById("nova-visualizer");
    if (visualizer && !isListening) {
      visualizer.classList.remove("active");
    }
  };

  utterance.onerror = () => {
    const visualizer = document.getElementById("nova-visualizer");
    if (visualizer && !isListening) {
      visualizer.classList.remove("active");
    }
  };

  SpeechSynthesis.speak(utterance);
}

/**
 * Handle Nova Dialogue Submission
 */
function submitNovaQuery(queryText) {
  const chatLog = document.getElementById("nova-chat-log");
  if (!chatLog) return;

  // Append user bubble
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.innerHTML = `
    <div class="bubble-avatar">AV</div>
    <div class="bubble-content font-jakarta">
      <p>${escapeHtml(queryText)}</p>
    </div>
  `;
  chatLog.appendChild(userBubble);
  chatLog.scrollTop = chatLog.scrollHeight;

  // Simulate AI loading process
  setTimeout(() => {
    const responseText = processNovaQuery(queryText);
    
    const novaBubble = document.createElement("div");
    novaBubble.className = "chat-bubble nova";
    novaBubble.innerHTML = `
      <div class="bubble-avatar">N</div>
      <div class="bubble-content font-jakarta">
        ${responseText}
      </div>
    `;
    chatLog.appendChild(novaBubble);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Trigger Speech Feedback
    speakText(responseText);
  }, 500);
}

/**
 * Nova Database Analysis Engine
 */
function processNovaQuery(queryText) {
  const clean = queryText.toLowerCase().trim();
  const dates = getComparisonDates(selectedDate);
  const mtdOrders = allOrders.filter(o => o.order_date_time >= dates.mtdStart && o.order_date_time <= dates.mtdEnd);
  const todayOrders = allOrders.filter(o => o.order_date_time === dates.today);

  // 1. Today Revenue / Sales counts
  if (clean.includes("today") && (clean.includes("revenue") || clean.includes("sales") || clean.includes("spend") || clean.includes("total") || clean.includes("billing"))) {
    const todayRev = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const todaySales = todayOrders.length;
    return `Today's revenue is <strong>${formatCurrency(todayRev)}</strong> across <strong>${todaySales}</strong> transaction${todaySales !== 1 ? 's' : ''}. This is compared against PMSD (${new Date(dates.pmsd + "T00:00:00").toLocaleDateString()}).`;
  }

  // 2. Leaderboard Top representative
  if (clean.includes("leaderboard") || clean.includes("top representative") || clean.includes("top rep") || clean.includes("best rep") || clean.includes("who is leading") || clean.includes("top agent") || clean.includes("best agent")) {
    const repRevenue = {};
    salespeople.forEach(r => repRevenue[r.user_id] = 0);
    mtdOrders.forEach(o => {
      if (repRevenue[o.created_by] !== undefined) repRevenue[o.created_by] += o.amount || 0;
    });
    const sortedReps = Object.entries(repRevenue).sort((a, b) => b[1] - a[1]);
    const topRepId = parseInt(sortedReps[0]?.[0] || 0);
    const topRepObj = userMap.get(topRepId);
    const topRepVal = sortedReps[0]?.[1] || 0;
    if (topRepObj) {
      const progress = (topRepVal / monthlyTarget) * 100;
      return `Our top performing representative Month-to-Date is <strong>${topRepObj.name}</strong>, with a total revenue of <strong>${formatCurrency(topRepVal)}</strong>. This is <strong>${progress.toFixed(0)}%</strong> of their individual monthly milestone.`;
    }
    return "There is no representative performance data recorded in this period.";
  }

  // 3. Customers details
  if (clean.includes("customer") || clean.includes("client") || clean.includes("highest spending") || clean.includes("spent") || clean.includes("platinum") || clean.includes("account") || clean.includes("loyalty")) {
    const customerStats = customers.map(c => {
      const orders = allOrders.filter(o => o.user_id === c.user_id);
      const spent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      return { name: c.name, spent, company: getCustomerCompany(c.user_id, c.name), tier: getCustomerTier(spent) };
    });

    if (clean.includes("platinum")) {
      const plats = customerStats.filter(c => c.tier === "Platinum");
      if (plats.length === 0) return "We currently have no Platinum-tier customer accounts in the database.";
      const listHtml = plats.map(c => `<li><strong>${c.company}</strong> (Contact: ${c.name}) - Total Spend: ${formatCurrency(c.spent)}</li>`).join("");
      return `Here are the <strong>${plats.length}</strong> Platinum tier customer accounts:<ul>${listHtml}</ul>`;
    }

    customerStats.sort((a, b) => b.spent - a.spent);
    const topCust = customerStats[0];
    if (topCust) {
      return `Our highest spending corporate client account is <strong>${topCust.company}</strong> (contact: <strong>${topCust.name}</strong>) with a total lifetime spend of <strong>${formatCurrency(topCust.spent)}</strong>, placing them in the <strong>${topCust.tier}</strong> loyalty tier.`;
    }
  }

  // 4. Simulate Sale
  if (clean.includes("simulate") || clean.includes("record") || clean.includes("add sale") || clean.includes("add transaction")) {
    const numMatch = clean.match(/\d+/g);
    const amountVal = numMatch ? parseFloat(numMatch[0]) : 5000;
    
    // Choose random rep, customer, product
    const randomRep = salespeople[Math.floor(Math.random() * salespeople.length)];
    const randomCust = customers[Math.floor(Math.random() * customers.length)];
    const randomProd = products[Math.floor(Math.random() * products.length)];
    
    if (randomRep && randomCust && randomProd) {
      const maxOrderNo = allOrders.reduce((max, o) => Math.max(max, o.order_no || 0), 0);
      const mockOrder = {
        order_no: maxOrderNo + 1,
        order_date_time: selectedDate,
        user_id: randomCust.user_id,
        product_id: randomProd.prod_id,
        amount: amountVal,
        discount_amount: 0,
        created_by: randomRep.user_id,
        destination_id: null,
        users: randomCust,
        products: randomProd,
        destinations: null
      };

      simulatedOrders.push(mockOrder);
      localStorage.setItem("apex_simulated_orders", JSON.stringify(simulatedOrders));
      rebuildOrders();
      renderAll();
      triggerConfetti();
      return `Simulated transaction recorded successfully! Added a sale of <strong>${formatCurrency(amountVal)}</strong> by representative <strong>${randomRep.name}</strong> for customer <strong>${getCustomerCompany(randomCust.user_id, randomCust.name)}</strong> on selected date ${selectedDate}. Dashboard metrics updated!`;
    }
    return "Failed to simulate transaction. Verify mock arrays are loaded.";
  }

  // 5. Seed data
  if (clean.includes("seed") || clean.includes("populate")) {
    setTimeout(() => seedSampleData(), 500);
    return "Initiating automated transaction seeding... Adding 10 mock transactions within the current month date range. The charts will refresh in a brief moment.";
  }

  // 6. Reset simulated data
  if (clean.includes("reset") || clean.includes("clear") || clean.includes("delete")) {
    localStorage.removeItem("apex_simulated_orders");
    simulatedOrders = [];
    rebuildOrders();
    setTimeout(() => renderAll(), 500);
    return "Simulated transaction cache cleared. Telemetry has returned to the Supabase baseline.";
  }

  // 7. Greetings
  if (clean.includes("hello") || clean.includes("hi") || clean.includes("hey") || clean.includes("greetings")) {
    return "Hello Aayush! I am <strong>Nova</strong>, your companion. I can analyze the sales database and run dashboard functions for you. What would you like to check?";
  }

  return "I'm sorry Aayush, I didn't quite capture that query. Try asking me: <ul><li><em>'What is today's revenue?'</em></li><li><em>'Who is leading the team?'</em></li><li><em>'List our Platinum loyalty customers.'</em></li><li><em>'Simulate a sale of $5000'</em></li></ul>";
}

/**
 * Toast Notice System
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "check-circle";
  if (type === "error") icon = "alert-circle";
  if (type === "warning") icon = "alert-triangle";
  if (type === "info") icon = "info";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();

  // Slide out animation
  setTimeout(() => {
    toast.style.animation = "toastSlideOut 0.3s ease-in forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Confetti celebration effect
 */
function triggerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#0ea5e9", "#10b981", "#ffb700"]
    });
  }
}

/**
 * Spinner control
 */
function showLoading(show, message = "Loading...") {
  const overlay = document.getElementById("loading-overlay");
  const text = document.getElementById("loading-text");
  if (!overlay) return;

  if (show) {
    overlay.style.display = "flex";
    overlay.style.opacity = 1;
    if (text) text.innerText = message;
  } else {
    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
}

// XSS safe escape
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// Start
document.addEventListener("DOMContentLoaded", initApp);
