import { avatarColor, cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
} as const;

export function Avatar({ name, id, size = 'md', className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        avatarColor(id ?? name),
        SIZES[size],
        className
      )}
    >
      {getInitials(name) || '?'}
    </div>
  );
}
