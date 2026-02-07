import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data available',
  message = 'Run the Planning Engine to generate insights.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <Sparkles className="h-6 w-6 text-accent" />}
      </div>
      <h3 className="text-sm font-semibold text-card-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
