// KEYFS Client Dashboard Script
// Manages active user session portfolios, mock transactions, KYC checks, and Bank Integrations

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
    ? 'http://localhost:5000'
    : '';

let activeUser = null;
let portfolio = {};
let allocationChart = null;
let kycDocNumber = '';
let currentSimulatedOTP = '';
let marketTickInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('portfolio-total-value')) {
        initDashboard();
    }
});

function initDashboard() {
    // 1. Enforce Authentication Guard (Redirect to auth if no active session)
    if (typeof dbGetActiveUser !== 'function') {
        alert('Database layer missing. Redirecting to home.');
        window.location.href = 'index.html';
        return;
    }

    activeUser = dbGetActiveUser();
    if (!activeUser) {
        alert('Access denied. Please login or register to view your E-Wealth console.');
        window.location.href = 'auth.html';
        return;
    }

    // Load active user's portfolio data
    portfolio = activeUser.portfolio;
    
    // Ensure cash balance key safety
    if (portfolio.portfolio_cash === undefined) {
        portfolio.portfolio_cash = portfolio.cash || 0;
    }

    // 2. Setup user badges
    updateUserBadges();

    // 3. Initial UI rendering
    updateDashboardUI();

    // 4. Check compliance KYC state
    checkKYCStatus();

    // 5. Setup mock transactions and modals
    initTransactionModal();
    initKYCWizardModal();
    initBankModals();
}

function checkKYCStatus() {
    const kycBanner = document.getElementById('kyc-warning-banner');
    const investBtn = document.getElementById('dashboard-btn-invest');

    if (activeUser.kycStatus === false) {
        if (kycBanner) kycBanner.style.display = 'flex';
        if (investBtn) {
            investBtn.disabled = true;
            investBtn.style.opacity = '0.5';
            investBtn.style.cursor = 'not-allowed';
            investBtn.title = 'Complete KYC to unlock trading console.';
        }
    } else {
        if (kycBanner) kycBanner.style.display = 'none';
        if (investBtn) {
            investBtn.disabled = false;
            investBtn.style.opacity = '1';
            investBtn.style.cursor = 'pointer';
            investBtn.title = '';
        }

        // Start portfolio ticking
        startMarketSimulation();
    }
}

function startMarketSimulation() {
    if (marketTickInterval) clearInterval(marketTickInterval);

    marketTickInterval = setInterval(() => {
        const pct = (Math.random() - 0.42) * 0.001; 
        portfolio.assets.equity *= (1 + pct);
        portfolio.assets.gold *= (1 + (Math.random() - 0.5) * 0.0005);
        
        dbUpdateUserPortfolio(activeUser.email, portfolio);
        updateDashboardUI(true); 
    }, 4000);
}

function updateUserBadges() {
    const nameBadge = document.querySelector('.dash-user-badge span');
    const avatarBadge = document.querySelector('.avatar');

    if (nameBadge) {
        nameBadge.innerText = activeUser.name;
    }
    
    if (avatarBadge) {
        const parts = activeUser.name.split(' ');
        const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
        avatarBadge.innerText = initials || 'US';
    }
}

function updateDashboardUI(onlyValues = false) {
    const equityVal = portfolio.assets.equity;
    const debtVal = portfolio.assets.debt;
    const goldVal = portfolio.assets.gold;
    const cashVal = portfolio.portfolio_cash;

    const currentValue = equityVal + debtVal + goldVal + cashVal;
    const totalInvested = portfolio.invested;
    const totalReturns = currentValue - totalInvested;
    
    let returnsPct = 0;
    if (totalInvested > 0) {
        returnsPct = (totalReturns / totalInvested) * 100;
    }

    animateValue('portfolio-total-value', currentValue, '₹');
    animateValue('portfolio-invested', totalInvested, '₹');
    animateValue('portfolio-cash-balance', cashVal, '₹');
    
    const returnsEl = document.getElementById('portfolio-returns');
    if (returnsEl) {
        const sign = totalReturns >= 0 ? '+' : '';
        returnsEl.className = totalReturns >= 0 ? 'value up' : 'value down';
        returnsEl.innerText = `${sign}₹${Math.round(totalReturns).toLocaleString('en-IN')} (${sign}${returnsPct.toFixed(2)}%)`;
    }

    const eqCard = document.getElementById('asset-val-equity');
    const dbCard = document.getElementById('asset-val-debt');
    const gdCard = document.getElementById('asset-val-gold');
    if (eqCard) eqCard.innerText = '₹' + Math.round(equityVal).toLocaleString('en-IN');
    if (dbCard) dbCard.innerText = '₹' + Math.round(debtVal).toLocaleString('en-IN');
    if (gdCard) gdCard.innerText = '₹' + Math.round(goldVal).toLocaleString('en-IN');

    // Update Linked Bank widget labels
    updateBankUI();

    if (!onlyValues) {
        renderTransactionHistory();
        renderAllocationChart(equityVal, debtVal, goldVal, cashVal);
    }
}

