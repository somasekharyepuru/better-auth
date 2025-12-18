"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold">Auth Service</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Secure Authentication
            </h1>
            <p className="text-blue-100 text-lg">
              Sign in securely with email verification and password protection
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-blue-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold">A</span>
              </div>
              <span>Auth Service</span>
            </div>
            <span>•</span>
            <span>Secure by design</span>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold">Auth Service</span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>

          {children}

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-700">
                Terms
              </Link>
              <Link href="/help" className="hover:text-gray-700">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
