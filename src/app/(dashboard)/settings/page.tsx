'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Save, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { safeFetch } from '@/lib/utils/fetch';
import type { Form, Institution } from '@/types';

export default function SettingsPage() {
  const { admin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Database management state (super_admin only)
  const [forms, setForms] = useState<Form[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [fullResetPhrase, setFullResetPhrase] = useState('');
  const [clearingData, setClearingData] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearAction, setClearAction] = useState<string>('');
  const [clearDescription, setClearDescription] = useState('');

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      safeFetch<{ forms: Form[] }>('/api/forms').then(r => setForms(r.data?.forms || []));
      safeFetch<{ institutions: Institution[] }>('/api/institutions').then(r => setInstitutions(r.data?.institutions || []));
    }
  }, [admin]);

  const handleClearData = async (type: string, extras?: Record<string, string>) => {
    setClearingData(true);
    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...extras }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Cleared ${data.deleted || 0} records`);
      setFullResetPhrase('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  const confirmClear = (action: string, description: string) => {
    setClearAction(action);
    setClearDescription(description);
    setClearConfirmOpen(true);
  };

  const executeClear = () => {
    switch (clearAction) {
      case 'form_responses':
        handleClearData('form_responses', { formId: selectedFormId });
        break;
      case 'otp_sessions':
        handleClearData('otp_sessions');
        break;
      case 'institution_students':
        handleClearData('institution_students', { institutionId: selectedInstitutionId });
        break;
      case 'full_reset':
        handleClearData('full_reset', { confirmPhrase: 'DELETE EVERYTHING' });
        break;
    }
  };

  const initials = admin?.displayName
    ? admin.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error('Not authenticated');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        toast.error('Current password is incorrect');
      } else {
        toast.error(message);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account information" />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-6">
          <p className="label-ink mb-5">Profile</p>
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-ink text-paper font-display text-2xl shrink-0">
              {initials}
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <p className="label-ink">Name</p>
                <p className="font-medium mt-1 text-lg">{admin?.displayName}</p>
              </div>
              <div>
                <p className="label-ink">Email</p>
                <p className="font-medium mt-1">{admin?.email}</p>
              </div>
              <div>
                <p className="label-ink">Role</p>
                <Badge variant="outline" className="mt-1.5">
                  {admin?.role === 'super_admin' ? 'Super Admin' : 'Institution Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <p className="label-ink mb-4">Change Password</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={changingPassword} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* Institution Card (read-only) */}
        {admin?.role === 'institution_admin' && admin?.institutionId && (
          <div className="glass-card p-6">
            <p className="label-ink mb-4">Institution</p>
            <p className="text-sm text-muted-foreground">
              You are an admin of institution <span className="font-medium text-ink">{admin.institutionId}</span>.
            </p>
          </div>
        )}

        {/* Database Management (super_admin only) */}
        {admin?.role === 'super_admin' && (
          <div className="glass-card p-6 border-red/20 space-y-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red" />
              <p className="label-ink text-red">Danger Zone</p>
            </div>
            <p className="text-sm text-muted-foreground">
              These actions are irreversible. Proceed with caution.
            </p>

            {/* Clear Form Responses */}
            <div className="space-y-2">
              <Label>Clear Form Responses</Label>
              <div className="flex gap-2">
                <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                  <SelectTrigger className="flex-1">
                    {selectedFormId
                      ? <span>{forms.find(f => f.id === selectedFormId)?.title || 'Select a form'}</span>
                      : <SelectValue placeholder="Select a form" />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.title} ({f.responseCount} responses)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="text-red hover:text-red shrink-0"
                  disabled={!selectedFormId || clearingData}
                  onClick={() => confirmClear('form_responses', `Delete all responses for "${forms.find(f => f.id === selectedFormId)?.title}"?`)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Clear OTP Sessions */}
            <div className="space-y-2">
              <Label>Clear All OTP Sessions</Label>
              <p className="text-xs text-muted-foreground">Removes all expired and active OTP sessions.</p>
              <Button
                variant="outline"
                className="text-red hover:text-red"
                disabled={clearingData}
                onClick={() => confirmClear('otp_sessions', 'Delete all OTP sessions?')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear OTP Sessions
              </Button>
            </div>

            {/* Clear Institution Students */}
            <div className="space-y-2">
              <Label>Clear Institution Students</Label>
              <div className="flex gap-2">
                <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
                  <SelectTrigger className="flex-1">
                    {selectedInstitutionId
                      ? <span>{institutions.find(i => i.id === selectedInstitutionId)?.name || 'Select an institution'}</span>
                      : <SelectValue placeholder="Select an institution" />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="text-red hover:text-red shrink-0"
                  disabled={!selectedInstitutionId || clearingData}
                  onClick={() => confirmClear('institution_students', `Delete all students from "${institutions.find(i => i.id === selectedInstitutionId)?.name}"?`)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Full Reset */}
            <div className="space-y-2 border-t border-red/20 pt-4">
              <Label className="text-red">Full Database Reset</Label>
              <p className="text-xs text-muted-foreground">
                This will delete ALL forms, responses, students, and OTP sessions. Type <span className="font-mono font-bold">DELETE EVERYTHING</span> to enable.
              </p>
              <Input
                value={fullResetPhrase}
                onChange={(e) => setFullResetPhrase(e.target.value)}
                placeholder='Type "DELETE EVERYTHING"'
                className="font-mono"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={fullResetPhrase !== 'DELETE EVERYTHING' || clearingData}
                onClick={() => confirmClear('full_reset', 'This will permanently delete ALL data. Are you absolutely sure?')}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {clearingData ? 'Clearing...' : 'Reset Entire Database'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Confirm Data Deletion"
        description={clearDescription}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeClear}
      />
    </div>
  );
}
