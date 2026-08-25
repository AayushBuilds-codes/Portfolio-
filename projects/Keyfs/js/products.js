// KEYFS Mutual Fund Explorer Script
// Queries live mutual fund data from api.mfapi.in and handles client-side buy events

const POPULAR_FUNDS = [
    { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Equity: Flexi Cap' },
    { code: '120684', name: 'Nippon India Small Cap Fund - Direct Growth', category: 'Equity: Small Cap' },
    { code: '119598', name: 'SBI Bluechip Fund - Direct Growth', category: 'Equity: Large Cap' },
    { code: '119063', name: 'HDFC Top 100 Fund - Direct Growth', category: 'Equity: Large Cap' },
    { code: '120847', name: 'Quant Active Fund - Direct Growth', category: 'Equity: Multi Cap' },
    { code: '120586', name: 'ICICI Prudential Bluechip Fund - Direct Growth', category: 'Equity: Large Cap' },
    { code: '119640', name: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Equity: Large Cap' },
    { code: '120465', name: 'Axis Bluechip Fund - Direct Growth', category: 'Equity: Large Cap' }
];

let masterSchemeList = [];
let navChart = null;
let activeViewingFund = { code: '', name: '' };

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mf-explorer-table')) {
        initMFExplorer();
    }
});

async function initMFExplorer() {
    const tableBody = document.getElementById('mf-explorer-table');
    const searchInput = document.getElementById('mf-search-input');
    const modal = document.getElementById('mf-details-modal');
    const modalClose = document.getElementById('modal-close-btn');

    // 1. Load Trending/Popular Funds Table with Live NAVs
    loadPopularFunds(tableBody);

    // 2. Fetch full scheme index asynchronously in background for search auto-completion
    fetchMasterSchemeList();

    // 3. Search Box Input Listener (Debounced)
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim().toLowerCase();
        
        if (query.length === 0) {
            loadPopularFunds(tableBody);
            return;
        }

        if (query.length < 3) return; // wait for 3 characters

        // Show loading spinner in table body
        tableBody.innerHTML = '<tr><td colspan="5"><div class="spinner"></div></td></tr>';

        debounceTimer = setTimeout(() => {
            performSearch(query, tableBody);
        }, 400);
    });

    // 4. Modal Closer
    if (modalClose && modal) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
            if (navChart) {
                navChart.destroy();
                navChart = null;
            }
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (navChart) {
                    navChart.destroy();
                    navChart = null;
                }
            }
        });
    }

    // 5. Connect Buy Button handler
    const modalBuyBtn = document.getElementById('modal-buy-btn');
    if (modalBuyBtn) {
        modalBuyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeBuyActiveFund();
        });
    }
}

// Fetch Popular Funds dynamically
async function loadPopularFunds(tableBody) {
    tableBody.innerHTML = '';
    
    // Create rows with loading badges first
    POPULAR_FUNDS.forEach(fund => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${fund.name}</strong><br><span style="font-size:0.8rem; color:var(--text-secondary);">${fund.category}</span></td>
            <td id="nav-val-${fund.code}">Loading...</td>
            <td id="nav-date-${fund.code}">-</td>
            <td id="nav-ret-${fund.code}">-</td>
            <td><button class="btn-table-action" onclick="viewFundDetails('${fund.code}', '${fund.name.replace(/'/g, "\\'")}')">View Details</button></td>
        `;
        tableBody.appendChild(row);

        // Perform individual dynamic fetch for the NAV and calculations
        fetchFundNAV(fund.code);
    });
}

async function fetchFundNAV(code) {
    try {
        const response = await fetch(`https://api.mfapi.in/mf/${code}`);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            const latest = data.data[0];
            const latestNAV = parseFloat(latest.nav);
            const date = latest.date;

            // Calculate mock returns based on historical data for realistic display
            let returnPct = 12.5; // fallback
            if (data.data.length > 250) {
                const oldNAV = parseFloat(data.data[250].nav); // ~1 year ago
                returnPct = ((latestNAV - oldNAV) / oldNAV) * 100;
            } else if (data.data.length > 10) {
                const oldNAV = parseFloat(data.data[data.data.length - 1].nav);
                returnPct = ((latestNAV - oldNAV) / oldNAV) * 12; // annualized estimation
            }

            const navElement = document.getElementById(`nav-val-${code}`);
            const dateElement = document.getElementById(`nav-date-${code}`);
            const retElement = document.getElementById(`nav-ret-${code}`);

            if (navElement) navElement.innerText = '₹' + latestNAV.toFixed(2);
            if (dateElement) dateElement.innerText = date;
            if (retElement) {
                const sign = returnPct >= 0 ? '+' : '';
                retElement.className = returnPct >= 0 ? 'up' : 'down';
                retElement.innerText = `${sign}${returnPct.toFixed(1)}% (1Y)`;
            }
        }
    } catch (err) {
        console.error(`Error loading NAV for fund ${code}:`, err);
        const navElement = document.getElementById(`nav-val-${code}`);
        if (navElement) navElement.innerText = 'Error';
    }
}

// Background loading of scheme master list
async function fetchMasterSchemeList() {
    try {
        const response = await fetch('https://api.mfapi.in/mf');
        masterSchemeList = await response.json();
        console.log(`Loaded ${masterSchemeList.length} mutual funds into index.`);
    } catch (err) {
        console.error('Failed to load master mutual fund scheme list:', err);
    }
}

