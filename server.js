require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;

// 1. Call start
app.post('/make-call', async (req, res) => {
  const { phone } = req.body;
  const call = await client.calls.create({
    url: `https://kunjilicious-voice-ai.onrender.com/voice`,
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER
  });
  res.json({ success: true, callSid: call.sid });
});

// 2. Yaha 5 naye sawaal + Radhe Radhe
let questions = [
  "Radhe Radhe! Thank you for calling Kunjilicious Technologies.",
  "What is your full name?",
  "Which position are you applying for?",
  "Are you available for an interview this week?",
  "How many years of relevant experience do you have?",
  "What is your notice period, or when can you join?"
];

let currentQuestion = 0;
let allAnswers = []; // saare jawab save karne ke liye

app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (currentQuestion < questions.length) {
    const gather = twiml.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: '/handle-answer'
    });
    gather.say({ voice: 'alice', language: 'en-IN' }, questions[currentQuestion]);
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for your time. We will contact you soon. Radhe Radhe!');
    twiml.hangup();
    console.log("ALL ANSWERS:", allAnswers); // logs me saare jawab
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// 3. Jawab save karna
app.post('/handle-answer', (req, res) => {
  const customerAnswer = req.body.SpeechResult;
  allAnswers.push({ question: questions[currentQuestion], answer: customerAnswer });

  console.log(`Q${currentQuestion + 1}: ${questions[currentQuestion]}`);
  console.log(`Ans: ${customerAnswer}`);

  currentQuestion++;

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect('/voice');
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
