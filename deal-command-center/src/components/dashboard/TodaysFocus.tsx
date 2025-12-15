import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { useActiveDeals } from '../../hooks/useDeals';
import { formatCurrency, formatRelativeDate, daysFromNow } from '../../lib/utils';
import type { Deal } from '../../types';

export function TodaysFocus() {
  const activeDeals = useActiveDeals();

  // Get deals with next steps due today or overdue
  const urgentDeals = activeDeals.filter((deal) => {
    if (!deal.nextStepDueDate) return false;
    const daysUntil = daysFromNow(deal.nextStepDueDate);
    return daysUntil <= 0;
  });

  // Get deals closing this week
  const closingThisWeek = activeDeals.filter((deal) => {
    const daysUntil = daysFromNow(deal.expectedCloseDate);
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const hasItems = urgentDeals.length > 0 || closingThisWeek.length > 0;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-gray-900">Today's Focus</h3>
      </div>

      {!hasItems ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No urgent items today</p>
          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {urgentDeals.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <AlertCircle className="w-4 h-4 text-danger" />
                <span className="text-sm font-medium text-danger">
                  Overdue Next Steps
                </span>
              </div>
              <div className="space-y-2">
                {urgentDeals.slice(0, 3).map((deal) => (
                  <FocusItem key={deal.id} deal={deal} type="overdue" />
                ))}
              </div>
            </div>
          )}

          {closingThisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Calendar className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Closing This Week
                </span>
              </div>
              <div className="space-y-2">
                {closingThisWeek.slice(0, 3).map((deal) => (
                  <FocusItem key={deal.id} deal={deal} type="closing" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface FocusItemProps {
  deal: Deal;
  type: 'overdue' | 'closing';
}

function FocusItem({ deal, type }: FocusItemProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/deals/${deal.id}`)}
      className="w-full flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {deal.companyName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {type === 'overdue' ? deal.nextStep : `Closes ${formatRelativeDate(deal.expectedCloseDate)}`}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-sm font-medium text-gray-700">
          {formatCurrency(deal.value, true)}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );
}
