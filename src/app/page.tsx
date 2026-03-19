import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { FileText, BarChart3, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b-[1.5px] border-line bg-paper/95 backdrop-blur px-4 sm:px-8">
        <Logo size="sm" />
        <Link href="/login">
          <Button variant="outline" size="sm">Admin Login</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-20 sm:py-28 lg:py-36 text-center">
        <h1
          className="font-display leading-[0.9] tracking-tight opacity-0 animate-fade-in-up"
          style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}
        >
          Forms for<br />
          <span className="text-red">Education</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
          Create, distribute, and analyze forms for your educational institution — simple, fast, and beautiful.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center opacity-0 animate-fade-in-up animation-delay-200">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">Learn More</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 sm:px-8 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FileText,
              title: 'Create',
              description: 'Build forms with a powerful drag-and-drop editor. Support for 12+ field types.',
            },
            {
              icon: Users,
              title: 'Collect',
              description: 'Share forms with students via unique links. OTP-verified responses ensure authenticity.',
            },
            {
              icon: BarChart3,
              title: 'Analyze',
              description: 'View response analytics with charts and graphs. Export data to CSV anytime.',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`glass-card p-6 opacity-0 animate-fade-in-up animation-delay-${(i + 1) * 100}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded bg-red/10 text-red">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-3xl px-4 sm:px-8 py-16">
        <h2 className="font-display text-3xl tracking-tight text-center mb-10">How It Works</h2>
        <div className="space-y-8">
          {[
            { step: '01', title: 'Create Your Form', desc: 'Use the form builder to add fields, set validations, and customize your form.' },
            { step: '02', title: 'Share With Students', desc: 'Publish your form and share the unique link. Students verify via OTP.' },
            { step: '03', title: 'Analyze Responses', desc: 'View real-time analytics, charts, and export data for your records.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <span className="font-display text-4xl text-red/30 leading-none">{item.step}</span>
              <div>
                <h3 className="font-display text-lg tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[1.5px] border-line px-4 sm:px-8 py-6">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ScholarForm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
