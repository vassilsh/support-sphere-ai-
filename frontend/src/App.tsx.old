import { useState } from 'react';
import './App.css'; // Using the default Vite CSS file for basic styling

// Define the shape of our API response
interface AnalysisResult {
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  redactedTicket: {
    text?: string;
  } | string; // Handling both cases depending on how the LLM formatted the inner key
}

function App() {
  const [ticketContent, setTicketContent] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!ticketContent.trim()) {
      setError('Please enter a ticket to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
//      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
//      const response = await fetch(`${API_URL}/api/analyze`, {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({ ticketContent }),
//      });

   const response = await fetch('/api/analyze', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ ticketContent }),
   });
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to analyze ticket. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to safely extract the redacted text
  const getRedactedText = (redactedObj: any) => {
    if (typeof redactedObj === 'string') return redactedObj;
    if (redactedObj && redactedObj.text) return redactedObj.text;
    return JSON.stringify(redactedObj);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>SupportSphere AI Analysis</h1>
      <p>Enter a customer support ticket below to generate a summary, detect sentiment, and redact PII.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <textarea
          rows={8}
          value={ticketContent}
          onChange={(e) => setTicketContent(e.target.value)}
          placeholder="Paste customer ticket here... (e.g., Hi, my name is John, my order 123 is missing!)"
          style={{ padding: '1rem', fontSize: '1rem', width: '100%' }}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={isLoading}
          style={{ padding: '1rem', fontSize: '1rem', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? 'Analyzing with AI...' : 'Analyze Ticket'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}><strong>Error:</strong> {error}</div>}

      {result && (
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2>Analysis Results</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Sentiment: </strong> 
            <span style={{
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              backgroundColor: result.sentiment === 'negative' ? '#ffcccc' : result.sentiment === 'positive' ? '#ccffcc' : '#eeeeee',
              color: '#333',
              textTransform: 'capitalize'
            }}>
              {result.sentiment}
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Summary:</strong>
            <p style={{ margin: '0.5rem 0' }}>{result.summary}</p>
          </div>

          <div>
            <strong>Safe / Redacted Ticket Data:</strong>
            <pre style={{ backgroundColor: '#fff', padding: '1rem', border: '1px solid #ddd', whiteSpace: 'pre-wrap' }}>
              {getRedactedText(result.redactedTicket)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
