// Bulk-calls every candidate listed in candidates.csv
// CSV format (no header needed extra columns, just these 2):
// name,phone
// Rahul Sharma,+91XXXXXXXXXX
// Priya Singh,+91YYYYYYYYYY
//
// Usage:  node call-candidates.js
// Make sure your server (server.js) is already running and BASE_URL in .env
// points to its public URL (e.g. your Render deployment URL).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const CSV_PATH = path.join(__dirname, 'candidates.csv');
const SERVER_URL = process.env.BASE_URL; // must be your public server URL
const DELAY_MS = 15000; // wait 15s between calls so you don't hit trial rate limits

function parseCsv(content) {
  return content
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const [name, phone] = line.split(',').map(s => s.trim());
      return { name, phone };
    });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!SERVER_URL) {
    console.error('Set BASE_URL in your .env file to your public server URL first.');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error('candidates.csv not found. Create it with lines like: Name,+91XXXXXXXXXX');
    process.exit(1);
  }

  const candidates = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`Found ${candidates.length} candidates to call.`);

  for (const c of candidates) {
    try {
      console.log(`Calling ${c.name} (${c.phone})...`);
      const resp = await fetch(`${SERVER_URL}/call-candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: c.phone })
      });
      const data = await resp.json();
      console.log('  ->', data);
    } catch (err) {
      console.error(`  Failed to call ${c.name}:`, err.message);
    }
    await sleep(DELAY_MS);
  }

  console.log('All calls triggered. Check /dashboard on your server for results as they complete.');
}

main();
