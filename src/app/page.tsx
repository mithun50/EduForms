import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Footer } from '@/components/ui/footer';
import { FileText, BarChart3, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-line/60 bg-paper/90 backdrop-blur-md px-4 sm:px-8">
        <Logo size="sm" />
        <Link href="/login">
          <Button variant="outline" size="sm" className="rounded-full px-5">Admin Login</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden dot-grid-bg">
        <div className="mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-16 px-4 py-20 sm:py-28 lg:py-36">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block rounded-full bg-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red mb-6 opacity-0 animate-fade-in-up">
              Built for Education
            </div>
            <h1
              className="font-display leading-[0.88] tracking-tight opacity-0 animate-fade-in-up animation-delay-100"
              style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)' }}
            >
              Forms for<br />
              <span className="text-red">Education</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200 mx-auto lg:mx-0 leading-relaxed">
              Create, distribute, and analyze forms for your educational institution — simple, fast, and beautiful.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start opacity-0 animate-fade-in-up animation-delay-300">
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8 h-12 text-sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm">Learn More</Button>
              </a>
            </div>
          </div>

          {/* Right: Form Mockup */}
          <div className="flex-1 max-w-sm w-full opacity-0 animate-fade-in-up animation-delay-400">
            <div className="glass-card p-6 space-y-5 shadow-xl">
              <div className="space-y-1.5">
                <div className="h-2 w-20 rounded-full bg-red/20" />
                <div className="font-display text-xl tracking-tight">Student Feedback</div>
                <div className="h-2 w-36 rounded-full bg-muted/60" />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Full Name <span className="text-red">*</span></div>
                  <div className="h-10 rounded-lg border border-line bg-paper" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Rating</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-6 w-6 rounded ${i <= 4 ? 'bg-red/80' : 'bg-muted/40'}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Department</div>
                  <div className="flex gap-2">
                    {['CS', 'ECE', 'ME'].map((d, i) => (
                      <div
                        key={d}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          i === 0 ? 'bg-ink text-paper border-ink' : 'border-line'
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-10 rounded-lg bg-red flex items-center justify-center">
                  <span className="text-xs font-semibold text-paper uppercase tracking-wider">Submit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 sm:px-8 py-20">
        <h2 className="font-display text-3xl tracking-tight text-center mb-3">Everything you need</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">Powerful tools to streamline form management across your institution.</p>
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
                className={`glass-card p-7 opacity-0 animate-fade-in-up animation-delay-${(i + 1) * 100} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red/10 text-red">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-3xl px-4 sm:px-8 py-20">
        <h2 className="font-display text-3xl tracking-tight text-center mb-4">How It Works</h2>
        <p className="text-center text-muted-foreground mb-14 max-w-md mx-auto">Three simple steps to start collecting responses.</p>
        <div className="relative space-y-10">
          {/* Connecting line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-line/60 hidden sm:block" />
          {[
            { step: '01', title: 'Create Your Form', desc: 'Use the form builder to add fields, set validations, and customize your form.' },
            { step: '02', title: 'Share With Students', desc: 'Publish your form and share the unique link. Students verify via OTP.' },
            { step: '03', title: 'Analyze Responses', desc: 'View real-time analytics, charts, and export data for your records.' },
          ].map((item) => (
            <div key={item.step} className="relative flex gap-5 items-start group">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper border border-line shadow-sm group-hover:border-red/30 transition-colors">
                <span className="font-display text-lg text-red">{item.step}</span>
              </div>
              <div className="pt-1.5">
                <h3 className="font-display text-lg tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-4 sm:px-8 py-20 text-center">
        <div className="glass-card p-10 sm:p-14">
          <h2 className="font-display text-4xl tracking-tight">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Create your first form in minutes.</p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" className="rounded-full px-8 h-12 text-sm">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
