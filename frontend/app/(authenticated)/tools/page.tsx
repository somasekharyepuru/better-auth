"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { PageHeader } from "@/components/page-header";
import { Timer, Grid3X3, BookOpen, Repeat } from "lucide-react";

const TOOLS = [
  {
    key: "pomodoro",
    name: "Pomodoro Timer",
    description: "Focus timer for deep work sessions",
    icon: Timer,
    href: "/tools/pomodoro",
    settingsKey: "pomodoroEnabled" as const,
  },
  {
    key: "matrix",
    name: "Eisenhower Matrix",
    description: "Prioritize by urgency and importance",
    icon: Grid3X3,
    href: "/tools/matrix",
    settingsKey: "eisenhowerEnabled" as const,
  },
  {
    key: "decisions",
    name: "Decision Log",
    description: "Track important decisions and context",
    icon: BookOpen,
    href: "/tools/decisions",
    settingsKey: "decisionLogEnabled" as const,
  },
  {
    key: "habits",
    name: "Work Habits",
    description: "Build streaks for daily work disciplines",
    icon: Repeat,
    href: "/tools/habits",
    settingsKey: "habitsEnabled" as const,
  },
];

export default function ToolsPage() {
  const router = useRouter();
  const { settings, isLoading: settingsLoading } = useSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.data) {
          router.push("/login");
          return;
        }
        setIsAuthenticated(true);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading || settingsLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  const enabledTools = TOOLS.filter((tool) => settings[tool.settingsKey]);

  return (
    <AuthenticatedPageShell>
      <PageHeader
        title="Tools"
        description="Productivity utilities"
        breadcrumbs={[{ label: "Tools" }]}
        className="mb-8"
      />

      {enabledTools.length === 0 ? (
        <div className="card-subtle py-16 text-center">
          <p className="text-muted">No tools enabled</p>
          <button
            type="button"
            onClick={() => router.push("/profile?tab=preferences")}
            className="text-body mt-4 underline underline-offset-2 hover:text-gray-900"
          >
            Enable tools in preferences
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enabledTools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => router.push(tool.href)}
              className="card-premium group text-left"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100/80 transition-colors group-hover:bg-gray-200/80 dark:bg-gray-800 dark:group-hover:bg-gray-700">
                <tool.icon className="text-body h-6 w-6 dark:text-gray-300" />
              </div>
              <h3 className="text-subheading mb-1 text-lg">{tool.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
            </button>
          ))}
        </div>
      )}
    </AuthenticatedPageShell>
  );
}
