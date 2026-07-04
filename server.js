let questions = [
  "Radhe Radhe! This is a call from Kunjilicious Technologies. How may I help you today?",
  "What is your name?",
  "What product are you interested in?",
  "What is your budget?",
  "When do you want to start?"
];

let currentQuestion = 0;

// 2. Sawal poochne wala route
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
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you. Radhe Radhe!');
    twiml.hangup();
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});


// 3. Jawab sunne wala route
app.post('/handle-answer', (req, res) => {
  console.log("Customer said: " + req.body.SpeechResult);
  currentQuestion++;

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect('/voice');
  res.type('text/xml');
  res.send(twiml.toString());
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