function animateValue(id, targetVal, prefix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = prefix + Math.round(targetVal).toLocaleString('en-IN');
}

function renderAllocationChart(equity, debt, gold, cash) {
    const ctx = document.getElementById('allocationChartCanvas');
    if (!ctx) return;

    if (allocationChart) {
        allocationChart.destroy();
    }

    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Equity Mutual Funds', 'Bonds / Debt', 'Gold ETFs', 'Liquid Cash'],
            datasets: [{
                data: [equity, debt, gold, cash],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#171D2C'],
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
                            size: 11
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderTransactionHistory() {
    const tbody = document.getElementById('dash-transactions-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const list = [...portfolio.transactions].reverse();

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No transactions recorded yet.</td></tr>';
        return;
    }

    list.forEach(tx => {
        const row = document.createElement('tr');
        const badgeClass = tx.type === 'Buy' || tx.type === 'SIP' || tx.type === 'Deposit' ? 'up' : 'down';
        
        row.innerHTML = `
            <td><strong>${tx.date}</strong></td>
            <td><span class="${badgeClass}" style="font-weight:600;">${tx.type}</span></td>
            <td>${tx.asset}</td>
            <td>₹${tx.amount.toLocaleString('en-IN')}</td>
            <td><span style="color:#10B981; font-weight:500;">● ${tx.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Simulated Investments Panel Modal handlers
function initTransactionModal() {
    const investBtn = document.getElementById('dashboard-btn-invest');
    const modal = document.getElementById('invest-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const form = document.getElementById('mock-invest-form');

    if (!modal || !investBtn) return;

    investBtn.addEventListener('click', () => {
        // Enforce compliance block
        if (activeUser.kycStatus === false) {
            alert('Access Denied. You must complete your KYC Verification to unlock investment execution.');
            openKYCWizardModal();
            return;
        }

        modal.style.display = 'flex';
        const warning = document.getElementById('invest-warning');
        if (warning) warning.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const assetClass = document.getElementById('invest-asset').value;
        const amount = parseFloat(document.getElementById('invest-amount').value);
        const warning = document.getElementById('invest-warning');

        if (isNaN(amount) || amount <= 0) return;

        if (amount > portfolio.portfolio_cash) {
            if (warning) {
                warning.style.color = '#EF4444';
                warning.innerText = 'Insufficient cash balance in your account to execute transaction.';
                warning.style.display = 'block';
            }
            return;
        }

        portfolio.portfolio_cash -= amount;
        portfolio.invested += amount;

        let assetLabel = '';
        if (assetClass === 'equity') {
            portfolio.assets.equity += amount;
            assetLabel = 'Equity Mutual Fund';
        } else if (assetClass === 'debt') {
            portfolio.assets.debt += amount;
            assetLabel = 'Corporate Bond ETF';
        } else if (assetClass === 'gold') {
            portfolio.assets.gold += amount;
            assetLabel = 'Gold ETF';
        }

        const today = new Date().toISOString().split('T')[0];
        portfolio.transactions.push({
            date: today,
            type: 'Buy',
            asset: assetLabel,
            amount: amount,
            status: 'Completed'
        });

        dbUpdateUserPortfolio(activeUser.email, portfolio);
        updateDashboardUI();
        
        modal.style.display = 'none';
        form.reset();
        
        alert(`Successfully invested ₹${amount.toLocaleString('en-IN')} in ${assetLabel}!`);
    });
}

// --- KYC WIZARD CONTROLLERS ---
function initKYCWizardModal() {
    const kycClose = document.getElementById('kyc-close-btn');
    const kycModal = document.getElementById('kyc-modal');

    if (kycClose && kycModal) {
        kycClose.addEventListener('click', () => {
            kycModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === kycModal) {
                kycModal.style.display = 'none';
            }
        });
    }
}

function openKYCWizardModal() {
    const kycModal = document.getElementById('kyc-modal');
    const errBox = document.getElementById('kyc-error-msg');
    
    if (kycModal) {
        if (errBox) errBox.style.display = 'none';
        
        document.getElementById('kyc-step-1').style.display = 'block';
        document.getElementById('kyc-step-2').style.display = 'none';
        document.getElementById('kyc-step-3').style.display = 'none';
        
        document.getElementById('kyc-doc-number').value = '';
        document.getElementById('kyc-otp-input').value = '';
        
        kycModal.style.display = 'flex';
    }
}

async function submitKYCDocument() {
    const docType = document.getElementById('kyc-doc-type').value;
    const docNum = document.getElementById('kyc-doc-number').value.trim();
    const errBox = document.getElementById('kyc-error-msg');

    if (errBox) errBox.style.display = 'none';

    // Regex checks
    if (docType === 'aadhaar') {
        if (!/^[0-9]{12}$/.test(docNum)) {
            showKYCError('Invalid Aadhaar Card. Must contain exactly 12 numerical digits.');
            return;
        }
    } else if (docType === 'vid') {
        if (!/^[0-9]{16}$/.test(docNum)) {
            showKYCError('Invalid Virtual ID (VID). Must contain exactly 16 numerical digits.');
            return;
        }
    }

    kycDocNumber = docNum;

    // Generate random OTP
    currentSimulatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if Express backend is running to dispatch live Twilio SMS OTP
    try {
        const response = await fetch(`${API_URL}/api/kyc/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: activeUser.phone, otp: currentSimulatedOTP })
        });
        const resData = await response.json();
        
        if (resData.success && !resData.simulated) {
            alert(`[Twilio OTP Service] Verification code successfully sent to your registered mobile phone number: +91****${activeUser.phone.slice(-4)}`);
        } else {
            // Fallback Simulation alert
            alert(`[OTP Simulator] OTP sent to registered mobile number. \n\nSimulated OTP: ${currentSimulatedOTP}`);
        }
    } catch (err) {
        // Fetch failed (server offline) -> use standard Simulation alert
        console.warn('Backend server offline. Simulating SMS locally.');
        alert(`[OTP Simulator] Twilio service offline. Simulated OTP: ${currentSimulatedOTP}`);
    }

    document.getElementById('kyc-step-1').style.display = 'none';
    document.getElementById('kyc-step-2').style.display = 'block';
}

