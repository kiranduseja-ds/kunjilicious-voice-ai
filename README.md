# Kunjilicious Technologies — AI Voice Screening Caller

This calls job candidates, asks them 5 screening questions, and saves their
spoken answers so your HR team can review them — no manual dialing needed.

It uses **Twilio** for the actual phone call. Twilio gives every new account
**free trial credit** (enough for many test calls) plus a free phone number,
so you can run this completely free while testing. For ongoing production
use at volume, Twilio charges a small per-minute rate (a few cents/min) —
there is no way to make real phone calls with zero cost forever, since
telecom carriers charge for call minutes, but Twilio is the cheapest
reliable way to do it and the trial covers you to start.

No coding needed from you beyond following the steps below.

---

## What it does

1. You give it a candidate's phone number (one at a time, or a whole list).
2. It calls them.
3. A natural voice greets them as calling from **Kunjilicious Technologies**
   and asks, one at a time:
   1. What is your full name?
   2. Which position are you applying for?
   3. Are you available for an interview this week?
   4. How many years of relevant experience do you have?
   5. What is your notice period / when can you join?
4. Their spoken answers are transcribed automatically and saved.
5. You view all answers anytime at a simple web dashboard: `/dashboard`

You can freely edit the questions, greeting, and company name in
`questions.json` — no code changes required.

---

## Step 1 — Create a free Twilio account

1. Go to https://www.twilio.com/try-twilio and sign up (free).
2. Verify your email and phone number.
3. On your Twilio Console dashboard, copy:
   - **Account SID**
   - **Auth Token**
4. Get a free trial phone number: Console → Phone Numbers → Buy a Number
   (trial accounts get one free). Copy this number.

> Note: on a Twilio **trial** account, you can only call phone numbers you've
> first verified in the Twilio console (Console → Verified Caller IDs).
> To call any number without this limit, upgrade the Twilio account
> (pay-as-you-go, no monthly fee — you just add a small balance).

## Step 2 — Deploy this server (free hosting)

Use **Render.com** (has a free tier):

1. Create a free account at https://render.com
2. Push this project folder to a GitHub repo (or use Render's "upload" option).
3. On Render: New → Web Service → connect your repo.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add these Environment Variables in Render's dashboard (from Step 1):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `BASE_URL` → set this AFTER Render gives you your live URL, e.g.
     `https://kunjilicious-voice-ai.onrender.com`
7. Deploy. Once live, copy your Render URL.
8. Go back to Render env vars and set `BASE_URL` to that URL, then redeploy
   (needed so outbound calls know where to send Twilio webhooks).

## Step 3 — Connect Twilio to your server

1. In Twilio Console → Phone Numbers → your number → Voice Configuration.
2. Set "A call comes in" webhook to: `https://YOUR-RENDER-URL/voice` (POST).
3. Save.

## Step 4 — Make calls

**Single candidate**, using any HTTP tool (Postman, or even a browser
extension) or curl:

```bash
curl -X POST https://YOUR-RENDER-URL/call-candidate \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91XXXXXXXXXX"}'
```

**Bulk candidates**: edit `candidates.csv` (name,phone per line), then run
locally:

```bash
npm install
npm run call
```

This calls each candidate one by one with a short delay between calls.

## Step 5 — View results

Open `https://YOUR-RENDER-URL/dashboard` in your browser anytime to see
every candidate's answers as they come in, or fetch raw JSON at
`/responses`.

---

## Editing questions / company name

Open `questions.json` — change `companyName`, `greeting`, `closing`, or the
`questions` array. No other code changes needed. Redeploy after editing.

---

## Important notes before real use

- **Consent & compliance**: many countries (India's TRAI regulations, the
  US TCPA, etc.) restrict automated/robocalls to phone numbers, especially
  for unsolicited contact. Since these are candidates who applied to your
  jobs, this is generally fine, but it's worth confirming your calling
  practice complies with local telecom regulations before wide rollout.
- **Trial limits**: Twilio trial accounts play a short "this is a trial
  account" message before your greeting, and can only call verified
  numbers. Upgrading (adding a small balance, no subscription) removes
  both limits.
- **Speech recognition accuracy**: Twilio's built-in speech-to-text works
  well for clear English answers; heavy accents or noisy environments may
  need the candidate to repeat themselves — the bot already re-asks once
  automatically if it hears nothing.

---

## Project files

```
kunjilicious-voice-ai/
├── server.js            # main server — handles calls, questions, dashboard
├── call-candidates.js   # bulk-calling script
├── candidates.csv       # your list of candidates to call
├── questions.json       # EDIT THIS to change questions/company name
├── package.json
├── .env.example         # copy to .env and fill in your Twilio details
└── data/responses.json  # saved candidate answers (auto-created)
```
