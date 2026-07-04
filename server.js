require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express(); // <-- ye line missing thi
app.use(express.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;

// Ye wala route
app.post('/make-call', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: "phone number chahiye" });
  }

  const twiml = `<Response><Say voice="alice" language="en-IN">Hello, this is a call from Kunjilicious Technologies</Say></Response>`;

  try {
    const call = await client.calls.create({
      twiml: twiml,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
