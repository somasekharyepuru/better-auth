"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { LoadingButton } from "@/components/ui/loading-button"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { sessionManagementApi } from "@/lib/session-management-api"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionActionLoading, setIsSessionActionLoading] = useState(false)
  const [isRevokeSessionsDialogOpen, setIsRevokeSessionsDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const router = useRouter()

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true)

    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      if (result.error) {
        toast.error("Failed to change password", {
          description: result.error.message,
        })
        return
      }

      toast.success("Password changed successfully")
      form.reset()
      setIsRevokeSessionsDialogOpen(true)
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeepSessions = () => {
    setIsRevokeSessionsDialogOpen(false)
    router.push("/profile")
  }

  const handleRevokeAllExceptThis = async () => {
    setIsSessionActionLoading(true)
    try {
      await sessionManagementApi.revokeAllExceptCurrent()
      toast.success("All other sessions were revoked")
      setIsRevokeSessionsDialogOpen(false)
      router.push("/profile")
    } catch (error) {
      toast.error("Failed to revoke other sessions", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSessionActionLoading(false)
    }
  }

  const handleRevokeAllSessions = async () => {
    setIsSessionActionLoading(true)
    try {
      await sessionManagementApi.revokeAllIncludingCurrent()
      toast.success("All sessions were revoked. Please sign in again.")
      setIsRevokeSessionsDialogOpen(false)
      window.location.href = "/login"
    } catch (error) {
      toast.error("Failed to revoke all sessions", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
      setIsSessionActionLoading(false)
    }
  }

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          disabled={isLoading}
                          className="pr-9"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          disabled={isLoading}
                          className="pr-9"
                          autoComplete="new-password"
                          onChange={(e) => {
                            field.onChange(e)
                            setNewPassword(e.target.value)
                          }}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <PasswordStrengthMeter password={newPassword} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          disabled={isLoading}
                          className="pr-9"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                className="w-full"
                isLoading={isLoading}
                loadingText="Changing..."
              >
                Change password
              </LoadingButton>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Use a strong password with a mix of uppercase, lowercase, numbers, and special characters.
      </div>
    </div>
  )

  return (
    <>
      {content}
      <Dialog
        open={isRevokeSessionsDialogOpen}
        onOpenChange={(open) => {
          if (!isSessionActionLoading) {
            setIsRevokeSessionsDialogOpen(open)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password changed</DialogTitle>
            <DialogDescription>
              For better account security, do you want to sign out other devices now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <LoadingButton
              type="button"
              variant="destructive"
              className="w-full"
              isLoading={isSessionActionLoading}
              loadingText="Revoking sessions..."
              onClick={handleRevokeAllSessions}
              disabled={isSessionActionLoading}
            >
              Revoke all sessions
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              className="w-full"
              isLoading={isSessionActionLoading}
              loadingText="Revoking sessions..."
              onClick={handleRevokeAllExceptThis}
              disabled={isSessionActionLoading}
            >
              Revoke all except this device
            </LoadingButton>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleKeepSessions}
              disabled={isSessionActionLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
