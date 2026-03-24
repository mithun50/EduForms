'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-line/60 bg-paper/90 backdrop-blur-md px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      {title && <h1 className="font-display text-xl tracking-tight">{title}</h1>}
    </header>
  );
}
