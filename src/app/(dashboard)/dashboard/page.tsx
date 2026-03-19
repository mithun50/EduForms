'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/ui/page-header';
import { FileText, Users, GraduationCap, Building2 } from 'lucide-react';
import { safeFetch } from '@/lib/utils/fetch';

interface Stats {
  forms: number;
  responses: number;
  students: number;
  institutions: number;
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<Stats>({ forms: 0, responses: 0, students: 0, institutions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const studentParams = admin?.role === 'institution_admin' && admin?.institutionId
          ? `?institutionId=${admin.institutionId}`
          : '';

        const [formsResult, studentsResult] = await Promise.all([
          safeFetch<{ forms: { responseCount?: number }[] }>('/api/forms'),
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
    { title: 'Total Forms', value: stats.forms, icon: FileText },
    { title: 'Total Responses', value: stats.responses, icon: Users },
    { title: 'Students', value: stats.students, icon: GraduationCap },
    ...(admin?.role === 'super_admin'
      ? [{ title: 'Institutions', value: stats.institutions, icon: Building2 }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${admin?.displayName}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <span className="label-ink">{card.title}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded bg-red/10">
                  <Icon className="h-4 w-4 text-red" />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 h-9 w-20 animate-pulse rounded bg-paper2" />
              ) : (
                <p className="mt-3 font-display text-4xl tracking-tight">{card.value}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
