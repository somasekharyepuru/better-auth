"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Effective Date: {effectiveDate}</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Welcome to Daymark. These Terms of Service govern your access to and use of our service. By accessing or using our service, you agree to be bound by these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By creating an account or using our service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 13 years old to use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Description of Services</h2>
              <p className="text-muted-foreground">Daymark provides:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>User authentication and account management</li>
                <li>Two-factor authentication (2FA)</li>
                <li>Email verification and password reset</li>
                <li>Organization and team management</li>
                <li>Session management and activity tracking</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Accounts</h2>
              <p className="text-muted-foreground">You agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of unauthorized access</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Interfere with service integrity or performance</li>
                <li>Use automated systems without permission</li>
                <li>Impersonate any person or entity</li>
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
            <span>© {new Date().getFullYear()} Daymark</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
