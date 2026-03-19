import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Edu<span className="text-primary">Forms</span>
        </h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Create, manage, and analyze forms for your educational institution.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Admin Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
