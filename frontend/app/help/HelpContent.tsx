"use client";

import { useEffect, useState } from "react";
import { CALENDAR_UI_ENABLED } from "@/lib/feature-flags";
import { authClient } from "@/lib/auth-client";
import { APP_CONFIG } from "@/config/app.constants";
import Link from "next/link";
import {
  Calendar,
  Target,
  Clock,
  Keyboard,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Timer,
  Grid3X3,
  Scale,
  Star,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Search,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/60 overflow-hidden mb-4 transition-all hover:shadow-lg shadow-primary/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/5 rounded-lg text-primary">
            {icon}
          </div>
          <span className="font-semibold text-lg text-foreground tracking-tight">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <CardContent className="p-6 pt-0 border-t border-border/40">
          <div className="pt-6">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function KeyboardShortcut({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
      <span className="text-muted-foreground font-medium">{description}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="min-w-[24px] h-7 px-2 flex items-center justify-center bg-muted/80 rounded text-xs font-mono font-bold text-foreground border border-border shadow-sm">
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span className="text-muted-foreground/50 text-xs">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}) {
  const content = (
    <div className="p-5 border border-border/50 rounded-2xl hover:bg-background/80 hover:shadow-md transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1 tracking-tight">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {link && (
        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

export function HelpContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser(session.data.user);
      }
    };
    checkAuth();
  }, []);

  const quickLinkGridClass = CALENDAR_UI_ENABLED
    ? "grid grid-cols-2 md:grid-cols-4 gap-4"
    : "grid grid-cols-1 sm:grid-cols-3 gap-4";

  const faqItems = [
    {
      q: "How do I get started quickly?",
      a: "Start with your top 3 priorities, then block focused time for each one in your calendar."
    },
    {
      q: "How can I recover my account?",
      a: "Use the forgot password flow from the sign-in page, then follow the reset email instructions."
    },
    {
      q: "Does Daymark support keyboard shortcuts?",
      a: "Yes. Press ? in supported views to open the shortcut guide and speed up navigation."
    },
    {
      q: "How do I contact support?",
      a: "Use the Email Support button below and include any relevant screenshots or error details."
    }
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const isSearching = queryTerms.length > 0;

  const matchesSearch = (...targets: string[]) => {
    if (!isSearching) return true;

    const searchableText = targets.join(" ").toLowerCase();
    return queryTerms.every((term) => searchableText.includes(term));
  };

  const sectionMatches = {
    gettingStarted: matchesSearch("getting started onboarding setup priorities block time focus"),
    dashboard: matchesSearch("dashboard daily view priorities schedule overview"),
    tools: matchesSearch("tools pomodoro matrix decision helper productivity"),
    shortcuts: matchesSearch("shortcuts keyboard commands navigation"),
  };

  const filteredFaqs = faqItems.filter((item) => matchesSearch(item.q, item.a));
  const hasAnyContentMatch =
    sectionMatches.gettingStarted ||
    sectionMatches.dashboard ||
    sectionMatches.tools ||
    sectionMatches.shortcuts ||
    filteredFaqs.length > 0;

  return (
    <div className="min-h-screen bg-premium relative overflow-hidden font-sans">
      {/* Background blobs — same as AuthLayout for consistency */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none opacity-40" />
      <div className="absolute inset-0 decorative-grid opacity-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo size="sm" />
          </Link>
          <div className="flex gap-4">
            {!user && (
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-4">
                {APP_CONFIG.navigation.login}
              </Link>
            )}
            <Link href={user ? "/" : "/signup"}>
              <Button variant="default" size="sm" className="btn-primary pointer-events-auto h-9 px-5 py-0 text-sm">
                {user ? "Dashboard" : APP_CONFIG.navigation.signup}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Title & Search Section */}
        <div className="flex flex-col items-center text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            How can we help you today?
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl leading-relaxed mb-10">
            Find guides, tips, and answers to your questions about Daymark productivity.
          </p>

          <div className="w-full max-w-xl group relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <Input
              type="text"
              placeholder="Search help articles..."
              className="input-premium h-14 !pl-12 text-lg shadow-xl shadow-primary/5 focus:ring-4 focus:ring-indigo-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Links Section */}
        {!isSearching && (
          <div className={`${quickLinkGridClass} mb-12 animate-fade-in-up delay-100`}>
            <Link href="#dashboard" className="card-premium group flex flex-col items-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <span className="font-semibold text-foreground">Dashboard</span>
            </Link>
            {CALENDAR_UI_ENABLED && (
              <Link href="/calendar/help" className="card-premium group flex flex-col items-center p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-semibold text-foreground">Calendar Guide</span>
              </Link>
            )}
            <Link href="#tools" className="card-premium group flex flex-col items-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <span className="font-semibold text-foreground">Tools</span>
            </Link>
            <Link href="#shortcuts" className="card-premium group flex flex-col items-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Keyboard className="w-6 h-6" />
              </div>
              <span className="font-semibold text-foreground">Shortcuts</span>
            </Link>
          </div>
        )}

        {/* Search Results Indicator */}
        {isSearching && (
          <div className="mb-10 text-center animate-fade-in">
            <p className="text-muted-foreground">
              Showing help results for <span className="font-semibold text-foreground">&quot;{searchQuery}&quot;</span>
            </p>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-4 animate-fade-in-up delay-200">
          {sectionMatches.gettingStarted && (
            <CollapsibleSection
              title="Getting Started"
              icon={<Sparkles className="w-5 h-5" />}
              defaultOpen={!isSearching}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Daymark! Start with these three steps to create a calm, focused day.
                </p>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { icon: Target, title: "1. Set Priorities", text: "Choose your top 3 daily focus items." },
                    { icon: Clock, title: "2. Block Time", text: "Reserve focused sessions on your schedule." },
                    { icon: Timer, title: "3. Focus", text: "Use the timer tools to protect deep-work sessions." }
                  ].map((item, i) => (
                    <div key={i} className="text-center p-6 bg-muted/20 rounded-2xl border border-border/10">
                      <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {sectionMatches.dashboard && (
            <div id="dashboard">
              <CollapsibleSection
                title="Daily Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                defaultOpen={isSearching}
              >
                <div className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Your command center. The dashboard shows priorities, schedule context, and what to focus on next.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={<Star className="w-5 h-5" />}
                      title="Top 3 Priorities"
                      description="Stay focused on high-impact tasks that matter most today."
                    />
                    <FeatureCard
                      icon={<Clock className="w-5 h-5" />}
                      title="Today's Schedule"
                      description="See your time blocks and priorities in one chronological flow."
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}

          {sectionMatches.tools && (
            <div id="tools">
              <CollapsibleSection
                title="Productivity Tools"
                icon={<Grid3X3 className="w-5 h-5" />}
                defaultOpen={isSearching}
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FeatureCard
                    icon={<Timer className="w-5 h-5" />}
                    title="Pomodoro Timer"
                    description="Build sustainable focus with structured work and break intervals."
                    link="/tools/pomodoro"
                  />
                  <FeatureCard
                    icon={<Grid3X3 className="w-5 h-5" />}
                    title="Eisenhower Matrix"
                    description="Categorize tasks by urgency and importance to plan better."
                    link="/tools/matrix"
                  />
                  <FeatureCard
                    icon={<Scale className="w-5 h-5" />}
                    title="Decision Helper"
                    description="Compare options with structure when choices feel unclear."
                    link="/tools/decisions"
                  />
                </div>
              </CollapsibleSection>
            </div>
          )}

          {sectionMatches.shortcuts && (
            <div id="shortcuts">
              <CollapsibleSection
                title="Keyboard Shortcuts"
                icon={<Keyboard className="w-5 h-5" />}
                defaultOpen={isSearching}
              >
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Common</h5>
                    <KeyboardShortcut keys={["Esc"]} description="Close modal / Reset focus" />
                    <KeyboardShortcut keys={["Enter"]} description="Confirm action" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Navigation</h5>
                    <KeyboardShortcut keys={["D"]} description="Go to Dashboard" />
                    {CALENDAR_UI_ENABLED && <KeyboardShortcut keys={["C"]} description="Go to Calendar" />}
                    <KeyboardShortcut keys={["?"]} description="Show help" />
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}

          {filteredFaqs.length > 0 && (
            <CollapsibleSection
              title="FAQs"
              icon={<HelpCircle className="w-5 h-5" />}
              defaultOpen={isSearching}
            >
              <div className="space-y-6">
                {filteredFaqs.map((item, i) => (
                  <div key={i} className="pb-6 border-b border-border/40 last:border-0 last:pb-0">
                    <h5 className="font-semibold text-foreground mb-2">{item.q}</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {isSearching && !hasAnyContentMatch && (
            <Card className="border-border/50 bg-card/80 dark:bg-card/60">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-semibold text-foreground mb-2">No help articles matched your search</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try different keywords, or reach out and we&apos;ll help you directly.
                </p>
                <a href={`mailto:${APP_CONFIG.footer.links.find(l => l.label === "Contact")?.href.replace("mailto:", "") || "support@daymark.com"}`}>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Support Section */}
        <div className="mt-24 animate-fade-in-up delay-300">
          <div className="card-premium relative overflow-hidden p-8 md:p-12 text-center">
            <div className="absolute top-0 right-0 -m-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
                Still have questions?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 font-light">
                Our support team is always ready to help you optimize your workflow.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={`mailto:${APP_CONFIG.footer.links.find(l => l.label === "Contact")?.href.replace('mailto:', '') || 'support@daymark.com'}`}>
                  <Button className="btn-primary px-8 h-12 text-base shadow-xl shadow-primary/20">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Support
                  </Button>
                </a>
                <Link href={user ? "/" : "/signup"}>
                  <Button variant="secondary" className="px-8 h-12 text-base font-medium">
                    {user ? "Back to Dashboard" : APP_CONFIG.navigation.signup}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info and copyright */}
        <div className="mt-20 pt-12 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>{APP_CONFIG.footer.copyright} {APP_CONFIG.name}. {APP_CONFIG.footer.tagline}</p>
        </div>
      </main>
    </div>
  );
}
