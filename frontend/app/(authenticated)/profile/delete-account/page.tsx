"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
interface DeletionStatus {
  hasActiveRequest: boolean
  status?: string
  requestedAt?: string
  confirmedAt?: string
  expiresAt?: string
  canCancel?: boolean
}

export default function DeleteAccountPage() {
  const router = useRouter()
  const [status, setStatus] = useState<DeletionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [confirmationToken, setConfirmationToken] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/status`, {
        credentials: "include",
      })

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to fetch status")

      const data = await response.json()
      setStatus(data)

      if (data.hasActiveRequest && data.status === "confirmed") {
        setStep(3)
      } else if (data.hasActiveRequest && data.status === "pending") {
        setStep(2)
      }
    } catch {
      toast.error("Failed to load status")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestDeletion = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/request`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to request deletion")

      // The confirmation token is delivered via email only (not in this response)
      // for security; the user must paste it from their inbox in step 2.
      setConfirmationToken("")
      setStep(2)
      await fetchStatus()
      toast.success("Confirmation email sent. Check your inbox.")
    } catch {
      toast.error("Failed to request deletion")
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDeletion = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/confirm/${confirmationToken}`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!response.ok) throw new Error("Failed to confirm deletion")

      setStep(3)
      await fetchStatus()
    } catch {
      toast.error("Failed to confirm deletion")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/cancel`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to cancel deletion")

      setConfirmationToken("")
      setStep(1)
      await fetchStatus()
      toast.success("Deletion cancelled")
    } catch {
      toast.error("Failed to cancel deletion")
    } finally {
      setActionLoading(false)
    }
  }

  const handleExecuteDeletion = async () => {
    if (!confirmationToken) {
      toast.error("Confirmation token is required to delete now")
      return
    }
    setActionLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/execute/${confirmationToken}`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!response.ok) throw new Error("Failed to execute deletion")

      // Sign out locally and bounce to the login page. The user no longer
      // exists server-side, so the next request would 401 anyway.
      try {
        await authClient.signOut()
      } catch {
        // Ignore sign-out failures — the account is already gone.
      }
      toast.success("Your account has been permanently deleted")
      router.replace("/login")
    } catch {
      toast.error("Failed to execute deletion")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
          {status?.hasActiveRequest && status.status !== "deleted" && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Account deletion in progress</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {status.expiresAt ? (
                      <>
                        Your account will be permanently deleted on{" "}
                        <strong>{new Date(status.expiresAt).toLocaleDateString()}</strong>.
                      </>
                    ) : (
                      "Your account deletion is in progress."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Deletion Process</CardTitle>
              <CardDescription>
                {step === 1 && "Initiate account deletion"}
                {step === 2 && "Verify your request"}
                {step === 3 && "Grace period - you can still cancel"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step > 1 ? "bg-success text-success-foreground" : step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Request Deletion</p>
                    <p className="text-muted-foreground">Initiate account deletion</p>
                  </div>
                </div>
                <div className="h-0.5 flex-1 bg-border" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step > 2 ? "bg-success text-success-foreground" : step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > 2 ? <Check className="h-4 w-4" /> : "2"}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Confirm via Email</p>
                    <p className="text-muted-foreground">Verify your request</p>
                  </div>
                </div>
                <div className="h-0.5 flex-1 bg-border" />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 3 ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step === 3 ? "!" : "3"}
                </div>
                <div className="text-sm">
                  <p className="font-medium">Grace Period</p>
                  <p className="text-muted-foreground">30 days to change your mind</p>
                </div>
              </div>

              <Separator />

              {step === 1 && !status?.hasActiveRequest && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Before you delete your account:</p>
                    <ul className="space-y-2 pl-4">
                      <li className="flex gap-2">
                        <span className="text-destructive">•</span>
                        All your personal data will be permanently deleted
                      </li>
                      <li className="flex gap-2">
                        <span className="text-destructive">•</span>
                        You will lose access to all organizations and teams
                      </li>
                      <li className="flex gap-2">
                        <span className="text-destructive">•</span>
                        This action cannot be undone after the grace period
                      </li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleRequestDeletion}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading ? "Processing..." : "Request Account Deletion"}
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-xs text-muted-foreground">
                      We've sent a confirmation email with a token. Enter it below to confirm.
                    </p>
                  </div>
                  <Input
                    type="text"
                    value={confirmationToken}
                    onChange={(e) => setConfirmationToken(e.target.value)}
                    placeholder="Enter confirmation token"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConfirmDeletion}
                      disabled={actionLoading || !confirmationToken}
                      variant="destructive"
                      className="flex-1"
                    >
                      {actionLoading ? "Confirming..." : "Confirm Deletion"}
                    </Button>
                    <Button
                      onClick={handleCancelDeletion}
                      disabled={actionLoading}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-center">
                  {status?.canCancel ? (
                    <>
                      <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Your account will be deleted soon</p>
                        <p className="text-xs text-muted-foreground">
                          On {status.expiresAt && new Date(status.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={handleCancelDeletion}
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full"
                      >
                        {actionLoading ? "Cancelling..." : "Cancel Deletion Request"}
                      </Button>

                      <Separator />

                      <div className="space-y-3 text-left">
                        <div>
                          <p className="text-sm font-medium">Don't want to wait?</p>
                          <p className="text-xs text-muted-foreground">
                            Paste your confirmation token from the email to permanently delete your account right now. This signs you out and cannot be undone.
                          </p>
                        </div>
                        <Input
                          type="text"
                          value={confirmationToken}
                          onChange={(e) => setConfirmationToken(e.target.value)}
                          placeholder="Confirmation token from email"
                        />
                        <Button
                          onClick={handleExecuteDeletion}
                          disabled={actionLoading || !confirmationToken}
                          variant="destructive"
                          className="w-full"
                        >
                          {actionLoading ? "Deleting..." : "Delete My Account Now"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                        <Trash2 className="w-8 h-8 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Deletion cannot be cancelled</p>
                        <p className="text-xs text-muted-foreground">
                          {status?.expiresAt
                            ? `Grace period expired on ${new Date(status.expiresAt).toLocaleDateString()}`
                            : "The grace period has expired and your account deletion is final."}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        If you believe this is an error, please contact support for assistance.
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            After deletion, your account and all personal data are permanently removed. You cannot recover your account after the grace period.
          </div>
        </div>
    </>
  )
}
