'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Search, BarChart3, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/utils/fetch';
import type { Form, FormField, FormResponse } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const CHART_COLORS = ['#E8341A', '#0D0D0D', '#7A7670', '#B8B4AE', '#E8E4DD', '#C4281A'];

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [formId]);

  const fetchData = async () => {
    try {
      const [formResult, responsesResult] = await Promise.all([
        safeFetch<{ form: Form; fields: FormField[] }>(`/api/forms/${formId}`),
        safeFetch<{ responses: FormResponse[] }>(`/api/forms/${formId}/responses`),
      ]);
      if (!formResult.ok) {
        toast.error(formResult.error || 'Failed to load form');
        return;
      }
      if (!responsesResult.ok) {
        toast.error(responsesResult.error || 'Failed to load responses');
      }
      setForm(formResult.data?.form || null);
      setFields(formResult.data?.fields || []);
      setResponses(responsesResult.data?.responses || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (responses.length === 0) return;

    const headers = ['Respondent', 'Email', 'Submitted At', ...fields.map((f) => f.label || f.id)];
    const rows = responses.map((r) => [
      r.respondentIdentifier,
      r.respondentEmail,
      new Date(r.submittedAt).toLocaleString(),
      ...fields.map((f) => {
        const answer = r.answers?.[f.id];
        if (!answer) return '';
        return Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value);
      }),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.title || 'responses'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFieldAnalytics = (field: FormField) => {
    const values = responses
      .map((r) => r.answers?.[field.id]?.value)
      .filter((v) => v !== undefined && v !== null && v !== '');

    if (['dropdown', 'radio', 'checkbox'].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        const items = Array.isArray(v) ? v : [v];
        items.forEach((item) => {
          counts[String(item)] = (counts[String(item)] || 0) + 1;
        });
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    if (['rating', 'linear_scale', 'number'].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([name, value]) => ({ name, value }));
    }

    return null;
  };

  const timelineData = () => {
    const byDate: Record<string, number> = {};
    responses.forEach((r) => {
      const date = new Date(r.submittedAt).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, count]) => ({ date, count }));
  };

  const filtered = responses.filter(
    (r) =>
      r.respondentIdentifier?.toLowerCase().includes(search.toLowerCase()) ||
      r.respondentEmail?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/forms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-display text-2xl tracking-tight">{form?.title} — Responses</h2>
            <p className="label-ink mt-1">{responses.length} response(s)</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={responses.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">
            <TableIcon className="mr-1 h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-1 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card py-12 text-center text-muted-foreground">
              No responses yet
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {filtered.map((r, i) => (
                  <div key={r.id} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">#{i + 1} {r.respondentIdentifier}</p>
                      <p className="label-ink">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.respondentEmail}</p>
                    {fields.slice(0, 3).map((f) => {
                      const answer = r.answers?.[f.id];
                      const val = answer
                        ? Array.isArray(answer.value)
                          ? answer.value.join(', ')
                          : String(answer.value)
                        : '-';
                      return (
                        <div key={f.id} className="text-sm">
                          <span className="text-muted-foreground">{f.label}: </span>
                          <span className="truncate">{val}</span>
                        </div>
                      );
                    })}
                    {fields.length > 3 && (
                      <p className="label-ink">+{fields.length - 3} more fields</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto glass-card">
                <table className="table-ink">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Respondent</th>
                      <th>Email</th>
                      {fields.map((f) => (
                        <th key={f.id}>{f.label}</th>
                      ))}
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td>{r.respondentIdentifier}</td>
                        <td>{r.respondentEmail}</td>
                        {fields.map((f) => {
                          const answer = r.answers?.[f.id];
                          const val = answer
                            ? Array.isArray(answer.value)
                              ? answer.value.join(', ')
                              : String(answer.value)
                            : '-';
                          return (
                            <td key={f.id} className="max-w-[200px] truncate">
                              {val}
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap">
                          {new Date(r.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Timeline */}
          {responses.length > 0 && (
            <div className="glass-card p-4">
              <p className="label-ink mb-3">Response Timeline</p>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.08)" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#E8341A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Per-field analytics */}
          {fields.map((field) => {
            const data = getFieldAnalytics(field);
            if (!data || data.length === 0) return null;

            return (
              <div key={field.id} className="glass-card p-4">
                <p className="label-ink mb-3">{field.label}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.08)" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#E8341A" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {data.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
