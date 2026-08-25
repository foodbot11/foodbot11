const express = require('express');
const app = express();
app.use(express.json());

// হোয়াটসঅ্যাপ কানেকশনের পাসওয়ার্ড (Token)
const VERIFY_TOKEN = "foodbot_secret_123"; 

// Webhook Verification (Meta-র সাথে কানেক্ট করার জন্য)
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// মেসেজ রিসিভ করার জন্য (আপাতত ফাঁকা রাখছি)
app.post('/webhook', (req, res) => {
    console.log("Message received!");
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
