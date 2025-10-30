'use client';

import { useState } from 'react';

interface AnalysisResult {
  session_id: string;
  sentiment: {
    overall: string;
    score: number;
    explanation: string;
  };
  key_points: string[];
  objections: string[];
  strengths: string[];
  areas_for_improvement: string[];
  coaching_tips: string[];
  next_steps: string[];
}

export default function TranscriptAnalysis() {
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTranscript = async () => {
    if (!transcript.trim()) {
      setError('Please paste a transcript first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze transcript');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze transcript');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setTranscript('');
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transcript Analysis
          </h1>
          <p className="text-gray-600">
            Paste a Gong transcript or any sales call transcript to get AI-powered feedback
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paste Transcript
            </h2>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your Gong transcript here...

Example:
Rep: Hi John, thanks for taking the time today. How's everything going?
Customer: Going well, thanks. Been busy with the new quarter.
Rep: I can imagine. I wanted to discuss how we can help streamline your workflow..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={analyzeTranscript}
                disabled={loading || !transcript.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze Transcript'}
              </button>

              <button
                onClick={clearAll}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Tips for best results:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Include speaker labels (Rep:, Customer:, etc.)</li>
                <li>• Paste the full conversation for complete analysis</li>
                <li>• Works with Gong, Chorus, or any transcript format</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Results
            </h2>

            {!analysis && !loading && (
              <div className="text-center py-16 text-gray-400">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Your analysis will appear here</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Analyzing transcript...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {/* Success message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-800 font-medium">
                      Analysis complete! This transcript has been saved to Call History.
                    </p>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sentiment Analysis
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {analysis.sentiment.overall}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${analysis.sentiment.score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {Math.round(analysis.sentiment.score * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{analysis.sentiment.explanation}</p>
                </div>

                {/* Key Points */}
                {analysis.key_points.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {analysis.key_points.map((point, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      ✓ Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Objections */}
                {analysis.objections.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-orange-700 mb-2">
                      ⚠ Objections Detected
                    </h3>
                    <ul className="space-y-2">
                      {analysis.objections.map((objection, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-orange-600 font-bold">⚠</span>
                          <span>{objection}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {analysis.areas_for_improvement.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysis.areas_for_improvement.map((area, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-red-600 font-bold">→</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Coaching Tips */}
                {analysis.coaching_tips.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-purple-700 mb-2">
                      💡 Coaching Tips
                    </h3>
                    <ul className="space-y-2">
                      {analysis.coaching_tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-purple-600 font-bold">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {analysis.next_steps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                      Next Steps
                    </h3>
                    <ul className="space-y-2">
                      {analysis.next_steps.map((step, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
