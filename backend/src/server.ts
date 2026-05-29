import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Ollama } from 'ollama';

// Configure your remote Ollama instance
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const ollama = new Ollama({ host: OLLAMA_HOST });

const fastify = Fastify({ logger: true });

// Register CORS so our React frontend can talk to this API
fastify.register(cors, {
  origin: '*', // For prototyping, allow all. In production, restrict to frontend domain.
});

// Define the shape of our expected request body
interface AnalyzeRequest {
  ticketContent: string;
}

// The core analysis endpoint
fastify.post<{ Body: AnalyzeRequest }>('/api/analyze', async (request, reply) => {
  const { ticketContent } = request.body;

  if (!ticketContent) {
    return reply.status(400).send({ error: 'ticketContent is required' });
  }

  const systemPrompt = `
    You are an expert customer support AI. Your task is to analyze the following support ticket.
    You MUST respond with a raw JSON object containing exactly three keys:
    1. "summary": A concise 1-2 sentence summary of the issue.
    2. "sentiment": The customer's sentiment, exactly one of: "positive", "negative", or "neutral".
    3. "redactedTicket": The original ticket content, but replace ANY Personally Identifiable Information (PII) like names, email addresses, phone numbers, physical addresses, or credit card numbers with the exact string "[REDACTED]".

    Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ollama.chat({
      model: 'llama3.1', // Using your 8B model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: ticketContent }
      ],
      format: 'json', // Forces Ollama to output valid JSON
      options: {
        temperature: 0.1 // Low temperature for more deterministic, analytical outputs
      }
    });

    // Parse the JSON string returned by the LLM
    const analysisResult = JSON.parse(response.message.content);
    
    return reply.send(analysisResult);

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to process ticket with AI.' });
  }
});

// Start the server
const start = async () => {
  try {
    // Listen on 0.0.0.0 so it's accessible outside the VM
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Backend listening on http://0.0.0.0:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
