import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-surface-200 text-surface-700',
        brand:   'bg-brand-100 text-brand-700 ring-1 ring-brand-300/60',
        success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/60',
        warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300/60',
        danger:  'bg-red-100 text-red-700 ring-1 ring-red-300/60',
        info:    'bg-sky-100 text-sky-700 ring-1 ring-sky-300/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))}>{children}</span>;
}
