import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
  };
  subtitle?: string;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
  subtitle,
  className,
}: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white border-b border-gray-100',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-[48px]">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Center section */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 min-w-[48px] justify-end">
          {rightAction && (
            <button
              onClick={rightAction.onClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={rightAction.label}
            >
              {rightAction.icon}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

interface SimpleHeaderProps {
  title: string;
  className?: string;
}

export function SimpleHeader({ title, className }: SimpleHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white border-b border-gray-100',
        className
      )}
    >
      <div className="flex items-center h-14 px-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}
