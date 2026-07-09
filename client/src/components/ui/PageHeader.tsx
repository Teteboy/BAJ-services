import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-start justify-between gap-4 border-b border-surface-200 pb-5', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-surface-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
