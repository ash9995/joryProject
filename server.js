// server.js - مُعدّل للعمل مع Vercel Postgres
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// 1. استيراد "Pool" من "pg" بدلاً من "sqlite3"
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000; // Vercel ستستخدم process.env.PORT

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// 2. إعداد الاتصال بـ Vercel Postgres
// سيتم قراءة "POSTGRES_URL" تلقائياً من متغيرات البيئة في Vercel
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false // مطلوب للاتصال بقواعد البيانات السحابية
    }
});

// 3. دالة لإنشاء الجدول (إن لم يكن موجوداً) عند بدء تشغيل الخادم
const createTableQuery = `
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    type TEXT NOT NULL,
    details TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    submissionDate TEXT NOT NULL
);`;

async function initializeDatabase() {
    try {
        await pool.query(createTableQuery);
        console.log("Applications table ready.");
    } catch (err) {
        console.error("Error creating table:", err.message);
    }
}

// --- API Endpoints (تم تحويلها إلى async/await مع pg) ---

// POST: Submit a new application
app.post('/api/applications', async (req, res) => {
    const { id, name, contact, type, details, priority, status, submissionDate } = req.body;

    // pg تستخدم $1, $2 بدلاً من ?
    const sql = `INSERT INTO applications (id, name, contact, type, details, priority, status, submissionDate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
    const values = [id, name, contact, type, details, priority, status, submissionDate];
    
    try {
        await pool.query(sql, values);
        res.json({ message: 'Application submitted successfully', applicationId: id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to save application.' });
    }
});

// GET: Fetch all applications (sorted by newest first)
app.get('/api/applications', async (req, res) => {
    const sql = `SELECT * FROM applications ORDER BY id DESC`;
    
    try {
        // pool.query تُرجع كائن "result"، والبيانات موجودة في "result.rows"
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// PUT: Update application status
app.put('/api/applications/:id/status', async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;

    const sql = `UPDATE applications SET status = $1 WHERE id = $2`;
    
    try {
        const result = await pool.query(sql, [newStatus, id]);
        
        // "result.rowCount" يُستخدم بدلاً من "this.changes"
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// DELETE: Clear all applications
app.delete('/api/applications', async (req, res) => {
    const sql = `DELETE FROM applications`;
    
    try {
        await pool.query(sql);
        res.json({ message: 'All applications cleared successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to clear all applications.' });
    }
});

// --- بدء تشغيل الخادم ---
// سنقوم بإنشاء الجدول أولاً ثم تشغيل الخادم
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Application form: http://localhost:${PORT}/index.html`);
        console.log(`Staff dashboard: http://localhost:${PORT}/dashboard.html`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});