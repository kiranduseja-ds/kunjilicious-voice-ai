const express = require('express');
const twilio = require('twilio');
const { twiml } = require('twilio');

const app = express();
app.use(express.json()); // POST data ke liye

// RENDER KE ENV SE
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const BASE_URL = process.env.BASE_URL; // https://kunjilicious-voice-ai.onrender.com

// 1. CUSTOMER KO CALL KARNE KA ROUTE
app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body; // {"phone": "+919922315104"}
        
        if(!phone) {
            return res.status(400).json({ error: "phone number bhejo bhai" });
        }
        if(!TWILIO_NUMBER) {
            return res.status(500).json({ error: "TWILIO_PHONE_NUMBER env me set nahi hai" });
        }

        console.log(`Call kar rahe hai: ${phone} se ${TWILIO_NUMBER}`);

        const call = await client.calls.create({
            url: `${BASE_URL}/ivr`, // Call lagte hi ye IVR chalega
            to: phone,
            from: TWILIO_NUMBER
        });
        
        res.json({ success: true, message: "Call ki ja rahi hai", sid: call.sid });
        
    } catch (err) {
        console.error("Call Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. IVR WALA ROUTE - RADHE RADHE 5 QUESTIONS
app.post('/ivr', (req, res) => {
    const response = new twiml.VoiceResponse();
    
    const gather = response.gather({
        input: 'dtmf speech', // 1-9 dabaye ya bole
        timeout: 5,
        numDigits: 1,
        action: '/handle-key',
        method: 'POST'
    });
    
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Radhe Radhe.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Ye 5 sawal hai.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Sawal 1: Aapka naam kya hai?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Sawal 2: Aap kaha se bol rahe hai?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Sawal 3: Aapki age kya hai?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Sawal 4: Aapko hamari service kaisi lagi?');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Sawal 5: Kya aap dobara call karna chahenge?');
    
    response.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Shukriya. Call ke liye dhanyawad. Radhe Radhe.');
    response.hangup();
    
    res.type('text/xml');
    res.send(response.toString());
});

// 3. BUTTON DABANE PE YE CHALEGA
app.post('/handle-key', (req, res) => {
    const response = new twiml.VoiceResponse();
    const digit = req.body.Digits;
    
    if(digit) {
        response.say({voice: 'Polly.Aditi', language: 'hi-IN'}, `Aapne ${digit} dabaaya. Dhanyawad.`);
    }
    
    response.redirect('/ivr'); // Wapas sawal pe bhej dega
    
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/', (req, res) => res.send("✅ Server chal raha hai. Radhe Radhe IVR ready hai."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
