"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { useTimeBlockTypes } from "@/lib/time-block-types-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings,
  ListChecks,
  Clock,
  Moon,
  Zap,
  Wrench,
  Timer,
  Grid3X3,
  Sun,
  Monitor,
  Calendar,
  Plus,
  Trash2,
  MonitorPlay,
  History,
  KeyRound,
  Building2,
  ChevronRight,
} from "lucide-react";
import { SettingsSidebar, type SettingsNavItem } from "@/components/settings-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const SECTION_OPTIONS = [
  { key: "priorities", label: "Top Priorities", description: "Main focus items" },
  { key: "discussion", label: "To Discuss", description: "Meeting items" },
  { key: "schedule", label: "Today's Schedule", description: "Time blocks" },
  { key: "notes", label: "Quick Notes", description: "Freeform notes" },
  { key: "progress", label: "Day Progress", description: "Priority progress" },
  { key: "review", label: "End-of-Day Review", description: "Daily reflection" },
];

const AVAILABLE_COLORS = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Red", hex: "#EF4444" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Orange", hex: "#F97316" },
];

const settingsNavItems: SettingsNavItem[] = [
  { title: "Profile", href: "/profile", icon: User, description: "Your account info" },
  { title: "Preferences", href: "/profile?tab=preferences", icon: Settings, description: "App settings" },
  { title: "Two-Factor Auth", href: "/profile/two-factor", icon: Shield, description: "2FA settings" },
  { title: "Active Sessions", href: "/profile/sessions", icon: MonitorPlay, description: "Manage sessions" },
  { title: "Security Activity", href: "/profile/activity", icon: History, description: "Login history" },
  { title: "Change Password", href: "/profile/change-password", icon: KeyRound, description: "Update password" },
  { title: "Delete Account", href: "/profile/delete-account", icon: Trash2, description: "Permanently delete" },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, isLoading: isSettingsLoading, updateSettings } = useSettings();
  const { types: timeBlockTypes, activeTypes, addType, updateType, deleteType, isLoading: isTypesLoading } = useTimeBlockTypes();

  const activeTab = searchParams.get("tab") || "account";
  const isPreferences = activeTab === "preferences";

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#6366F1");
  const [isAddingType, setIsAddingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  const [enabledSections, setEnabledSections] = useState<string[]>([]);
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [defaultType, setDefaultType] = useState("Deep Work");
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [autoCarry, setAutoCarry] = useState(true);
  const [autoCreate, setAutoCreate] = useState(true);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(true);
  const [eisenhowerEnabled, setEisenhowerEnabled] = useState(true);
  const [decisionLogEnabled, setDecisionLogEnabled] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [pomodoroSoundEnabled, setPomodoroSoundEnabled] = useState(true);
  const [focusBlocksCalendar, setFocusBlocksCalendar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => { setMounted(true); }, []);

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
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, reset]);

  useEffect(() => {
    if (settings) {
      setEnabledSections(settings.enabledSections);
      setDefaultDuration(settings.defaultTimeBlockDuration);
      setDefaultType(settings.defaultTimeBlockType);
      setReviewEnabled(settings.endOfDayReviewEnabled);
      setAutoCarry(settings.autoCarryForward);
      setAutoCreate(settings.autoCreateNextDay);
      setToolsEnabled(settings.toolsTabEnabled);
      setPomodoroEnabled(settings.pomodoroEnabled);
      setEisenhowerEnabled(settings.eisenhowerEnabled);
      setDecisionLogEnabled(settings.decisionLogEnabled);
      setFocusDuration(settings.pomodoroFocusDuration);
      setShortBreak(settings.pomodoroShortBreak);
      setLongBreak(settings.pomodoroLongBreak);
      setPomodoroSoundEnabled(settings.pomodoroSoundEnabled);
      setFocusBlocksCalendar(settings.focusBlocksCalendar);
    }
  }, [settings]);

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
    } catch (error) {
      setProfileError("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        enabledSections,
        defaultTimeBlockDuration: defaultDuration,
        defaultTimeBlockType: defaultType,
        endOfDayReviewEnabled: reviewEnabled,
        autoCarryForward: autoCarry,
        autoCreateNextDay: autoCreate,
        toolsTabEnabled: toolsEnabled,
        pomodoroEnabled,
        eisenhowerEnabled,
        decisionLogEnabled,
        pomodoroFocusDuration: focusDuration,
        pomodoroShortBreak: shortBreak,
        pomodoroLongBreak: longBreak,
        pomodoroSoundEnabled,
        focusBlocksCalendar,
      });
      addToast({ type: "success", title: "Preferences saved", duration: 3000 });
    } catch (error) {
      addToast({ type: "error", title: "Failed to save preferences", duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    setIsAddingType(true);
    try {
      await addType({ name: newTypeName.trim(), color: newTypeColor });
      setNewTypeName("");
      setNewTypeColor("#6366F1");
      setShowAddType(false);
    } catch (error) {
      addToast({ type: "error", title: "Failed to add type", duration: 3000 });
    } finally {
      setIsAddingType(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    setDeletingTypeId(id);
    try {
      await deleteType(id);
    } catch (error) {
      addToast({ type: "error", title: "Failed to delete type", duration: 3000 });
    } finally {
      setDeletingTypeId(null);
    }
  };

  const toggleSection = (key: string) => {
    setEnabledSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <SettingsSidebar items={settingsNavItems} basePath="/profile" title="Settings">
      <div className="space-y-6">
        {isPreferences ? (
          <>
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Daymark looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select your preferred theme</p>
                    <div className="flex gap-2">
                      {[
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark", icon: Moon, label: "Dark" },
                        { value: "system", icon: Monitor, label: "System" },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                            theme === value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Dashboard Sections
                </CardTitle>
                <CardDescription>Choose which sections appear on your dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SECTION_OPTIONS.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => toggleSection(section.key)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        enabledSections.includes(section.key)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        enabledSections.includes(section.key)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}>
                        {enabledSections.includes(section.key) && (
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Productivity Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Productivity Tools
                </CardTitle>
                <CardDescription>Enable or disable productivity features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Tools Tab</Label>
                    <p className="text-xs text-muted-foreground">Show Tools in navigation</p>
                  </div>
                  <Checkbox checked={toolsEnabled} onCheckedChange={(v) => setToolsEnabled(!!v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Pomodoro Timer</Label>
                    <p className="text-xs text-muted-foreground">Focus timer with breaks</p>
                  </div>
                  <Checkbox checked={pomodoroEnabled} onCheckedChange={(v) => setPomodoroEnabled(!!v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Eisenhower Matrix</Label>
                    <p className="text-xs text-muted-foreground">Priority matrix view</p>
                  </div>
                  <Checkbox checked={eisenhowerEnabled} onCheckedChange={(v) => setEisenhowerEnabled(!!v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Decision Log</Label>
                    <p className="text-xs text-muted-foreground">Track decisions</p>
                  </div>
                  <Checkbox checked={decisionLogEnabled} onCheckedChange={(v) => setDecisionLogEnabled(!!v)} />
                </div>
              </CardContent>
            </Card>

            {/* Pomodoro Settings */}
            {pomodoroEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Pomodoro Settings
                  </CardTitle>
                  <CardDescription>Customize your focus timer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Focus (min)</Label>
                      <Input
                        type="number"
                        value={focusDuration}
                        onChange={(e) => setFocusDuration(Number(e.target.value))}
                        min={1}
                        max={120}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Short Break</Label>
                      <Input
                        type="number"
                        value={shortBreak}
                        onChange={(e) => setShortBreak(Number(e.target.value))}
                        min={1}
                        max={30}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Long Break</Label>
                      <Input
                        type="number"
                        value={longBreak}
                        onChange={(e) => setLongBreak(Number(e.target.value))}
                        min={1}
                        max={60}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Sound Notifications</Label>
                      <p className="text-xs text-muted-foreground">Play sound when timer ends</p>
                    </div>
                    <Checkbox checked={pomodoroSoundEnabled} onCheckedChange={(v) => setPomodoroSoundEnabled(!!v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Block Calendar During Focus</Label>
                      <p className="text-xs text-muted-foreground">Mark focus time on calendar</p>
                    </div>
                    <Checkbox checked={focusBlocksCalendar} onCheckedChange={(v) => setFocusBlocksCalendar(!!v)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time Block Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Time Block Types
                </CardTitle>
                <CardDescription>Manage custom time block categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeBlockTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="font-medium text-sm">{type.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteType(type.id)}
                        disabled={deletingTypeId === type.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {showAddType ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed">
                      <div className="flex gap-1">
                        {AVAILABLE_COLORS.map((color) => (
                          <button
                            key={color.hex}
                            onClick={() => setNewTypeColor(color.hex)}
                            className={cn(
                              "w-5 h-5 rounded-full transition-transform",
                              newTypeColor === color.hex && "scale-125 ring-2 ring-offset-1"
                            )}
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                      <Input
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Type name..."
                        className="flex-1 h-8"
                        onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                      />
                      <Button size="sm" onClick={handleAddType} disabled={isAddingType}>
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddType(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddType(true)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-dashed w-full text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Type
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Behavior */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Behavior
                </CardTitle>
                <CardDescription>Automation and daily workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto Carry Forward</Label>
                    <p className="text-xs text-muted-foreground">Move incomplete items to next day</p>
                  </div>
                  <Checkbox checked={autoCarry} onCheckedChange={(v) => setAutoCarry(!!v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto Create Next Day</Label>
                    <p className="text-xs text-muted-foreground">Create next day entry automatically</p>
                  </div>
                  <Checkbox checked={autoCreate} onCheckedChange={(v) => setAutoCreate(!!v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">End-of-Day Review</Label>
                    <p className="text-xs text-muted-foreground">Show review prompts at day end</p>
                  </div>
                  <Checkbox checked={reviewEnabled} onCheckedChange={(v) => setReviewEnabled(!!v)} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Default Time Block Duration</Label>
                  <p className="text-xs text-muted-foreground mb-2">Default duration in minutes</p>
                  <Input
                    type="number"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(Number(e.target.value))}
                    min={15}
                    max={480}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={isSaving}>
                {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                Save Preferences
              </Button>
            </div>
          </>
        ) : (
          <>
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

            {/* Organizations */}
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
                  href="/organizations"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-sm">View Organizations</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SettingsSidebar>
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
