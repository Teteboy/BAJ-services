import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', variant = 'light' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full rounded-2xl shadow-card-hover animate-slide-up',
          isDark
            ? 'border border-admin-border bg-admin-card'
            : 'border border-surface-300 bg-white',
          sizeClasses[size]
        )}
      >
        <div className={cn(
          'flex items-center justify-between border-b px-6 py-4',
          isDark ? 'border-admin-border' : 'border-surface-200'
        )}>
          <h2 className={cn('text-sm font-semibold', isDark ? 'text-admin-text' : 'text-surface-900')}>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className={cn('h-4 w-4', isDark ? 'text-admin-textSub' : 'text-surface-500')} />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className={cn(
            'flex items-center justify-end gap-3 border-t px-6 py-4',
            isDark ? 'border-admin-border' : 'border-surface-200'
          )}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
