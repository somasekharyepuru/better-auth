"use client";

import Link from "next/link";
import { useEffect } from "react";
import { APP_CONFIG } from "@/config/app.constants";
import { AppMockup } from "@/components/landing/AppMockup";
import { Logo } from "@/components/ui/logo";
import { LayoutDashboard, Focus, Sparkles, Zap } from "lucide-react";
import { HeroConnections, AnimatedOrb, FeatureIconRing, SeparatorLine } from "@/components/landing/premium-svgs";

// Feature icons mapped by index
const featureIcons = [
  LayoutDashboard, // Your day, at a glance
  Focus,           // Focus without distraction  
  Sparkles,        // Reflect and improve
];

export function LandingPage() {

  return (
    <div className="min-h-screen bg-premium flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-b border-gray-200/30 dark:border-gray-800/50 transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                {APP_CONFIG.navigation.login}
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm px-5 py-2"
              >
                {APP_CONFIG.navigation.signup}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 relative overflow-hidden">
          <HeroConnections />
          <AnimatedOrb color="#818cf8" size={600} left="20%" top="30%" delay="0s" />
          <AnimatedOrb color="#c084fc" size={500} left="80%" top="60%" delay="2s" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800/50 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 mb-8 opacity-0-initial animate-fade-in-up">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
              Introducing a new way to work
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 opacity-0-initial animate-fade-in-up delay-100" style={{ letterSpacing: "-0.04em" }}>
              {APP_CONFIG.hero.headline}
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-light mb-12 max-w-2xl mx-auto opacity-0-initial animate-fade-in-up delay-200 leading-relaxed">
              {APP_CONFIG.hero.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 opacity-0-initial animate-fade-in-up delay-300">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                {APP_CONFIG.hero.primaryCta}
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-5xl opacity-0-initial animate-fade-in-scale delay-500">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur-2xl"></div>
              <div className="relative rounded-3xl ring-1 ring-gray-900/10 dark:ring-white/10 overflow-hidden shadow-2xl">
                <AppMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-32 px-6 opacity-0-initial animate-fade-in-up delay-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-semibold text-gray-900 dark:text-white mb-8 tracking-tight">
              {APP_CONFIG.philosophy.headline}
            </h2>
            <p className="text-xl md:text-3xl text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              {APP_CONFIG.philosophy.description}
            </p>
          </div>
        </section>

        {/* Feature Highlights - Bento Box Style */}
        <section className="py-32 px-6 opacity-0-initial animate-fade-in-up flex justify-center">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight">
                {APP_CONFIG.featuresHeadline.part1} <br className="hidden md:block" /> {APP_CONFIG.featuresHeadline.part2}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {APP_CONFIG.features.map((feature, index) => {
                const Icon = featureIcons[index] || Zap;
                return (
                  <div key={index} className="card-subtle flex flex-col items-center text-center p-10 group hover:-translate-y-1 transition-transform duration-300 relative z-10">
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                      <FeatureIconRing />
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-900 border border-indigo-100/50 dark:border-indigo-800/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 relative z-10">
                        <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <SeparatorLine />

        {/* How It Fits Into Your Life */}
        <section className="py-24 px-6 relative overflow-hidden opacity-0-initial animate-fade-in-up">
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900/50 mix-blend-multiply" />
          <div className="max-w-5xl mx-auto relative z-10 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 text-center">
              {APP_CONFIG.lifestyle.statements.map((statement, index) => (
                <div key={index} className="py-8 md:py-0 md:px-8">
                  <p className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    {index + 1}.
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-400 mt-2">
                    {statement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-6 opacity-0-initial animate-fade-in-up flex justify-center">
          <div className="w-full max-w-4xl text-center card-premium py-20 px-8 relative overflow-hidden text-center justify-center items-center flex flex-col">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 -m-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -m-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight relative z-10">
              {APP_CONFIG.finalCta.headline}
            </h2>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-light mb-12 relative z-10">
              {APP_CONFIG.finalCta.subtext}
            </p>
            <Link href="/signup" className="btn-primary text-xl px-10 py-5 shadow-lg hover:shadow-xl relative z-10 inline-block font-medium">
              {APP_CONFIG.finalCta.buttonText}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-black/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {APP_CONFIG.footer.tagline}
              </span>
            </div>

            <div className="flex items-center gap-8">
              {APP_CONFIG.footer.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                {APP_CONFIG.footer.copyright} {APP_CONFIG.name}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


