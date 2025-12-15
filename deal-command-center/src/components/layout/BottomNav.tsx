import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calculator, BookOpen, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/deals', label: 'Deals', icon: Briefcase },
  { path: '/calculators', label: 'Calc', icon: Calculator },
  { path: '/reference', label: 'Intel', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors active:scale-95 transform',
                active ? 'text-primary-500' : 'text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
