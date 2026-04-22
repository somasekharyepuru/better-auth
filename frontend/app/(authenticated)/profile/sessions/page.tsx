"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { MonitorPlay, Info, Smartphone, Laptop, Globe, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/components/session-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Session {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  ipAddress: string | null
  userAgent: string | null
  device: string | null
  isCurrent: boolean
}

type DeviceFilter = "all" | "mobile" | "desktop" | "other"
type SortOrder = "desc" | "asc"
type PendingAction =
  | { type: "single"; sessionId: string; sessionLabel: string }
  | { type: "all" }
  | null

export default function SessionsPage() {
  const { user, isLoading: isSessionLoading } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/sessions/me`, {
        credentials: "include",
      })

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      if (!response.ok) throw new Error("Failed to fetch sessions")

      const data = await response.json()
      setSessions(data)
    } catch {
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/sessions/me/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to revoke session")

      toast.success("Session revoked")
      await fetchSessions()
      return true
    } catch {
      toast.error("Failed to revoke session")
      return false
    }
  }

  const handleRevokeAll = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/sessions/me`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to revoke sessions")

      toast.success("All other sessions revoked")
      await fetchSessions()
      return true
    } catch {
      toast.error("Failed to revoke sessions")
      return false
    }
  }

  const openRevokeSessionConfirm = (session: Session) => {
    setPendingAction({
      type: "single",
      sessionId: session.id,
      sessionLabel: session.device || "Unknown Device",
    })
  }

  const openRevokeAllConfirm = () => {
    setPendingAction({ type: "all" })
  }

  const onConfirmAction = async () => {
    if (!pendingAction) return

    setIsSubmitting(true)
    const success = pendingAction.type === "single"
      ? await handleRevokeSession(pendingAction.sessionId)
      : await handleRevokeAll()
    setIsSubmitting(false)

    if (success) {
      setPendingAction(null)
    }
  }

  const getDeviceType = (device: string | null, userAgent: string | null): "mobile" | "desktop" | "other" => {
    const ua = (userAgent || device || "").toLowerCase()
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
      return "mobile"
    }
    if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux")) {
      return "desktop"
    }
    return "other"
  }

  const getDeviceIcon = (device: string | null, userAgent: string | null) => {
    const type = getDeviceType(device, userAgent)
    switch (type) {
      case "mobile": return Smartphone
      case "desktop": return Laptop
      default: return Globe
    }
  }

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions

    if (deviceFilter !== "all") {
      filtered = sessions.filter(s => getDeviceType(s.device, s.userAgent) === deviceFilter)
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [sessions, deviceFilter, sortOrder])

  if (loading || isSessionLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MonitorPlay className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {deviceFilter === "all" ? "All Devices" : deviceFilter.charAt(0).toUpperCase() + deviceFilter.slice(1)}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={deviceFilter} onValueChange={(v) => setDeviceFilter(v as DeviceFilter)}>
                    <DropdownMenuRadioItem value="all">All Devices</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="desktop">Desktop</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="mobile">Mobile</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="other">Other</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              >
                {sortOrder === "desc" ? "Newest first" : "Oldest first"}
              </Button>
              {sessions.length > 1 && (
                <Button variant="destructive" size="sm" onClick={openRevokeAllConfirm}>
                  Revoke all others
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <MonitorPlay className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No sessions found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {deviceFilter !== "all" ? "Try changing the device filter" : "No active sessions"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAndSortedSessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device, session.userAgent)
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {session.device || "Unknown Device"}
                          </span>
                          {session.isCurrent && (
                            <Badge className="text-xs px-2 py-0 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 rounded-full">
                              This device
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {session.ipAddress && (
                            <>
                              <span>{session.ipAddress}</span>
                              <span className="text-muted-foreground/40">·</span>
                            </>
                          )}
                          <span>
                            {new Date(session.updatedAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {session.isCurrent ? (
                          <div className="h-8 w-8" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRevokeSessionConfirm(session)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-lg bg-muted/50 p-4">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            A session represents a single sign-in to your account on a device or browser. Revoking a session signs you out of that device immediately.
          </p>
        </div>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setPendingAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "all" ? "Revoke all other sessions?" : "Revoke this session?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "all"
                ? "This will sign out all other devices and browsers. Your current session will remain active."
                : `This will immediately sign out ${pendingAction?.sessionLabel}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault()
                void onConfirmAction()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting
                ? "Revoking..."
                : pendingAction?.type === "all"
                  ? "Revoke all others"
                  : "Revoke session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