// Perform client-side filter against search queries
function performSearch(query, tableBody) {
    if (masterSchemeList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Still indexing mutual funds... Please try again in a few seconds.</td></tr>';
        return;
    }

    const matches = [];
    for (let i = 0; i < masterSchemeList.length; i++) {
        const scheme = masterSchemeList[i];
        if (scheme.schemeName.toLowerCase().includes(query)) {
            matches.push(scheme);
            if (matches.length >= 15) break; // limit to 15 search results
        }
    }

    if (matches.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No matching mutual funds found. Try another term (e.g. HDFC, SBI, Equity).</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    matches.forEach(match => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${match.schemeName}</strong><br><span style="font-size:0.8rem; color:var(--text-secondary);">AMFI Code: ${match.schemeCode}</span></td>
            <td id="nav-val-${match.schemeCode}">Loading...</td>
            <td id="nav-date-${match.schemeCode}">-</td>
            <td id="nav-ret-${match.schemeCode}">-</td>
            <td><button class="btn-table-action" onclick="viewFundDetails('${match.schemeCode}', '${match.schemeName.replace(/'/g, "\\'")}')">View Details</button></td>
        `;
        tableBody.appendChild(row);
        fetchFundNAV(match.schemeCode);
    });
}

// View details modal with Chart
async function viewFundDetails(code, name) {
    const modal = document.getElementById('mf-details-modal');
    if (!modal) return;

    activeViewingFund = { code: code, name: name };

    // Show loading text in details
    document.getElementById('modal-fund-name').innerText = name;
    document.getElementById('modal-fund-category').innerText = 'Fetching fund details...';
    document.getElementById('modal-latest-nav').innerText = '₹--';
    document.getElementById('modal-nav-date').innerText = '';

    modal.style.display = 'flex';

    try {
        const response = await fetch(`https://api.mfapi.in/mf/${code}`);
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const meta = data.meta;
            const history = data.data;
            const latest = history[0];

            document.getElementById('modal-fund-category').innerText = `${meta.scheme_type || 'Equity'} | ${meta.scheme_category || 'Mutual Fund'} | AMFI Code ${code}`;
            document.getElementById('modal-latest-nav').innerText = '₹' + parseFloat(latest.nav).toFixed(2);
            document.getElementById('modal-nav-date').innerText = 'as on ' + latest.date;

            // Prepare chart data (last 90 business days)
            const plotData = history.slice(0, 90).reverse();
            const labels = plotData.map(d => d.date);
            const navs = plotData.map(d => parseFloat(d.nav));

            renderNAVChart(labels, navs);
        } else {
            document.getElementById('modal-fund-category').innerText = 'Unable to extract historical data for this fund.';
        }
    } catch (err) {
        console.error('Error fetching details modal data:', err);
        document.getElementById('modal-fund-category').innerText = 'Error communicating with mutual fund API.';
    }
}

// Render historical line chart
function renderNAVChart(labels, dataPoints) {
    const canvas = document.getElementById('modalChart');
    if (!canvas) return;

    if (navChart) {
        navChart.destroy();
    }

    navChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Asset Value (NAV)',
                data: dataPoints,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.2,
                pointRadius: 1,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        maxTicksLimit: 6
                    }
                }
            }
        }
    });
}

// Live Mock Purchase logic for logged in user session
function executeBuyActiveFund() {
    if (typeof dbGetActiveUser !== 'function') {
        alert('Authentication system unavailable.');
        return;
    }

    const user = dbGetActiveUser();
    if (!user) {
        alert('Please login or open a free E-Wealth account to buy mutual funds.');
        window.location.href = 'auth.html';
        return;
    }

    // Enforce KYC check
    if (user.kycStatus === false) {
        alert('Access Denied. You must complete your KYC Verification to buy mutual funds. Redirecting to your dashboard to complete registration.');
        window.location.href = 'dashboard.html';
        return;
    }

    const inputVal = prompt(`Enter amount to invest in "${activeViewingFund.name}" (Minimum ₹1,000):`, '10000');
    if (inputVal === null) return; // cancelled

    const amount = parseFloat(inputVal);
    if (isNaN(amount) || amount < 1000) {
        alert('Invalid amount. The minimum transaction value is ₹1,000.');
        return;
    }

    const portfolio = user.portfolio;
    const cash = portfolio.portfolio_cash || portfolio.cash || 0;
    
    // Safety check for cash balance key
    if (portfolio.portfolio_cash === undefined) {
        portfolio.portfolio_cash = portfolio.cash;
    }

    if (amount > portfolio.portfolio_cash) {
        alert(`Insufficient cash balance in your account. Available balance: ₹${Math.round(portfolio.portfolio_cash).toLocaleString('en-IN')}`);
        return;
    }

    // Execute buy
    portfolio.portfolio_cash -= amount;
    portfolio.invested += amount;
    portfolio.assets.equity += amount;
    
    portfolio.transactions.push({
        date: new Date().toISOString().split('T')[0],
        type: 'Buy',
        asset: activeViewingFund.name,
        amount: amount,
        status: 'Completed'
    });

    dbUpdateUserPortfolio(user.email, portfolio);
    
    alert(`Congratulations! Successfully invested ₹${amount.toLocaleString('en-IN')} in ${activeViewingFund.name}. Transaction completed.`);
    
    // Hide details modal
    document.getElementById('mf-details-modal').style.display = 'none';
}

// Expose modal details function globally
window.viewFundDetails = viewFundDetails;
