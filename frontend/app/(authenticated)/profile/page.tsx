"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Trash2,
  MonitorPlay,
  History,
  KeyRound,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

function ProfileContent() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState("");
  const router = useRouter();
  const { addToast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.data) {
          router.push("/login");
          return;
        }
        const userData = sessionData.data.user;
        setUser(userData);
        reset({ name: userData.name });
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, reset]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    setProfileError("");
    try {
      const result = await authClient.updateUser({ name: data.name });
      if (result.error) {
        setProfileError(result.error.message || "Failed to update profile");
        return;
      }
      addToast({ type: "success", title: "Profile updated", duration: 3000 });
      if (result.data && user) {
        setUser({ ...user, ...result.data });
      }
    } catch {
      setProfileError("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {user?.emailVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Email verified
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Email not verified
                    </span>
                  )}
                </p>
              </div>
              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Spinner size="sm" className="mr-2" /> : null}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Account</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/profile/two-factor", icon: Shield, label: "Two-Factor Authentication", desc: "Add extra security" },
              { href: "/profile/sessions", icon: MonitorPlay, label: "Active Sessions", desc: "Manage logged in devices" },
              { href: "/profile/activity", icon: History, label: "Security Activity", desc: "View login history" },
              { href: "/profile/change-password", icon: KeyRound, label: "Change Password", desc: "Update your password" },
              { href: "/profile/delete-account", icon: Trash2, label: "Delete Account", desc: "Permanently delete your account", danger: true },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  item.danger
                    ? "border-destructive/20 hover:bg-destructive/10 text-destructive"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
              <CardDescription>Manage your team workspaces</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/profile/organizations"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <span className="font-medium text-sm">View Organizations</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
