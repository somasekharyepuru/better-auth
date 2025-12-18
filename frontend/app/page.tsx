import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="min-h-screen bg-gradient-to-br from-white/80 via-blue-50/50 to-indigo-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="pt-6 pb-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-2xl font-semibold text-gray-800">
                  Auth Service
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <main className="py-20 text-center text-gray-800">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-6xl font-bold leading-tight bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Secure Authentication Platform
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Complete authentication solution with email verification,
                password reset, and organization management
              </p>

              <div className="flex items-center justify-center space-x-4 pt-8">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 h-14 px-8 text-lg shadow-xl"
                  >
                    Create account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 h-14 px-8 text-lg shadow-lg bg-white/80 backdrop-blur-sm"
                  >
                    Sign in
                  </Button>
                </Link>
              </div>

              <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 space-y-3 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Email & OTP Verification
                  </h3>
                  <p className="text-gray-600">
                    Secure email verification with one-time passwords for
                    enhanced security
                  </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 space-y-3 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Password Recovery
                  </h3>
                  <p className="text-gray-600">
                    Secure password reset flow with email verification and OTP
                    codes
                  </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 space-y-3 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Social Authentication
                  </h3>
                  <p className="text-gray-600">
                    Sign in with Google, Apple, or traditional email and
                    password
                  </p>
                </div>
              </div>
            </div>
          </main>

          <footer className="py-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <span>Auth Service</span>
              </div>
              <span>•</span>
              <span>Secure by design</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