function submitKYCOTP() {
    const enteredOTP = document.getElementById('kyc-otp-input').value.trim();
    const errBox = document.getElementById('kyc-error-msg');

    if (errBox) errBox.style.display = 'none';

    if (enteredOTP !== currentSimulatedOTP) {
        showKYCError('Incorrect OTP entered. Verify the simulation code and try again.');
        return;
    }

    const res = dbVerifyKYC(activeUser.email, kycDocNumber);
    if (res) {
        activeUser.kycStatus = true;
        activeUser.aadhaar = kycDocNumber;
        
        // Refresh session
        sessionStorage.setItem('keyfs_active_session', activeUser.email);
        
        document.getElementById('kyc-step-2').style.display = 'none';
        document.getElementById('kyc-step-3').style.display = 'block';
    } else {
        showKYCError('System database write error. Please try again.');
    }
}

function closeKYCWizard() {
    const kycModal = document.getElementById('kyc-modal');
    if (kycModal) kycModal.style.display = 'none';
    checkKYCStatus();
}

function showKYCError(msg) {
    const errBox = document.getElementById('kyc-error-msg');
    if (errBox) {
        errBox.innerText = msg;
        errBox.style.display = 'block';
    } else {
        alert(msg);
    }
}

// --- LINK BANK ACCOUNT & WITHDRAWAL CONTROLLERS ---
function initBankModals() {
    const bankClose = document.getElementById('bank-close-btn');
    const withdrawClose = document.getElementById('withdraw-close-btn');
    const bankForm = document.getElementById('link-bank-form');
    const withdrawForm = document.getElementById('withdraw-form');

    if (bankClose) {
        bankClose.addEventListener('click', () => {
            document.getElementById('bank-modal').style.display = 'none';
        });
    }
    if (withdrawClose) {
        withdrawClose.addEventListener('click', () => {
            document.getElementById('withdraw-modal').style.display = 'none';
        });
    }

    // Submit Bank linking form
    if (bankForm) {
        bankForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errBox = document.getElementById('bank-error-msg');
            if (errBox) errBox.style.display = 'none';

            const bankName = document.getElementById('bank-name-input').value.trim();
            const acNum = document.getElementById('bank-ac-input').value.trim();
            const ifscCode = document.getElementById('bank-ifsc-input').value.trim().toUpperCase();

            // Validate IFSC Code: 4 letters, 0, 6 alpha-numeric
            const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            if (!ifscRegex.test(ifscCode)) {
                if (errBox) {
                    errBox.innerText = 'Invalid IFSC Code format. Enforce standard: SBIN0001234.';
                    errBox.style.display = 'block';
                } else {
                    alert('Invalid IFSC Code format.');
                }
                return;
            }

            const res = dbLinkBankAccount(activeUser.email, bankName, acNum, ifscCode);
            if (res) {
                activeUser.bankLinked = true;
                activeUser.bankDetails = { bankName, accountNum: acNum, ifsc: ifscCode };
                
                // Refresh session storage user copy
                sessionStorage.setItem('keyfs_active_session', activeUser.email);
                
                document.getElementById('bank-modal').style.display = 'none';
                updateDashboardUI();
                alert(`Bank Account successfully linked: ${bankName} (A/C ****${acNum.slice(-4)})`);
            } else {
                alert('Database write failed linking bank account.');
            }
        });
    }

    // Submit Withdrawal form
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errBox = document.getElementById('withdraw-error-msg');
            if (errBox) errBox.style.display = 'none';

            const amount = parseFloat(document.getElementById('withdraw-amount-input').value);

            if (isNaN(amount) || amount <= 0) return;

            if (amount > portfolio.portfolio_cash) {
                if (errBox) {
                    errBox.innerText = 'Insufficient cash balance for withdrawal.';
                    errBox.style.display = 'block';
                }
                return;
            }

            const res = dbWithdrawFunds(activeUser.email, amount);
            if (res.success) {
                portfolio = res.portfolio;
                
                document.getElementById('withdraw-modal').style.display = 'none';
                updateDashboardUI();
                
                alert(`Withdrawal request processed! ₹${amount.toLocaleString('en-IN')} has been transferred to your linked bank account.`);
            } else {
                if (errBox) {
                    errBox.innerText = res.message;
                    errBox.style.display = 'block';
                } else {
                    alert(res.message);
                }
            }
        });
    }
}

