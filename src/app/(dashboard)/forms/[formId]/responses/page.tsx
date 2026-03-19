'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Search, BarChart3, Table as TableIcon, ChevronDown, ChevronUp } from 'lucide-react';
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
  Legend,
} from 'recharts';

const CHART_COLORS = ['#E8341A', '#0D0D0D', '#7A7670', '#B8B4AE', '#E8E4DD', '#C4281A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

type StudentInfo = { name: string; department: string; year: string; section: string };

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, StudentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [formId]);

  const fetchData = async () => {
    try {
      const [formResult, responsesResult] = await Promise.all([
        safeFetch<{ form: Form; fields: FormField[] }>(`/api/forms/${formId}`),
        safeFetch<{ responses: FormResponse[]; studentMap: Record<string, StudentInfo> }>(`/api/forms/${formId}/responses`),
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
      setStudentMap(responsesResult.data?.studentMap || {});
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const escCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

  const exportCsv = () => {
    if (responses.length === 0) return;

    const isRestricted = form?.accessType === 'restricted';
    const fieldLabels = fields.map((f) => f.label || f.id);

    // Build header row
    const headers = [
      '#',
      'Respondent',
      ...(isRestricted ? ['Name', 'Department', 'Year', 'Section'] : []),
      'Email',
      ...fieldLabels,
      'Submitted At',
    ];

    // Build data rows
    const rows = responses.map((r, i) => {
      const student = studentMap[r.respondentIdentifier];
      return [
        String(i + 1),
        r.respondentIdentifier,
        ...(isRestricted
          ? [
              student?.name || '',
              student?.department || '',
              student?.year || '',
              student?.section || '',
            ]
          : []),
        r.respondentEmail,
        ...fields.map((f) => {
          const answer = r.answers?.[f.id];
          if (!answer) return '';
          return Array.isArray(answer.value) ? answer.value.join('; ') : String(answer.value);
        }),
        new Date(r.submittedAt).toLocaleString(),
      ];
    });

    // Build CSV with title header and BOM for Excel
    const titleRow = [`${form?.title || 'Form'} — Responses (${responses.length})`];
    const csv =
      '\uFEFF' +
      [titleRow, headers, ...rows]
        .map((row) => row.map(escCsv).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
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
      return {
        type: 'choice' as const,
        data: Object.entries(counts).map(([name, value]) => ({ name, value })),
        total: values.length,
      };
    }

    if (['rating', 'linear_scale', 'number'].includes(field.type)) {
      const counts: Record<string, number> = {};
      let sum = 0;
      values.forEach((v) => {
        const key = String(v);
        const num = Number(v);
        counts[key] = (counts[key] || 0) + 1;
        if (!isNaN(num)) sum += num;
      });
      const avg = values.length > 0 ? (sum / values.length).toFixed(1) : '0';
      return {
        type: 'numeric' as const,
        data: Object.entries(counts)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([name, value]) => ({ name, value })),
        total: values.length,
        average: avg,
      };
    }

    if (['text', 'textarea', 'email', 'phone'].includes(field.type)) {
      return {
        type: 'text' as const,
        data: null,
        total: values.length,
        responses: values.slice(0, 10).map(String),
      };
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

  const sectionData = () => {
    if (form?.accessType !== 'restricted') return null;
    const bySec: Record<string, number> = {};
    responses.forEach((r) => {
      const student = studentMap[r.respondentIdentifier];
      const sec = student?.section || 'Unknown';
      bySec[sec] = (bySec[sec] || 0) + 1;
    });
    return Object.entries(bySec).map(([name, value]) => ({ name, value }));
  };

  const departmentData = () => {
    if (form?.accessType !== 'restricted') return null;
    const byDept: Record<string, number> = {};
    responses.forEach((r) => {
      const student = studentMap[r.respondentIdentifier];
      const dept = student?.department || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + 1;
    });
    return Object.entries(byDept).map(([name, value]) => ({ name, value }));
  };

  const getAnswerDisplay = (r: FormResponse, f: FormField) => {
    const answer = r.answers?.[f.id];
    if (!answer) return '-';
    return Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value);
  };

  const filtered = responses.filter(
    (r) =>
      r.respondentIdentifier?.toLowerCase().includes(search.toLowerCase()) ||
      r.respondentEmail?.toLowerCase().includes(search.toLowerCase()) ||
      (studentMap[r.respondentIdentifier]?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />
      </div>
    );
  }

  const isRestricted = form?.accessType === 'restricted';

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
              placeholder="Search by respondent, email, or name..."
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
                {filtered.map((r, i) => {
                  const student = studentMap[r.respondentIdentifier];
                  return (
                    <div key={r.id} className="glass-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">#{i + 1} {r.respondentIdentifier}</p>
                        <p className="label-ink">
                          {new Date(r.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isRestricted && student && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{student.name}</Badge>
                          {student.section && <Badge variant="secondary">{student.section}</Badge>}
                          {student.department && <Badge variant="secondary">{student.department}</Badge>}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">{r.respondentEmail}</p>
                      {fields.map((f) => {
                        const val = getAnswerDisplay(r, f);
                        return (
                          <div key={f.id} className="text-sm">
                            <span className="text-muted-foreground">{f.label}: </span>
                            <span className="whitespace-pre-wrap break-words">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto glass-card">
                <table className="table-ink">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Respondent</th>
                      {isRestricted && <th>Name</th>}
                      {isRestricted && <th>Section</th>}
                      <th>Email</th>
                      {fields.map((f) => (
                        <th key={f.id}>{f.label}</th>
                      ))}
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const student = studentMap[r.respondentIdentifier];
                      const isExpanded = expandedRow === r.id;
                      return (
                        <tr
                          key={r.id}
                          className="cursor-pointer hover:bg-paper2/50"
                          onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                        >
                          <td>
                            <div className="flex items-center gap-1">
                              {i + 1}
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td>{r.respondentIdentifier}</td>
                          {isRestricted && <td>{student?.name || '-'}</td>}
                          {isRestricted && <td>{student?.section || '-'}</td>}
                          <td>{r.respondentEmail}</td>
                          {fields.map((f) => {
                            const val = getAnswerDisplay(r, f);
                            return (
                              <td key={f.id} className={isExpanded ? 'whitespace-pre-wrap break-words max-w-[300px]' : 'max-w-[200px] truncate'}>
                                {val}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap">
                            {new Date(r.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Summary cards */}
          {responses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card p-4 text-center">
                <p className="label-ink">Total Responses</p>
                <p className="font-display text-3xl tracking-tight mt-1">{responses.length}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="label-ink">Fields</p>
                <p className="font-display text-3xl tracking-tight mt-1">{fields.length}</p>
              </div>
              {form?.settings?.responseLimit && (
                <div className="glass-card p-4 text-center">
                  <p className="label-ink">Limit</p>
                  <p className="font-display text-3xl tracking-tight mt-1">
                    {responses.length}/{form.settings.responseLimit}
                  </p>
                </div>
              )}
              <div className="glass-card p-4 text-center">
                <p className="label-ink">Completion Rate</p>
                <p className="font-display text-3xl tracking-tight mt-1">
                  {responses.length > 0
                    ? Math.round(
                        (responses.filter((r) =>
                          fields.every((f) => !f.required || (r.answers?.[f.id]?.value !== undefined && r.answers?.[f.id]?.value !== ''))
                        ).length /
                          responses.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          )}

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
                    <Line type="monotone" dataKey="count" stroke="#E8341A" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Section & Department breakdown for restricted forms */}
          {isRestricted && responses.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sectionData() && sectionData()!.length > 0 && (
                <div className="glass-card p-4">
                  <p className="label-ink mb-3">Responses by Section</p>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectionData()!}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {sectionData()!.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {departmentData() && departmentData()!.length > 0 && (
                <div className="glass-card p-4">
                  <p className="label-ink mb-3">Responses by Department</p>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData()!}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.08)" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#E8341A" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-field analytics */}
          {fields.map((field) => {
            const analytics = getFieldAnalytics(field);
            if (!analytics) return null;

            return (
              <div key={field.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-ink">{field.label}</p>
                  <Badge variant="outline">{analytics.total} response(s)</Badge>
                </div>

                {analytics.type === 'choice' && analytics.data.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.data} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.08)" />
                          <XAxis type="number" fontSize={12} />
                          <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#E8341A" radius={[0, 2, 2, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.data}
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
                            {analytics.data.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {analytics.type === 'numeric' && analytics.data.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Average: <span className="font-medium text-ink">{analytics.average}</span>
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.data}>
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
                              data={analytics.data}
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
                              {analytics.data.map((_, index) => (
                                <Cell
                                  key={index}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {analytics.type === 'text' && analytics.responses && (
                  <div className="space-y-2">
                    {analytics.responses.map((text, i) => (
                      <div key={i} className="rounded border-[1.5px] border-line p-3 text-sm whitespace-pre-wrap break-words">
                        {text}
                      </div>
                    ))}
                    {analytics.total > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Showing 10 of {analytics.total} responses. Export CSV for full data.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
