import { useNavigate } from 'react-router-dom';
import { Calendar, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import type { Deal } from '../../types';
import { Card } from '../ui/Card';
import { StageBadge, Badge } from '../ui/Badge';
import { formatCurrency, formatRelativeDate, cn } from '../../lib/utils';
import { calculateDaysInStage } from '../../lib/calculations';
import { DEAL_TYPE_LABELS, STUCK_DEAL_DAYS } from '../../lib/constants';

interface DealCardProps {
  deal: Deal;
  isStuck?: boolean;
  showChevron?: boolean;
}

export function DealCard({ deal, isStuck = false, showChevron = true }: DealCardProps) {
  const navigate = useNavigate();
  const daysInStage = calculateDaysInStage(deal);

  return (
    <Card
      onClick={() => navigate(`/deals/${deal.id}`)}
      hoverable
      className={cn(
        isStuck && 'border-l-4 border-l-warning'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {deal.companyName}
            </h3>
            {isStuck && (
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 truncate mb-2">{deal.dealName}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <StageBadge stage={deal.stage} />
            <Badge variant="default" size="sm">
              {DEAL_TYPE_LABELS[deal.dealType]}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 ml-4">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(deal.value, true)}
          </span>
          <span className="text-xs text-gray-500">
            {deal.probability}% prob
          </span>
          {showChevron && (
            <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Close: {formatRelativeDate(deal.expectedCloseDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            daysInStage >= STUCK_DEAL_DAYS ? 'text-warning font-medium' : ''
          )}>
            {daysInStage}d in stage
          </span>
        </div>
        {deal.userCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{deal.userCount}</span>
          </div>
        )}
      </div>

      {deal.nextStep && (
        <div className="mt-2 text-xs">
          <span className="text-gray-400">Next: </span>
          <span className="text-gray-600">{deal.nextStep}</span>
        </div>
      )}
    </Card>
  );
}

interface DealCardCompactProps {
  deal: Deal;
  onClick?: () => void;
}

export function DealCardCompact({ deal, onClick }: DealCardCompactProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/deals/${deal.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{deal.companyName}</p>
          <p className="text-sm text-gray-500">{formatCurrency(deal.value, true)}</p>
        </div>
        <StageBadge stage={deal.stage} />
      </div>
    </button>
  );
}
