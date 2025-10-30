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
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const deleteCall = async (sessionId: string) => {
    try {
      await api.deleteCall(sessionId);
      setCalls(calls.filter(call => call.session_id !== sessionId));
      if (selectedCall?.session_id === sessionId) {
        setSelectedCall(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete call');
      console.error(err);
    }
  };

  const deleteAllCalls = async () => {
    try {
      await api.deleteAllCalls();
      setCalls([]);
      setSelectedCall(null);
      setShowClearAllConfirm(false);
    } catch (err) {
      setError('Failed to delete all calls');
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
        <div className="flex gap-2">
          <button
            onClick={loadCallHistory}
            className="px-4 py-2 text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
          {calls.length > 0 && (
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Clear All Calls?</h3>
            <p className="text-gray-700 mb-6">
              This will permanently delete all {calls.length} calls and their transcripts.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllCalls}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedCall ? (
        <div className="grid gap-4">
          {calls.map((call) => (
            <div
              key={call.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow relative"
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(call.session_id);
                }}
                className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete this call"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Delete confirmation for individual call */}
              {deleteConfirmId === call.session_id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Delete This Call?</h3>
                    <p className="text-gray-700 mb-6">
                      This will permanently delete call {call.session_id.slice(0, 8)}... and its transcript.
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCall(call.session_id);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div
                onClick={() => loadCallDetail(call.session_id)}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4 pr-12">
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
