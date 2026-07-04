require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
const DATA_FILE = path.join(__dirname, 'data', 'responses.json');
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL; // e.g. https://your-app.onrender.com

// in-memory tracking of retries per call (per question, so we don't loop forever)
const retryCount = {};

function loadResponses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveResponses(all) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
}

function getOrCreateRecord(callSid, from) {
  const all = loadResponses();
  let record = all.find(r => r.callSid === callSid);
  if (!record) {
    record = {
      callSid,
      phone: from,
      startedAt: new Date().toISOString(),
      answers: [],
      completed: false
    };
    all.push(record);
    saveResponses(all);
  }
  return record;
}

function updateRecord(callSid, updateFn) {
  const all = loadResponses();
  const idx = all.findIndex(r => r.callSid === callSid);
  if (idx === -1) return;
  updateFn(all[idx]);
  saveResponses(all);
}

// ---- 1. Entry point: Twilio hits this when the call is answered ----
app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.To || req.body.From; // candidate's number
  getOrCreateRecord(callSid, from);

  const twiml = new VoiceResponse();
  twiml.say({ voice: 'Polly.Joanna' }, CONFIG.greeting);
  twiml.redirect(`/ask?step=0`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// ---- 2. Ask a question (by step index) ----
app.post('/ask', (req, res) => {
  const step = parseInt(req.query.step, 10) || 0;
  const twiml = new VoiceResponse();

  if (step >= CONFIG.questions.length) {
    // all questions done
    const callSid = req.body.CallSid;
    updateRecord(callSid, (r) => { r.completed = true; r.endedAt = new Date().toISOString(); });
    twiml.say({ voice: 'Polly.Joanna' }, CONFIG.closing);
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  const gather = twiml.gather({
    input: 'speech',
    action: `/response?step=${step}`,
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 6
  });
  gather.say({ voice: 'Polly.Joanna' }, CONFIG.questions[step]);

  // fallback if nothing is heard at all
  twiml.redirect(`/ask?step=${step}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// ---- 3. Handle the candidate's spoken answer ----
app.post('/response', (req, res) => {
  const step = parseInt(req.query.step, 10) || 0;
  const callSid = req.body.CallSid;
  const speechResult = (req.body.SpeechResult || '').trim();
  const twiml = new VoiceResponse();

  const key = `${callSid}-${step}`;

  if (!speechResult) {
    retryCount[key] = (retryCount[key] || 0) + 1;
    if (retryCount[key] > CONFIG.maxRetries) {
      // give up on this question, move on with a blank answer
      updateRecord(callSid, (r) => {
        r.answers.push({ question: CONFIG.questions[step], answer: '(no response)' });
      });
      twiml.redirect(`/ask?step=${step + 1}`);
      return res.type('text/xml').send(twiml.toString());
    }
    twiml.say({ voice: 'Polly.Joanna' }, CONFIG.noInputMessage);
    twiml.redirect(`/ask?step=${step}`);
    return res.type('text/xml').send(twiml.toString());
  }

  updateRecord(callSid, (r) => {
    r.answers.push({ question: CONFIG.questions[step], answer: speechResult });
  });

  twiml.redirect(`/ask?step=${step + 1}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// ---- 4. Trigger an outbound call to one candidate ----
// POST { "phone": "+91XXXXXXXXXX", "name": "optional" }
app.post('/call-candidate', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required, in E.164 format e.g. +91XXXXXXXXXX' });
    if (!BASE_URL) return res.status(500).json({ error: 'BASE_URL is not set in your .env / environment variables' });

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      url: `${BASE_URL}/voice`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    res.json({ success: true, sid: call.sid, to: phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- 5. View all collected responses (simple JSON) ----
app.get('/responses', (req, res) => {
  res.json(loadResponses());
});

// ---- 6. Simple human-readable dashboard ----
app.get('/dashboard', (req, res) => {
  const all = loadResponses();
  let rows = all.map(r => `
    <tr>
      <td>${r.phone}</td>
      <td>${r.completed ? '✅ Completed' : '⏳ In progress'}</td>
      <td>${r.answers.map(a => `<b>${a.question}</b><br>${a.answer}`).join('<hr>')}</td>
      <td>${r.startedAt}</td>
    </tr>`).join('');

  res.send(`
    <html>
      <head><title>${CONFIG.companyName} - Candidate Call Responses</title>
      <style>
        body{font-family:Arial;margin:20px;background:#f7f7f9}
        table{border-collapse:collapse;width:100%;background:#fff}
        td,th{border:1px solid #ddd;padding:10px;vertical-align:top;font-size:14px}
        th{background:#222;color:#fff}
      </style></head>
      <body>
        <h2>${CONFIG.companyName} — Candidate Screening Call Results</h2>
        <table>
          <tr><th>Phone</th><th>Status</th><th>Answers</th><th>Started At</th></tr>
          ${rows}
        </table>
      </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.send(`${CONFIG.companyName} Voice AI screening server is running. Visit /dashboard to view responses.`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
