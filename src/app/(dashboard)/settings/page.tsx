'use client';

import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  const { admin } = useAuth();

  const initials = admin?.displayName
    ? admin.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account information" />

      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded bg-ink text-paper font-display text-xl shrink-0">
            {initials}
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <p className="label-ink">Name</p>
              <p className="font-medium mt-1">{admin?.displayName}</p>
            </div>
            <div>
              <p className="label-ink">Email</p>
              <p className="font-medium mt-1">{admin?.email}</p>
            </div>
            <div>
              <p className="label-ink">Role</p>
              <Badge variant="outline" className="mt-1">
                {admin?.role === 'super_admin' ? 'Super Admin' : 'Institution Admin'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
