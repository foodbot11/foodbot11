const express = require('express');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "foodbot_secret_123";

// Webhook Verification (Meta-র কানেকশন)
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});
// মেসেজ রিসিভ করা এবং রিপ্লাই দেওয়া
app.post('/webhook', async (req, res) => {
    // এই নতুন লাইনটা আমাদের বলে দেবে মেটা থেকে কী ডেটা আসছে
    console.log("Incoming Webhook: ", JSON.stringify(req.body, null, 2)); 

    try {
        let body = req.body;
        
        if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            let messageData = body.entry[0].changes[0].value.messages[0];
            let from = messageData.from; 
            let msg_body = messageData.text.body; 
            let phone_number_id = process.env.PHONE_NUMBER_ID;

            // ১. Google Sheet-এ ডেটা সেভ করার কাজ
            const serviceAccountAuth = new JWT({
                email: process.env.GOOGLE_CLIENT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            
            const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
            await doc.loadInfo(); 
            const sheet = doc.sheetsByIndex[0]; 
            
            let orderId = "ORD-" + Math.floor(Math.random() * 10000); 
            let time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

            await sheet.addRow({
                'ORDER ID': orderId,
                'PRODUCT': msg_body, 
                'PAYMENT_DETAILS': 'Pending',
                'CUSTOMER_DETAILS': 'WhatsApp User',
                'PH NO': from,
                'COMMENTS': 'Auto-received by Bot',
                'DATE & TIME': time
            });

            // ২. কাস্টমারকে WhatsApp-এ রিপ্লাই দেওয়া
            let replyMessage = `হ্যালো! আপনার মেসেজটি আমরা পেয়েছি। 🥳\n\n📝 *আপনার Order ID:* ${orderId}\nখুব শিগগিরই আমরা আপনার সাথে যোগাযোগ করছি!`;

            await axios({
                method: 'POST',
                url: `https://graph.facebook.com/v25.0/${phone_number_id}/messages`,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: replyMessage }
                },
                headers: {
                    "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Error occurred:", error);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
