'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    if (!confirm('Delete this student?')) return;
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

  // Super admin without institution selected
  const needsInstitution = admin?.role === 'super_admin' && !selectedInstitutionId;
  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">{needsInstitution ? 'Select an institution' : `${students.length} student(s)`}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={needsInstitution}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
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
                    <div className="max-h-64 overflow-auto rounded border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            {Object.keys(csvPreview[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="px-3 py-2">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
            <DialogTrigger asChild>
              <Button disabled={needsInstitution}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
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
      </div>

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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Select an institution to view students</p>
          </CardContent>
        </Card>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No students found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {filtered.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{s.rollNumber}</p>
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
                        onClick={() => handleDelete(s.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Roll No.</th>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Department</th>
                      <th className="px-4 py-3 text-left font-medium">Year</th>
                      <th className="px-4 py-3 text-left font-medium">Section</th>
                      <th className="px-4 py-3 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="px-4 py-3 font-medium">{s.rollNumber}</td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">{s.email}</td>
                        <td className="px-4 py-3">{s.department}</td>
                        <td className="px-4 py-3">{s.year}</td>
                        <td className="px-4 py-3">{s.section}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(s.id)}
                            className="text-muted-foreground hover:text-destructive"
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
    </div>
  );
}
