"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Card */}
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 text-base leading-relaxed max-w-sm mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div>{children}</div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <Link
              href="/privacy"
              className="hover:text-gray-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-600 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/"
              className="hover:text-gray-600 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
