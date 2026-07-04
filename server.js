const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.get('/call/:to', async (req, res) => {
  const call = await client.calls.create({
    to: req.params.to,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: `${process.env.BASE_URL}/voice`
  });
  res.send(`Calling ${req.params.to}. SID: ${call.sid}`);
});

app.post('/voice', (req, res) => {
  const response = new twilio.twiml.VoiceResponse();
  response.say({voice: 'Polly.Aditi', language: 'hi-IN'}, 'Hello, this is Kunjilicious Voice AI. How can I help you today?');
  res.type('text/xml').send(response.toString());
});

app.listen(10000);
