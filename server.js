const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'licenses.json');

// GET: Send the keys to the app
app.get('/licenses.json', (req, res) => {
    res.sendFile(DATA_FILE);
});

// PUT/POST: Receive the updated JSON (with Device ID) from the app
app.all('/update', (req, res) => {
    const newConfig = req.body;
    if (newConfig && newConfig.keys) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(newConfig, null, 2));
        console.log("Device Registered Successfully!");
        return res.status(200).send("OK");
    }
    res.status(400).send("Invalid Data");
});

app.listen(process.env.PORT || 3000, () => console.log("Server Running..."));
