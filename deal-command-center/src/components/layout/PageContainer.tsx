import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  noBottomPadding?: boolean;
}

export function PageContainer({
  children,
  className,
  noPadding = false,
  noBottomPadding = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto bg-gray-50',
        !noPadding && 'px-4 pt-4',
        !noBottomPadding && 'pb-20', // Space for bottom nav
        className
      )}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Section({ title, children, className, action }: SectionProps) {
  return (
    <section className={cn('mb-6', className)}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
