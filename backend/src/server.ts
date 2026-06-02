import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Set up Prisma 7 with the SQLite Adapter
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:/app/prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: '*'
});

// POST endpoint to save results to SQLite
fastify.post('/api/analyze', async (request, reply) => {
  const { content } = request.body as { content: string };

  try {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const modelName = process.env.LLM_MODEL || 'llama3.2:1b';

    // Using Node 20's global native fetch
    const ollamaResponse = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName, 
        prompt: `Analyze the following customer support ticket. \nProvide a JSON response with exactly three keys: \n"sentiment" (positive, neutral, or negative), \n"summary" (a 1-sentence summary), \n"redactedContent" (the original content with any names or sensitive info replaced by [REDACTED]). \nTicket: "${content}"`,
        stream: false,
        format: 'json'
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`External Ollama endpoint responded with status ${ollamaResponse.status}`);
    }

    const data = await ollamaResponse.json();
    const result = JSON.parse(data.response);

    // Save the ticket and the AI analysis into the database
    const savedTicket = await prisma.ticket.create({
      data: {
        rawContent: content,
        sentiment: result.sentiment,
        summary: result.summary,
        redactedContent: result.redactedContent,
      }
    });

    return reply.send(savedTicket);
    
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to process ticket', details: error.message });
  }
});

// GET endpoint to fetch history
fastify.get('/api/history', async (request, reply) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(tickets);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch history' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Backend server running internally on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
