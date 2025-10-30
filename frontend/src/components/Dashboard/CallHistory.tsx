/**
 * Call History Component
 * Displays list of past calls with transcripts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { api, CallHistoryItem, CallDetail } from '../../services/api';

export default function CallHistory() {
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const history = await api.getCallHistory(50);
      setCalls(history);
      setError(null);
    } catch (err) {
      setError('Failed to load call history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCallDetail = async (sessionId: string) => {
    try {
      const detail = await api.getCallDetail(sessionId);
      setSelectedCall(detail);
    } catch (err) {
      setError('Failed to load call details');
      console.error(err);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadCallHistory}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center p-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No calls yet</h3>
        <p className="text-gray-500">Start a call to see it appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
        <button
          onClick={loadCallHistory}
          className="px-4 py-2 text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {!selectedCall ? (
        <div className="grid gap-4">
          {calls.map((call) => (
            <div
              key={call.id}
              onClick={() => loadCallDetail(call.session_id)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Session: {call.session_id.slice(0, 8)}...
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(call.started_at)}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    call.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {call.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Duration</div>
                  <div className="font-semibold">{formatDuration(call.duration_seconds)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Data</div>
                  <div className="font-semibold">{formatBytes(call.total_bytes)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Chunks</div>
                  <div className="font-semibold">{call.chunks_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Transcripts</div>
                  <div className="font-semibold">{call.transcript_count}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedCall(null)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back to list
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Call Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-500">Session ID</div>
                <div className="font-mono">{selectedCall.session_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-semibold">{selectedCall.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Started</div>
                <div>{formatDate(selectedCall.started_at)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div>{formatDuration(selectedCall.duration_seconds)}</div>
              </div>
            </div>

            <h4 className="font-bold text-lg mb-4">Transcript ({selectedCall.transcriptions.length} lines)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCall.transcriptions.filter(t => t.is_final).map((transcript) => (
                <div key={transcript.id} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{new Date(transcript.timestamp).toLocaleTimeString()}</span>
                    {transcript.confidence && (
                      <span>Confidence: {(transcript.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  <p className="text-gray-900">{transcript.transcript}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
