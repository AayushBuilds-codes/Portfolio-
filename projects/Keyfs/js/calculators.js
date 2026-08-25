// KEYFS Calculators Script
// Integrates standard financial formulas with dynamic slider listeners and Chart.js

let activeChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the calculators page
    if (document.getElementById('sip-monthly')) {
        initCalculators();
    }
});

function initCalculators() {
    // 1. Tab switching
    const tabs = document.querySelectorAll('.calc-tab');
    const forms = document.querySelectorAll('.calc-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetFormId = tab.getAttribute('data-calc') + '-calc-form';
            forms.forEach(form => {
                if (form.id === targetFormId) {
                    form.style.display = 'block';
                } else {
                    form.style.display = 'none';
                }
            });

            // Recalculate for the newly active tab
            calculate(tab.getAttribute('data-calc'));
        });
    });

    // 2. Setup Slider Listeners
    const sliders = document.querySelectorAll('.slider-input');
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valBox = document.getElementById(slider.id + '-val');
            if (valBox) {
                let formattedVal = slider.value;
                if (slider.id.includes('amt') || slider.id.includes('monthly') || slider.id.includes('target')) {
                    formattedVal = '₹' + parseInt(slider.value).toLocaleString('en-IN');
                } else if (slider.id.includes('rate')) {
                    formattedVal = slider.value + '%';
                } else if (slider.id.includes('years') || slider.id.includes('delay')) {
                    formattedVal = slider.value + ' Yr';
                }
                valBox.innerText = formattedVal;
            }

            // Find current active calc type and calculate
            const activeTab = document.querySelector('.calc-tab.active');
            if (activeTab) {
                calculate(activeTab.getAttribute('data-calc'));
            }
        });
    });

    // Initial calculation
    calculate('sip');
}

// Main Calculator routing
function calculate(type) {
    if (type === 'sip') {
        calculateSIP();
    } else if (type === 'lumpsum') {
        calculateLumpsum();
    } else if (type === 'goal') {
        calculateGoal();
    } else if (type === 'delay') {
        calculateDelay();
    }
}

// 1. SIP Calculator Math
function calculateSIP() {
    const monthlyAmt = parseFloat(document.getElementById('sip-monthly').value);
    const expectedRate = parseFloat(document.getElementById('sip-rate').value);
    const years = parseFloat(document.getElementById('sip-years').value);

    const monthlyRate = expectedRate / 12 / 100;
    const months = years * 12;

    // SIP Formula: M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
    const investedAmount = monthlyAmt * months;
    let totalValue = 0;
    if (monthlyRate === 0) {
        totalValue = investedAmount;
    } else {
        totalValue = monthlyAmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }
    const estReturns = totalValue - investedAmount;

    // Update UI elements
    document.getElementById('sip-total-invested').innerText = formatCurrency(investedAmount);
    document.getElementById('sip-est-returns').innerText = formatCurrency(estReturns);
    document.getElementById('sip-total-value').innerText = formatCurrency(totalValue);

    // Update Chart
    updatePieChart(investedAmount, estReturns);
}

// 2. Lumpsum Calculator Math
function calculateLumpsum() {
    const totalAmt = parseFloat(document.getElementById('lumpsum-amt').value);
    const expectedRate = parseFloat(document.getElementById('lumpsum-rate').value);
    const years = parseFloat(document.getElementById('lumpsum-years').value);

    // Lumpsum Formula: A = P * (1 + r/100)^n
    const investedAmount = totalAmt;
    const totalValue = totalAmt * Math.pow(1 + expectedRate / 100, years);
    const estReturns = totalValue - investedAmount;

    // Update UI
    document.getElementById('lumpsum-total-invested').innerText = formatCurrency(investedAmount);
    document.getElementById('lumpsum-est-returns').innerText = formatCurrency(estReturns);
    document.getElementById('lumpsum-total-value').innerText = formatCurrency(totalValue);

    // Update Chart
    updatePieChart(investedAmount, estReturns);
}

