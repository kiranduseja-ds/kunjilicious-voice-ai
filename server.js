const express = require('express');
const twilio = require('twilio');
const { twiml } = require('twilio');

const app = express();
app.use(express.json());

// RENDER KE ENV SE
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const BASE_URL = process.env.BASE_URL;

// 1. CALL KARNE KA ROUTE
app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body; // {"phone": "+919922315104"}
        
        if(!phone) return res.status(400).json({ error: "Please send phone number" });
        if(!TWILIO_NUMBER) return res.status(500).json({ error: "TWILIO_PHONE_NUMBER not set" });

        const call = await client.calls.create({
            url: `${BASE_URL}/ivr`, 
            to: phone,
            from: TWILIO_NUMBER
        });
        
        res.json({ success: true, message: "Call initiated", sid: call.sid });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. IVR ROUTE - ENGLISH + FLOWER BUSINESS
app.post('/ivr', (req, res) => {
    const response = new twiml.VoiceResponse();
    
    const gather = response.gather({
        input: 'dtmf speech',
        timeout: 5,
        numDigits: 1,
        action: '/handle-key',
        method: 'POST'
    });
    
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Radhe Radhe. Thank you for calling Kunjilicious Technologies.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'We have 5 quick questions for you regarding our flower business.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Question 1: What is your name?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Question 2: Which city are you calling from?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Question 3: What type of flowers are you interested in?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Question 4: Is this for an event, gift, or personal use?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Question 5: Would you like us to call you back with our latest offers?');
    
    response.say({voice: 'Polly.Joanna', language: 'en-US'}, 'Thank you for your time. Have a great day. Radhe Radhe.');
    response.hangup();
    
    res.type('text/xml');
    res.send(response.toString());
});

// 3. BUTTON PRESS HANDLER
app.post('/handle-key', (req, res) => {
    const response = new twiml.VoiceResponse();
    const digit = req.body.Digits;
    
    if(digit) {
        response.say({voice: 'Polly.Joanna', language: 'en-US'}, `You pressed ${digit}. Thank you.`);
    }
    
    response.redirect('/ivr'); 
    
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/', (req, res) => res.send("✅ Kunjilicious Technologies IVR Server is Live"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
