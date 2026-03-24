'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { GraduationCap, Plus, Upload, Search, Trash2, Building2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/utils/fetch';
import Papa from 'papaparse';
import type { Student, Institution } from '@/types';

export default function StudentsPage() {
  const { admin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: '',
    year: '',
    section: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({ rollNumber: '', name: '', email: '', department: '', year: '', section: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Super admin institution selector
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      fetchInstitutions();
    } else {
      fetchStudents();
    }
  }, [admin]);

  useEffect(() => {
    if (admin?.role === 'super_admin' && selectedInstitutionId) {
      fetchStudents();
    }
  }, [selectedInstitutionId]);

  const fetchInstitutions = async () => {
    const result = await safeFetch<{ institutions: Institution[] }>('/api/institutions');
    setInstitutions(result.data?.institutions || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      let params = '';
      if (admin?.role === 'institution_admin' && admin?.institutionId) {
        params = `?institutionId=${admin.institutionId}`;
      } else if (admin?.role === 'super_admin' && selectedInstitutionId) {
        params = `?institutionId=${selectedInstitutionId}`;
      }
      const result = await safeFetch<{ students: Student[] }>(`/api/students${params}`);
      if (!result.ok) {
        toast.error(result.error || 'Failed to fetch students');
        return;
      }
      setStudents(result.data?.students || []);
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, string> = { ...formData };
      if (admin?.role === 'super_admin') {
        body.institutionId = selectedInstitutionId;
      }
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error);
      }
      toast.success('Student added');
      setDialogOpen(false);
      setFormData({ rollNumber: '', name: '', email: '', department: '', year: '', section: '' });
      fetchStudents();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data as Record<string, string>[]);
      },
      error: () => {
        toast.error('Failed to parse file');
      },
    });
  };

  const handleBulkUpload = async () => {
    if (csvPreview.length === 0) return;
    setUploading(true);
    try {
      const students = csvPreview.map((row) => ({
        rollNumber: row.rollNumber || row.roll_number || row['Roll Number'] || '',
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        department: row.department || row.Department || '',
        year: row.year || row.Year || '',
        section: row.section || row.Section || '',
      }));

      const body: { students: typeof students; institutionId?: string } = { students };
      if (admin?.role === 'super_admin') {
        body.institutionId = selectedInstitutionId;
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error);
      }

      const data = await res.json();
      toast.success(`${data.imported} students imported`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} rows had errors`);
      }
      setUploadDialogOpen(false);
      setCsvPreview([]);
      fetchStudents();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (s: Student) => {
    setEditingStudent(s);
    setEditFormData({ rollNumber: s.rollNumber, name: s.name, email: s.email, department: s.department || '', year: s.year || '', section: s.section || '' });
    setEditDialogOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error); }
      toast.success('Student updated');
      setEditDialogOpen(false);
      fetchStudents();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success(`${selectedIds.size} student(s) deleted`);
      setSelectedIds(new Set());
      fetchStudents();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
  );

  const needsInstitution = admin?.role === 'super_admin' && !selectedInstitutionId;
  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-paper2" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={needsInstitution ? 'Select an institution' : `${students.length} student(s)`}
        actions={
          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger render={<Button variant="outline" disabled={needsInstitution} />}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Student Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV with columns: rollNumber, name, email, department, year, section
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {csvPreview.length > 0 && (
                    <>
                      <div className="max-h-64 overflow-auto glass-card">
                        <table className="table-ink">
                          <thead>
                            <tr>
                              {Object.keys(csvPreview[0]).map((key) => (
                                <th key={key}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.slice(0, 10).map((row, i) => (
                              <tr key={i}>
                                {Object.values(row).map((val, j) => (
                                  <td key={j}>{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="label-ink">
                        Showing {Math.min(10, csvPreview.length)} of {csvPreview.length} rows
                      </p>
                      <Button onClick={handleBulkUpload} disabled={uploading} className="w-full">
                        {uploading ? 'Uploading...' : `Import ${csvPreview.length} Students`}
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button disabled={needsInstitution} />}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Roll Number</Label>
                      <Input
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Student'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Institution selector for super_admin */}
      {admin?.role === 'super_admin' && (
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
            <SelectTrigger className="w-full max-w-xs">
              {selectedInstitution
                ? <span>{selectedInstitution.name} ({selectedInstitution.code})</span>
                : <SelectValue placeholder="Select an institution" />
              }
            </SelectTrigger>
            <SelectContent>
              {institutions.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name} ({inst.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {needsInstitution ? (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-5 text-muted-foreground font-medium">Select an institution to view students</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Choose from the dropdown above to get started</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                <Button variant="destructive" size="sm" onClick={() => { setDeleteTargetId(null); setConfirmOpen(true); }}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Delete Selected
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
                <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="mt-5 text-muted-foreground font-medium">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {students.length === 0 ? 'Add students individually or upload a CSV' : 'Try adjusting your search'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {filtered.map((s) => (
                  <div key={s.id} className="glass-card flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(s.id); else next.delete(s.id);
                        setSelectedIds(next);
                      }} className="h-4 w-4 accent-red shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="label-ink mt-1">{s.rollNumber}</p>
                        <p className="text-sm text-muted-foreground truncate">{s.email}</p>
                        {s.department && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.department}{s.year ? ` - ${s.year}` : ''}{s.section ? ` ${s.section}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(s)} className="text-muted-foreground hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTargetId(s.id);
                          setConfirmOpen(true);
                        }}
                        className="text-muted-foreground hover:text-red"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block glass-card table-scroll">
                <table className="table-ink">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={(e) => {
                          if (e.target.checked) setSelectedIds(new Set(filtered.map(s => s.id)));
                          else setSelectedIds(new Set());
                        }} className="h-4 w-4 accent-red" />
                      </th>
                      <th>Roll No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Section</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <input type="checkbox" checked={selectedIds.has(s.id)} onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(s.id); else next.delete(s.id);
                            setSelectedIds(next);
                          }} className="h-4 w-4 accent-red" />
                        </td>
                        <td className="font-medium">{s.rollNumber}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.department}</td>
                        <td>{s.year}</td>
                        <td>{s.section}</td>
                        <td className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(s)} className="text-muted-foreground hover:text-ink">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTargetId(s.id);
                              setConfirmOpen(true);
                            }}
                            className="text-muted-foreground hover:text-red"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTargetId ? 'Delete Student' : `Delete ${selectedIds.size} Student${selectedIds.size !== 1 ? 's' : ''}`}
        description={deleteTargetId
          ? 'Are you sure you want to delete this student? This action cannot be undone.'
          : `Are you sure you want to delete ${selectedIds.size} selected student${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTargetId) {
            handleDelete(deleteTargetId);
          } else if (selectedIds.size > 0) {
            handleBulkDelete();
          }
          setDeleteTargetId(null);
        }}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input
                  value={editFormData.rollNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input
                  value={editFormData.section}
                  onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={editSubmitting}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
