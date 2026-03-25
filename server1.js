const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'licenses.json');

// Initialize Database if missing
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }));
}

const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDb = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

app.use(cors());
app.use(express.json());

// Global Header for all API responses
app.use('/api', (req, res, next) => {
    res.setHeader('X-License-Server', 'DEOSOFT-V1');
    next();
});

// 1. PING
app.get('/api/ping', (req, res) => {
    res.json({ status: 'online', message: 'DeoSoft License Server is Online' });
});

// 2. ACTIVATE
app.post('/api/activate', (req, res) => {
    let { licenseKey, deviceId } = req.body;
    const db = getDb();

    if (!licenseKey || !db.keys[licenseKey]) {
        return res.status(404).json({ success: false, message: 'Invalid Key' });
    }

    const license = db.keys[licenseKey];

    if (license.deviceId && license.deviceId !== deviceId) {
        return res.status(403).json({ success: false, message: 'Key Already Used' });
    }

    if (!license.deviceId) {
        license.deviceId = deviceId;
        license.activatedAt = Date.now();
        license.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 Days
        saveDb(db);
    }

    res.json({ 
        success: true, 
        expiresAt: license.expiresAt,
        message: 'Activated'
    });
});

// 3. ADMIN: ADD KEY
app.post('/api/admin/add-key', (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== 'DEOSOFT_ADMIN_SECRET') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { key } = req.body;
    const db = getDb();
    if (db.keys[key]) return res.status(409).json({ error: 'Key already exists' });

    db.keys[key] = { deviceId: null, activatedAt: null, expiresAt: null };
    saveDb(db);
    res.json({ success: true, message: `Key ${key} added successfully` });
});

// 4. ADMIN: RESET KEY
app.post('/api/admin/reset-key', (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== 'DEOSOFT_ADMIN_SECRET') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { key } = req.body;
    const db = getDb();
    if (db.keys[key]) {
        db.keys[key].deviceId = null;
        saveDb(db);
        return res.json({ success: true, message: `Key ${key} has been reset.` });
    }
    res.status(404).json({ error: 'Key not found' });
});

// 5. ADMIN: DELETE ALL KEYS (The New Feature)
app.post('/api/admin/delete-all-keys', (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== 'DEOSOFT_ADMIN_SECRET') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    saveDb({ keys: {} });
    res.json({ success: true, message: 'All keys deleted successfully' });
});

// 6. ADMIN: LIST ALL KEYS
app.get('/api/keys', (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== 'DEOSOFT_ADMIN_SECRET') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(getDb().keys);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
