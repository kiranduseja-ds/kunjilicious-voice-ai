const express = require('express');
const twilio = require('twilio');
const { twiml } = require('twilio');
const VoiceResponse = twiml.VoiceResponse;

const app = express();
app.use(express.json());

// .env se keys
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const TWILIO_NUMBER = process.env.TWILIO_NUMBER; 

// 1. YE ROUTE CUSTOMERS KO CALL KAREGA - PEHLE WALA
app.post('/make-call', async (req, res) => {
    try {
        const { phone } = req.body; // {"phone": "+91XXXXXXXXXX"}
        
        if(!phone) {
            return res.status(400).json({ error: "phone number bhejo" });
        }

        const call = await client.calls.create({
            url: `https://kunjilicious-voice-ai.onrender.com/ivr`, // Ab server khud IVR dega
            to: phone,
            from: TWILIO_NUMBER
        });
        
        res.json({ success: true, sid: call.sid });
        console.log("Call ki SID:", call.sid);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. YE ROUTE IVR CHALAYEGA - RADHE RADHE 5 QUESTIONS
app.post('/ivr', (req, res) => {
    const response = new VoiceResponse();
    
    const gather = response.gather({
        input: 'dtmf speech',
        timeout: 5,
        numDigits: 1,
        action: '/handle-key'
    });
    
    gather.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Radhe Radhe. Ye 5 sawal hai.');
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
    
    res.type('text/xml');
    res.send(response.toString());
});

// 3. YE ROUTE BUTTON DABANE PE CHALEGA
app.post('/handle-key', (req, res) => {
    const response = new VoiceResponse();
    const digit = req.body.Digits;
    
    response.say({voice: 'Polly.Aditi', language: 'hi-IN'}, `Aapne ${digit} dabaaya. Dhanyawad.`);
    response.redirect('/ivr'); // Wapas IVR pe bhej dega
    
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/', (req, res) => res.send("Server chal raha hai"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
