/**
 * API Service for REST endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CallHistoryItem {
  id: number;
  session_id: string;
  title?: string | null;
  account_name?: string | null;
  account_slug?: string | null;
  meeting_type?: string | null;
  opportunity_stage?: string | null;
  technical_win?: string | null;
  decision_maker_alignment?: string | null;
  customer_timeline?: string | null;
  competitor_position?: string | null;
  ae_assessment?: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_bytes: number;
  chunks_count: number;
  status: string;
  transcript_count: number;
  sentiment_score?: number | null;
  sentiment_label?: string | null;
  sentiment_explanation?: string | null;
  deal_confidence?: number | null;
  deal_confidence_raw?: number | null;
  deal_confidence_adjustments?: Record<string, unknown>;
  deal_confidence_reasoning?: string | null;
  confidence_notes?: string[];
  opportunity_context?: Record<string, unknown>;
  ae_perspective?: Record<string, unknown>;
  upsell_opportunities?: string[];
}

export interface TranscriptItem {
  id: number;
  transcript: string;
  is_final: boolean;
  confidence: number | null;
  timestamp: string;
  speaker: string | null;
}

export interface AnalysisDetail {
  sentiment?: string | null;
  sentiment_score?: number | null;
  sentiment_explanation?: string | null;
  key_points: string[];
  objections: string[];
  strengths: string[];
  areas_for_improvement: string[];
  coaching_tips: string[];
  next_steps: string[];
  deal_confidence?: number | null;
  deal_confidence_raw?: number | null;
  deal_confidence_adjustments?: Record<string, unknown>;
  deal_confidence_reasoning?: string | null;
  confidence_notes?: string[];
  context_summary?: Record<string, unknown>;
  opportunity_context?: Record<string, unknown>;
  ae_perspective?: Record<string, unknown>;
  ae_assessment_text?: string | null;
  upsell_opportunities: string[];
}

export interface CallDetail extends CallHistoryItem {
  analysis?: AnalysisDetail | null;
  transcriptions: TranscriptItem[];
}

export interface CallHistoryFilters {
  search?: string;
  minSentiment?: number;
  maxSentiment?: number;
  startDate?: string;
  endDate?: string;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  status?: string;
}

export const api = {
  async getCallHistory(
    limit: number = 50,
    filters: CallHistoryFilters = {},
    offset: number = 0
  ): Promise<CallHistoryItem[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(Math.max(0, offset)),
    });

    if (filters.search) params.set('search', filters.search);
    if (typeof filters.minSentiment === 'number') params.set('min_sentiment', filters.minSentiment.toString());
    if (typeof filters.maxSentiment === 'number') params.set('max_sentiment', filters.maxSentiment.toString());
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
    if (typeof filters.minDurationSeconds === 'number') params.set('min_duration', filters.minDurationSeconds.toString());
    if (typeof filters.maxDurationSeconds === 'number') params.set('max_duration', filters.maxDurationSeconds.toString());
    if (filters.status) params.set('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/api/calls/history?${params.toString()}`);
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
