import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { useStuckDealsWithInfo } from '../../hooks/useStuckDeals';
import { formatCurrency } from '../../lib/utils';
import { STAGE_LABELS } from '../../lib/constants';

export function StuckDealsAlert() {
  const navigate = useNavigate();
  const stuckDeals = useStuckDealsWithInfo();

  if (stuckDeals.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-warning">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-gray-900">
          {stuckDeals.length} Stuck Deal{stuckDeals.length > 1 ? 's' : ''}
        </h3>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        No activity in 7+ days. Time to re-engage!
      </p>

      <div className="space-y-2">
        {stuckDeals.slice(0, 3).map(({ deal, daysStuck }) => (
          <button
            key={deal.id}
            onClick={() => navigate(`/deals/${deal.id}`)}
            className="w-full flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {deal.companyName}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{STAGE_LABELS[deal.stage]}</span>
                <span>•</span>
                <span className="text-warning font-medium">
                  {daysStuck} days stuck
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(deal.value, true)}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {stuckDeals.length > 3 && (
        <button
          onClick={() => navigate('/deals?filter=stuck')}
          className="w-full mt-2 text-sm text-primary-500 text-center py-2"
        >
          View all {stuckDeals.length} stuck deals
        </button>
      )}
    </Card>
  );
}
