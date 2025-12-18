import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app.constants";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {APP_CONFIG.shortName}
                </span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                {APP_CONFIG.name}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  {APP_CONFIG.navigation.login}
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6">
                  {APP_CONFIG.navigation.signup}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-7xl font-normal leading-tight text-gray-900">
              {APP_CONFIG.hero.title.main}
              <br />
              <span className="font-light">
                {APP_CONFIG.hero.title.subtitle}
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {APP_CONFIG.hero.description}
              <sup className="text-sm">{APP_CONFIG.hero.footnote}</sup>
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-8">
                {/* Mock Dashboard Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg"></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-16 bg-gray-100 rounded"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="space-y-3">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-12 bg-gray-100 rounded"></div>
                        <div className="h-12 bg-gray-100 rounded"></div>
                        <div className="h-12 bg-gray-100 rounded"></div>
                        <div className="h-12 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-20 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {APP_CONFIG.features.security.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {APP_CONFIG.features.security.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {APP_CONFIG.features.performance.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {APP_CONFIG.features.performance.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {APP_CONFIG.features.management.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {APP_CONFIG.features.management.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {APP_CONFIG.shortName}
                </span>
              </div>
              <span className="text-gray-900 font-medium">
                {APP_CONFIG.name}
              </span>
            </div>
            <div className="text-xs">
              <sup>{APP_CONFIG.hero.footnote}</sup>{" "}
              {APP_CONFIG.footer.disclaimer}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
