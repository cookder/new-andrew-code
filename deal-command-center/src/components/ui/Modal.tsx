import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col',
          sizeClasses[size]
        )}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
