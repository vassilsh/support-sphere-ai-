import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Ollama } from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// --- Configuration & Environment ---
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama'; // 'ollama' or 'gemini'
// Gemini 1.5 Flash is lightning fast and free in AI Studio
const LLM_MODEL = process.env.LLM_MODEL || (LLM_PROVIDER === 'gemini' ? 'gemini-1.5-flash' : 'qwen2.5:14b');

// Ollama Config
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const ollama = new Ollama({ host: OLLAMA_HOST });

// Google Gemini Config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const fastify = Fastify({ logger: true });
fastify.register(cors, { origin: '*' });

// --- Schema Validation ---
const TicketAnalysisSchema = z.object({
  summary: z.string().min(1),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  redactedTicket: z.union([
    z.string(),
    z.object({ text: z.string() })
  ]).transform((val) => (typeof val === 'string' ? val : val.text))
});

interface AnalyzeRequest {
  ticketContent: string;
}

// --- Route Handler ---
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
    let rawJsonText = "";

    // --- Dynamic Provider Routing ---
    if (LLM_PROVIDER === 'gemini') {
      if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing in environment variables.');
      
      const model = genAI.getGenerativeModel({
        model: LLM_MODEL,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json", // Enforces strict JSON return
        }
      });

      // Gemini works best when system instructions and user prompts are clearly separated in the prompt string
      const fullPrompt = `${systemPrompt}\n\n---TICKET CONTENT---\n${ticketContent}`;
      
      const result = await model.generateContent(fullPrompt);
      rawJsonText = result.response.text();

    } else {
      // Fallback to local Ollama
      const response = await ollama.chat({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: ticketContent }
        ],
        format: 'json',
        options: { temperature: 0.1 }
      });
      rawJsonText = response.message.content;
    }

    // Defensive parsing: validate raw text output via Zod
    const rawJson = JSON.parse(rawJsonText);
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
