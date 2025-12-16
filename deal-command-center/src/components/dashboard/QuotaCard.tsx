import { Target, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { QuotaProgress } from '../ui/ProgressBar';
import { useQuotaAttainment } from '../../hooks/useQuotaAttainment';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function QuotaCard() {
  const quota = useQuotaAttainment();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900">{currentMonth} Quota</h3>
        </div>
        {quota.target > 0 && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              quota.onTrack
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            )}
          >
            {quota.onTrack ? 'On Track' : 'Behind Pace'}
          </span>
        )}
      </div>

      {quota.target > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(quota.closedWon, true)}
              </p>
              <p className="text-xs text-gray-500">Closed Won</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(quota.target, true)}
              </p>
              <p className="text-xs text-gray-500">Target</p>
            </div>
          </div>

          <QuotaProgress closedWon={quota.closedWon} target={quota.target} />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{quota.daysRemaining} days left</span>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">
                {formatCurrency(quota.remaining, true)}
              </span>{' '}
              to go
            </div>
          </div>

          {quota.runRate > 0 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Need {formatCurrency(quota.runRate, true)}/day to hit quota
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-2">No quota set for this month</p>
          <p className="text-xs text-gray-400">Go to Settings to set your quota target</p>
        </div>
      )}
    </Card>
  );
}
