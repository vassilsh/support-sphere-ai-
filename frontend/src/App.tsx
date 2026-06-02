import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, History, AlertCircle, CheckCircle } from 'lucide-react';

interface TicketHistoryItem {
  id: string;
  createdAt: string;
  rawContent: string;
  sentiment: string;
  summary: string;
  redactedContent: string;
}

export default function App() {
  // Navigation State: 'analyze' or 'history'
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  // Existing Analyzer States
  const [ticketInput, setTicketInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New History States
  const [historyData, setHistoryData] = useState<TicketHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch history when entering the history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      // Clean relative path that proxies through Nginx
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Failed to fetch processing history');
      const data = await response.json();
      setHistoryData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Clean relative path that proxies through Nginx
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: ticketInput }),
      });

      if (!response.ok) throw new Error('Failed to analyze ticket. Ensure backend is running.');

      const data = await response.json();
      setAnalysisResult(data);
      setTicketInput('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Shared Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SupportSphere AI</h1>
              <p className="text-xs text-slate-400">PII Redaction & Guardrails</p>
            </div>
          </div>

          <nav className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analyze'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Analyze Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'analyze' ? (
          /* TAB 1: ANALYZER UI */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-800/40 to-slate-900/40 shadow-xl">
              <h2 className="text-xl font-bold mb-2">Submit Support Ticket</h2>
              <p className="text-sm text-slate-400 mb-4">Paste the customer communication below to automatically purge sensitive PII and evaluate operational sentiment.</p>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <textarea
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Paste raw ticket content here (including names, emails, phones)..."
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600 resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Processing through Local LLM...' : 'Analyze & Redact Ticket'}
                </button>
              </form>
            </div>

            {error && (
              <div className="flex items-start space-x-3 bg-red-950/40 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {analysisResult && (
              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-800/40 to-slate-900/40 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analysis Complete</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    analysisResult.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    analysisResult.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {analysisResult.sentiment}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Executive Summary</h4>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">{analysisResult.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sanitized Output (PII Stripped)</h4>
                  <p className="text-sm text-slate-300 font-mono leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap select-all">{analysisResult.redactedContent}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: AUDIT & ANALYTICS HISTORY TABLE */
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Audit & Analytics History</h2>
              <p className="text-sm text-slate-400">Review, filter, and inspect previously parsed customer transactions stored in the SQLite engine.</p>
            </div>

            {historyLoading ? (
              /* Loading Spinner Block */
              <div className="flex justify-center items-center py-12 text-slate-400 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-3"></div>
                <span>Syncing records with SQLite database...</span>
              </div>
            ) : historyData.length === 0 ? (
              /* Empty Database Block */
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/50 text-slate-500 text-sm">
                No transaction logs found in the audit database. Try analyzing a ticket first.
              </div>
            ) : (
              /* Rich Data Table Layout */
              <div className="space-y-4">
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-slate-400 text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Connection Verified. Total logs: <strong>{historyData.length}</strong></span>
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/30 backdrop-blur-md shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-4 w-32">Sentiment</th>
                          <th className="px-6 py-4 w-1/4">Summary</th>
                          <th className="px-6 py-4 w-2/5">Redacted Content (PII Purged)</th>
                          <th className="px-6 py-4 w-40 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                        {historyData.map((ticket) => {
                          let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          if (ticket.sentiment?.toLowerCase() === 'positive') {
                            badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          } else if (ticket.sentiment?.toLowerCase() === 'negative') {
                            badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          }

                          return (
                            <tr key={ticket.id} className="hover:bg-slate-800/20 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
                                  {ticket.sentiment || 'unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-200">
                                {ticket.summary}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-400 bg-slate-950/20 select-all whitespace-pre-wrap">
                                {ticket.redactedContent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500">
                                {new Date(ticket.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
