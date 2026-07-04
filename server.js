app.post('/make-call', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: "phone number chahiye" });
  }

  try {
    // TwiML direct yahi likh denge
    const twiml = `
      <Response>
        <Say voice="alice" language="en-IN">
          Hello, this is a call from Kunjilicious Technologies
        </Say>
      </Response>
    `;

    const call = await client.calls.create({
      twiml: twiml, // url ki jagah direct twiml bhej diya
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
