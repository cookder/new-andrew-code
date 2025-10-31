'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardMetrics {
  total_calls: number;
  average_sentiment: number;
  positive_calls: number;
  neutral_calls: number;
  negative_calls: number;
  total_duration_minutes: number;
  calls_this_week: number;
  sentiment_trend: 'improving' | 'declining' | 'stable';
  average_deal_confidence: number;
  high_confidence_calls: number;
}

interface SentimentDataPoint {
  date: string;
  sentiment_score: number;
  session_id: string;
  sentiment_label?: string | null;
  sentiment_explanation?: string | null;
  coaching_tip_count: number;
}

interface TopItem {
  item: string;
  count: number;
}

interface InsightTheme {
  theme: string;
  total_mentions: number;
  representative_examples: string[];
}

interface DashboardData {
  metrics: DashboardMetrics;
  sentiment_over_time: SentimentDataPoint[];
  top_objections: TopItem[];
  top_strengths: TopItem[];
  top_improvements: TopItem[];
  top_upsell_opportunities: TopItem[];
  strength_themes?: InsightTheme[];
  improvement_themes?: InsightTheme[];
  objection_themes?: InsightTheme[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      const response = await fetch(`${API_BASE_URL}/api/dashboard/metrics?days=${days}`);
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

  const strengthThemes = data.strength_themes ?? [];
  const improvementThemes = data.improvement_themes ?? [];
  const objectionThemes = data.objection_themes ?? [];

  const filteredTimeline = data.sentiment_over_time.filter((point) => {
    if (filter === 'positive') return point.sentiment_score >= 0.7;
    if (filter === 'neutral') return point.sentiment_score >= 0.4 && point.sentiment_score < 0.7;
    if (filter === 'negative') return point.sentiment_score < 0.4;
    return true;
  });

  const primaryFocus =
    improvementThemes[0]?.theme || data.top_improvements[0]?.item;
  const highlightStrength =
    strengthThemes[0]?.theme || data.top_strengths[0]?.item;
  const topObjectionTheme =
    objectionThemes[0]?.theme || data.top_objections[0]?.item;
  const coachingFocus = primaryFocus || topObjectionTheme;
  const topUpsellIdea = data.top_upsell_opportunities[0]?.item;
  const averageDealConfidencePercent = Math.round((metrics.average_deal_confidence || 0) * 100);

  const getTrendIcon = () => {
    if (metrics.sentiment_trend === 'improving') {
      return <span className="text-green-600">↗ Improving</span>;
    } else if (metrics.sentiment_trend === 'declining') {
      return <span className="text-red-600">↘ Declining</span>;
    }
    return <span className="text-gray-600">→ Stable</span>;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          {/* Deal Confidence */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Deal Confidence</h3>
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4m-4-9v5m0 8v5m6.364-15.364l-3.536 3.536M6.636 17.364l-3.536 3.536m0-15.364l3.536 3.536M17.364 17.364l3.536 3.536" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageDealConfidencePercent}%</p>
            <p className="text-sm text-gray-500 mt-1">{metrics.high_confidence_calls} high-confidence deals</p>
          </div>
        </div>

        {/* Call Distribution & Highlights */}
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Strength Themes</h3>
            <div className="space-y-4">
              {strengthThemes.length > 0 ? (
                strengthThemes.map((theme, idx) => (
                  <div key={idx} className="border border-green-100 rounded-lg p-3 bg-green-50/40">
                    <div className="flex items-center justify-between text-sm text-green-700 mb-1">
                      <span className="font-semibold">{theme.theme}</span>
                      <span>{theme.total_mentions} mentions</span>
                    </div>
                    {theme.representative_examples.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {theme.representative_examples.map((example, exIdx) => (
                          <li key={exIdx} className="flex gap-2">
                            <span>•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : data.top_strengths.length > 0 ? (
                data.top_strengths.map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{strength.item}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Analyze a transcript to surface strengths.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Priorities</h3>
            <div className="space-y-4">
              {improvementThemes.length > 0 ? (
                improvementThemes.map((theme, idx) => (
                  <div key={idx} className="border border-blue-100 rounded-lg p-3 bg-blue-50/40">
                    <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                      <span className="font-semibold">{theme.theme}</span>
                      <span>{theme.total_mentions} mentions</span>
                    </div>
                    {theme.representative_examples.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {theme.representative_examples.map((example, exIdx) => (
                          <li key={exIdx} className="flex gap-2">
                            <span>•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : data.top_improvements.length > 0 ? (
                data.top_improvements.slice(0, 5).map((imp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{imp.item}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Analyze a transcript to capture focus areas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment Over Time & Objections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sentiment Trend</h3>
              <div className="flex gap-2 text-sm">
                {(['all', 'positive', 'neutral', 'negative'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    className={`px-3 py-1 rounded-full border ${
                      filter === option
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              {filteredTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                      domain={[0, 1]}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Sentiment']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="sentiment_score"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <p>No data yet - analyze some calls to see trends!</p>
                </div>
              )}
            </div>
            {filteredTimeline.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Recent Insights</h4>
                {filteredTimeline.slice(-3).reverse().map((point) => (
                  <div key={point.session_id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>{new Date(point.date).toLocaleDateString()}</span>
                      <span className="font-semibold text-blue-600">
                        {(point.sentiment_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {point.sentiment_explanation && (
                      <p className="text-sm text-gray-700">{point.sentiment_explanation}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Session {point.session_id.slice(0, 8)} • {point.coaching_tip_count} coaching tips
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Patterns</h3>
            <div className="space-y-4">
              {objectionThemes.length > 0 ? (
                objectionThemes.map((theme, idx) => (
                  <div key={idx} className="border border-orange-100 rounded-lg p-3 bg-orange-50/40">
                    <div className="flex items-center justify-between text-sm text-orange-700 mb-1">
                      <span className="font-semibold">{theme.theme}</span>
                      <span>{theme.total_mentions} mentions</span>
                    </div>
                    {theme.representative_examples.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {theme.representative_examples.map((example, exIdx) => (
                          <li key={exIdx} className="flex gap-2">
                            <span>•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : data.top_objections.length > 0 ? (
                data.top_objections.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{obj.item}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No objections detected yet.</p>
              )}
            </div>
            <div className="mt-6 bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-orange-800">
              {topObjectionTheme
                ? `Most common objection: ${topObjectionTheme}`
                : 'Run more analyses to uncover objection trends.'}
            </div>
            {data.top_upsell_opportunities.length > 0 && (
              <div className="mt-4 border-t border-orange-100 pt-4">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Top Upsell Plays</h4>
                <ul className="space-y-2 text-sm text-orange-700">
                  {data.top_upsell_opportunities.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>{item.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>📈</span>
              <span>
                Your win rate is {metrics.total_calls > 0 ? Math.round((metrics.positive_calls / metrics.total_calls) * 100) : 0}%.
                Double down on strengths like{' '}
                {highlightStrength ? <strong>{highlightStrength}</strong> : 'the themes your best calls highlight'}.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🎯</span>
              <span>
                Focus coaching on{' '}
                {coachingFocus ? <strong>{coachingFocus}</strong> : 'the improvement themes emerging across calls'}.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚀</span>
              <span>
                Deal confidence averages {averageDealConfidencePercent}% with{' '}
                {metrics.high_confidence_calls} high-probability calls. Prep next steps to keep the momentum.
              </span>
            </li>
            {topUpsellIdea && (
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>
                  Lead with this upsell idea: <strong>{topUpsellIdea}</strong>
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span>📊</span>
              <span>Track your sentiment trend – aim for consistent improvement week over week.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
