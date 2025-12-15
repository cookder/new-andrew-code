import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const heightClasses = {
    auto: 'max-h-[85vh]',
    half: 'h-[50vh]',
    full: 'h-[95vh]',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          heightClasses[height],
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe-bottom">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    icon?: React.ReactNode;
  }>;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  actions,
}: ActionSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom">
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          {title && (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500 text-center">{title}</p>
            </div>
          )}
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={cn(
                'w-full px-4 py-3 text-center font-medium',
                'hover:bg-gray-50 active:bg-gray-100 transition-colors',
                'border-b border-gray-100 last:border-0',
                'flex items-center justify-center gap-2',
                action.variant === 'danger' ? 'text-danger' : 'text-primary-500'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-3 bg-white rounded-2xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
