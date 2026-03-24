import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({ message = 'Loading...', fullScreen = true, className }: LoadingScreenProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-8 dot-grid-bg',
      fullScreen && 'min-h-screen bg-paper',
      className
    )}>
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-5 animate-fade-in-up">
        <div className="relative">
          {/* Pulsing background circle */}
          <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-red/10 animate-pulse" />
          {/* Logo icon */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-paper">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 14L12 20L24 26L36 20L24 14Z" fill="currentColor" />
              <path d="M16 22V28C16 28 19 32 24 32C29 32 32 28 32 28V22" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="36" y1="22" x2="36" y2="30" stroke="currentColor" strokeWidth="2" />
              <circle cx="36" cy="31" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <span className="font-display text-2xl tracking-tight leading-none">
          Edu<span className="text-red">Forms</span>
        </span>
      </div>

      {/* Loading bar */}
      <div className="w-48 animate-fade-in-up animation-delay-200">
        <div className="h-1 w-full rounded-full bg-line/30 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-red loading-bar-slide" />
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-sm text-muted-foreground animate-fade-in-up animation-delay-300">{message}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Processing...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
      <div className="glass-card p-8 shadow-xl flex flex-col items-center gap-5 animate-scale-in">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-[3px] border-line/30" />
          <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-[3px] border-transparent border-t-red" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingInline({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16', className)}>
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-[2.5px] border-line/20" />
        <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-[2.5px] border-transparent border-t-red" />
      </div>
      <div className="w-32">
        <div className="h-1 w-full rounded-full bg-line/20 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-red/60 loading-bar-slide" />
        </div>
      </div>
    </div>
  );
}
