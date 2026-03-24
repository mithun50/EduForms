'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, GraduationCap, Building2, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import { safeFetch } from '@/lib/utils/fetch';
import type { Form } from '@/types';

interface Stats {
  forms: number;
  responses: number;
  students: number;
  institutions: number;
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ forms: 0, responses: 0, students: 0, institutions: 0 });
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const studentParams = admin?.role === 'institution_admin' && admin?.institutionId
          ? `?institutionId=${admin.institutionId}`
          : '';

        const [formsResult, studentsResult] = await Promise.all([
          safeFetch<{ forms: Form[] }>('/api/forms'),
          safeFetch<{ students: unknown[] }>(`/api/students${studentParams}`),
        ]);

        const forms = formsResult.data?.forms || [];
        const totalResponses = forms.reduce(
          (sum, f) => sum + (f.responseCount || 0),
          0
        );

        setStats({
          forms: forms.length,
          responses: totalResponses,
          students: studentsResult.data?.students?.length || 0,
          institutions: 0,
        });

        // Get 5 most recent forms
        const sorted = [...forms].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentForms(sorted.slice(0, 5));

        if (admin?.role === 'super_admin') {
          const instResult = await safeFetch<{ institutions: unknown[] }>('/api/institutions');
          setStats((prev) => ({ ...prev, institutions: instResult.data?.institutions?.length || 0 }));
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    if (admin) fetchStats();
  }, [admin]);

  const cards = [
    { title: 'Total Forms', value: stats.forms, icon: FileText, href: '/forms' },
    { title: 'Total Responses', value: stats.responses, icon: BarChart3, href: '/forms' },
    { title: 'Students', value: stats.students, icon: GraduationCap, href: '/students' },
    ...(admin?.role === 'super_admin'
      ? [{ title: 'Institutions', value: stats.institutions, icon: Building2, href: '/institutions' }]
      : []),
  ];

  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    draft: 'secondary',
    published: 'default',
    closed: 'destructive',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${admin?.displayName}`}
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className="stat-card p-5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="label-ink">{card.title}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red/8">
                  <Icon className="h-[18px] w-[18px] text-red" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="mt-3 h-9 w-20" />
              ) : (
                <p className="mt-3 font-display text-4xl tracking-tight">{card.value}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/forms">
          <Button variant="outline" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </Link>
        <Link href="/forms">
          <Button variant="outline" className="rounded-full">
            <FileText className="mr-2 h-4 w-4" />
            View All Forms
          </Button>
        </Link>
      </div>

      {/* Recent Forms */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="label-ink">Recent Forms</h3>
          <Link href="/forms" className="text-sm text-muted-foreground hover:text-ink transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="glass-card divide-y divide-line/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : recentForms.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">No forms yet</p>
            <Link href="/forms" className="mt-3">
              <Button size="sm" variant="outline" className="rounded-full">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Create your first form
              </Button>
            </Link>
          </div>
        ) : (
          <div className="glass-card divide-y divide-line/40 overflow-hidden">
            {recentForms.map((form) => (
              <Link
                key={form.id}
                href={`/forms/${form.id}/edit`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-paper2/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{form.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{form.responseCount} response{form.responseCount !== 1 ? 's' : ''}</span>
                    <span className="text-muted-foreground/60">&middot;</span>
                    <span>{formatDate(form.createdAt)}</span>
                  </div>
                </div>
                <Badge variant={statusVariants[form.status]} className="shrink-0 ml-3">
                  {form.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
