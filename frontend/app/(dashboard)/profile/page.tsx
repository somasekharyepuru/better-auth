"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Lock,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "account" | "settings"
  >("account");
  const [activeAccountTab, setActiveAccountTab] = useState<
    "profile" | "password" | "2fa"
  >("profile");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

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
        reset({
          name: userData.name,
          email: userData.email,
        });
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
  }, [router, reset, addToast]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      // Use Better Auth's built-in updateUser method
      const result = await authClient.updateUser({
        name: data.name,
        // Note: Email changes require special handling in Better Auth
        // We'll handle email separately if it changed
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update profile");
      }

      // Handle email change separately if needed
      if (data.email !== user?.email) {
        const emailResult = await authClient.changeEmail({
          newEmail: data.email,
          callbackURL: "/profile",
        });

        if (emailResult.error) {
          // Name was updated but email failed
          addToast({
            type: "warning",
            title: "Partial Update",
            description:
              "Name updated successfully, but email change failed. Please try again.",
          });
        } else {
          addToast({
            type: "info",
            title: "Email Verification Required",
            description:
              "Name updated. Please check your new email to verify the email change.",
          });
        }
      } else {
        addToast({
          type: "success",
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }

      // Update local user state
      if (result.data && user) {
        setUser({ ...user, ...result.data });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      addToast({
        type: "error",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error updating your profile. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      // Use Better Auth's built-in changePassword method
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true, // Invalidate other sessions for security
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }

      addToast({
        type: "success",
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      resetPassword();
    } catch (error) {
      console.error("Password change error:", error);
      addToast({
        type: "error",
        title: "Password Change Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error changing your password. Please try again.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      addToast({
        type: "success",
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      addToast({
        type: "error",
        title: "Sign Out Failed",
        description: "There was an error signing you out. Please try again.",
      });
    }
  };

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
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Personal settings for this workspace
              </h3>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSidebarTab("account")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md text-sm font-medium ${
                    activeSidebarTab === "account"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </button>
                <button
                  onClick={() => setActiveSidebarTab("settings")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md text-sm font-medium ${
                    activeSidebarTab === "settings"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>

              {/* Sign Out Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSidebarTab === "account" && (
              <div className="space-y-6">
                {/* Account Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveAccountTab("profile")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAccountTab === "profile"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => setActiveAccountTab("password")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAccountTab === "password"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => setActiveAccountTab("2fa")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAccountTab === "2fa"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      2FA
                    </button>
                  </nav>
                </div>

                {/* Update Profile Tab */}
                {activeAccountTab === "profile" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <User className="w-5 h-5" />
                            <span>Personal Information</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                          >
                            <div>
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Full Name
                              </label>
                              <Input
                                id="name"
                                {...register("name")}
                                placeholder="Enter your full name"
                                className={errors.name ? "border-red-500" : ""}
                              />
                              {errors.name && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors.name.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Email Address
                              </label>
                              <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                placeholder="Enter your email address"
                                className={errors.email ? "border-red-500" : ""}
                              />
                              {errors.email && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors.email.message}
                                </p>
                              )}
                              {!user.emailVerified && (
                                <p className="text-amber-600 text-sm mt-1 flex items-center space-x-1">
                                  <Mail className="w-4 h-4" />
                                  <span>Email not verified</span>
                                </p>
                              )}
                            </div>

                            <div className="pt-4">
                              <Button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full"
                              >
                                {isUpdating ? (
                                  <>
                                    <Spinner size="sm" className="mr-2" />
                                    Updating...
                                  </>
                                ) : (
                                  "Update Profile"
                                )}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>

                      {/* Account Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              User ID
                            </span>
                            <p className="text-gray-900 font-mono text-xs break-all">
                              {user.id}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Role
                            </span>
                            <p className="text-gray-900 capitalize">
                              {user.role || "user"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Email Status
                            </span>
                            <p
                              className={`${
                                user.emailVerified
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {user.emailVerified ? "Verified" : "Not Verified"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Member Since</span>
                            </span>
                            <p className="text-gray-900">
                              {new Date(user.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Email Verification */}
                    {!user.emailVerified && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Mail className="w-5 h-5" />
                            <span>Email Verification</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">
                            Your email address is not verified. Please verify
                            your email to secure your account.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => router.push("/verify-email")}
                          >
                            Verify Email
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Change Password Tab */}
                {activeAccountTab === "password" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Lock className="w-5 h-5" />
                          <span>Change Password</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form
                          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                          className="space-y-4"
                        >
                          {/* Current Password */}
                          <div>
                            <label
                              htmlFor="currentPassword"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Current Password
                            </label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                {...registerPassword("currentPassword")}
                                placeholder="Enter your current password"
                                className={
                                  passwordErrors.currentPassword
                                    ? "border-red-500 pr-12"
                                    : "pr-12"
                                }
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.currentPassword && (
                              <p className="text-red-600 text-sm mt-1">
                                {passwordErrors.currentPassword.message}
                              </p>
                            )}
                          </div>

                          {/* New Password */}
                          <div>
                            <label
                              htmlFor="newPassword"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              New Password
                            </label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                {...registerPassword("newPassword")}
                                placeholder="Enter your new password"
                                className={
                                  passwordErrors.newPassword
                                    ? "border-red-500 pr-12"
                                    : "pr-12"
                                }
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <p className="text-red-600 text-sm mt-1">
                                {passwordErrors.newPassword.message}
                              </p>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...registerPassword("confirmPassword")}
                                placeholder="Confirm your new password"
                                className={
                                  passwordErrors.confirmPassword
                                    ? "border-red-500 pr-12"
                                    : "pr-12"
                                }
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="text-red-600 text-sm mt-1">
                                {passwordErrors.confirmPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="pt-4">
                            <Button
                              type="submit"
                              disabled={isChangingPassword}
                              className="w-full"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Changing Password...
                                </>
                              ) : (
                                "Change Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Two-Factor Authentication Tab */}
                {activeAccountTab === "2fa" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Two-Factor Authentication</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">
                          Add an extra layer of security to your account with
                          two-factor authentication.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/profile/two-factor")}
                        >
                          Manage 2FA
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeSidebarTab === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Settings and preferences will be available here in future
                      updates.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
