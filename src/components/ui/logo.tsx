import { cn } from '@/lib/utils';

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-2xl' },
  lg: { icon: 48, text: 'text-3xl' },
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="2" />
        {/* Graduation cap */}
        <path
          d="M24 14L12 20L24 26L36 20L24 14Z"
          fill="currentColor"
        />
        <path
          d="M16 22V28C16 28 19 32 24 32C29 32 32 28 32 28V22"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Document lines */}
        <line x1="36" y1="22" x2="36" y2="30" stroke="currentColor" strokeWidth="2" />
        <circle cx="36" cy="31" r="1" fill="currentColor" />
      </svg>
      {showText && (
        <span className={cn('font-display tracking-tight leading-none', s.text)}>
          Edu<span className="text-red">Forms</span>
        </span>
      )}
    </div>
  );
}
