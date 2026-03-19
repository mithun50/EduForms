'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Search, ExternalLink, Pencil, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/utils/fetch';
import type { Form, Institution } from '@/types';

export default function FormsPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessType: 'restricted' as 'restricted' | 'public',
    institutionId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchForms();
    if (admin?.role === 'super_admin') {
      fetchInstitutions();
    }
  }, [admin]);

  const fetchForms = async () => {
    try {
      const result = await safeFetch<{ forms: Form[] }>('/api/forms');
      if (!result.ok) {
        toast.error(result.error || 'Failed to fetch forms');
        return;
      }
      setForms(result.data?.forms || []);
    } catch {
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    const result = await safeFetch<{ institutions: Institution[] }>('/api/institutions');
    setInstitutions(result.data?.institutions || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error);
      }
      const data = await res.json();
      toast.success('Form created');
      setDialogOpen(false);
      setFormData({ title: '', description: '', accessType: 'restricted', institutionId: '' });
      router.push(`/forms/${data.id}/edit`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'secondary',
    published: 'default',
    closed: 'destructive',
  };

  const filtered = forms.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
          <p className="text-muted-foreground">Create and manage forms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Student Feedback Form"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select
                  value={formData.accessType}
                  onValueChange={(val: 'restricted' | 'public') =>
                    setFormData({ ...formData, accessType: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restricted">Restricted (College students only)</SelectItem>
                    <SelectItem value="public">Public (Anyone with email)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {admin?.role === 'super_admin' && (
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select
                    value={formData.institutionId}
                    onValueChange={(val) => setFormData({ ...formData, institutionId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create & Build'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No forms yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((form) => (
            <Card key={form.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  {form.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{form.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColors[form.status] as "default" | "secondary" | "destructive"}>
                    {form.status}
                  </Badge>
                  <Badge variant="outline">
                    {form.accessType === 'restricted' ? 'Restricted' : 'Public'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {form.responseCount} response{form.responseCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/forms/${form.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/forms/${form.id}/responses`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="mr-1 h-3 w-3" />
                        Responses
                      </Button>
                    </Link>
                    {form.status === 'published' && (
                      <Link href={`/f/${form.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
