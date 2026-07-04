const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: true }));

let currentQuestion = 0;
let answers = [];

// 1. Yaha tumhare 5 audio ke link
let audioLinks = [
  "https://drive.google.com/uc?export=download&id=1EkxqPRZDZqmGWMbJkd5JdE4vAfvMzTCI", // Q1
  "https://drive.google.com/uc?export=download&id=1B9nmt-pyDkiUqoLls_bAlLjXdXWyXOQq", // Q2
  "https://drive.google.com/uc?export=download&id=1gcNA5Xw7zncNOhRr-xI_wJekFJ54NU6j", // Q3
  "https://drive.google.com/uc?export=download&id=1nzycfMZrkga3S_7Z9-2gkLEf-tr7NVOf", // Q4
  "https://drive.google.com/uc?export=download&id=1lmFZ7dRTMAq2OBBYE53Be35rZZvd2-uz" // Q5
];

// 2. Jab call aayegi ye chalega
app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (currentQuestion < audioLinks.length) {
    const gather = twiml.gather({ // <--- customer ka jawab sunega
      input: 'speech',
      timeout: 5,
      action: '/handle-answer'
    });
    gather.play(audioLinks[currentQuestion]); // <--- yaha tumhari awaaz bajegi
    currentQuestion++;
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you. Our team will call you back soon. Radhe Radhe!');
    twiml.hangup();
    currentQuestion = 0; // next call ke liye reset
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
  twiml.redirect('/voice'); // wapas agla sawal pe jao
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(3000, () => console.log('Server chal gaya on 3000'));
