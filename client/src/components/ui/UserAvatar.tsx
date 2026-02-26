import { User } from 'lucide-react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  name?: string;
  avatar?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { wrapper: string; icon: string; text: string }> = {
  sm: { wrapper: 'w-8 h-8',  icon: 'w-4 h-4', text: 'text-xs' },
  md: { wrapper: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm' },
  lg: { wrapper: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-base' },
  xl: { wrapper: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-lg' },
};

export default function UserAvatar({ name, avatar, size = 'md', className = '' }: UserAvatarProps) {
  const { wrapper, icon, text } = sizeClasses[size];
  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`${wrapper} rounded-full bg-amber-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${className}`}
    >
      {avatar ? (
        // referrerPolicy="no-referrer" is required for Google profile pictures —
        // Google's CDN blocks requests that include a Referer header from a different origin.
        <img
          src={avatar}
          alt={name ?? 'User avatar'}
          referrerPolicy="no-referrer"
          className={`${wrapper} rounded-full object-cover`}
        />
      ) : initial ? (
        <span className={`${text} font-semibold text-white leading-none`}>{initial}</span>
      ) : (
        <User className={`${icon} text-white`} />
      )}
    </div>
  );
}
