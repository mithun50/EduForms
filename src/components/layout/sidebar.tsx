'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  GraduationCap,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/institutions', label: 'Institutions', icon: Building2, superOnly: true },
  { href: '/admins', label: 'Admins', icon: Users, superOnly: true },
  { href: '/forms', label: 'Forms', icon: FileText },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { admin } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filtered = navItems.filter(
    (item) => !item.superOnly || admin?.role === 'super_admin'
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col bg-ink text-paper transition-all duration-200',
          // Mobile: hidden by default, slide in when open
          'w-60 max-w-[85vw] -translate-x-full',
          open && 'translate-x-0',
          // Tablet (md): collapsed icons-only
          'md:translate-x-0 md:w-14',
          // Desktop (lg): full width
          'lg:w-60'
        )}
      >
        {/* Header */}
        <div className="flex h-[60px] items-center justify-between border-b border-paper/10 px-3 lg:px-4">
          <Link href="/dashboard" className="flex items-center">
            <span className="md:hidden lg:block">
              <Logo size="sm" showText={true} />
            </span>
            <span className="hidden md:block lg:hidden">
              <Logo size="sm" showText={false} />
            </span>
          </Link>
          <button onClick={onClose} className="md:hidden text-paper/60 hover:text-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 lg:p-3">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
                  'md:justify-center md:px-0 lg:justify-start lg:px-3',
                  active
                    ? 'bg-paper/10 text-paper border-l-2 border-red'
                    : 'text-paper/60 hover:bg-paper/5 hover:text-paper border-l-2 border-transparent'
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="md:hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-paper/10 p-2 lg:p-3">
          <div className="mb-2 px-3 md:hidden lg:block">
            <p className="text-sm font-medium truncate text-paper">{admin?.displayName}</p>
            <p className="text-xs text-paper/50 truncate">{admin?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              'flex w-full items-center gap-3 rounded px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper/60 transition-colors hover:bg-red/20 hover:text-red',
              'md:justify-center md:px-0 lg:justify-start lg:px-3'
            )}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="md:hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