function updateBankUI() {
    const unlinkedView = document.getElementById('bank-unlinked-view');
    const linkedView = document.getElementById('bank-linked-view');
    
    if (!unlinkedView || !linkedView) return;

    if (activeUser.bankLinked === true && activeUser.bankDetails && activeUser.bankDetails.bankName) {
        unlinkedView.style.display = 'none';
        
        // Mask account number
        const rawAc = activeUser.bankDetails.accountNum;
        const maskedAc = `A/C ************${rawAc.slice(-4)}`;
        
        document.getElementById('lbl-bank-name').innerText = activeUser.bankDetails.bankName;
        document.getElementById('lbl-ac-num').innerText = maskedAc;
        document.getElementById('lbl-ifsc-code').innerText = `IFSC: ${activeUser.bankDetails.ifsc}`;
        
        linkedView.style.display = 'block';
    } else {
        unlinkedView.style.display = 'block';
        linkedView.style.display = 'none';
    }
}

function openLinkBankModal() {
    const modal = document.getElementById('bank-modal');
    if (!modal) return;

    const errBox = document.getElementById('bank-error-msg');
    if (errBox) errBox.style.display = 'none';

    document.getElementById('link-bank-form').reset();

    // Pre-populate if already linked
    if (activeUser.bankLinked === true && activeUser.bankDetails) {
        document.getElementById('bank-name-input').value = activeUser.bankDetails.bankName;
        document.getElementById('bank-ac-input').value = activeUser.bankDetails.accountNum;
        document.getElementById('bank-ifsc-input').value = activeUser.bankDetails.ifsc;
    }

    modal.style.display = 'flex';
}

function openWithdrawModal() {
    if (activeUser.bankLinked !== true) {
        alert('Please link a valid bank account before making withdrawals.');
        openLinkBankModal();
        return;
    }

    const modal = document.getElementById('withdraw-modal');
    if (!modal) return;

    const errBox = document.getElementById('withdraw-error-msg');
    if (errBox) errBox.style.display = 'none';

    document.getElementById('withdraw-form').reset();

    // Set withdraw target label
    const rawAc = activeUser.bankDetails.accountNum;
    document.getElementById('lbl-withdraw-target').innerText = `${activeUser.bankDetails.bankName} (A/C ****${rawAc.slice(-4)})`;
    document.getElementById('withdraw-amount-input').max = portfolio.portfolio_cash;

    modal.style.display = 'flex';
}

// Expose modal functions globally
window.openKYCWizardModal = openKYCWizardModal;
window.submitKYCDocument = submitKYCDocument;
window.submitKYCOTP = submitKYCOTP;
window.closeKYCWizard = closeKYCWizard;
window.openLinkBankModal = openLinkBankModal;
window.openWithdrawModal = openWithdrawModal;
