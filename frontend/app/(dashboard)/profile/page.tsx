"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronRight,
  LogOut,
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
  BookOpen,
  Sun,
  Monitor,
  Calendar,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

const SECTION_OPTIONS = [
  {
    key: "priorities",
    label: "Top Priorities",
    description: "Your main focus items for the day",
  },
  {
    key: "discussion",
    label: "To Discuss",
    description: "Items to bring up in meetings",
  },
  {
    key: "schedule",
    label: "Today's Schedule",
    description: "Time blocks for your day",
  },
  { key: "notes", label: "Quick Notes", description: "Freeform notes area" },
  {
    key: "progress",
    label: "Day Progress",
    description: "Progress indicator for priorities",
  },
  {
    key: "review",
    label: "End-of-Day Review",
    description: "Daily reflection prompts",
  },
];

// Available colors for time block types
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

type TabType = "account" | "preferences";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "account",
  );
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const {
    settings,
    isLoading: isSettingsLoading,
    updateSettings,
  } = useSettings();
  const {
    types: timeBlockTypes,
    activeTypes,
    addType,
    updateType,
    deleteType,
    isLoading: isTypesLoading,
  } = useTimeBlockTypes();

  // Time block type management state
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#6366F1");
  const [isAddingType, setIsAddingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  // Settings local state
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
  const [saveMessage, setSaveMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Mount check for theme
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Sync local state with settings
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    setProfileError("");

    try {
      const result = await authClient.updateUser({ name: data.name });

      if (result.error) {
        setProfileError(result.error.message || "Failed to update profile");
        return;
      }

      addToast({
        type: "success",
        title: "Profile updated",
        duration: 3000,
      });

      if (result.data && user) {
        setUser({ ...user, ...result.data });
      }
    } catch (error) {
      setProfileError("An unexpected error occurred. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    setPasswordError("");

    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setPasswordError(result.error.message || "Failed to change password");
        return;
      }

      addToast({
        type: "success",
        title: "Password changed",
        duration: 3000,
      });

      resetPassword();
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordError("An unexpected error occurred. Please try again.");
      console.error("Password change error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      // Clear cached auth to prevent flash
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
      }
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");
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
      setSaveMessage("Settings saved successfully!");
      addToast({
        type: "success",
        title: "Preferences saved",
        duration: 3000,
      });
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setEnabledSections((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== key);
      }
      return [...prev, key];
    });
  };

  const handleAddTimeBlockType = async () => {
    if (!newTypeName.trim()) return;

    setIsAddingType(true);
    try {
      await addType({
        name: newTypeName.trim(),
        color: newTypeColor,
      });
      setNewTypeName("");
      setNewTypeColor("#6366F1");
      setShowAddType(false);
      addToast({
        type: "success",
        title: "Time block type added",
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: error.message || "Failed to add type",
        duration: 3000,
      });
    } finally {
      setIsAddingType(false);
    }
  };

  const handleDeleteTimeBlockType = async (id: string) => {
    setDeletingTypeId(id);
    try {
      await deleteType(id);
      addToast({
        type: "success",
        title: "Time block type deleted",
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: error.message || "Failed to delete type",
        duration: 3000,
      });
    } finally {
      setDeletingTypeId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-semibold text-gray-600 dark:text-gray-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {user.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          {user.emailVerified ? (
            <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Verified</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Email not verified</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
          <button
            onClick={() => handleTabChange("account")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "account"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <User className="w-4 h-4" />
            Account
          </button>
          <button
            onClick={() => handleTabChange("preferences")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "preferences"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* Account Tab Content */}
        {activeTab === "account" && (
          <div className="space-y-8">
            {/* Profile Section */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Profile
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <form
                  onSubmit={handleSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
                  {profileError && (
                    <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                      {profileError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <Input
                      {...register("name")}
                      placeholder="Your name"
                      disabled={isUpdating}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </div>
            </section>

            {/* Security Section */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Security
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl divide-y divide-gray-200 dark:divide-gray-700">
                {/* Change Password */}
                <div className="p-6">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Password
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Change your password
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        showPasswordForm ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {showPasswordForm && (
                    <form
                      onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                      className="mt-6 space-y-4"
                    >
                      {passwordError && (
                        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                          {passwordError}
                        </div>
                      )}
                      <div className="relative">
                        <Input
                          {...registerPassword("currentPassword")}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Current password"
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        {passwordErrors.currentPassword && (
                          <p className="mt-2 text-sm text-red-500">
                            {passwordErrors.currentPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          {...registerPassword("newPassword")}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New password"
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        {passwordErrors.newPassword && (
                          <p className="mt-2 text-sm text-red-500">
                            {passwordErrors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          {...registerPassword("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-2 text-sm text-red-500">
                            {passwordErrors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? "Changing..." : "Change password"}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <button
                  onClick={() => router.push("/profile/two-factor")}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Two-factor authentication
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </section>

            {/* Account Section */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Account
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Member since
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Preferences Tab Content */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            {isSettingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Calendar Integration - Temporarily hidden
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <button
                    onClick={() => router.push("/settings/calendars")}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Calendar Connections</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sync Google, Microsoft, or Apple calendars</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </section>
                */}

                {/* Theme Preferences */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sun className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Appearance
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`
                          flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all border
                          ${
                            mounted && theme === mode
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                          }
                        `}
                      >
                        {mode === "light" && <Sun className="w-4 h-4" />}
                        {mode === "dark" && <Moon className="w-4 h-4" />}
                        {mode === "system" && <Monitor className="w-4 h-4" />}
                        <span className="capitalize font-medium">{mode}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Dashboard Preferences */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <ListChecks className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Dashboard Preferences
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {SECTION_OPTIONS.map((section) => (
                      <label
                        key={section.key}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {section.label}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {section.description}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabledSections.includes(section.key)}
                          onChange={() => toggleSection(section.key)}
                          className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                        />
                      </label>
                    ))}
                  </div>
                </section>

                {/* Scheduling Preferences */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Scheduling Defaults
                    </h2>
                  </div>

                  <div className="space-y-5">
                    {/* Default Duration */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Default Duration
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          For new time blocks
                        </p>
                      </div>
                      <select
                        value={defaultDuration}
                        onChange={(e) =>
                          setDefaultDuration(Number(e.target.value))
                        }
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-300"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>

                    {/* Default Type */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Default Type
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          For new time blocks
                        </p>
                      </div>
                      <select
                        value={defaultType}
                        onChange={(e) => setDefaultType(e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-300"
                        disabled={isTypesLoading || activeTypes.length === 0}
                      >
                        {activeTypes.length === 0 ? (
                          <option value={defaultType}>{defaultType}</option>
                        ) : (
                          activeTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Time Block Types Management */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Time Block Types
                      </h2>
                    </div>
                    {!showAddType && (
                      <button
                        onClick={() => setShowAddType(true)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Type
                      </button>
                    )}
                  </div>

                  {isTypesLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Existing Types */}
                      {timeBlockTypes.map((type) => (
                        <div
                          key={type.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {type.name}
                            </span>
                            {type.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                                Default
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTimeBlockType(type.id)}
                            disabled={
                              deletingTypeId === type.id ||
                              timeBlockTypes.length <= 1
                            }
                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              timeBlockTypes.length <= 1
                                ? "Cannot delete the last type"
                                : "Delete type"
                            }
                          >
                            {deletingTypeId === type.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Add New Type Form */}
                      {showAddType && (
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 space-y-3">
                          <Input
                            type="text"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            placeholder="Type name (e.g., Research)"
                            autoFocus
                          />
                          <div>
                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_COLORS.map((color) => (
                                <button
                                  key={color.hex}
                                  type="button"
                                  onClick={() => setNewTypeColor(color.hex)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    newTypeColor === color.hex
                                      ? "border-gray-900 dark:border-white scale-110"
                                      : "border-transparent hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setShowAddType(false);
                                setNewTypeName("");
                                setNewTypeColor("#6366F1");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddTimeBlockType}
                              disabled={!newTypeName.trim() || isAddingType}
                            >
                              {isAddingType ? "Adding..." : "Add Type"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Tools Settings */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Tools
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Tools Tab Toggle */}
                    <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Show Tools Tab
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Display tools link in dashboard header
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={toolsEnabled}
                        onChange={(e) => setToolsEnabled(e.target.checked)}
                        className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                      />
                    </label>

                    {toolsEnabled && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                            Available Tools
                          </p>
                          <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <Timer className="w-5 h-5 text-blue-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Pomodoro Timer
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Focus timer for deep work
                                  </p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={pomodoroEnabled}
                                onChange={(e) =>
                                  setPomodoroEnabled(e.target.checked)
                                }
                                className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                              />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <Grid3X3 className="w-5 h-5 text-purple-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Eisenhower Matrix
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Prioritize tasks by urgency
                                  </p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={eisenhowerEnabled}
                                onChange={(e) =>
                                  setEisenhowerEnabled(e.target.checked)
                                }
                                className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                              />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-green-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Decision Log
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Track important decisions
                                  </p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={decisionLogEnabled}
                                onChange={(e) =>
                                  setDecisionLogEnabled(e.target.checked)
                                }
                                className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                              />
                            </label>
                          </div>
                        </div>

                        {pomodoroEnabled && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                              Pomodoro Settings
                            </p>
                            <div className="space-y-4">
                              {/* Sound Toggle */}
                              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Notification Sound
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Play sound when timer completes
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={pomodoroSoundEnabled}
                                  onChange={(e) =>
                                    setPomodoroSoundEnabled(e.target.checked)
                                  }
                                  className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                />
                              </label>

                              {/* Block External Calendars */}
                              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Block External Calendars
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Create busy events during focus sessions
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={focusBlocksCalendar}
                                  onChange={(e) =>
                                    setFocusBlocksCalendar(e.target.checked)
                                  }
                                  className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                />
                              </label>

                              {/* Duration Controls */}
                              <div className="pt-2">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                  Durations
                                </p>
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      Focus
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          setFocusDuration((p) =>
                                            Math.max(5, p - 5),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="w-16 text-center font-medium text-gray-900 dark:text-gray-100">
                                        {focusDuration} min
                                      </span>
                                      <button
                                        onClick={() =>
                                          setFocusDuration((p) =>
                                            Math.min(120, p + 5),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      Short Break
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          setShortBreak((p) =>
                                            Math.max(1, p - 1),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="w-16 text-center font-medium text-gray-900 dark:text-gray-100">
                                        {shortBreak} min
                                      </span>
                                      <button
                                        onClick={() =>
                                          setShortBreak((p) =>
                                            Math.min(30, p + 1),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      Long Break
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          setLongBreak((p) =>
                                            Math.max(5, p - 5),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="w-16 text-center font-medium text-gray-900 dark:text-gray-100">
                                        {longBreak} min
                                      </span>
                                      <button
                                        onClick={() =>
                                          setLongBreak((p) =>
                                            Math.min(60, p + 5),
                                          )
                                        }
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>

                {/* Review Preferences */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Moon className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Review Preferences
                    </h2>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        End-of-Day Review
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable daily reflection prompts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reviewEnabled}
                      onChange={(e) => setReviewEnabled(e.target.checked)}
                      className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                    />
                  </label>
                </section>

                {/* Daily Behavior */}
                <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Daily Behavior
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-carry unfinished
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Move incomplete priorities to next day
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoCarry}
                        onChange={(e) => setAutoCarry(e.target.checked)}
                        className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-create next day
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Automatically prepare tomorrow's dashboard
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoCreate}
                        onChange={(e) => setAutoCreate(e.target.checked)}
                        className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                      />
                    </label>
                  </div>
                </section>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4 mt-4">
                  {saveMessage && (
                    <p
                      className={`text-sm ${
                        saveMessage.includes("Failed")
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {saveMessage}
                    </p>
                  )}
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Wrap in Suspense for useSearchParams() support in Next.js 15
export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Spinner size="lg" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
