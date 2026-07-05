const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;

app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body;
        if(!phone) return res.status(400).json({ error: "Send phone" });

        const call = await client.calls.create({
            url: `https://kunjilicious-voice-ai.onrender.com/ivr`,
            to: phone,
            from: TWILIO_NUMBER
        });
        res.json({ success: true, sid: call.sid });
        console.log("Call SID:", call.sid);
    } catch (err) {
        console.log("TWILIO ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/ivr', (req, res) => {
    const response = new twilio.twiml.VoiceResponse();
    response.say({voice: 'Polly.Aria'}, 'Radhe Radhe');
    response.pause({length: 1});
    response.say({voice: 'Polly.Aria'}, 'Thank you for calling Kunjilicious Technologies.');
    response.pause({length: 1});
    response.say({voice: 'Polly.Aria'}, 'Question 1: What is your name?');
    response.pause({length: 8});
    response.hangup();
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/', (req, res) => res.send("✅ Server Live"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
