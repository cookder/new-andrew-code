import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { usePipelineMetrics } from '../../hooks/usePipelineMetrics';
import { useQuotaAttainment } from '../../hooks/useQuotaAttainment';
import { formatCurrency } from '../../lib/utils';
import { STAGE_LABELS, ACTIVE_STAGES, PIPELINE_COVERAGE_TARGET } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function PipelineSummary() {
  const navigate = useNavigate();
  const metrics = usePipelineMetrics();
  const quota = useQuotaAttainment();

  const coveragePercentage = Math.min((quota.coverage / PIPELINE_COVERAGE_TARGET) * 100, 100);
  const coverageColor =
    quota.coverage >= PIPELINE_COVERAGE_TARGET
      ? 'success'
      : quota.coverage >= 2
      ? 'warning'
      : 'danger';

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900">Pipeline</h3>
        </div>
        <button
          onClick={() => navigate('/deals')}
          className="text-sm text-primary-500 flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.totalPipeline, true)}
          </p>
          <p className="text-xs text-gray-500">Total Pipeline</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.weightedPipeline, true)}
          </p>
          <p className="text-xs text-gray-500">Weighted</p>
        </div>
      </div>

      {quota.target > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Pipeline Coverage</span>
            <span className={cn(
              'font-medium',
              quota.coverage >= PIPELINE_COVERAGE_TARGET ? 'text-green-600' : 'text-yellow-600'
            )}>
              {quota.coverage.toFixed(1)}x
            </span>
          </div>
          <ProgressBar
            value={coveragePercentage}
            color={coverageColor}
            size="sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Target: {PIPELINE_COVERAGE_TARGET}x coverage
          </p>
        </div>
      )}

      <div className="space-y-2">
        {ACTIVE_STAGES.map((stage) => {
          const count = metrics.dealsByStage[stage];
          const value = metrics.valueByStage[stage];

          if (count === 0) return null;

          return (
            <button
              key={stage}
              onClick={() => navigate(`/deals?stage=${stage}`)}
              className="w-full flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-sm text-gray-700">{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-gray-400">({count})</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(value, true)}
              </span>
            </button>
          );
        })}
      </div>

      {metrics.dealCount === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No active deals</p>
          <button
            onClick={() => navigate('/deals')}
            className="text-primary-500 text-sm mt-1"
          >
            Add your first deal
          </button>
        </div>
      )}
    </Card>
  );
}
