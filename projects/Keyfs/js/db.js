// KEYFS Secure Client-Side Database Layer
// Uses native browser WebCrypto API for secure hashing and localStorage for persistence

const DB_KEY = 'keyfs_database';
const SESSION_KEY = 'keyfs_active_session';
const ADMIN_USER = 'keyfsuser@26';
const ADMIN_PASS = 'admin@234';

// 1. SHA-256 Cryptographic Hashing Function (Native WebCrypto)
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. Fetch all users from Database
function getDatabase() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
}

// 3. Save database back to localStorage
function saveDatabase(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// 4. Fetch specific user record
function dbGetUser(email) {
    const db = getDatabase();
    return db.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

// 5. Create/Register new user record
async function dbCreateUser(name, email, password, phone, pan, initialFunding) {
    const db = getDatabase();
    
    // Check if duplicate email
    if (dbGetUser(email) || email.toLowerCase().trim() === ADMIN_USER) {
        return { success: false, message: 'An account with this email address already exists.' };
    }

    const hashedPassword = await hashPassword(password);
    const cleanEmail = email.toLowerCase().trim();

    // Default portfolio structure pre-loaded with initial funding cash
    const newUser = {
        name: sanitizeHTML(name),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone.trim(),
        pan: pan.toUpperCase().trim(),
        kycStatus: false,
        aadhaar: "",
        bankLinked: false,
        bankDetails: { bankName: "", accountNum: "", ifsc: "" },
        portfolio: {
            invested: 0,
            portfolio_cash: parseFloat(initialFunding) || 0,
            assets: {
                equity: 0,
                debt: 0,
                gold: 0
            },
            transactions: [
                { 
                    date: new Date().toISOString().split('T')[0], 
                    type: 'Deposit', 
                    asset: 'Initial Cash Funding', 
                    amount: parseFloat(initialFunding) || 0, 
                    status: 'Completed' 
                }
            ]
        }
    };

    db.push(newUser);
    saveDatabase(db);
    return { success: true, user: newUser };
}

// 6. Update user portfolio values (used on investments or ticks)
function dbUpdateUserPortfolio(email, portfolio) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (idx !== -1) {
        db[idx].portfolio = portfolio;
        saveDatabase(db);
        return true;
    }
    return false;
}

// 7. Validate user credentials during Login (Standard Client or Admin)
async function dbValidateUser(email, password) {
    const cleanEmail = email.toLowerCase().trim();
    
    // Admin Override Check
    if (cleanEmail === ADMIN_USER) {
        return password === ADMIN_PASS;
    }

    const user = dbGetUser(email);
    if (!user) return false;

    const hashedInput = await hashPassword(password);
    return user.password === hashedInput;
}

// 8. Session Management
function dbStartSession(email) {
    sessionStorage.setItem(SESSION_KEY, email.toLowerCase().trim());
}

// Check if active session points to standard client email or admin
function dbEndSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function dbGetActiveUser() {
    const email = sessionStorage.getItem(SESSION_KEY);
    if (!email) return null;

    // Handle Admin Session
    if (email.toLowerCase().trim() === ADMIN_USER) {
        return {
            name: 'KEYFS Administrator',
            email: ADMIN_USER,
            isAdmin: true,
            portfolio: { invested: 0, portfolio_cash: 0, assets: { equity: 0, debt: 0, gold: 0 }, transactions: [] }
        };
    }
    return dbGetUser(email);
}

// 9. Admin Overrides: Edit client data
function dbUpdateUserProfileAdmin(email, newName, newPhone, newPan, newCash) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
        db[idx].name = sanitizeHTML(newName);
        db[idx].phone = newPhone.trim();
        db[idx].pan = newPan.toUpperCase().trim();
        db[idx].portfolio.portfolio_cash = parseFloat(newCash) || 0;
        saveDatabase(db);
        return true;
    }
    return false;
}

// 10. Admin Overrides: Execute dynamic buy/sell for client
function dbAdminExecuteTransaction(email, txType, assetName, amount) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
        const portfolio = db[idx].portfolio;
        const amt = parseFloat(amount) || 0;
        
        if (portfolio.portfolio_cash === undefined) {
            portfolio.portfolio_cash = portfolio.cash || 0;
        }

        if (txType === 'Buy' || txType === 'SIP') {
            if (amt > portfolio.portfolio_cash) return { success: false, message: 'Insufficient client cash balance.' };
            portfolio.portfolio_cash -= amt;
            portfolio.invested += amt;
            portfolio.assets.equity += amt; // default to equity
        } else if (txType === 'Sell') {
            if (amt > portfolio.assets.equity) return { success: false, message: 'Client does not hold enough equity assets.' };
            portfolio.assets.equity -= amt;
            portfolio.invested = Math.max(0, portfolio.invested - amt);
            portfolio.portfolio_cash += amt;
        }

        portfolio.transactions.push({
            date: new Date().toISOString().split('T')[0],
            type: txType,
            asset: assetName,
            amount: amt,
            status: 'Completed (Admin Overridden)'
        });

        db[idx].portfolio = portfolio;
        saveDatabase(db);
        return { success: true };
    }
    return { success: false, message: 'Client not found.' };
}

// 11. Admin Overrides: Delete client account
function dbDeleteUser(email) {
    let db = getDatabase();
    const originalLen = db.length;
    db = db.filter(user => user.email.toLowerCase() !== email.toLowerCase());
    if (db.length < originalLen) {
        saveDatabase(db);
        return true;
    }
    return false;
}

// 12. KYC Verification helpers
function dbVerifyKYC(email, docNumber) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
        db[idx].kycStatus = true;
        db[idx].aadhaar = docNumber.trim();
        saveDatabase(db);
        return true;
    }
    return false;
}

// 13. Bank Account Link helper
function dbLinkBankAccount(email, bankName, accountNum, ifsc) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
        db[idx].bankLinked = true;
        db[idx].bankDetails = {
            bankName: sanitizeHTML(bankName),
            accountNum: accountNum.trim(),
            ifsc: ifsc.toUpperCase().trim()
        };
        saveDatabase(db);
        return true;
    }
    return false;
}

// 14. Cash Withdrawal helper
function dbWithdrawFunds(email, amount) {
    const db = getDatabase();
    const idx = db.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
        const portfolio = db[idx].portfolio;
        const amt = parseFloat(amount) || 0;

        if (portfolio.portfolio_cash === undefined) {
            portfolio.portfolio_cash = portfolio.cash || 0;
        }

        if (amt > portfolio.portfolio_cash) {
            return { success: false, message: 'Insufficient cash balance for withdrawal.' };
        }

        // Deduct balance
        portfolio.portfolio_cash -= amt;
        
        // Log transaction
        portfolio.transactions.push({
            date: new Date().toISOString().split('T')[0],
            type: 'Withdrawal',
            asset: `${db[idx].bankDetails.bankName} (A/C ****${db[idx].bankDetails.accountNum.slice(-4)})`,
            amount: amt,
            status: 'Completed'
        });

        db[idx].portfolio = portfolio;
        saveDatabase(db);
        return { success: true, portfolio };
    }
    return { success: false, message: 'Client account not found.' };
}

// DOM XSS Sanitization Helper
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
