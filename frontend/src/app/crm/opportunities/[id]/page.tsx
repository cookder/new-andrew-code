'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface OpportunityData {
  id: string;
  name: string;
  currentStage: string;
  overallHealthScore: number;
  amount: number | null;
  expectedCloseDate: string | null;
  stageHistory: Array<{ stage: string; timestamp: string }>;
  lastAnalyzed: string | null;
  account: {
    id: string;
    name: string;
    industry: string | null;
  };
  primaryContact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadDate: string;
    processingStatus: string;
  }>;
  meddpiccAnalysis: any;
  bantAnalysis: any;
  aiInsights: any;
  analysisSnapshots: any[];
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      fetchOpportunity(params.id as string);
    }
  }, [params.id]);

  const fetchOpportunity = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/opportunities/${id}`);
      const data = await response.json();
      setOpportunity(data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score > 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading opportunity...</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">Opportunity not found</div>
          <Link href="/crm">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysSinceLastUpdate = opportunity.lastAnalyzed
    ? Math.floor((Date.now() - new Date(opportunity.lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/crm">
              <Button variant="ghost" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{opportunity.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{opportunity.account.name}</span>
                {opportunity.account.industry && (
                  <>
                    <span>•</span>
                    <span>{opportunity.account.industry}</span>
                  </>
                )}
                {opportunity.primaryContact && (
                  <>
                    <span>•</span>
                    <span>
                      {opportunity.primaryContact.firstName} {opportunity.primaryContact.lastName}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Health Score</div>
                <div className={`text-4xl font-bold ${getHealthScoreColor(opportunity.overallHealthScore)}`}>
                  {opportunity.overallHealthScore}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {['overview', 'meddpicc-bant', 'insights', 'documents', 'contacts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' / ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab opportunity={opportunity} />}
        {activeTab === 'meddpicc-bant' && <MEDDPICCBantTab opportunity={opportunity} />}
        {activeTab === 'insights' && <InsightsTab opportunity={opportunity} />}
        {activeTab === 'documents' && <DocumentsTab opportunity={opportunity} onUpload={() => fetchOpportunity(params.id as string)} />}
        {activeTab === 'contacts' && <ContactsTab opportunity={opportunity} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ opportunity }: { opportunity: OpportunityData }) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Current Stage</div>
            <div className="text-2xl font-bold text-gray-900">{opportunity.currentStage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Amount</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(opportunity.amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Expected Close</div>
            <div className="text-lg font-semibold text-gray-900">{formatDate(opportunity.expectedCloseDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Documents</div>
            <div className="text-2xl font-bold text-gray-900">{opportunity.documents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Recommendation */}
      {opportunity.aiInsights?.stageRecommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Stage Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">
                  Consider moving to "{opportunity.aiInsights.stageRecommendation}"
                </div>
                <div className="text-sm text-blue-700">
                  {opportunity.aiInsights.stageRecommendationRationale}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Confidence: {opportunity.aiInsights.stageRecommendationConfidence}%
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="primary">Accept</Button>
                <Button size="sm" variant="outline">Dismiss</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage History */}
      <Card>
        <CardHeader>
          <CardTitle>Stage History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunity.stageHistory.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-sm">
                <div className="w-32 text-gray-500">
                  {new Date(item.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="font-medium text-gray-900">{item.stage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// MEDDPICC/BANT Tab Component
function MEDDPICCBantTab({ opportunity }: { opportunity: OpportunityData }) {
  const meddpicc = opportunity.meddpiccAnalysis;
  const bant = opportunity.bantAnalysis;

  const renderElement = (label: string, data: any) => {
    if (!data) return null;

    const getConfidenceColor = (confidence: number) => {
      if (confidence > 70) return 'bg-green-100 text-green-800';
      if (confidence >= 40) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="font-semibold text-gray-900">{label}</div>
            <Badge className={getConfidenceColor(data.confidence)}>
              {data.confidence}% confidence
            </Badge>
          </div>
          <div className="text-sm text-gray-700 mb-3">
            {data.value || 'No information available'}
          </div>
          {data.sources && data.sources.length > 0 && (
            <div className="text-xs text-gray-500">
              Sources: {JSON.parse(data.sources).join(', ')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* MEDDPICC */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">MEDDPICC</h2>
        {meddpicc ? (
          <>
            {renderElement('Metrics', {
              value: meddpicc.metricsValue,
              confidence: meddpicc.metricsConfidence,
              sources: meddpicc.metricsSources,
            })}
            {renderElement('Economic Buyer', {
              value: meddpicc.economicBuyerValue,
              confidence: meddpicc.economicBuyerConfidence,
              sources: meddpicc.economicBuyerSources,
            })}
            {renderElement('Decision Criteria', {
              value: meddpicc.decisionCriteriaValue,
              confidence: meddpicc.decisionCriteriaConfidence,
              sources: meddpicc.decisionCriteriaSources,
            })}
            {renderElement('Decision Process', {
              value: meddpicc.decisionProcessValue,
              confidence: meddpicc.decisionProcessConfidence,
              sources: meddpicc.decisionProcessSources,
            })}
            {renderElement('Pain', {
              value: meddpicc.painValue,
              confidence: meddpicc.painConfidence,
              sources: meddpicc.painSources,
            })}
            {renderElement('Champion', {
              value: meddpicc.championValue,
              confidence: meddpicc.championConfidence,
              sources: meddpicc.championSources,
            })}
            {renderElement('Competition', {
              value: meddpicc.competitionValue,
              confidence: meddpicc.competitionConfidence,
              sources: meddpicc.competitionSources,
            })}
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No MEDDPICC analysis available. Upload documents to generate analysis.
          </div>
        )}
      </div>

      {/* BANT */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">BANT</h2>
        {bant ? (
          <>
            {renderElement('Budget', {
              value: bant.budgetValue,
              confidence: bant.budgetConfidence,
              sources: bant.budgetSources,
            })}
            {renderElement('Authority', {
              value: bant.authorityValue,
              confidence: bant.authorityConfidence,
              sources: bant.authoritySources,
            })}
            {renderElement('Need', {
              value: bant.needValue,
              confidence: bant.needConfidence,
              sources: bant.needSources,
            })}
            {renderElement('Timeline', {
              value: bant.timelineValue,
              confidence: bant.timelineConfidence,
              sources: bant.timelineSources,
            })}
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No BANT analysis available. Upload documents to generate analysis.
          </div>
        )}
      </div>
    </div>
  );
}

// Insights Tab Component
function InsightsTab({ opportunity }: { opportunity: OpportunityData }) {
  const insights = opportunity.aiInsights;

  if (!insights) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No AI insights available yet.</div>
        <div className="text-sm text-gray-400">Upload documents to generate insights.</div>
      </div>
    );
  }

  const redFlags = insights.redFlags || [];
  const nextActions = insights.nextActions || [];

  const getSeverityColor = (severity: string) => {
    if (severity === 'High') return 'danger';
    if (severity === 'Medium') return 'warning';
    return 'secondary';
  };

  return (
    <div className="space-y-8">
      {/* Red Flags */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Red Flags & Risks</h2>
        {redFlags.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-green-600 text-sm">No critical red flags identified</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {redFlags.map((flag: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getSeverityColor(flag.severity) as any}>
                      {flag.severity} Severity
                    </Badge>
                    <span className="text-xs text-gray-500">{flag.confidence}% confidence</span>
                  </div>
                  <div className="font-semibold text-gray-900 mb-2">{flag.description}</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {flag.evidence}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Next Best Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Best Actions</h2>
        {nextActions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-gray-500 text-sm">No actions recommended yet</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {nextActions.map((action: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      action.priority === 1 ? 'bg-red-100 text-red-700' :
                      action.priority === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    } font-bold text-sm flex-shrink-0`}>
                      {action.priority}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">{action.action}</div>
                      <div className="text-sm text-gray-600 mb-2">{action.rationale}</div>
                      <div className="text-xs text-gray-500">Confidence: {action.confidence}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ opportunity, onUpload }: { opportunity: OpportunityData; onUpload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully uploaded ${result.documentsUploaded} document(s). Health Score: ${result.healthScore}`);
        setSelectedFiles(null);
        onUpload();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept=".txt,.pdf"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="mb-4"
            />
            <div className="text-sm text-gray-600 mb-4">
              Drag and drop files here, or click to browse
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Accepted formats: TXT, PDF (up to 10 files at once)
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mb-4 text-sm text-gray-700">
                {selectedFiles.length} file(s) selected
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFiles || uploading}
              variant="primary"
            >
              {uploading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents ({opportunity.documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.documents.length === 0 ? (
            <div className="text-gray-500 text-sm">No documents uploaded yet</div>
          ) : (
            <div className="space-y-2">
              {opportunity.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{doc.fileName}</div>
                    <div className="text-xs text-gray-500">
                      {doc.documentType} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={
                    doc.processingStatus === 'Completed' ? 'success' :
                    doc.processingStatus === 'Processing' ? 'warning' :
                    doc.processingStatus === 'Error' ? 'danger' :
                    'secondary'
                  }>
                    {doc.processingStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Contacts Tab Component
function ContactsTab({ opportunity }: { opportunity: OpportunityData }) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Account & Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Account</div>
              <div className="text-lg font-semibold text-gray-900">{opportunity.account.name}</div>
              {opportunity.account.industry && (
                <div className="text-sm text-gray-600">{opportunity.account.industry}</div>
              )}
            </div>
            {opportunity.primaryContact && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Primary Contact</div>
                <div className="text-lg font-semibold text-gray-900">
                  {opportunity.primaryContact.firstName} {opportunity.primaryContact.lastName}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
