/**
 * API Service for REST endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CallHistoryItem {
  id: number;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_bytes: number;
  chunks_count: number;
  status: string;
  transcript_count: number;
}

export interface TranscriptItem {
  id: number;
  transcript: string;
  is_final: boolean;
  confidence: number | null;
  timestamp: string;
  speaker: string | null;
}

export interface CallDetail extends CallHistoryItem {
  transcriptions: TranscriptItem[];
}

export const api = {
  async getCallHistory(limit: number = 50): Promise<CallHistoryItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/calls/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch call history');
    return response.json();
  },

  async getCallDetail(sessionId: string): Promise<CallDetail> {
    const response = await fetch(`${API_BASE_URL}/api/calls/${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch call detail');
    return response.json();
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  async deleteCall(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/calls/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete call');
  },

  async deleteAllCalls(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/calls/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete all calls');
  }
};
