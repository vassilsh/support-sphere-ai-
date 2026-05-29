import { describe, it, expect } from 'vitest';

describe('API Endpoints', () => {
  it('should return 400 if ticketContent is missing', async () => {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Empty body
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('ticketContent is required');
  });
});
