const express = require('express');
const twilio = require('twilio');
const app = express();

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio client -.env se key lega
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Variables
let currentQuestion = 0;
let answers = [];

// 1. Yaha tumhare 5 audio ke link
let audioLinks = [
  "https://drive.google.com/uc?export=download&id=1EkxqPRZDZqmGWbMbkd5d3E4vAfvMzTCI",
  "https://drive.google.com/uc?export=download&id=1B9nmt-pyDkiUqoL1s_bAIl_jXdXWyX0Qg",
  "https://drive.google.com/uc?export=download&id=1gcNA5Xw7zncN0hRr-xI_wJekF354NU6j",
  "https://drive.google.com/uc?export=download&id=1nzycfMZrkga3S_ZZ9-2gkLEf-tr7NV0F",
  "https://drive.google.com/uc?export=download&id=1ImFZ7dRTMAq2OBBYE53Be35rZZvd2-uz"
];

// 0. Call trigger karne wala route - Postman isi ko hit karega
app.post('/make-call', async (req, res) => {
  const toNumber = req.body.phone;
  currentQuestion = 0; // har nayi call ke liye reset
  answers = [];

  try {
    const call = await client.calls.create({
      to: toNumber,
      from: FROM_NUMBER,
      url: 'https://kunjilicious-voice-ai.onrender.com/voice'
    });
    res.json({ success: true, callSid: call.sid, message: 'Call lag gayi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Jab call aayegi ye chalega
app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (currentQuestion < audioLinks.length) {
    const gather = twiml.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: '/handle-answer'
    });
    gather.play(audioLinks[currentQuestion]);
    currentQuestion++;
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you. Our team will call you back soon. Radhe Radhe!');
    twiml.hangup();
    currentQuestion = 0;
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// 3. Customer ka jawab yaha save hoga
app.post('/handle-answer', (req, res) => {
  const speechResult = req.body.SpeechResult;
  answers.push(speechResult);
  console.log(`Answer ${answers.length}: ${speechResult}`);

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect('/voice');
  res.type('text/xml');
  res.send(twiml.toString());
});

// 4. Server start
app.listen(3000, () => console.log('Server chal gaya on 3000'));
