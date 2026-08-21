import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:bg-red-200"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
