"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Monitor, Info, Smartphone, Laptop, Globe, ChevronDown } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export default function SessionsPage() {
  const { user, isLoading: isSessionLoading } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

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
    if (!confirm("Are you sure you want to revoke this session?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/sessions/me/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to revoke session")

      toast.success("Session revoked")
      await fetchSessions()
    } catch {
      toast.error("Failed to revoke session")
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to revoke all other sessions?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/sessions/me`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to revoke sessions")

      toast.success("All other sessions revoked")
      await fetchSessions()
    } catch {
      toast.error("Failed to revoke sessions")
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

  const sessionsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Your Sessions</CardTitle>
            <CardDescription>{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Filter: {deviceFilter === "all" ? "All" : deviceFilter}
                  <ChevronDown className="w-4 h-4 ml-2" />
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
              Sort: {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeAll}>
                Revoke all others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No active sessions</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSessions.map((session) => {
                      const DeviceIcon = getDeviceIcon(session.device, session.userAgent)
                      return (
                        <TableRow key={session.id} className={session.isCurrent ? "bg-primary/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DeviceIcon className={`w-4 h-4 ${session.isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="font-medium">{session.device || "Unknown Device"}</span>
                              {session.isCurrent && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{session.ipAddress || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(session.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {!session.isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredAndSortedSessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device, session.userAgent)
                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border ${session.isCurrent ? "border-primary/30 bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <DeviceIcon className={`w-5 h-5 shrink-0 ${session.isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{session.device || "Unknown Device"}</p>
                              {session.isCurrent && (
                                <Badge variant="outline" className="text-xs shrink-0">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {session.ipAddress && `${session.ipAddress} · `}
                              {new Date(session.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          A session represents a single sign-in to your account on a device or browser. Revoking a session signs you out of that device immediately.
        </p>
      </div>
    </div>
  )

  if (loading || isSessionLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      {sessionsContent}
    </>
  )
}
