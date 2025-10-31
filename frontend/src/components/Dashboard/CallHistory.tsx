/**
 * Call History Component
 * Displays list of past calls with transcripts
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api, CallHistoryItem, CallDetail, CallHistoryFilters } from '../../services/api';

export default function CallHistory() {
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const groupedCalls = useMemo(() => {
    if (!calls || calls.length === 0) return [];

    const sorted = [...calls].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    const byAccount = new Map<
      string,
      { accountLabel: string; calls: CallHistoryItem[]; latestStartedAt?: string }
    >();

    sorted.forEach((call) => {
      const label = call.account_name?.trim() || 'Unassigned Account';
      const key =
        call.account_slug ||
        (call.account_name ? call.account_name.toLowerCase() : 'unassigned');
      if (!byAccount.has(key)) {
        byAccount.set(key, { accountLabel: label, calls: [], latestStartedAt: call.started_at });
      }
      const group = byAccount.get(key)!;
      group.calls.push(call);
      const callTime = call.started_at ? new Date(call.started_at).getTime() : 0;
      const groupTime = group.latestStartedAt ? new Date(group.latestStartedAt).getTime() : 0;
      if (callTime > groupTime) {
        group.latestStartedAt = call.started_at;
      }
    });

    return Array.from(byAccount.entries())
      .map(([key, value]) => ({
        key,
        accountLabel: value.accountLabel,
        calls: value.calls,
        latestStartedAt: value.latestStartedAt ?? '',
      }))
      .sort((a, b) => {
        const aTime = a.latestStartedAt ? new Date(a.latestStartedAt).getTime() : 0;
        const bTime = b.latestStartedAt ? new Date(b.latestStartedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [calls]);

  useEffect(() => {
    loadCallHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCallHistory = async ({ append = false }: { append?: boolean } = {}) => {
    const targetOffset = append ? calls.length : 0;
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      const filters: CallHistoryFilters = {};

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      if (sentimentFilter === 'positive') {
        filters.minSentiment = 0.7;
        filters.maxSentiment = 1.0;
      } else if (sentimentFilter === 'neutral') {
        filters.minSentiment = 0.4;
        filters.maxSentiment = 0.7;
      } else if (sentimentFilter === 'negative') {
        filters.minSentiment = 0.0;
        filters.maxSentiment = 0.4;
      }

      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      const toSeconds = (value: string) => {
        const minutes = parseFloat(value);
        if (Number.isNaN(minutes)) return undefined;
        return Math.max(0, Math.round(minutes * 60));
      };

      const minSeconds = toSeconds(minDuration);
      const maxSeconds = toSeconds(maxDuration);

      if (typeof minSeconds === 'number') {
        filters.minDurationSeconds = minSeconds;
      }
      if (typeof maxSeconds === 'number') {
        filters.maxDurationSeconds = maxSeconds;
      }

      const history = await api.getCallHistory(PAGE_SIZE + 1, filters, targetOffset);
      const nextItems = history.slice(0, PAGE_SIZE);
      setHasMore(history.length > PAGE_SIZE);

      if (append) {
        setCalls((prev) => {
          const existingIds = new Set(prev.map((item) => item.session_id));
          const merged = [...prev];
          nextItems.forEach((item) => {
            if (!existingIds.has(item.session_id)) {
              merged.push(item);
            }
          });
          return merged;
        });
      } else {
        setCalls(nextItems);
        setSelectedCall(null);
        setDeleteConfirmId(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load call history');
      console.error(err);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    loadCallHistory({ append: true });
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

  const resetFilters = () => {
    setSearchTerm('');
    setSentimentFilter('all');
    setStartDate('');
    setEndDate('');
    setMinDuration('');
    setMaxDuration('');
    setCalls([]);
    setSelectedCall(null);
    setDeleteConfirmId(null);
    setHasMore(false);
    loadCallHistory();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      loadCallHistory();
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
      setHasMore(false);
      setIsLoadingMore(false);
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

  const formatConfidence = (value?: number | null): string => {
    if (typeof value !== 'number') return '—';
    return `${Math.round(value * 100)}%`;
  };

  const getConfidenceClasses = (score: number) => {
    if (score >= 0.7) return 'bg-green-100 text-green-700';
    if (score >= 0.5) return 'bg-blue-100 text-blue-700';
    if (score >= 0.3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const describeStage = (stage?: string | null): string =>
    stage || 'Unassigned stage';

  const describeTechnicalWin = (value?: string | null): string => {
    if (!value) return 'Unknown';
    const normalized = value.toLowerCase();
    if (normalized.includes('won')) return 'Technical validation complete';
    if (normalized.includes('not')) return 'Technical validation pending';
    return value;
  };

  const describeDecisionAlignment = (value?: string | null): string => {
    if (!value || value.toLowerCase() === 'unknown') return 'Unknown';
    if (value.toLowerCase() === 'strong') return 'Strong alignment';
    if (value.toLowerCase() === 'moderate') return 'Partial alignment';
    if (value.toLowerCase() === 'weak') return 'Weak alignment';
    return value;
  };

  const describeCompetitor = (value?: string | null): string => {
    if (!value || value.toLowerCase() === 'unknown') return 'Unknown';
    if (value.toLowerCase().includes('leading')) return 'Box leading';
    if (value.toLowerCase().includes('neutral')) return 'Neutral footing';
    if (value.toLowerCase().includes('trailing')) return 'Box trailing';
    return value;
  };

  const describeAeAlignment = (value?: string | null): string => {
    if (!value || value.toLowerCase() === 'unknown') return 'AE stance unknown';
    const normalized = value.toLowerCase();
    if (normalized === 'supportive' || normalized === 'aligned' || normalized === 'positive') {
      return 'AE feels confident';
    }
    if (normalized === 'neutral') {
      return 'AE is cautiously optimistic';
    }
    if (normalized === 'contradictory' || normalized === 'negative' || normalized === 'concerned') {
      return 'AE is signaling risk';
    }
    return value;
  };

  const asAePerspective = (
    value?: Record<string, unknown> | null
  ): { summary?: string; alignment?: string; confidence?: number; risk_flags?: string[] } | undefined => {
    if (!value) return undefined;
    if (Object.keys(value).length === 0) return undefined;
    return value as {
      summary?: string;
      alignment?: string;
      confidence?: number;
      risk_flags?: string[];
    };
  };

  const extractNumeric = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined;

  const selectedAePerspective = asAePerspective(
    selectedCall?.analysis?.ae_perspective ?? undefined
  );
  const selectedAeAssessmentText = selectedCall?.analysis?.ae_assessment_text ?? null;
  const selectedAeStoredNote = selectedCall?.ae_assessment ?? null;
  const hasSelectedAeAssessment =
    !!(typeof selectedAeAssessmentText === 'string' && selectedAeAssessmentText.trim()) ||
    !!(typeof selectedAeStoredNote === 'string' && selectedAeStoredNote.trim());

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
          onClick={() => loadCallHistory()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by session ID or transcript text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value as typeof sentimentFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All</option>
              <option value="positive">Positive (≥ 0.70)</option>
              <option value="neutral">Neutral (0.40 - 0.69)</option>
              <option value="negative">Needs Attention (&lt; 0.40)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Min Duration (min)</label>
              <input
                type="number"
                min="0"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Max Duration (min)</label>
              <input
                type="number"
                min="0"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => loadCallHistory()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => loadCallHistory()}
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

      {calls.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
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
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No calls match your filters
          </h3>
          <p className="text-gray-500">Adjust the filters above or start a new analysis.</p>
        </div>
      ) : (
        <>
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
            <div className="space-y-8">
              {groupedCalls.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {group.accountLabel}
                      </h3>
                      {group.calls[0] && (
                        <p className="text-sm text-gray-500">
                          Last call: {formatDate(group.calls[0].started_at)}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {group.calls.length} {group.calls.length === 1 ? 'call' : 'calls'}
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {group.calls.map((call) => {
                      const aePerspective = asAePerspective(call.ae_perspective);
                      const hasAeAssessment = !!(call.ae_assessment && call.ae_assessment.trim());
                      return (
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

                        <div onClick={() => loadCallDetail(call.session_id)} className="cursor-pointer">
                          <div className="flex justify-between items-start mb-4 pr-12">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-gray-900">
                                {call.title || call.meeting_type || `Session ${call.session_id.slice(0, 8)}...`}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(call.started_at)}
                                {call.meeting_type ? ` • ${call.meeting_type}` : ''}
                              </p>
                              <p className="text-xs text-gray-500">Session: {call.session_id.slice(0, 8)}...</p>
                              <p className="text-xs text-gray-500">
                                Stage: {describeStage(call.opportunity_stage)}
                              </p>
                              {call.technical_win && (
                                <p className="text-xs text-gray-500">
                                  Tech: {describeTechnicalWin(call.technical_win)}
                                </p>
                              )}
                              {call.decision_maker_alignment &&
                                call.decision_maker_alignment.toLowerCase() !== 'unknown' && (
                                  <p className="text-xs text-gray-500">
                                    DM alignment: {describeDecisionAlignment(call.decision_maker_alignment)}
                                  </p>
                                )}
                              {call.customer_timeline && (
                                <p className="text-xs text-gray-500">Timeline: {call.customer_timeline}</p>
                              )}
                              {call.competitor_position &&
                                call.competitor_position.toLowerCase() !== 'unknown' && (
                                  <p className="text-xs text-gray-500">
                                    Competitive: {describeCompetitor(call.competitor_position)}
                                  </p>
                                )}
                              {hasAeAssessment && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  AE: {call.ae_assessment}
                                </p>
                              )}
                              {hasAeAssessment && aePerspective?.summary && (
                                  <p className="text-xs text-emerald-700 line-clamp-2">
                                    AI on AE: {aePerspective.summary}
                                  </p>
                                )}
                              {call.confidence_notes && call.confidence_notes.length > 0 && (
                                <p className="text-xs text-emerald-700">
                                  Signal: {call.confidence_notes[0]}
                                </p>
                              )}
                              {call.sentiment_label && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold text-blue-600">{call.sentiment_label}</span>
                                  {typeof call.sentiment_score === 'number' && (
                                    <span className="text-xs text-gray-500">
                                      {(call.sentiment_score * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              )}
                              {call.sentiment_explanation && (
                                <p className="text-xs text-gray-600">{call.sentiment_explanation}</p>
                              )}
                              {typeof call.deal_confidence === 'number' && (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full font-semibold ${getConfidenceClasses(
                                      call.deal_confidence
                                    )}`}
                                  >
                                    {formatConfidence(call.deal_confidence)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Final
                                    {typeof call.deal_confidence_raw === 'number'
                                      ? ` • Raw ${formatConfidence(call.deal_confidence_raw)}`
                                      : ''}
                                  </span>
                                  {(() => {
                                    const heuristicScore = extractNumeric(
                                      call.deal_confidence_adjustments?.heuristic_score
                                    );
                                    if (typeof heuristicScore === 'number') {
                                      return (
                                        <span className="text-xs text-gray-500">
                                          Heuristic {formatConfidence(heuristicScore)}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                              {call.deal_confidence_reasoning && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {call.deal_confidence_reasoning}
                                </p>
                              )}
                              {call.upsell_opportunities && call.upsell_opportunities.length > 0 && (
                                <p className="text-xs text-green-700 line-clamp-2">
                                  Upsell: {call.upsell_opportunities[0]}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                call.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : call.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {call.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                            <div>
                              <div className="text-gray-500">Deal Confidence</div>
                              <div className="font-semibold">
                                {formatConfidence(call.deal_confidence)}
                                {typeof call.deal_confidence_raw === 'number' && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    raw {formatConfidence(call.deal_confidence_raw)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      isLoadingMore
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {isLoadingMore ? 'Loading more...' : 'Load more calls'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCall(null)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                ← Back to list
              </button>

              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">
                      {selectedCall.title || selectedCall.account_name || 'Call Details'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedCall.account_name ? `${selectedCall.account_name} • ` : ''}
                      {formatDate(selectedCall.started_at)}
                      {selectedCall.meeting_type ? ` • ${selectedCall.meeting_type}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">Session {selectedCall.session_id}</p>
                    <p className="text-xs text-gray-500">
                      Stage: {describeStage(selectedCall.opportunity_stage)}
                    </p>
                    {selectedCall.technical_win && (
                      <p className="text-xs text-gray-500">
                        Tech: {describeTechnicalWin(selectedCall.technical_win)}
                      </p>
                    )}
                    {selectedCall.decision_maker_alignment &&
                      selectedCall.decision_maker_alignment.toLowerCase() !== 'unknown' && (
                        <p className="text-xs text-gray-500">
                          DM alignment: {describeDecisionAlignment(selectedCall.decision_maker_alignment)}
                        </p>
                      )}
                    {selectedCall.customer_timeline && (
                      <p className="text-xs text-gray-500">Timeline: {selectedCall.customer_timeline}</p>
                    )}
                    {selectedCall.competitor_position &&
                      selectedCall.competitor_position.toLowerCase() !== 'unknown' && (
                        <p className="text-xs text-gray-500">
                          Competitive: {describeCompetitor(selectedCall.competitor_position)}
                        </p>
                      )}
                  </div>
                  {selectedCall.analysis?.sentiment && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">
                        {selectedCall.analysis.sentiment}
                      </span>
                      {typeof selectedCall.analysis.sentiment_score === 'number' && (
                        <span className="text-xs text-gray-500">
                          {(selectedCall.analysis.sentiment_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {selectedCall.analysis?.sentiment_explanation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
                    {selectedCall.analysis.sentiment_explanation}
                  </div>
                )}

                {selectedCall.analysis && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-emerald-800 font-semibold">
                          Final
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceClasses(
                            selectedCall.analysis.deal_confidence ?? 0
                          )}`}
                        >
                          {formatConfidence(selectedCall.analysis.deal_confidence)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-800">
                        <span className="text-xs uppercase tracking-wide">Raw model</span>
                        <span className="px-3 py-1 rounded-full bg-white/80 border border-emerald-200">
                          {formatConfidence(selectedCall.deal_confidence_raw)}
                        </span>
                      </div>
                      {(() => {
                        const heuristicScore = extractNumeric(
                          selectedCall.deal_confidence_adjustments?.heuristic_score
                        );
                        if (typeof heuristicScore === 'number') {
                          return (
                            <div className="flex items-center gap-2 text-sm text-emerald-800">
                              <span className="text-xs uppercase tracking-wide">Heuristic</span>
                              <span className="px-3 py-1 rounded-full bg-white/80 border border-emerald-200">
                                {formatConfidence(heuristicScore)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {selectedCall.analysis.deal_confidence_reasoning && (
                      <p className="text-sm text-emerald-900">
                        {selectedCall.analysis.deal_confidence_reasoning}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-900">
                      <p><span className="font-semibold">Stage:</span> {describeStage(selectedCall.opportunity_stage)}</p>
                      <p><span className="font-semibold">Technical win:</span> {describeTechnicalWin(selectedCall.technical_win)}</p>
                      <p><span className="font-semibold">DM alignment:</span> {describeDecisionAlignment(selectedCall.decision_maker_alignment)}</p>
                      <p><span className="font-semibold">Timeline:</span> {selectedCall.customer_timeline || 'Not specified'}</p>
                      <p><span className="font-semibold">Competitive:</span> {describeCompetitor(selectedCall.competitor_position)}</p>
                    </div>
                    {hasSelectedAeAssessment && (
                      <div className="text-sm text-emerald-900 bg-white/70 border border-emerald-100 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold text-emerald-800">Account Executive perspective</h4>
                        {selectedAeAssessmentText && selectedAeAssessmentText.trim() && (
                          <p>
                            <span className="font-semibold">AE notes:</span> {selectedAeAssessmentText}
                          </p>
                        )}
                        {selectedAePerspective?.summary && (
                          <p>
                            <span className="font-semibold">AI interpretation:</span> {selectedAePerspective.summary}
                          </p>
                        )}
                        {selectedAePerspective && (
                          <>
                            <div className="flex flex-wrap items-center gap-3">
                              {typeof selectedAePerspective?.confidence === 'number' && (
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                                  AE confidence {formatConfidence(selectedAePerspective?.confidence)}
                                </span>
                              )}
                              {selectedAePerspective?.alignment && (
                                <span className="text-xs text-emerald-800">
                                  {describeAeAlignment(selectedAePerspective?.alignment)}
                                </span>
                              )}
                            </div>
                            {Array.isArray(selectedAePerspective?.risk_flags) &&
                              selectedAePerspective?.risk_flags?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wide">
                                    AE risk flags
                                  </h5>
                                  <ul className="list-disc list-inside space-y-1">
                                    {selectedAePerspective?.risk_flags?.map((flag, idx) => (
                                      <li key={idx}>{flag}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    )}
                    {selectedCall.confidence_notes && selectedCall.confidence_notes.length > 0 && (
                      <div className="text-sm text-emerald-900">
                        <h4 className="font-semibold mb-1">Confidence signals</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          {selectedCall.confidence_notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedCall.analysis.upsell_opportunities &&
                      selectedCall.analysis.upsell_opportunities.length > 0 && (
                        <div className="text-sm text-emerald-900">
                          <h4 className="font-semibold mb-1">Upsell Opportunities</h4>
                          <ul className="space-y-1 list-disc list-inside">
                            {selectedCall.analysis.upsell_opportunities.map((idea, index) => (
                              <li key={index}>{idea}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Account</div>
                    <div className="font-semibold">
                      {selectedCall.account_name || 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-semibold capitalize">{selectedCall.status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Started</div>
                    <div>{formatDate(selectedCall.started_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Meeting type</div>
                    <div>{selectedCall.meeting_type || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Stage</div>
                    <div>{describeStage(selectedCall.opportunity_stage)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Technical win</div>
                    <div>{describeTechnicalWin(selectedCall.technical_win)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div>{formatDuration(selectedCall.duration_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Transcripts</div>
                    <div>{selectedCall.transcriptions.length}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">AE assessment</div>
                    <div>{selectedCall.ae_assessment || '—'}</div>
                  </div>
                </div>

                {selectedCall.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Strengths</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(selectedCall.analysis.strengths || []).length > 0 ? (
                          selectedCall.analysis.strengths.map((item, index) => (
                            <li key={index} className="bg-green-50 border border-green-100 rounded-md px-3 py-2">
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No strengths captured.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(selectedCall.analysis.areas_for_improvement || []).length > 0 ? (
                          selectedCall.analysis.areas_for_improvement.map((item, index) => (
                            <li key={index} className="bg-orange-50 border border-orange-100 rounded-md px-3 py-2">
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No improvements captured.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Coaching Tips</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(selectedCall.analysis.coaching_tips || []).length > 0 ? (
                          selectedCall.analysis.coaching_tips.map((item, index) => (
                            <li key={index} className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No coaching tips captured.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Next Steps</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(selectedCall.analysis.next_steps || []).length > 0 ? (
                          selectedCall.analysis.next_steps.map((item, index) => (
                            <li key={index} className="bg-purple-50 border border-purple-100 rounded-md px-3 py-2">
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No next steps captured.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-lg mb-4">
                    Transcript ({selectedCall.transcriptions.length} lines)
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedCall.transcriptions
                      .filter((t) => t.is_final)
                      .map((transcript) => (
                        <div key={transcript.id} className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{new Date(transcript.timestamp).toLocaleTimeString()}</span>
                            {typeof transcript.confidence === 'number' && (
                              <span>Confidence: {(transcript.confidence * 100).toFixed(0)}%</span>
                            )}
                          </div>
                          <p className="text-gray-900">{transcript.transcript}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