// 3. Goal Planner Math
function calculateGoal() {
    const targetAmt = parseFloat(document.getElementById('goal-target').value);
    const expectedRate = parseFloat(document.getElementById('goal-rate').value);
    const years = parseFloat(document.getElementById('goal-years').value);

    const monthlyRate = expectedRate / 12 / 100;
    const months = years * 12;

    // Goal Formula (Solve for SIP Monthly): P = M / ( [ ( (1 + i)^n - 1 ) / i ] * (1 + i) )
    let requiredMonthly = 0;
    if (monthlyRate === 0) {
        requiredMonthly = targetAmt / months;
    } else {
        requiredMonthly = targetAmt / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    }

    const investedAmount = requiredMonthly * months;
    const estReturns = targetAmt - investedAmount;

    // Update UI
    document.getElementById('goal-required-sip').innerText = formatCurrency(requiredMonthly) + ' / Mo';
    document.getElementById('goal-total-invested').innerText = formatCurrency(investedAmount);
    document.getElementById('goal-est-returns').innerText = formatCurrency(estReturns);

    // Update Chart
    updatePieChart(investedAmount, estReturns);
}

// 4. Delay in SIP Calculator Math
function calculateDelay() {
    const monthlyAmt = parseFloat(document.getElementById('delay-monthly').value);
    const expectedRate = parseFloat(document.getElementById('delay-rate').value);
    const years = parseFloat(document.getElementById('delay-years').value);
    const delayYears = parseFloat(document.getElementById('delay-time').value);

    const monthlyRate = expectedRate / 12 / 100;
    
    // Scenario A: Started Today
    const totalMonthsNow = years * 12;
    const wealthNow = monthlyAmt * ((Math.pow(1 + monthlyRate, totalMonthsNow) - 1) / monthlyRate) * (1 + monthlyRate);
    const investedNow = monthlyAmt * totalMonthsNow;

    // Scenario B: Started After Delay
    const totalMonthsDelayed = (years - delayYears) * 12;
    let wealthDelayed = 0;
    if (totalMonthsDelayed > 0) {
        wealthDelayed = monthlyAmt * ((Math.pow(1 + monthlyRate, totalMonthsDelayed) - 1) / monthlyRate) * (1 + monthlyRate);
    }
    const investedDelayed = monthlyAmt * Math.max(0, totalMonthsDelayed);

    const netCostOfDelay = wealthNow - wealthDelayed;

    // Update UI
    document.getElementById('delay-wealth-now').innerText = formatCurrency(wealthNow);
    document.getElementById('delay-wealth-delayed').innerText = formatCurrency(wealthDelayed);
    document.getElementById('delay-cost').innerText = formatCurrency(netCostOfDelay);

    // Update double bar chart representing Delay Cost
    updateDelayChart(wealthNow, wealthDelayed);
}

// --- Chart Helper functions using Chart.js ---
function updatePieChart(invested, returns) {
    const ctx = document.getElementById('calcChart');
    if (!ctx) return;

    if (activeChart) {
        activeChart.destroy();
    }

    // Chart.js initialization
    activeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Invested Amount', 'Est. Returns'],
            datasets: [{
                data: [invested, returns],
                backgroundColor: ['#171D2C', '#10B981'],
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9CA3AF',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function updateDelayChart(wealthNow, wealthDelayed) {
    const ctx = document.getElementById('calcChart');
    if (!ctx) return;

    if (activeChart) {
        activeChart.destroy();
    }

    activeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Start Today', `Start in ${document.getElementById('delay-time').value} Years`],
            datasets: [{
                label: 'Potential Wealth Accumulated',
                data: [wealthNow, wealthDelayed],
                backgroundColor: ['#10B981', '#3B82F6'],
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1
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
                        color: '#9CA3AF',
                        callback: function(value) {
                            if (value >= 10000000) return '₹' + (value / 10000000) + ' Cr';
                            if (value >= 100000) return '₹' + (value / 100000) + ' L';
                            return '₹' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                }
            }
        }
    });
}

// Utility Formatter Local copy
function formatCurrency(val) {
    if (val === 0) return '₹0';
    if (val >= 10000000) {
        return '₹' + (val / 10000000).toFixed(2) + ' Cr';
    }
    if (val >= 100000) {
        return '₹' + (val / 100000).toFixed(2) + ' Lakh';
    }
    return '₹' + Math.round(val).toLocaleString('en-IN');
}
