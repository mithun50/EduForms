'use client';

import { useAuth } from '@/hooks/use-auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { LoadingScreen } from '@/components/ui/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (!admin) return null;

  return <DashboardShell>{children}</DashboardShell>;
}
