import express from "express";
import cors from "cors";
import lmsRoutes from "./routes/lms.routes.js";
import userRoutes from "./routes/user.routes.js";
import appreciationRoutes from "./routes/appreciation.routes.js";
import employeeOfMonthRoutes from "./routes/employeeOfMonth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import { initDb } from "./db/initDb.js";
import { createUserTable } from "./models/user.model.js";
import { createPayrollTable } from "./models/payroll.model.js";
import meetingRoutes from "./routes/meeting.routes.js";
import eventRoutes from "./routes/event.routes.js";
const app = express();

// CORS + Private Network Access (PNA) handling
// FRONTEND_ORIGIN may contain one origin or a comma-separated list of deployed origins.
const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...configuredOrigins, 'http://localhost:5173'])];
const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Request-Private-Network, X-Requested-With');
  }

  // Handle PNA preflight
  if (req.method === 'OPTIONS') {
    if (req.headers['access-control-request-private-network'] === 'true') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
initDb();
createUserTable()
  .then(() => createPayrollTable())
  .catch((err) => console.error("Payroll init error", err));

app.use("/api/lms", lmsRoutes);
app.use("/api/users", userRoutes);
// allow updating location via users route (updateUser supports it now)
import usersRoutes from './routes/users.routes.js';
app.use('/api/users', usersRoutes);
app.use("/api/appreciations", appreciationRoutes);
app.use("/api/employee-of-month", employeeOfMonthRoutes);


app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/events", eventRoutes);

// activities
import activitiesRoutes from './routes/activities.routes.js';
app.use('/api/activities', activitiesRoutes);

// Serve static files
app.use('/assets', express.static('assets'));

// uploads routes (file management)
import uploadsRoutes from './routes/uploads.routes.js';
app.use('/api/uploads', uploadsRoutes);

// Redemption routes
import redeemRoutes from './routes/redeem.routes.js';
app.use('/api/redeem', redeemRoutes);

// Promotions routes
import promotionRoutes from './routes/promotion.routes.js';
app.use('/api/promotions', promotionRoutes);

// Dashboard routes
import dashboardRoutes from './routes/dashboard.routes.js';
app.use('/api/dashboard', dashboardRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "rednote-payroll-backend",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.get("/", (req, res) => {
    res.json({ service: "rednote-payroll-backend", status: "running" });
});

// admin routes (grant points)
import adminRoutes from './routes/admin.routes.js';
app.use('/api/admin', adminRoutes);

// Lightweight contact endpoint — replace with real mailer/service as needed
import nodemailer from 'nodemailer';

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        console.log('Contact submission:', { name, email, message });

        // If SMTP configured, send mail
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            });

            const to = process.env.CONTACT_TO || process.env.SMTP_USER;

            await transporter.sendMail({
                from: email,
                to,
                subject: `Contact form: ${name}`,
                text: message,
                html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message}</p>`
            });
        }

        return res.status(201).json({ success: true, message: 'Received' });
    } catch (err) {
        console.error('Contact error', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Lightweight feedback endpoint
app.post('/api/feedback', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating) return res.status(400).json({ error: 'Rating required' });
        console.log('Feedback submission:', { rating, comment });

        // If SMTP configured, send a notification email
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            });
            const to = process.env.FEEDBACK_TO || process.env.SMTP_USER;
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to,
                subject: `New feedback: ${rating} stars`,
                text: `${comment || ''}`,
                html: `<p><strong>Rating:</strong> ${rating}</p><p>${comment || ''}</p>`
            });
        }

        // TODO: persist or forward to service
        return res.status(201).json({ success: true });
    } catch (err) {
        console.error('Feedback error', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default app;
