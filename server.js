const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, setDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "gen-lang-client-0144574194",
  appId: "1:32145727069:web:1dc8b8267cca06330d77b4",
  apiKey: "AIzaSyAwGu_lrSdpCJdf24wEvezrPbBjNsmoK14",
  authDomain: "gen-lang-client-0144574194.firebaseapp.com"
};

const app = express();
app.use(express.json());

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-738cdd8e-43fe-4446-b424-4109156019cd");

// 1. Fetch all licenses (for the app's initial check)
app.get('/licenses.json', async (req, res) => {
    try {
        const q = collection(db, "licenses");
        const querySnapshot = await getDocs(q);
        const keys = [];
        querySnapshot.forEach((doc) => { keys.push(doc.data()); });
        res.json({ status: "active", keys: keys });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Activate a key and bind Device ID
app.post('/activate', async (req, res) => {
    const { key, dev } = req.body;
    try {
        const docRef = doc(db, "licenses", key);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return res.status(400).json({ status: "error", message: "Invalid Key" });

        const data = docSnap.data();
        if (data.blocked) return res.status(400).json({ status: "error", message: "Key Blocked" });

        // Device Binding Logic
        if (data.dev && data.dev !== "" && data.dev !== dev) {
            return res.status(400).json({ status: "error", message: "Locked to another device" });
        }

        // Set Expiry (30 Days from now)
        const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await updateDoc(docRef, { dev: dev, expires_at: expiry });

        res.json({ status: "success", expires_at: expiry });
    } catch (e) { res.status(500).json({ status: "error", message: "Server Error" }); }
});

// 3. Admin: Add a new key (Secret: pearlpix_admin_secret)
app.post('/admin/add-key', async (req, res) => {
    const { secret, key } = req.body;
    if (secret !== "pearlpix_admin_secret") return res.status(403).send("Forbidden");
    try {
        await setDoc(doc(db, "licenses", key), { key: key, blocked: false, dev: "", expires_at: "" });
        res.send("Key Added Successfully");
    } catch (e) { res.status(500).send(e.message); }
});

app.listen(process.env.PORT || 3000);
