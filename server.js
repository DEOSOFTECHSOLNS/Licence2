const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'licenses.json');

app.use(cors());
app.use(express.json());

// Initialize Database with your test key
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        keys: {
            "DEO-DUBTIU0G": { deviceId: null, activatedAt: null, expiresAt: null },
            "DEO-0KE1XXGI": { deviceId: null, activatedAt: null, expiresAt: null }
        }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDb = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

app.get('/', (req, res) => {
    res.send('<h1>License Server is ONLINE</h1>');
});

app.post('/api/activate', (req, res) => {
    // This header tells the app "I am the real server"
    res.setHeader('X-License-Server', 'DEOSOFT-V1');
    
    let { licenseKey, deviceId } = req.body;
    licenseKey = licenseKey?.trim();
    deviceId = deviceId?.trim();

    console.log(`Activation attempt: ${licenseKey} for device ${deviceId}`);

    const db = getDb();
    if (!licenseKey || !db.keys[licenseKey]) {
        return res.status(404).json({ success: false, message: 'Invalid License Key' });
    }

    const license = db.keys[licenseKey];
    if (license.deviceId && license.deviceId !== deviceId) {
        return res.status(403).json({ success: false, message: 'Key already used' });
    }

    if (!license.deviceId) {
        license.deviceId = deviceId;
        license.activatedAt = Date.now();
        license.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 Days
        saveDb(db);
    }

    res.json({ success: true, expiresAt: license.expiresAt });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
