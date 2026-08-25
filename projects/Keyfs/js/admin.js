// KEYFS Administrative Panel Script
// Manages system settings, client account list, overrides, audits, and sessions

document.addEventListener('DOMContentLoaded', () => {
    initAdminConsole();
});

function initAdminConsole() {
    // 1. Double check Authentication Security Guard
    const activeSession = sessionStorage.getItem('keyfs_active_session');
    if (activeSession !== 'keyfsuser@26') {
        window.location.replace('auth.html');
        return;
    }

    // Refresh client tables and audits
    renderClientsTable();
    renderAuditLedger();

    // 2. Setup Search Listener
    const searchInput = document.getElementById('client-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            renderClientsTable(query);
        });
    }

    // 3. Setup Modal Close Button Actions
    const editClose = document.getElementById('edit-close-btn');
    const investClose = document.getElementById('invest-close-btn');

    if (editClose) {
        editClose.addEventListener('click', () => {
            document.getElementById('edit-user-modal').style.display = 'none';
        });
    }
    if (investClose) {
        investClose.addEventListener('click', () => {
            document.getElementById('admin-invest-modal').style.display = 'none';
        });
    }

    // 4. Form Submit Listeners
    initEditForm();
    initAdjustForm();
}

// 5. Render client accounts list
function renderClientsTable(filterQuery = '') {
    const tbody = document.getElementById('admin-clients-table-body');
    if (!tbody) return;

    const users = getDatabase();
    tbody.innerHTML = '';

    const filteredUsers = users.filter(user => {
        if (!filterQuery) return true;
        return user.name.toLowerCase().includes(filterQuery) || 
               user.email.toLowerCase().includes(filterQuery) ||
               user.phone.includes(filterQuery) ||
               user.pan.toLowerCase().includes(filterQuery);
    });

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching client accounts found in the database.</td></tr>';
        return;
    }

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        const portfolio = user.portfolio;
        const cash = portfolio.portfolio_cash !== undefined ? portfolio.portfolio_cash : (portfolio.cash || 0);
        const equity = portfolio.assets ? portfolio.assets.equity : 0;
        const invested = portfolio.invested || 0;

        const kycBadge = user.kycStatus === true 
            ? `<span style="color:#10B981; font-size:0.75rem; font-weight:600; display:block; margin-top:0.2rem;"><i class="fa-solid fa-circle-check"></i> KYC Verified</span>` 
            : `<span style="color:#EF4444; font-size:0.75rem; font-weight:600; display:block; margin-top:0.2rem;"><i class="fa-solid fa-circle-xmark"></i> KYC Pending</span>`;

        row.innerHTML = `
            <td><strong>${user.name}</strong>${kycBadge}<br><span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-phone"></i> ${user.phone}</span></td>
            <td><code>${user.email}</code></td>
            <td><code>${user.pan}</code></td>
            <td>₹${Math.round(cash).toLocaleString('en-IN')}</td>
            <td>₹${Math.round(invested).toLocaleString('en-IN')}</td>
            <td>₹${Math.round(equity).toLocaleString('en-IN')}</td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-table-action" onclick="openAdminEditModal('${user.email}')" style="border-color:var(--accent-blue); color:var(--accent-blue);"><i class="fa-solid fa-edit"></i> Edit</button>
                    <button class="btn-table-action" onclick="openAdminInvestModal('${user.email}')"><i class="fa-solid fa-exchange-alt"></i> Adjust</button>
                    <button class="btn-table-action" onclick="deleteClientAccount('${user.email}', '${user.name.replace(/'/g, "\\'")}')" style="border-color:#EF4444; color:#EF4444;"><i class="fa-solid fa-trash-can"></i> Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 6. Aggregate and render global transaction ledger
function renderAuditLedger() {
    const tbody = document.getElementById('admin-audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const users = getDatabase();
    let allTransactions = [];

    // Extract transactions from all clients
    users.forEach(user => {
        const portfolio = user.portfolio;
        if (portfolio && portfolio.transactions) {
            portfolio.transactions.forEach(tx => {
                allTransactions.push({
                    email: user.email,
                    date: tx.date,
                    type: tx.type,
                    asset: tx.asset,
                    amount: tx.amount,
                    status: tx.status
                });
            });
        }
    });

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transaction logs audited in the system.</td></tr>';
        return;
    }

    allTransactions.forEach(tx => {
        const row = document.createElement('tr');
        const badgeClass = tx.type === 'Buy' || tx.type === 'SIP' || tx.type === 'Deposit' ? 'up' : 'down';

        row.innerHTML = `
            <td><code>${tx.email}</code></td>
            <td><strong>${tx.date}</strong></td>
            <td><span class="${badgeClass}" style="font-weight:600;">${tx.type}</span></td>
            <td>${tx.asset}</td>
            <td>₹${tx.amount.toLocaleString('en-IN')}</td>
            <td><span style="color:#10B981; font-weight:500;">● ${tx.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// 7. Toggle Audit Ledger panel vs Client Accounts panel
function toggleAuditLedger(showAudit) {
    const clientsPanel = document.getElementById('clients-panel');
    const auditPanel = document.getElementById('audit-panel');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .sidebar-link');

    if (showAudit) {
        clientsPanel.style.display = 'none';
        auditPanel.style.display = 'block';
        sidebarLinks[0].classList.remove('active');
        sidebarLinks[1].classList.add('active');
        renderAuditLedger(); // refresh
    } else {
        clientsPanel.style.display = 'block';
        auditPanel.style.display = 'none';
        sidebarLinks[0].classList.add('active');
        sidebarLinks[1].classList.remove('active');
        renderClientsTable(); // refresh
    }
}

// 8. Open Edit Profile Modal
function openAdminEditModal(email) {
    const user = dbGetUser(email);
    if (!user) return;

    document.getElementById('edit-client-email').value = user.email;
    document.getElementById('edit-client-name').value = user.name;
    document.getElementById('edit-client-phone').value = user.phone;
    document.getElementById('edit-client-pan').value = user.pan;
    
    const cash = user.portfolio.portfolio_cash !== undefined ? user.portfolio.portfolio_cash : (user.portfolio.cash || 0);
    document.getElementById('edit-client-cash').value = cash;

    document.getElementById('edit-user-modal').style.display = 'flex';
}

function initEditForm() {
    const form = document.getElementById('admin-edit-user-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('edit-client-email').value;
        const name = document.getElementById('edit-client-name').value.trim();
        const phone = document.getElementById('edit-client-phone').value.trim();
        const pan = document.getElementById('edit-client-pan').value.toUpperCase().trim();
        const cash = parseFloat(document.getElementById('edit-client-cash').value);

        // Validations
        if (!/^[0-9]{10}$/.test(phone)) {
            alert('Phone number must contain exactly 10 digits.');
            return;
        }

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan)) {
            alert('Invalid PAN format (e.g. ABCDE1234F).');
            return;
        }

        const res = dbUpdateUserProfileAdmin(email, name, phone, pan, cash);
        if (res) {
            alert('Client profile updated successfully.');
            document.getElementById('edit-user-modal').style.display = 'none';
            renderClientsTable();
            renderAuditLedger();
        } else {
            alert('Failed to update client profile.');
        }
    });
}

