import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Ollama } from 'ollama';
import { z } from 'zod';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
// a fallback default model if the environment variable isn't set
const LLM_MODEL = process.env.LLM_MODEL || 'qwen2.5:14b'; 

const ollama = new Ollama({ host: OLLAMA_HOST });
const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });

// Define a strict schema for the LLM output validation
const TicketAnalysisSchema = z.object({
  summary: z.string().min(1),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  redactedTicket: z.union([
    z.string(),
    z.object({ text: z.string() })
  ]).transform((val) => {
    // Standardize formatting so the frontend doesn't have to guess
    if (typeof val === 'string') return val;
    return val.text;
  })
});

interface AnalyzeRequest {
  ticketContent: string;
}

fastify.post<{ Body: AnalyzeRequest }>('/api/analyze', async (request, reply) => {
  const { ticketContent } = request.body;

  if (!ticketContent?.trim()) {
    return reply.status(400).send({ error: 'ticketContent is required and cannot be empty' });
  }

  const systemPrompt = `
    You are an expert customer support AI. Your task is to analyze the following support ticket.
    
    CRITICAL STEP-BY-STEP PROCESS FOR PII:
    1. Scan the text specifically for human proper names, emails, card numbers, and addresses.
    2. Replace ALL of them with "[REDACTED]".
    3. Ensure that even if a name appears at the very end of a sentence or account note, it is wiped out.

    You MUST respond with a raw JSON object containing exactly three keys:
    1. "summary": A concise 1-2 sentence summary of the issue.
    2. "sentiment": The customer's sentiment, exactly one of: "positive", "negative", or "neutral".
    3. "redactedTicket": The fully sanitized text from step 2.

    Respond ONLY with valid JSON.
  `;

  try {
   const response = await ollama.chat({
      model: LLM_MODEL, // Dynamically driven by our environment variable!
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: ticketContent }
      ],
      format: 'json',
      options: { temperature: 0.1 }
    });

    // Defensive parsing: validate raw text output via Zod
    const rawJson = JSON.parse(response.message.content);
    const validatedData = TicketAnalysisSchema.parse(rawJson);
    
    return reply.send(validatedData);

  } catch (error) {
    fastify.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(502).send({ error: 'LLM returned invalid JSON structure.' });
    }
    return reply.status(500).send({ error: 'Failed to process ticket with AI.' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
