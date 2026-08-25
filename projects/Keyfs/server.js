// KEYFS Production-Ready Secure Backend Web Server
// Serves API endpoints for Twilio SMS OTPs and SMTP Greeting emails

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();

// Enable CORS from client-side origins (allows file:// and localhost connections)
app.use(cors());
app.use(express.json());

// 1. Initialize Twilio Client (Safe configuration check)
let twilioClient = null;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

if (TWILIO_SID && TWILIO_TOKEN && TWILIO_SID !== 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    try {
        twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
        console.log('Twilio SMS Client successfully initialized.');
    } catch (err) {
        console.error('Failed to initialize Twilio client:', err.message);
    }
} else {
    console.warn('WARNING: Twilio credentials missing in .env. SMS will run in SIMULATION mode.');
}

// 2. Initialize Nodemailer Transporter
let mailTransporter = null;
const SMTP_HOST = process.env.EMAIL_HOST;
const SMTP_PORT = parseInt(process.env.EMAIL_PORT) || 587;
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'notifications@keyfs.com';

if (SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_USER !== 'apikey') {
    try {
        mailTransporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465, // true for 465, false for 587
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });
        console.log('Nodemailer SMTP Transporter successfully initialized.');
    } catch (err) {
        console.error('Failed to initialize Nodemailer SMTP transporter:', err.message);
    }
} else {
    console.warn('WARNING: SMTP credentials missing in .env. Emails will run in SIMULATION mode.');
}

// --- API ENDPOINTS ---

// Health Check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        smsMode: twilioClient ? 'LIVE' : 'SIMULATION',
        emailMode: mailTransporter ? 'LIVE' : 'SIMULATION' 
    });
});

// A. Account Registration Greetings Endpoint (Email + SMS)
app.post('/api/auth/register-greeting', async (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Missing parameters. Require name, email, and phone.' });
    }

    let emailSent = false;
    let smsSent = false;
    let logs = [];

    // 1. Dispatch Nodemailer Greeting Email
    if (mailTransporter) {
        try {
            const mailOptions = {
                from: EMAIL_FROM,
                to: email,
                subject: 'Welcome to KEYFS E-Wealth Console!',
                html: `
                    <div style="font-family: sans-serif; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
                        <h2 style="color: #10B981; font-family: sans-serif;">KEYFS (Key Financial Services)</h2>
                        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-bottom: 20px;">
                        <p>Dear <strong>${name}</strong>,</p>
                        <p>Welcome to the KEYFS E-Wealth platform! We are thrilled to partner with you in your financial wealth-creation journey.</p>
                        <p>Your digital onboarding is complete. You can now log into your console to link your bank account, make deposits, and start your Systematic Investment Plans (SIP).</p>
                        <br>
                        <p style="font-size: 0.9rem; color: #6B7280;">If you did not execute this registration, please contact KEYFS compliance support immediately.</p>
                        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 20px; margin-bottom: 10px;">
                        <p style="font-size: 0.8rem; color: #9CA3AF; text-align: center;">© 2026 Key Financial Services. AMFI Registered Distributor.</p>
                    </div>
                `
            };

            await mailTransporter.sendMail(mailOptions);
            emailSent = true;
            console.log(`Welcome email successfully sent to ${email}`);
        } catch (err) {
            console.error(`Error sending email to ${email}:`, err.message);
            logs.push(`Email error: ${err.message}`);
        }
    } else {
        console.log(`[SIMULATION] Sending registration email to ${email} (Aayush)`);
    }

    // 2. Dispatch Twilio Greeting SMS
    if (twilioClient) {
        try {
            const smsBody = `Hello ${name}, welcome to KEYFS (Key Financial Services)! Your E-Wealth account has been successfully created. Link your bank account today to start investing.`;
            
            // Format phone for Twilio (assumes Indian +91 if code is missing)
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+91${formattedPhone}`;
            }

            await twilioClient.messages.create({
                body: smsBody,
                from: TWILIO_PHONE,
                to: formattedPhone
            });
            smsSent = true;
            console.log(`Welcome SMS successfully sent to ${formattedPhone}`);
        } catch (err) {
            console.error(`Error sending SMS to ${phone}:`, err.message);
            logs.push(`SMS error: ${err.message}`);
        }
    } else {
        console.log(`[SIMULATION] Sending registration SMS to ${phone}`);
    }

    res.json({
        success: true,
        emailSent,
        smsSent,
        simulated: (!mailTransporter && !twilioClient),
        errors: logs
    });
});

// B. KYC OTP Dispatch Endpoint (SMS)
app.post('/api/kyc/send-otp', async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Missing phone number or OTP parameters.' });
    }

    let smsSent = false;
    let errorLog = null;

    if (twilioClient) {
        try {
            const smsBody = `[KEYFS Verification Portal] Your secure KYC Verification OTP is: ${otp}. Do not share this code with anyone.`;
            
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+91${formattedPhone}`;
            }

            await twilioClient.messages.create({
                body: smsBody,
                from: TWILIO_PHONE,
                to: formattedPhone
            });
            smsSent = true;
            console.log(`KYC OTP SMS successfully sent to ${formattedPhone}`);
        } catch (err) {
            console.error(`Error dispatching OTP to ${phone}:`, err.message);
            errorLog = err.message;
        }
    } else {
        console.log(`[SIMULATION] Dispatching OTP SMS for phone ${phone} with code: ${otp}`);
    }

    res.json({
        success: true,
        smsSent,
        simulated: !twilioClient,
        error: errorLog
    });
});

// Start Web Server
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`KEYFS Secure Backend listening on port ${PORT}`);
    });
}

module.exports = app;
