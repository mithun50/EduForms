import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper dot-grid-bg px-4 text-center">
      <Logo size="md" className="mb-10" />
      <h1 className="font-display text-8xl sm:text-9xl leading-none text-ink/8">404</h1>
      <h2 className="mt-4 font-display text-2xl tracking-tight">Page not found</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link href="/">
          <Button variant="outline" size="lg" className="rounded-full px-6">Back to Home</Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" className="rounded-full px-6">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
