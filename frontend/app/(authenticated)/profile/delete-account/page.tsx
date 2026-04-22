"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, Trash2, ShieldAlert } from "lucide-react"
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
import { cn } from "@/lib/utils"
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

const steps = [
  { label: "Request deletion", desc: "Initiate the process" },
  { label: "Confirm via email", desc: "Verify your identity" },
  { label: "Grace period", desc: "30 days to change your mind" },
]

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
        { method: "POST", credentials: "include" }
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
      toast.error("Confirmation token is required")
      return
    }
    setActionLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/execute/${confirmationToken}`,
        { method: "POST", credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to execute deletion")

      try { await authClient.signOut() } catch { /* account already gone */ }
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active request warning banner */}
      {status?.hasActiveRequest && status.status !== "deleted" && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Account deletion in progress</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {status.expiresAt
                ? <>Scheduled for permanent deletion on <strong>{new Date(status.expiresAt).toLocaleDateString()}</strong>.</>
                : "Your account deletion is in progress."}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Permanently remove your account and all associated data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step indicators */}
          <div className="flex items-center gap-0">
            {steps.map((s, i) => {
              const stepNum = i + 1
              const isCompleted = step > stepNum
              const isActive = step === stepNum
              const isLast = i === steps.length - 1
              return (
                <div key={s.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                      isCompleted && "bg-green-500 text-white",
                      isActive && stepNum === 3 ? "bg-warning text-warning-foreground" : isActive ? "bg-primary text-primary-foreground" : "",
                      !isCompleted && !isActive && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNum === 3 && isActive ? "!" : stepNum}
                    </div>
                    <div className="text-center">
                      <p className={cn("text-xs font-medium leading-tight", isActive ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                      <p className="text-xs text-muted-foreground/70 leading-tight hidden sm:block">{s.desc}</p>
                    </div>
                  </div>
                  {!isLast && (
                    <div className={cn("flex-1 h-0.5 mx-2 mb-5 transition-colors", isCompleted ? "bg-green-500/50" : "bg-border")} />
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Step 1: Initiate */}
          {step === 1 && !status?.hasActiveRequest && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Before you continue:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "All your personal data will be permanently deleted",
                    "You will lose access to all organizations and teams",
                    "This action cannot be undone after the 30-day grace period",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleRequestDeletion}
                disabled={actionLoading}
                variant="destructive"
                className="w-full"
              >
                {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Request account deletion
              </Button>
            </div>
          )}

          {/* Step 2: Confirm token */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-xs text-muted-foreground">
                  We've sent a confirmation token to your email address. Enter it below to proceed.
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={confirmationToken}
                  onChange={(e) => setConfirmationToken(e.target.value)}
                  placeholder="Paste confirmation token from email"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmDeletion}
                  disabled={actionLoading || !confirmationToken}
                  variant="destructive"
                  className="flex-1"
                >
                  {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Confirm deletion
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

          {/* Step 3: Grace period */}
          {step === 3 && (
            <div className="space-y-5">
              {status?.canCancel ? (
                <>
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Your account is scheduled for deletion</p>
                      {status.expiresAt && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Permanent deletion on {new Date(status.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleCancelDeletion}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                      Cancel deletion request
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Delete immediately</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Paste your confirmation token to delete your account right now. This cannot be undone.
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
                      {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                      Delete my account now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-8 w-8 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">Deletion cannot be cancelled</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {status?.expiresAt
                        ? `Grace period expired on ${new Date(status.expiresAt).toLocaleDateString()}.`
                        : "The grace period has expired and your account deletion is final."}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If you believe this is an error, please contact support.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
        After deletion, your account and all personal data are permanently removed. You have 30 days to cancel after confirming.
      </div>
    </div>
  )
}
