require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;

// Tere 5 sawaal
let questions = [
  "Radhe Radhe! Thank you for calling Kunjilicious Technologies.",
  "What is your full name?",
  "Which position are you applying for?",
  "Are you available for an interview this week?",
  "How many years of relevant experience do you have?",
  "What is your notice period, or when can you join?"
];

// HAR CALL KE LIYE ALAG DATA STORE KAREGA
let sessions = {};

// 1. Call start
app.post('/make-call', async (req, res) => {
  const { phone } = req.body;
  const call = await client.calls.create({
    url: `https://kunjilicious-voice-ai.onrender.com/voice?step=0`, // step 0 se start
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER
  });
  res.json({ success: true, callSid: call.sid });
});

// 2. Sawaal poochna
app.post('/voice', (req, res) => {
  const step = parseInt(req.query.step || 0);
  const callSid = req.body.CallSid;

  // Nayi call hai to session bana de
  if(!sessions[callSid]) {
    sessions[callSid] = { step: 0, answers: [] };
  }

  const twiml = new twilio.twiml.VoiceResponse();

  if (sessions[callSid].step < questions.length) {
    const gather = twiml.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: `/handle-answer?step=${sessions[callSid].step}`
    });
    gather.say({ voice: 'alice', language: 'en-IN' }, questions[sessions[callSid].step]);
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for your time. We will contact you soon. Radhe Radhe!');
    twiml.hangup();
    console.log(`CALL ${callSid} COMPLETE:`, sessions[callSid].answers);
    delete sessions[callSid]; // call khatam to data hata de
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// 3. Jawab save karna
app.post('/handle-answer', (req, res) => {
  const step = parseInt(req.query.step);
  const callSid = req.body.CallSid;
  const customerAnswer = req.body.SpeechResult;

  sessions[callSid].answers.push({ question: questions[step], answer: customerAnswer });
  sessions[callSid].step = step + 1; // agla sawaal

  console.log(`Q${step + 1}: ${questions[step]}`);
  console.log(`Ans: ${customerAnswer}`);

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect(`/voice?step=${sessions[callSid].step}`); // agle step pe bhej
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
