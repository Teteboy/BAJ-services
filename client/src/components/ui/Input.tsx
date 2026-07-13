import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'light' | 'dark';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, variant = 'light', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className={cn(
            'mb-1.5 block text-xs font-semibold uppercase tracking-wide',
            variant === 'dark' ? 'text-admin-textMuted' : 'text-surface-600'
          )}>
            {label}
            {props.required ? <span className={variant === 'dark' ? 'ml-1 text-fire-400' : 'ml-1 text-brand-500'}>*</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'dark'
              ? 'border-admin-borderLight bg-admin-bg text-admin-text placeholder:text-admin-textSub focus:border-fire-500 focus:ring-fire-500/30'
              : 'border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:ring-brand-500/30',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-400/20',
            className
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
