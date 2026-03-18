"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
  const effectiveDate = "December 24, 2024"
  const supportEmail = "somasekharyepuru@gmail.com"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:max-w-4xl md:mx-auto">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-12 md:max-w-4xl md:mx-auto">
        <div className="space-y-8 mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">Effective Date: {effectiveDate}</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <p className="text-lg text-muted-foreground">
                At Auth Service, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our authentication service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
              <p className="text-muted-foreground">We collect:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name and email address</li>
                <li>Account credentials (encrypted)</li>
                <li>Profile information</li>
                <li>Device information and usage data</li>
                <li>IP address and access logs</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use your information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process authentication and authorization</li>
                <li>Send administrative and security notifications</li>
                <li>Respond to support requests</li>
                <li>Analyze usage patterns</li>
                <li>Detect and prevent security threats</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Data Security</h2>
              <p className="text-muted-foreground">
                We implement security measures including encryption, access controls, and secure infrastructure. However, no method of transmission is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Your Rights</h2>
              <p className="text-muted-foreground">You may:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request your personal information</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request account deletion</li>
                <li><strong>Portability:</strong> Export your data</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Contact Us</h2>
              <p className="text-muted-foreground">
                Questions? Contact us at{" "}
                <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                  {supportEmail}
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="px-4 md:max-w-4xl md:mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Logo size="sm" />
            </Link>
            <span>© {new Date().getFullYear()} Auth Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
