const express = require('express');
const twilio = require('twilio');
const { twiml } = require('twilio');

const app = express();
app.use(express.json());

// RENDER KE ENV VARIABLES
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const BASE_URL = process.env.BASE_URL;

// ROUTE 1: CALL KARNE KE LIYE
app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body;
        if(!phone) return res.status(400).json({ error: "Please send phone number" });

        const call = await client.calls.create({
            url: `${BASE_URL}/ivr`, 
            to: phone,
            from: TWILIO_NUMBER
        });
        res.json({ success: true, sid: call.sid });
        console.log("Call SID:", call.sid);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ROUTE 2: IVR - RADHE RADHE + 5 QUESTIONS WITH GAPS
app.post('/ivr', (req, res) => {
    const response = new twiml.VoiceResponse();
    
    const gather = response.gather({
        input: 'speech',
        timeout: 8,
        action: '/handle-answer',
        method: 'POST',
        language: 'en-IN'
    });
    
    gather.say({voice: 'Polly.Aria'}, 'Radhe. Radhe.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aria'}, 'Thank you for calling Kunjilicious Technologies.');
    gather.pause({length: 1});
    gather.say({voice: 'Polly.Aria'}, 'We have 5 quick questions for our flower business.');
    gather.pause({length: 2});
    
    gather.say({voice: 'Polly.Aria'}, 'Question 1: What is your name?');
    gather.pause({length: 8});
    
    gather.say({voice: 'Polly.Aria'}, 'Question 2: Which city are you calling from?');
    gather.pause({length: 8});
    
    gather.say({voice: 'Polly.Aria'}, 'Question 3: What type of flowers are you interested in?');
    gather.pause({length: 8});
    
    gather.say({voice: 'Polly.Aria'}, 'Question 4: Is this for an event, gift, or personal use?');
    gather.pause({length: 8});
    
    gather.say({voice: 'Polly.Aria'}, 'Question 5: Would you like us to call you back with our latest offers?');
    gather.pause({length: 8});
    
    response.say({voice: 'Polly.Aria'}, 'Thank you. We will contact you soon. Radhe Radhe.');
    response.hangup();
    
    res.type('text/xml');
    res.send(response.toString());
});

// ROUTE 3: CUSTOMER KA ANSWER PAKADNE KE LIYE
app.post('/handle-answer', (req, res) => {
    const response = new twiml.VoiceResponse();
    const speech = req.body.SpeechResult;
    
    console.log("Customer Answer:", speech); // Render logs me answer dikhega
    
    response.redirect('/ivr'); 
    
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/', (req, res) => res.send("✅ Kunjilicious IVR Server Live"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
