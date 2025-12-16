import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface QuotaProgressProps {
  closedWon: number;
  target: number;
  className?: string;
}

export function QuotaProgress({ closedWon, target, className }: QuotaProgressProps) {
  const percentage = target > 0 ? (closedWon / target) * 100 : 0;
  const color = percentage >= 100 ? 'success' : percentage >= 75 ? 'primary' : percentage >= 50 ? 'warning' : 'danger';

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-900">{Math.round(percentage)}% to quota</span>
      </div>
      <ProgressBar value={percentage} color={color} size="lg" />
    </div>
  );
}
