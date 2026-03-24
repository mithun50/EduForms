'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus,
  FileText,
  Search,
  ExternalLink,
  Pencil,
  BarChart3,
  Trash2,
  Copy,
  Link as LinkIcon,
  ToggleRight,
  ToggleLeft,
  MoreVertical,
  Calendar,
} from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessType: 'restricted' as 'restricted' | 'public',
    institutionId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);

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

  const handleDelete = async (form: Form) => {
    try {
      const res = await fetch(`/api/forms/${form.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Form deleted');
      fetchForms();
    } catch {
      toast.error('Failed to delete form');
    }
  };

  const handleToggleStatus = async (form: Form) => {
    const newStatus = form.status === 'published' ? 'closed' : 'published';
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(newStatus === 'closed' ? 'Form closed' : 'Form reopened');
      fetchForms();
    } catch {
      toast.error('Failed to update form status');
    }
  };

  const handleDuplicate = async (form: Form) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      toast.success('Form duplicated');
      fetchForms();
    } catch {
      toast.error('Failed to duplicate form');
    }
  };

  const handleCopyLink = (form: Form) => {
    const url = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    draft: 'secondary',
    published: 'default',
    closed: 'destructive',
  };

  const filtered = forms
    .filter((f) => statusFilter === 'all' || f.status === statusFilter)
    .filter((f) => f.title.toLowerCase().includes(search.toLowerCase()));

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        description="Create and manage forms"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                New Form
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accessType: 'restricted' })}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        formData.accessType === 'restricted'
                          ? 'border-red bg-red/5 ring-1 ring-red/30'
                          : 'border-line hover:bg-paper2'
                      }`}
                    >
                      <p className="text-sm font-medium">Restricted</p>
                      <p className="text-xs text-muted-foreground mt-0.5">College students only</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accessType: 'public' })}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        formData.accessType === 'public'
                          ? 'border-red bg-red/5 ring-1 ring-red/30'
                          : 'border-line hover:bg-paper2'
                      }`}
                    >
                      <p className="text-sm font-medium">Public</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Anyone with email</p>
                    </button>
                  </div>
                </div>
                {admin?.role === 'super_admin' && (
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Select
                      value={formData.institutionId}
                      onValueChange={(val) => setFormData({ ...formData, institutionId: val })}
                    >
                      <SelectTrigger>
                        {formData.institutionId
                          ? <span>{institutions.find(i => i.id === formData.institutionId)?.name || 'Select institution'}</span>
                          : <SelectValue placeholder="Select institution" />
                        }
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
        }
      />

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="mt-5 text-lg font-medium text-muted-foreground">
            {forms.length === 0 ? 'No forms yet' : 'No matching forms'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {forms.length === 0
              ? 'Create your first form to get started'
              : 'Try adjusting your search or filter'}
          </p>
          {forms.length === 0 && (
            <Button className="mt-6 rounded-full" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <div
              key={form.id}
              className="glass-card group flex flex-col p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Header: Title + Menu */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg tracking-tight truncate">
                    {form.title}
                  </h3>
                  {form.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {form.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-paper2 hover:text-ink" />
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                    {form.status === 'published' && (
                      <DropdownMenuItem onClick={() => window.open(`/f/${form.slug}`, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                        Open Form
                      </DropdownMenuItem>
                    )}
                    {form.status === 'published' && (
                      <DropdownMenuItem onClick={() => handleCopyLink(form)}>
                        <LinkIcon className="h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    {(form.status === 'published' || form.status === 'closed') && (
                      <DropdownMenuItem onClick={() => handleToggleStatus(form)}>
                        {form.status === 'published' ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Close Form
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Reopen Form
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(form)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariants[form.status]}>
                  {form.status}
                </Badge>
                <Badge variant="outline">
                  {form.accessType === 'restricted' ? 'Restricted' : 'Public'}
                </Badge>
              </div>

              {/* Footer: Meta + Actions */}
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/30">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{form.responseCount} response{form.responseCount !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(form.createdAt)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Link href={`/forms/${form.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/forms/${form.id}/responses`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Responses">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Form"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}
