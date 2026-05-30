import fs from 'fs';
import path from 'path';

// Target the Nginx proxy endpoint just like the frontend does
const API_URL = 'http://localhost/api/analyze'; 

// Use process.cwd() instead of __dirname to prevent ES Module crashes
const FIXTURES_PATH = path.join(process.cwd(), 'test-fixtures.json');

// Interface for the input test data
interface TestTicket {
  id: number;
  expectedSentiment: string;
  text: string;
}

// Interface for the API response (Fixes the 'unknown' data error)
interface ApiResponse {
  summary: string;
  sentiment: string;
  redactedTicket: string;
}

async function runTests() {
  console.log(`🚀 Starting Automated PII & Sentiment Tests...`);
  console.log(`📍 Target API: ${API_URL}\n`);

  if (!fs.existsSync(FIXTURES_PATH)) {
    console.error(`❌ Error: Could not find ${FIXTURES_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(FIXTURES_PATH, 'utf-8');
  const tickets: TestTicket[] = JSON.parse(rawData);

  let passed = 0;
  let failed = 0;

  for (const ticket of tickets) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketContent: ticket.text })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Cast the response to our ApiResponse interface
      const data = (await res.json()) as ApiResponse;
      
      // Validation 1: Did it accurately classify the sentiment?
      const sentimentMatch = data.sentiment === ticket.expectedSentiment;

      // Validation 2: Did it leak obvious PII? (Checking for unredacted emails/tags)
      const leaksEmail = data.redactedTicket.includes('@');
      
      // Validation 3: Did it actually perform redaction?
      const performedRedaction = data.redactedTicket.includes('[REDACTED]');

      const passedTest = sentimentMatch && !leaksEmail;

      if (passedTest) {
        console.log(`✅ Ticket #${ticket.id.toString().padStart(3, '0')} - Passed (Sentiment: ${data.sentiment})`);
        passed++;
      } else {
        console.error(`❌ Ticket #${ticket.id.toString().padStart(3, '0')} - Failed`);
        if (!sentimentMatch) {
          console.error(`   -> Expected '${ticket.expectedSentiment}', got '${data.sentiment}'`);
        }
        if (leaksEmail) {
          console.error(`   -> PII Leak Detected! '@' symbol found in output.`);
        }
        if (!performedRedaction && ticket.text.match(/[0-9]{3,}/)) {
           console.error(`   -> Warning: Original text had numbers, but no [REDACTED] tag was found in output.`);
        }
        failed++;
      }
    } catch (error: any) {
      console.error(`💥 Ticket #${ticket.id.toString().padStart(3, '0')} - Server Error: ${error.message}`);
      failed++;
    }
    
    // Add a 500ms delay between requests so we don't accidentally hit API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n================================`);
  console.log(`📊 Test Run Complete!`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🎯 Success Rate: ${((passed / tickets.length) * 100).toFixed(1)}%`);
  console.log(`================================\n`);
  
  if (failed > 0) process.exit(1);
}

runTests();
