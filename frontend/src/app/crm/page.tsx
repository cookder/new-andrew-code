'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Opportunity {
  id: string;
  name: string;
  currentStage: string;
  overallHealthScore: number;
  amount: number | null;
  expectedCloseDate: string | null;
  updatedAt: string;
  account: {
    id: string;
    name: string;
  };
  documents: any[];
}

export default function CRMDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    stage: '',
    healthScore: '',
  });

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/opportunities');
      const data = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score > 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const getHealthScoreLabel = (score: number): string => {
    if (score > 75) return 'Healthy';
    if (score >= 50) return 'At Risk';
    return 'Critical';
  };

  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      'Discovery': 'bg-blue-500',
      'Demo': 'bg-purple-500',
      'Validating Business Case': 'bg-yellow-500',
      'Negotiating $': 'bg-orange-500',
      'Finalizing Closure': 'bg-green-500',
      'Closed Won': 'bg-emerald-600',
      'Closed Lost': 'bg-red-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter.stage && opp.currentStage !== filter.stage) return false;
    if (filter.healthScore === 'healthy' && opp.overallHealthScore <= 75) return false;
    if (filter.healthScore === 'at-risk' && (opp.overallHealthScore < 50 || opp.overallHealthScore > 75)) return false;
    if (filter.healthScore === 'critical' && opp.overallHealthScore >= 50) return false;
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Intelligence</h1>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered CRM with MEDDPICC/BANT analysis
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/crm/accounts">
                <Button variant="outline">Manage Accounts</Button>
              </Link>
              <Link href="/crm/opportunities/new">
                <Button variant="primary">+ New Opportunity</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Stage:</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                value={filter.stage}
                onChange={(e) => setFilter({ ...filter, stage: e.target.value })}
              >
                <option value="">All Stages</option>
                <option value="Discovery">Discovery</option>
                <option value="Demo">Demo</option>
                <option value="Validating Business Case">Validating Business Case</option>
                <option value="Negotiating $">Negotiating $</option>
                <option value="Finalizing Closure">Finalizing Closure</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Health:</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                value={filter.healthScore}
                onChange={(e) => setFilter({ ...filter, healthScore: e.target.value })}
              >
                <option value="">All Scores</option>
                <option value="healthy">Healthy (75+)</option>
                <option value="at-risk">At Risk (50-75)</option>
                <option value="critical">Critical (&lt;50)</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              {filteredOpportunities.length} opportunities
            </div>
          </div>
        </Card>
      </div>

      {/* Opportunities List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading opportunities...</div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">No opportunities found</div>
            <Link href="/crm/opportunities/new">
              <Button variant="primary">Create Your First Opportunity</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opp) => (
              <Link key={opp.id} href={`/crm/opportunities/${opp.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {opp.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStageColor(opp.currentStage)}`} />
                          <span className="text-sm text-gray-600">{opp.currentStage}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {opp.account.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-8 ml-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(opp.amount)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Close Date</div>
                        <div className="text-sm text-gray-900">
                          {formatDate(opp.expectedCloseDate)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Documents</div>
                        <div className="text-sm text-gray-900">
                          {opp.documents.length}
                        </div>
                      </div>

                      <div className="text-right min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">Health Score</div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-2xl font-bold text-gray-900">
                            {opp.overallHealthScore}
                          </span>
                          <Badge variant={getHealthScoreColor(opp.overallHealthScore)}>
                            {getHealthScoreLabel(opp.overallHealthScore)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
