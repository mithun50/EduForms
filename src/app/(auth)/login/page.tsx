'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/firebase/auth';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { admin, loading: authLoading, setAdmin } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && admin) {
      router.replace(redirect);
    }
  }, [admin, authLoading, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const admin = await signIn(email, password);
      setAdmin(admin);
      toast.success('Logged in successfully');
      router.push(redirect);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while checking session
  if (authLoading || admin) {
    return (
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />
    );
  }

  return (
    <div className="glass-card w-full max-w-md p-8 sm:p-10 shadow-xl animate-scale-in">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Logo size="md" />
        <p className="label-ink mt-2">Sign in to your admin account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-ink transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper dot-grid-bg px-4">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
