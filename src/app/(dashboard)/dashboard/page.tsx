'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        // super_admin: no institutionId filter needed (API returns all)
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
    { title: 'Total Forms', value: stats.forms, icon: FileText, color: 'text-blue-600' },
    { title: 'Total Responses', value: stats.responses, icon: Users, color: 'text-green-600' },
    { title: 'Students', value: stats.students, icon: GraduationCap, color: 'text-purple-600' },
    ...(admin?.role === 'super_admin'
      ? [{ title: 'Institutions', value: stats.institutions, icon: Building2, color: 'text-orange-600' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {admin?.displayName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-3xl font-bold">{card.value}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
