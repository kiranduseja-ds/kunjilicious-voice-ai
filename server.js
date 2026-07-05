const express = require('express');
const twilio = require('twilio');
const app = express();
app.use(express.json());

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const TWILIO_NUMBER = process.env.TWILIO_NUMBER; // Tera Twilio number

// Ye wala route missing hai isliye 404 aa raha
app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body;
        const call = await client.calls.create({
            url: 'https://ivr-audios-2094.twil.io/welcome', // Tera IVR
            to: phone,
            from: TWILIO_NUMBER
        });
        res.json({ success: true, sid: call.sid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Server running'));
