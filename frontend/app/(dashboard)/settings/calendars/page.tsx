"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calendarApi, CalendarConnection, CalendarProvider } from "@/lib/daymark-api";
import { ConnectionCard } from "@/components/calendar/connection-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  Plus,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

function CalendarSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<CalendarProvider | null>(null);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [appleState, setAppleState] = useState("");
  const [appleId, setAppleId] = useState("");
  const [applePassword, setApplePassword] = useState("");
  const [isSubmittingApple, setIsSubmittingApple] = useState(false);

  const loadConnections = async () => {
    try {
      const data = await calendarApi.getConnections();
      setConnections(data);
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const provider = searchParams.get("provider");
    const state = searchParams.get("state");

    if (success === "true") {
      addToast({
        type: "success",
        title: `${provider || "Calendar"} connected successfully!`,
        duration: 5000,
      });
      loadConnections();
      router.replace("/settings/calendars");
    }

    if (error) {
      addToast({
        type: "error",
        title: `Connection failed: ${error.replace(/_/g, " ")}`,
        duration: 5000,
      });
      router.replace("/settings/calendars");
    }

    if (state && !success && !error) {
      setAppleState(state);
      setShowAppleModal(true);
    }
  }, [searchParams, addToast, router]);

  const handleConnect = async (provider: CalendarProvider) => {
    setIsConnecting(provider);
    try {
      // Construct the OAuth callback redirect URI
      const redirectUri = `${window.location.origin}/settings/calendars/callback`;
      const result = await calendarApi.initiateConnection(provider, redirectUri);
      if (provider === "APPLE") {
        setAppleState(result.state);
        setShowAppleModal(true);
        setIsConnecting(null);
      } else {
        window.location.href = result.authUrl;
      }
    } catch (error) {
      console.error("Connection initiation failed:", error);
      addToast({
        type: "error",
        title: "Failed to start connection",
        duration: 5000,
      });
      setIsConnecting(null);
    }
  };

  const handleAppleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appleId || !applePassword) return;

    setIsSubmittingApple(true);
    try {
      await calendarApi.completeAppleConnection(appleState, appleId, applePassword);
      addToast({
        type: "success",
        title: "Apple Calendar connected successfully!",
        duration: 5000,
      });
      setShowAppleModal(false);
      setAppleId("");
      setApplePassword("");
      loadConnections();
    } catch (error) {
      console.error("Apple connection failed:", error);
      addToast({
        type: "error",
        title: "Failed to connect Apple Calendar",
        duration: 5000,
      });
    } finally {
      setIsSubmittingApple(false);
    }
  };

  const getProviderCount = (provider: CalendarProvider) =>
    connections.filter((c) => c.provider === provider).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/profile?tab=preferences")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to settings
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Calendar Connections
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Sync your external calendars with Daymark
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {connections.length > 0 && (
              <div className="space-y-4 mb-8">
                {connections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onRefresh={loadConnections}
                  />
                ))}
              </div>
            )}

            <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {connections.length > 0 ? "Add another calendar" : "Connect a calendar"}
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => handleConnect("GOOGLE")}
                  disabled={isConnecting === "GOOGLE"}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Google Calendar</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getProviderCount("GOOGLE") > 0 ? "Add another Google account" : "Connect your Google account"}
                      </p>
                    </div>
                  </div>
                  {isConnecting === "GOOGLE" ? (
                    <Spinner size="sm" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleConnect("MICROSOFT")}
                  disabled={isConnecting === "MICROSOFT"}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#F25022" d="M1 1h10v10H1z" />
                        <path fill="#00A4EF" d="M13 1h10v10H13z" />
                        <path fill="#7FBA00" d="M1 13h10v10H1z" />
                        <path fill="#FFB900" d="M13 13h10v10H13z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Microsoft Outlook</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getProviderCount("MICROSOFT") > 0 ? "Add another Microsoft account" : "Connect your Microsoft account"}
                      </p>
                    </div>
                  </div>
                  {isConnecting === "MICROSOFT" ? (
                    <Spinner size="sm" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleConnect("APPLE")}
                  disabled={isConnecting === "APPLE"}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#555" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Apple iCloud</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getProviderCount("APPLE") > 0 ? "Add another Apple account" : "Connect with app-specific password"}
                      </p>
                    </div>
                  </div>
                  {isConnecting === "APPLE" ? (
                    <Spinner size="sm" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </section>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">How sync works</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                    <li>Events from connected calendars appear as time blocks</li>
                    <li>Changes sync both ways (bidirectional)</li>
                    <li>Google & Microsoft: Real-time via webhooks</li>
                    <li>Apple: Updates every 10 minutes via polling</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showAppleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Connect Apple Calendar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Apple Calendar requires an app-specific password. Create one at{" "}
              <a
                href="https://appleid.apple.com/account/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                appleid.apple.com
              </a>
            </p>

            <form onSubmit={handleAppleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apple ID (Email)
                </label>
                <Input
                  type="email"
                  value={appleId}
                  onChange={(e) => setAppleId(e.target.value)}
                  placeholder="your@icloud.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  App-Specific Password
                </label>
                <Input
                  type="password"
                  value={applePassword}
                  onChange={(e) => setApplePassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAppleModal(false);
                    setAppleId("");
                    setApplePassword("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingApple}
                  className="flex-1"
                >
                  {isSubmittingApple ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Spinner size="lg" />
        </div>
      }
    >
      <CalendarSettingsContent />
    </Suspense>
  );
}
