import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({ message = 'Loading...', fullScreen = true, className }: LoadingScreenProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-6',
      fullScreen && 'min-h-screen bg-paper',
      className
    )}>
      <div className="relative">
        {/* Outer ring */}
        <div className="h-12 w-12 rounded-full border-[3px] border-line/30" />
        {/* Spinning arc */}
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-red" />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-red animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
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
      <div className="glass-card p-8 shadow-xl flex flex-col items-center gap-4 animate-scale-in">
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
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-[2.5px] border-line/30" />
        <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-[2.5px] border-transparent border-t-red" />
      </div>
    </div>
  );
}