// 9. Open Adjust Investments Modal
function openAdminInvestModal(email) {
    document.getElementById('invest-client-email').value = email;
    document.getElementById('admin-invest-amount').value = '10000';
    document.getElementById('admin-asset-name').value = '';
    document.getElementById('admin-invest-modal').style.display = 'flex';
}

function initAdjustForm() {
    const form = document.getElementById('admin-invest-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('invest-client-email').value;
        const txType = document.getElementById('admin-tx-type').value;
        const assetName = document.getElementById('admin-asset-name').value.trim();
        const amount = parseFloat(document.getElementById('admin-invest-amount').value);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid investment amount.');
            return;
        }

        const res = dbAdminExecuteTransaction(email, txType, assetName, amount);
        if (res.success) {
            alert(`Successfully executed ${txType} transaction for ${email}.`);
            document.getElementById('admin-invest-modal').style.display = 'none';
            renderClientsTable();
            renderAuditLedger();
        } else {
            alert(`Transaction failed: ${res.message}`);
        }
    });
}

// 10. Delete Client Account
function deleteClientAccount(email, name) {
    const proceed = confirm(`Are you sure you want to permanently delete the account of "${name}" (${email})?\nThis action cannot be undone and will delete all their portfolios and transaction ledger histories.`);
    if (proceed) {
        const res = dbDeleteUser(email);
        if (res) {
            alert('Client account has been removed successfully.');
            renderClientsTable();
            renderAuditLedger();
        } else {
            alert('Failed to remove client account.');
        }
    }
}

// 11. Administrative Sign out
function logoutAdmin() {
    dbEndSession();
    alert('Administrative session terminated.');
    window.location.href = 'index.html';
}

// Expose modal openers globally so list buttons can access them
window.openAdminEditModal = openAdminEditModal;
window.openAdminInvestModal = openAdminInvestModal;
window.deleteClientAccount = deleteClientAccount;
window.toggleAuditLedger = toggleAuditLedger;
window.logoutAdmin = logoutAdmin;
