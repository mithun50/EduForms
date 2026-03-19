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
import { GraduationCap, Plus, Upload, Search, Trash2, Building2 } from 'lucide-react';
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
        <div className="glass-card flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Select an institution to view students</p>
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

          {filtered.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No students found</p>
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {filtered.map((s) => (
                  <div key={s.id} className="glass-card flex items-center justify-between p-4">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteTargetId(s.id);
                        setConfirmOpen(true);
                      }}
                      className="text-muted-foreground hover:text-red shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block glass-card overflow-x-auto">
                <table className="table-ink">
                  <thead>
                    <tr>
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
                        <td className="font-medium">{s.rollNumber}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.department}</td>
                        <td>{s.year}</td>
                        <td>{s.section}</td>
                        <td>
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
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
