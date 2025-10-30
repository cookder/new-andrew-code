/**
 * Call Interface Component
 * Main UI for managing live sales calls with audio streaming
 */

'use client';

import React, { useState, useEffect } from 'react';
import { wsService } from '../../services/websocket';
import { useAudioStreaming } from '../../hooks/useAudioStreaming';
import TranscriptView, { TranscriptLine } from '../Transcription/TranscriptView';
import { v4 as uuidv4 } from 'uuid';

export default function CallInterface() {
  const {
    isStreaming,
    isConnected,
    volume,
    error,
    stats,
    startStreaming,
    stopStreaming,
  } = useAudioStreaming(wsService);

  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);

  // Listen for transcription messages
  useEffect(() => {
    const handleTranscription = (message: any) => {
      const newTranscript: TranscriptLine = {
        id: uuidv4(),
        transcript: message.transcript,
        is_final: message.is_final,
        confidence: message.confidence,
        timestamp: new Date(),
      };

      setTranscripts((prev) => {
        // If this is an interim result, replace the last interim result
        if (!message.is_final && prev.length > 0 && !prev[prev.length - 1].is_final) {
          return [...prev.slice(0, -1), newTranscript];
        }
        // Otherwise add as a new line
        return [...prev, newTranscript];
      });
    };

    const handleConnection = (message: any) => {
      setTranscriptionEnabled(message.transcription_enabled || false);
      if (!message.transcription_enabled) {
        console.warn('Transcription is not enabled. Set DEEPGRAM_API_KEY to enable.');
      }
    };

    wsService.on('transcription', handleTranscription);
    wsService.on('connection', handleConnection);

    return () => {
      wsService.off('transcription', handleTranscription);
      wsService.off('connection', handleConnection);
    };
  }, []);

  // Clear transcripts when streaming stops
  useEffect(() => {
    if (!isStreaming) {
      // Don't clear immediately - keep the transcript visible
      // setTranscripts([]);
    }
  }, [isStreaming]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sales Call Feedback AI
        </h1>
        <p className="text-gray-600">
          Real-time audio streaming and transcription
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Status Indicators */}
        <div className="flex justify-center gap-4 mb-8">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-700">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Recording Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-700">
              {isStreaming ? 'Recording' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Volume Meter */}
        {isStreaming && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Microphone Level
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-100"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {!isStreaming ? (
            <button
              onClick={startStreaming}
              disabled={isStreaming}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              Start Call
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Stop Call
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Duration</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(stats.duration)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Data Sent</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(stats.bytesStreamed)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Chunks</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.chunksReceived}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Session ID</div>
            <div className="text-xs font-mono text-gray-900 truncate">
              {stats.sessionId ? stats.sessionId.slice(0, 8) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Display */}
      {transcriptionEnabled && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Live Transcript</h2>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Listening</span>
                </div>
              )}
            </div>
          </div>
          <TranscriptView transcripts={transcripts} />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How to use:
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>Click "Start Call" to begin streaming audio</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>Allow microphone access when prompted</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>
              Speak naturally - your audio is being streamed to the backend in real-time
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">4.</span>
            <span>
              Watch the stats update as audio chunks are sent and acknowledged
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">5.</span>
            <span>Click "Stop Call" when finished</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
