import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <h1 className="font-display text-[10rem] leading-none text-ink/10">404</h1>
      <h2 className="mt-4 font-display text-3xl tracking-tight">Page not found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" className="mt-8">
        <Button size="lg">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
