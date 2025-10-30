/**
 * Transcript View Component
 * Displays real-time transcription with speaker labels and timestamps
 */

'use client';

import React, { useEffect, useRef } from 'react';

export interface TranscriptLine {
  id: string;
  transcript: string;
  is_final: boolean;
  confidence: number;
  timestamp: Date;
  speaker?: string;
}

interface TranscriptViewProps {
  transcripts: TranscriptLine[];
  autoScroll?: boolean;
}

export default function TranscriptView({
  transcripts,
  autoScroll = true
}: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts, autoScroll]);

  if (transcripts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-400 text-lg">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="text-gray-500">Start speaking to see the transcript</p>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-lg p-6 h-96 overflow-y-auto space-y-4"
    >
      {transcripts.map((line) => (
        <div
          key={line.id}
          className={`p-3 rounded-lg transition-all ${
            line.is_final
              ? 'bg-gray-50 border border-gray-200'
              : 'bg-blue-50 border border-blue-200 opacity-70'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {line.speaker && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  {line.speaker}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatTime(line.timestamp)}
              </span>
              {!line.is_final && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded animate-pulse">
                  Interim
                </span>
              )}
            </div>
            <span
              className={`text-xs font-medium ${getConfidenceColor(line.confidence)}`}
              title={`Confidence: ${(line.confidence * 100).toFixed(1)}%`}
            >
              {(line.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className={`text-gray-900 ${line.is_final ? '' : 'italic'}`}>
            {line.transcript}
          </p>
        </div>
      ))}
    </div>
  );
}
