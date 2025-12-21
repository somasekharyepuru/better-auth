"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { APP_CONFIG } from "@/config/app.constants";
import { AppMockup } from "@/components/landing/AppMockup";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLElement | null, index: number) => {
    sectionsRef.current[index] = el;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {APP_CONFIG.navigation.login}
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {APP_CONFIG.navigation.signup}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 mb-6 opacity-0-initial animate-fade-in-up">
            {APP_CONFIG.hero.headline}
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-light mb-10 max-w-2xl mx-auto opacity-0-initial animate-fade-in-up delay-200">
            {APP_CONFIG.hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 opacity-0-initial animate-fade-in-up delay-400">
            <button className="btn-primary">
              {APP_CONFIG.hero.primaryCta}
            </button>
            <button className="btn-secondary">
              {APP_CONFIG.hero.secondaryCta}
            </button>
          </div>
          <div className="opacity-0-initial animate-fade-in-scale delay-600">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section
        ref={(el) => addToRefs(el, 0)}
        className="py-32 px-6 reveal"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8">
            {APP_CONFIG.philosophy.headline}
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed">
            {APP_CONFIG.philosophy.description}
          </p>
        </div>
      </section>

      {/* Feature Highlights */}
      <section
        ref={(el) => addToRefs(el, 1)}
        className="py-32 px-6 bg-gray-50/50 reveal"
      >
        <div className="max-w-4xl mx-auto">
          <div className="space-y-24">
            {APP_CONFIG.features.map((feature, index) => (
              <div key={index} className="text-center">
                {/* Feature Icon Placeholder */}
                <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/60 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-lg bg-gray-900/10" />
                </div>
                <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-xl text-gray-500 font-light max-w-md mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Fits Into Your Life */}
      <section
        ref={(el) => addToRefs(el, 2)}
        className="py-32 px-6 reveal"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {APP_CONFIG.lifestyle.statements.map((statement, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl md:text-3xl font-medium text-gray-900">
                  {statement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section
        ref={(el) => addToRefs(el, 3)}
        className="py-32 px-6 bg-gray-50/50 reveal"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-12">
            {APP_CONFIG.audience.headline}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {APP_CONFIG.audience.list.map((audience, index) => (
              <span
                key={index}
                className="text-xl md:text-2xl text-gray-500 font-light"
              >
                {audience}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={(el) => addToRefs(el, 4)}
        className="py-40 px-6 reveal"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-semibold text-gray-900 mb-6">
            {APP_CONFIG.finalCta.headline}
          </h2>
          <p className="text-xl text-gray-500 font-light mb-10">
            {APP_CONFIG.finalCta.subtext}
          </p>
          <button className="btn-primary">
            {APP_CONFIG.finalCta.buttonText}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <span className="text-gray-400 text-sm">
                {APP_CONFIG.footer.tagline}
              </span>
            </div>

            <div className="flex items-center gap-8">
              {APP_CONFIG.footer.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <span className="text-gray-400 text-sm">
                {APP_CONFIG.footer.copyright} {APP_CONFIG.name}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
