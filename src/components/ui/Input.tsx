import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400',
        'transition-colors duration-150',
        hasError
          ? 'border-red-400 focus:border-red-500'
          : 'border-zinc-200 hover:border-zinc-300 focus:border-primary-500',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
