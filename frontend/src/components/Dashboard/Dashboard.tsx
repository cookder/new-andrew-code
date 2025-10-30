'use client';

import { useState, useEffect } from 'react';

interface DashboardMetrics {
  total_calls: number;
  average_sentiment: number;
  positive_calls: number;
  neutral_calls: number;
  negative_calls: number;
  total_duration_minutes: number;
  calls_this_week: number;
  sentiment_trend: 'improving' | 'declining' | 'stable';
}

interface SentimentDataPoint {
  date: string;
  sentiment_score: number;
  session_id: string;
}

interface TopItem {
  item: string;
  count: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  sentiment_over_time: SentimentDataPoint[];
  top_objections: TopItem[];
  top_strengths: TopItem[];
  top_improvements: TopItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadDashboard();
  }, [days]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/dashboard/metrics?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { metrics } = data;

  const getTrendIcon = () => {
    if (metrics.sentiment_trend === 'improving') {
      return <span className="text-green-600">↗ Improving</span>;
    } else if (metrics.sentiment_trend === 'declining') {
      return <span className="text-red-600">↘ Declining</span>;
    }
    return <span className="text-gray-600">→ Stable</span>;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return 'Positive';
    if (score >= 0.4) return 'Neutral';
    return 'Needs Work';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
          <p className="text-gray-600">Track your sales call performance and improvement over time</p>
        </div>

        {/* Time Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setDays(7)}
            className={`px-4 py-2 rounded-lg font-medium ${
              days === 7 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-4 py-2 rounded-lg font-medium ${
              days === 30 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDays(90)}
            className={`px-4 py-2 rounded-lg font-medium ${
              days === 90 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 90 Days
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Calls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.total_calls}</p>
            <p className="text-sm text-gray-500 mt-1">{metrics.calls_this_week} this week</p>
          </div>

          {/* Average Sentiment */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Sentiment</h3>
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{Math.round(metrics.average_sentiment * 100)}%</p>
            <p className="text-sm mt-1">{getTrendIcon()}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Win Rate</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.total_calls > 0 ? Math.round((metrics.positive_calls / metrics.total_calls) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">{metrics.positive_calls} positive calls</p>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Time</h3>
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{Math.round(metrics.total_duration_minutes)}</p>
            <p className="text-sm text-gray-500 mt-1">minutes analyzed</p>
          </div>
        </div>

        {/* Call Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700 font-medium">Positive</span>
                  <span className="text-gray-600">{metrics.positive_calls}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${metrics.total_calls > 0 ? (metrics.positive_calls / metrics.total_calls) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-700 font-medium">Neutral</span>
                  <span className="text-gray-600">{metrics.neutral_calls}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${metrics.total_calls > 0 ? (metrics.neutral_calls / metrics.total_calls) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-700 font-medium">Needs Work</span>
                  <span className="text-gray-600">{metrics.negative_calls}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${metrics.total_calls > 0 ? (metrics.negative_calls / metrics.total_calls) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Objections */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Objections</h3>
            <div className="space-y-3">
              {data.top_objections.length > 0 ? (
                data.top_objections.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{obj.item.slice(0, 80)}...</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No objections detected yet</p>
              )}
            </div>
          </div>

          {/* Top Improvements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h3>
            <div className="space-y-3">
              {data.top_improvements.length > 0 ? (
                data.top_improvements.slice(0, 3).map((imp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <p className="text-sm text-gray-700 flex-1">{imp.item}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Analyze calls to see improvement areas</p>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment Over Time Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sentiment Trend</h3>
          <div className="h-64 flex items-end gap-2">
            {data.sentiment_over_time.length > 0 ? (
              data.sentiment_over_time.map((point, idx) => {
                const height = point.sentiment_score * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full group">
                      <div
                        className={`w-full ${getSentimentColor(point.sentiment_score)} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                        style={{ height: `${height * 2}px` }}
                        title={`${point.date}: ${Math.round(point.sentiment_score * 100)}%`}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        {point.date}<br/>{Math.round(point.sentiment_score * 100)}%
                      </div>
                    </div>
                    {idx % Math.ceil(data.sentiment_over_time.length / 7) === 0 && (
                      <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-8">
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p>No data yet - analyze some calls to see trends!</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Positive (≥70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Neutral (40-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Needs Work (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>📈</span>
              <span>Your win rate is {metrics.total_calls > 0 ? Math.round((metrics.positive_calls / metrics.total_calls) * 100) : 0}%. Analyze your top-performing calls to identify what works!</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🎯</span>
              <span>Focus on addressing the top objections you're seeing across calls.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>📊</span>
              <span>Track your sentiment trend - aim for consistent improvement week over week.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
