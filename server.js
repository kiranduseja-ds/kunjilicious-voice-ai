require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;

const questions = [
  "Radhe Radhe! Thank you for calling Kunj Real Estates. We help you find your dream home.",
  "What is your full name?",
  "Which area are you looking for property in? For example, Ulhasnagar, Kalyan, or Thane?",
  "What is your budget range?",
  "Are you looking for 1BHK, 2BHK, or a Plot?",
  "What is the best phone number and time to contact you for site visit?",
  "Thank you for your details. Our team from Kunj Real Estates will call you soon. Radhe Radhe!"
];

let sessions = {};

app.post('/make-call', async (req, res) => {
  try {
    const { phone } = req.body;
    const call = await client.calls.create({
      url: `https://kunjilicious-voice-ai.onrender.com/voice?step=0`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid;
  const step = parseInt(req.query.step || 0);

  if(!sessions[callSid]) {
    sessions[callSid] = { step: 0, answers: [] };
  }
  sessions[callSid].step = step;

  const twiml = new twilio.twiml.VoiceResponse();

  if (sessions[callSid].step < questions.length) {
    // YAHI FIX HAI
    const gather = twiml.gather({
      input: 'speech',
      timeout: 10, // 10 sec tak wait karega
      speechTimeout: 'auto', // bolna band karega tabhi agla sawaal
      numSpeechResults: 1,
      enhanced: true,
      language: 'en-IN',
      action: `/handle-answer?step=${sessions[callSid].step}`
    });
    gather.say({ voice: 'alice', language: 'en-IN' }, questions[sessions[callSid].step]);
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, questions[questions.length - 1]);
    twiml.hangup();
    console.log(`CALL DONE:`, sessions[callSid].answers);
    delete sessions[callSid];
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/handle-answer', (req, res) => {
  const callSid = req.body.CallSid;
  const step = parseInt(req.query.step);
  const answer = req.body.SpeechResult || "No answer";

  console.log(`Q${step}: ${answer}`); // Log me answer dikhega

  if(sessions[callSid]) {
    sessions[callSid].answers.push({ question: questions[step], answer: answer });
    sessions[callSid].step = step + 1;
  }

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect(`/voice?step=${sessions[callSid].step}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
