// KEYFS Authentication Portal Script
// Manages validations, login matching, and registration workflows (Client & Admin)

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
    ? 'http://localhost:5000'
    : '';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('auth-card')) {
        initAuthPortal();
    }
});

function initAuthPortal() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const regAlert = document.getElementById('reg-error-msg');
    const logAlert = document.getElementById('log-error-msg');

    // 1. Onboarding Tab Switcher
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const type = tab.getAttribute('data-tab');
            if (type === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                if (regAlert) regAlert.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                if (logAlert) logAlert.style.display = 'none';
            }
        });
    });

    // 2. Submit Handler: Login Form (Supports Client and Admin routes)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (logAlert) logAlert.style.display = 'none';

        const email = document.getElementById('l-email').value.trim();
        const password = document.getElementById('l-password').value;

        const isValid = await dbValidateUser(email, password);
        if (isValid) {
            dbStartSession(email);
            
            // Administrative Routing Check
            if (email.toLowerCase().trim() === 'keyfsuser@26') {
                alert('Administrator session validated. Entering KEYFS Admin Console.');
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            if (logAlert) {
                logAlert.innerText = 'Invalid email address/username or password. Please try again.';
                logAlert.style.display = 'block';
            } else {
                alert('Invalid email or password.');
            }
        }
    });

    // 3. Submit Handler: Register Form (Open Account)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (regAlert) regAlert.style.display = 'none';

        const name = document.getElementById('r-name').value.trim();
        const email = document.getElementById('r-email').value.trim();
        const password = document.getElementById('r-password').value;
        const phone = document.getElementById('r-phone').value.trim();
        const pan = document.getElementById('r-pan').value.toUpperCase().trim();
        const funding = parseFloat(document.getElementById('r-funding').value);

        // Security Validation checks
        // 3.1 Email check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showRegError('Please enter a valid email address.');
            return;
        }

        // 3.2 Phone check
        if (!/^[0-9]{10}$/.test(phone)) {
            showRegError('Phone number must contain precisely 10 numerical digits.');
            return;
        }

        // 3.3 PAN Card check (Indian Standard format: 5 letters, 4 digits, 1 letter)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan)) {
            showRegError('Invalid PAN Card format. Enforce Indian Standard: ABCDE1234F.');
            return;
        }

        // 3.4 Password check
        if (password.length < 6) {
            showRegError('Password must contain at least 6 characters for safety.');
            return;
        }

        // 3.5 Funding check
        if (isNaN(funding) || funding < 1000) {
            showRegError('Initial funding deposit must be a minimum of ₹1,00,000.');
            return;
        }

        // Proceed to write to database
        const res = await dbCreateUser(name, email, password, phone, pan, funding);
        
        if (res.success) {
            // Attempt to notify backend for greeting email and SMS
            try {
                const notifyRes = await fetch(`${API_URL}/api/auth/register-greeting`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone })
                });
                const notifyData = await notifyRes.json();
                console.log('Registration greeting notification status:', notifyData);
            } catch (err) {
                console.warn('Backend server offline or registration greeting notification failed:', err.message);
            }

            dbStartSession(email);
            // Redirect to dashboard
            alert('Account opened successfully! Welcome to KEYFS E-Wealth Console.');
            window.location.href = 'dashboard.html';
        } else {
            showRegError(res.message);
        }
    });

    function showRegError(msg) {
        if (regAlert) {
            regAlert.innerText = msg;
            regAlert.style.display = 'block';
            regAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert(msg);
        }
    }
}
