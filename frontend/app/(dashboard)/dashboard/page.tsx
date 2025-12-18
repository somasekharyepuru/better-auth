"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();

        if (!sessionData?.data) {
          router.push("/login");
          return;
        }

        setUser(sessionData?.data?.user);
      } catch (error) {
        console.error("Auth check error:", error);
        addToast({
          type: "error",
          title: "Authentication Error",
          description: "Please sign in again to continue.",
        });
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Ready to boost your productivity today? Let's get things done.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tasks Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">
                  Ready to add your first task?
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0%</div>
                <p className="text-xs text-gray-500">
                  Set your first goal to get started
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">--</div>
                <p className="text-xs text-gray-500">
                  Complete tasks to see your score
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Get Started with Personal Productivity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    📝 Add your first task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    🎯 Set a goal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    📊 View analytics
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Start with 3-5 tasks for today</li>
                  <li>• Set realistic, achievable goals</li>
                  <li>• Review your progress weekly</li>
                  <li>• Use time blocking for focus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
