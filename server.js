require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;

// Call karne ka route
app.post('/make-call', async (req, res) => {
  const { phone } = req.body;
  currentQuestion = 0; // har nayi call pe reset
  allAnswers = []; // purane jawab delete

  const call = await client.calls.create({
    url: `https://kunjilicious-voice-ai.onrender.com/voice`,
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER
  });
  res.json({ success: true, callSid: call.sid });
});

// 5 Sawal + Radhe Radhe
let questions = [
  "Radhe Radhe! This is a call from Kunjilicious Technologies. How may I help you today?",
  "What is your name?",
  "What product or service are you interested in?",
  "What is your budget range?",
  "When would you like us to get back to you?"
];

let currentQuestion = 0;
let allAnswers = [];

// Sawal poochne wala route
app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (currentQuestion < questions.length) {
    const gather = twiml.gather({
      input: 'speech', // customer bolega
      timeout: 5,
      speechTimeout: 'auto',
      action: '/handle-answer'
    });
    gather.say({ voice: 'alice', language: 'en-IN' }, questions[currentQuestion]);
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for your time. Our team will contact you soon. Radhe Radhe!');
    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Jawab record karne wala route
app.post('/handle-answer', (req, res) => {
  const customerAnswer = req.body.SpeechResult;
  allAnswers.push({
    question: questions[currentQuestion],
    answer: customerAnswer
  });

  console.log(`Q${currentQuestion + 1}: ${questions[currentQuestion]}`);
  console.log(`Ans: ${customerAnswer}`);

  currentQuestion++;

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect('/voice'); // next sawal pe bhej do
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
