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
  Calendar,
  Lock,
  ImageIcon,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const avatarSchema = z.object({
  imageUrl: z.string().url("Please enter a valid URL").or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AvatarFormData = z.infer<typeof avatarSchema>;

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMemberSince(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const securityLinks = [
  { href: "/profile/two-factor", icon: Shield, label: "Two-Factor Authentication", desc: "Add an extra layer of security to your account" },
  { href: "/profile/sessions", icon: MonitorPlay, label: "Active Sessions", desc: "View and manage devices logged into your account" },
  { href: "/profile/activity", icon: History, label: "Security Activity", desc: "Review recent login and security events" },
  { href: "/profile/change-password", icon: KeyRound, label: "Change Password", desc: "Update your account password" },
  { href: "/profile/delete-account", icon: Trash2, label: "Delete Account", desc: "Permanently remove your account and all data", danger: true },
];

function ProfileContent() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Avatar state
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const router = useRouter();
  const { addToast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const avatarForm = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: { imageUrl: "" },
  });

  const nameValue = watch("name");
  const avatarUrlValue = avatarForm.watch("imageUrl");

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
        if (userData.image) {
          avatarForm.setValue("imageUrl", userData.image);
          setAvatarPreview(userData.image);
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, reset, avatarForm]);

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

  const onAvatarSubmit = async (data: AvatarFormData) => {
    setIsUpdatingAvatar(true);
    try {
      const result = await authClient.updateUser({ image: data.imageUrl || null });
      if (result.error) {
        addToast({ type: "error", title: result.error.message || "Failed to update avatar", duration: 3000 });
        return;
      }
      addToast({ type: "success", title: "Avatar updated", duration: 3000 });
      if (user) {
        setUser({ ...user, image: data.imageUrl || null });
        setAvatarPreview(data.imageUrl);
      }
      setShowAvatarForm(false);
    } catch {
      addToast({ type: "error", title: "An unexpected error occurred.", duration: 3000 });
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const displayName = nameValue || user?.name || "";
  const currentAvatar = avatarPreview || user?.image || "";

  return (
    <div className="space-y-6">
      {/* Avatar hero card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* Clickable avatar */}
            <div className="relative group w-fit">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md ring-1 ring-border">
                <AvatarImage src={currentAvatar || undefined} alt={displayName} />
                <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                  {displayName ? getInitials(displayName) : "?"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowAvatarForm((v) => !v)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change avatar"
              >
                <ImageIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex-1 space-y-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold leading-none">{user?.name}</h2>
                {user?.role === "admin" && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                {user?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {formatMemberSince(user.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Avatar URL form */}
          {showAvatarForm && (
            <div className="mt-4 pt-4 border-t">
              <form onSubmit={avatarForm.handleSubmit(onAvatarSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Avatar Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      {...avatarForm.register("imageUrl")}
                      placeholder="https://example.com/avatar.jpg"
                      className="flex-1"
                      onChange={(e) => {
                        avatarForm.setValue("imageUrl", e.target.value);
                        setAvatarPreview(e.target.value);
                      }}
                    />
                    <Button type="submit" size="sm" disabled={isUpdatingAvatar}>
                      {isUpdatingAvatar ? <Spinner size="sm" /> : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAvatarForm(false);
                        setAvatarPreview(user?.image || "");
                        avatarForm.setValue("imageUrl", user?.image || "");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {avatarForm.formState.errors.imageUrl && (
                    <p className="text-xs text-destructive">{avatarForm.formState.errors.imageUrl.message}</p>
                  )}
                  {avatarUrlValue && (
                    <p className="text-xs text-muted-foreground">Preview updating in the avatar above</p>
                  )}
                </div>
                {user?.image && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      avatarForm.setValue("imageUrl", "");
                      setAvatarPreview("");
                    }}
                  >
                    Remove current avatar
                  </button>
                )}
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name form */}
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Your name"
                  className="flex-1"
                />
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? <Spinner size="sm" className="mr-2" /> : null}
                  Save
                </Button>
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}
            </div>
          </form>

          <div className="border-t" />

          {/* Email — read only */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="relative">
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted pr-10"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                {user?.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.emailVerified
                ? <span className="text-green-600">Email verified</span>
                : <span className="text-amber-600">Email not verified</span>
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security & Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Security & Account</CardTitle>
              <CardDescription>Manage your account security and access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {securityLinks.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-6 py-4 transition-colors",
                  item.danger ? "hover:bg-destructive/5 group" : "hover:bg-muted/50",
                  i === securityLinks.length - 1 && "rounded-b-lg"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    item.danger ? "bg-destructive/10 group-hover:bg-destructive/15" : "bg-muted"
                  )}>
                    <item.icon className={cn("h-4 w-4", item.danger ? "text-destructive" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", item.danger && "text-destructive")}>{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  item.danger ? "text-destructive/50" : "text-muted-foreground"
                )} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organizations — admin only */}
      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Manage your team workspaces</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href="/profile/organizations"
              className="flex items-center justify-between px-6 py-4 rounded-b-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">View Organizations</p>
                <p className="text-xs text-muted-foreground">Browse and manage all your organizations</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
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
