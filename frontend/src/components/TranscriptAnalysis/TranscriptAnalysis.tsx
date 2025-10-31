'use client';

import { useState } from 'react';

interface AnalysisResult {
  session_id: string;
  call_title?: string;
  account_name?: string;
  account_slug?: string;
  meeting_type?: string;
  opportunity_stage?: string | null;
  opportunity_context?: {
    stage?: string;
    technical_win?: string;
    decision_maker_alignment?: string;
    customer_timeline?: string;
    competitor_position?: string;
    confidence_notes?: string[];
    ae_perspective?: Record<string, unknown>;
    ae_assessment_text?: string;
    [key: string]: unknown;
  };
  ae_perspective?: {
    summary?: string;
    confidence?: number;
    alignment?: string;
    risk_flags?: string[];
  };
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
  deal_confidence: number;
  deal_confidence_raw: number;
  deal_confidence_adjustments?: Record<string, unknown>;
  deal_confidence_reasoning: string;
  upsell_opportunities: string[];
}

export default function TranscriptAnalysis() {
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('');
  const [technicalWin, setTechnicalWin] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [decisionAlignment, setDecisionAlignment] = useState<'unknown' | 'strong' | 'moderate' | 'weak'>('unknown');
  const [timeline, setTimeline] = useState('');
  const [competitorPosition, setCompetitorPosition] = useState<'unknown' | 'leading' | 'neutral' | 'trailing'>('unknown');
  const [aeAssessment, setAeAssessment] = useState('');

  const formatPercent = (value?: number | null) =>
    typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';

  const describeTechnicalWin = (value?: string | null) => {
    if (!value) return 'Unknown';
    const normalized = value.toLowerCase();
    if (normalized.includes('won')) return 'Technical validation complete';
    if (normalized.includes('not')) return 'Technical validation pending';
    return value;
  };

  const describeDecisionAlignment = (value?: string | null) => {
    if (!value || value.toLowerCase() === 'unknown') return 'Unknown';
    if (value.toLowerCase() === 'strong') return 'Strong alignment with decision makers';
    if (value.toLowerCase() === 'moderate') return 'Partial alignment with decision makers';
    if (value.toLowerCase() === 'weak') return 'Limited decision maker alignment';
    return value;
  };

  const describeCompetitor = (value?: string | null) => {
    if (!value || value.toLowerCase() === 'unknown') return 'Competitive status unknown';
    if (value.toLowerCase().includes('leading')) return 'Box is leading the evaluation';
    if (value.toLowerCase().includes('neutral')) return 'Competitive landscape is neutral';
    if (value.toLowerCase().includes('trailing')) return 'Box is trailing competitors';
    return value;
  };

  const describeAeAlignment = (value?: string | null) => {
    if (!value || value.toLowerCase() === 'unknown') return 'AE stance unknown';
    if (value.toLowerCase() === 'supportive' || value.toLowerCase() === 'aligned') {
      return 'AE feels confident about this deal';
    }
    if (value.toLowerCase() === 'neutral') {
      return 'AE is cautiously optimistic';
    }
    if (value.toLowerCase() === 'contradictory' || value.toLowerCase() === 'negative') {
      return 'AE is raising concerns about this deal';
    }
    return value;
  };

  const extractNumeric = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined;

  const analysisAeAssessmentText = analysis?.opportunity_context?.ae_assessment_text;
  const hasAnalysisAeAssessment =
    typeof analysisAeAssessmentText === 'string' && analysisAeAssessmentText.trim().length > 0;
  const analysisAePerspective = hasAnalysisAeAssessment ? analysis?.ae_perspective : undefined;

  const analyzeTranscript = async () => {
    if (!transcript.trim()) {
      setError('Please paste a transcript first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        transcript: transcript.trim(),
      };

      if (stage) {
        payload.opportunity_stage = stage;
      }
      if (technicalWin !== 'unknown') {
        payload.technical_win = technicalWin === 'yes';
      }
      if (decisionAlignment !== 'unknown') {
        payload.decision_maker_alignment = decisionAlignment;
      }
      if (timeline.trim()) {
        payload.customer_timeline = timeline.trim();
      }
      if (competitorPosition !== 'unknown') {
        payload.competitor_position = competitorPosition;
      }
      if (aeAssessment.trim()) {
        payload.ae_assessment = aeAssessment.trim();
      }

      const response = await fetch('http://localhost:8000/api/analyze/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    setStage('');
    setTechnicalWin('unknown');
    setDecisionAlignment('unknown');
    setTimeline('');
    setCompetitorPosition('unknown');
    setAeAssessment('');
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Executive Assessment <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={aeAssessment}
                onChange={(e) => setAeAssessment(e.target.value)}
                placeholder="Add your read on the deal: e.g., champion is excited but procurement is slowing us down..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                We’ll weigh your perspective alongside the transcript and contextual data when computing deal confidence.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                Opportunity context (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Deal stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Auto-detect from transcript</option>
                    <option value="discovery/trial">1. Discovery / Trial</option>
                    <option value="confirming w/ decision makers">2. Confirming w/ Decision Makers</option>
                    <option value="negotiating $$">3. Negotiating $$</option>
                    <option value="finalizing closure">4. Finalizing Closure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Technical validation</label>
                  <select
                    value={technicalWin}
                    onChange={(e) => setTechnicalWin(e.target.value as typeof technicalWin)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="unknown">Not sure yet</option>
                    <option value="yes">Yes — technical win</option>
                    <option value="no">Not yet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Decision-maker alignment</label>
                  <select
                    value={decisionAlignment}
                    onChange={(e) => setDecisionAlignment(e.target.value as typeof decisionAlignment)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="unknown">Auto-detect</option>
                    <option value="strong">Strong</option>
                    <option value="moderate">Moderate</option>
                    <option value="weak">Weak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Competitor position</label>
                  <select
                    value={competitorPosition}
                    onChange={(e) => setCompetitorPosition(e.target.value as typeof competitorPosition)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="unknown">Auto-detect</option>
                    <option value="leading">We’re leading</option>
                    <option value="neutral">Neck and neck</option>
                    <option value="trailing">We’re trailing</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Customer timeline</label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g., Target go-live this quarter, evaluating options for FY26..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                We’ll blend your context with AI-inferred signals to calibrate deal confidence. Leave fields blank if you’d like the AI to infer them.
              </p>
            </div>

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

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-1 text-sm text-gray-700">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Call metadata
                  </h3>
                  {analysis.call_title && (
                    <p>
                      <span className="font-semibold">Title:</span> {analysis.call_title}
                    </p>
                  )}
                  {analysis.account_name && (
                    <p>
                      <span className="font-semibold">Account:</span> {analysis.account_name}
                    </p>
                  )}
                  {analysis.meeting_type && (
                    <p>
                      <span className="font-semibold">Meeting type:</span> {analysis.meeting_type}
                    </p>
                  )}
                  {analysis.opportunity_stage && (
                    <p>
                      <span className="font-semibold">Deal stage:</span> {analysis.opportunity_stage}
                    </p>
                  )}
                  {analysis.opportunity_context?.technical_win && (
                    <p>
                      <span className="font-semibold">Technical win:</span> {describeTechnicalWin(analysis.opportunity_context?.technical_win)}
                    </p>
                  )}
                  {analysis.opportunity_context?.decision_maker_alignment && (
                    <p>
                      <span className="font-semibold">Decision-maker alignment:</span> {describeDecisionAlignment(analysis.opportunity_context?.decision_maker_alignment)}
                    </p>
                  )}
                  {analysis.opportunity_context?.customer_timeline && (
                    <p>
                      <span className="font-semibold">Timeline:</span> {analysis.opportunity_context?.customer_timeline}
                    </p>
                  )}
                  {analysis.opportunity_context?.competitor_position && (
                    <p>
                      <span className="font-semibold">Competitive position:</span> {describeCompetitor(analysis.opportunity_context?.competitor_position)}
                    </p>
                  )}
                <p>
                  <span className="font-semibold">Session ID:</span> {analysis.session_id}
                </p>
              </div>

                {hasAnalysisAeAssessment && (
                  <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-2 text-sm text-emerald-900">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Account Executive Perspective
                    </h3>
                    {analysisAeAssessmentText && (
                      <p>
                        <span className="font-semibold">AE notes:</span> {analysisAeAssessmentText}
                      </p>
                    )}
                    {analysisAePerspective?.summary && (
                      <p>
                        <span className="font-semibold">AI interpretation:</span> {analysisAePerspective.summary}
                      </p>
                    )}
                    {analysisAePerspective && (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          {typeof analysisAePerspective?.confidence === 'number' && (
                            <span className="px-3 py-1 rounded-full bg-white/70 border border-emerald-200 text-xs font-medium">
                              AE confidence {formatPercent(analysisAePerspective.confidence)}
                            </span>
                          )}
                          {analysisAePerspective?.alignment && (
                            <span className="text-xs text-emerald-800">
                              {describeAeAlignment(analysisAePerspective.alignment)}
                            </span>
                          )}
                        </div>
                        {Array.isArray(analysisAePerspective?.risk_flags) &&
                          analysisAePerspective?.risk_flags?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wide">
                              AE risk flags
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                            {analysisAePerspective?.risk_flags?.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                        )}
                      </>
                    )}
                  </div>
                )}

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

                {/* Deal Confidence */}
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-emerald-700">
                      Deal Confidence
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-emerald-800 font-semibold">Final</span>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${analysis.deal_confidence >= 0.7 ? 'bg-green-100 text-green-700' : analysis.deal_confidence >= 0.5 ? 'bg-blue-100 text-blue-700' : analysis.deal_confidence >= 0.3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {formatPercent(analysis.deal_confidence)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-800">
                      <span className="text-xs uppercase tracking-wide">Raw model</span>
                      <span className="px-3 py-1 rounded-full bg-white/80 border border-emerald-200">
                        {formatPercent(analysis.deal_confidence_raw)}
                      </span>
                    </div>
                    {typeof extractNumeric(analysis.deal_confidence_adjustments?.heuristic_score) === 'number' && (
                      <div className="flex items-center gap-2 text-sm text-emerald-800">
                        <span className="text-xs uppercase tracking-wide">Heuristic blend</span>
                        <span className="px-3 py-1 rounded-full bg-white/80 border border-emerald-200">
                          {formatPercent(extractNumeric(analysis.deal_confidence_adjustments?.heuristic_score))}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-emerald-900">{analysis.deal_confidence_reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-900">
                    <p><span className="font-semibold">Stage:</span> {analysis.opportunity_stage || 'Auto-detected'}</p>
                    <p><span className="font-semibold">Technical win:</span> {describeTechnicalWin(analysis.opportunity_context?.technical_win)}</p>
                    <p><span className="font-semibold">Decision-maker alignment:</span> {describeDecisionAlignment(analysis.opportunity_context?.decision_maker_alignment)}</p>
                    <p><span className="font-semibold">Timeline:</span> {analysis.opportunity_context?.customer_timeline || 'Not specified'}</p>
                    <p><span className="font-semibold">Competitive stance:</span> {describeCompetitor(analysis.opportunity_context?.competitor_position)}</p>
                  </div>
                  {Array.isArray(analysis.opportunity_context?.confidence_notes) && analysis.opportunity_context?.confidence_notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-800 mb-1">Confidence signals</h4>
                      <ul className="space-y-1 text-sm text-emerald-900 list-disc list-inside">
                        {analysis.opportunity_context?.confidence_notes?.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.upsell_opportunities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-800 mb-1">Upsell Opportunities</h4>
                      <ul className="space-y-1 text-sm text-emerald-900 list-disc list-inside">
                        {analysis.upsell_opportunities.map((idea, idx) => (
                          <li key={idx}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
