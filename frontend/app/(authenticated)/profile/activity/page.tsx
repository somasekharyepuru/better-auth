"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { History, Info, LogIn, LogOut, Shield, Key, User, Search, ChevronDown, Calendar as CalendarIcon, LucideIcon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import dayjs from "dayjs"

import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AuditLog {
  id: string
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  organizationId?: string
  sessionId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  createdAt: string
}

type ActionFilter = "" | "user.login" | "user.logout" | "user.2fa" | "user.password" | "user.email"
type SortOrder = "desc" | "asc"

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const DEFAULT_PAGE_SIZE = 20

const ACTION_LABELS: Record<string, string> = {
  "user.signup": "Account Created",
  "user.update": "Profile Updated",
  "user.profile.update": "Profile Updated",
  "user.login": "Signed In",
  "user.login.failed": "Sign-In Failed",
  "user.logout": "Signed Out",
  "user.logout.completed": "Signed Out",
  "user.email.verify": "Email Verified",
  "user.2fa": "Two-Factor Updated",
  "user.2fa.enable": "Two-Factor Enabled",
  "user.2fa.disable": "Two-Factor Disabled",
  "user.2fa.authenticate": "Two-Factor Authenticated",
  "user.otp.verify": "OTP Verified",
  "user.otp.verify.failed": "OTP Verification Failed",
  "user.password.change": "Password Changed",
  "user.password.update": "Password Changed",
  "user.password.reset.request": "Password Reset Requested",
  "user.password.reset.otp.request": "Password Reset OTP Requested",
  "user.password.reset.otp": "Password Reset via OTP",
  "user.password.reset.otp.failed": "Password Reset OTP Failed",
  "user.password.reset": "Password Reset",
  "user.password.reset.failed": "Password Reset Failed",
  "user.signup.failed": "Sign-Up Failed",
  "user.delete.request": "Account Deletion Requested",
  "user.delete.confirm": "Account Deletion Confirmed",
  "user.delete.cancel": "Account Deletion Cancelled",
  "user.delete.execute": "Account Deleted",
  "session.revoked": "Session Revoked",
  "session.revoked.all": "All Sessions Revoked",
  "session.revoked.all.others": "Other Sessions Revoked",
  "org.create": "Organization Created",
  "org.update": "Organization Updated",
  "org.delete": "Organization Deleted",
  "org.member.add": "Member Added",
  "org.member.remove": "Member Removed",
  "org.member.role": "Member Role Updated",
  "org.invite.create": "Invitation Created",
  "org.invite.cancel": "Invitation Cancelled",
  "org.invite.accept": "Invitation Accepted",
  "org.transfer.initiated": "Ownership Transfer Initiated",
  "org.transfer.confirmed": "Ownership Transfer Confirmed",
  "org.transfer.cancelled": "Ownership Transfer Cancelled",
  "org.transfer.declined": "Ownership Transfer Declined",
  "org.member.invite.resent": "Invitation Resent",
  "org.team.updated": "Team Updated",
  "org.team.deleted": "Team Deleted",
  "organization.role.created": "Custom Role Created",
  "organization.role.updated": "Custom Role Updated",
  "organization.role.deleted": "Custom Role Deleted",
  "password.policy.changed": "Password Policy Updated",
  "password.policy.org.changed": "Organization Password Policy Updated",
  "admin.access.denied": "Admin Access Denied",
  "admin.users.list": "Admin Users Viewed",
  "admin.users.ban": "User Banned",
  "admin.users.unban": "User Unbanned",
  "admin.users.delete": "User Deleted by Admin",
  "admin.user.delete": "User Deleted by Admin",
  "admin.user.deleted": "User Deleted by Admin",
  "admin.user.created": "User Created by Admin",
  "admin.user.ban": "User Banned by Admin",
  "admin.user.unban": "User Unbanned by Admin",
  "admin.user.role.changed": "User Role Changed",
  "admin.user.password.reset": "User Password Reset by Admin",
  "admin.organization.banned": "Organization Banned",
  "admin.organization.unbanned": "Organization Unbanned",
  "admin.organization.deleted": "Organization Deleted by Admin",
  "admin.org.member.role.changed": "Organization Member Role Changed",
  "admin.session.revoke.all": "All User Sessions Revoked by Admin",
  "user.session.get": "Session Checked",
  "user.email.change": "Email Change Requested",
}

function formatActionLabel(action: string) {
  if (ACTION_LABELS[action]) {
    return ACTION_LABELS[action]
  }

  if (action.startsWith("user.social.login.")) {
    const provider = action.replace("user.social.login.", "")
    const providerLabel = provider ? provider[0].toUpperCase() + provider.slice(1) : "Social"
    return `${providerLabel} Login`
  }

  const prettified = action
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!prettified) {
    return "Unknown Activity"
  }

  return prettified
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function ActivityPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<ActionFilter>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchQuery])

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(pageSize))
      params.set("offset", String((page - 1) * pageSize))
      params.set("sortOrder", sortOrder)

      if (actionFilter) params.set("actionPrefix", actionFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (dateRange.from) params.set("startDate", dateRange.from.toISOString())
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        params.set("endDate", endOfDay.toISOString())
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/audit/me/timeline?${params.toString()}`,
        { credentials: "include" }
      )

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to fetch activity")

      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortOrder, actionFilter, debouncedSearch, dateRange, router])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const handleFilterChange = (value: ActionFilter) => {
    setActionFilter(value)
    setPage(1)
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc")
    setPage(1)
  }

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    setPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getActionConfig = (action: string): { label: string; icon: LucideIcon; bg: string; color: string } => {
    const configs: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
      "user.signup": { icon: User, bg: "bg-success/10", color: "text-success" },
      "user.update": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "user.profile.update": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "user.login": { icon: LogIn, bg: "bg-primary/10", color: "text-primary" },
      "user.login.failed": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "user.logout": { icon: LogOut, bg: "bg-muted/50", color: "text-muted-foreground" },
      "user.logout.completed": { icon: LogOut, bg: "bg-muted/50", color: "text-muted-foreground" },
      "user.email.verify": { icon: Shield, bg: "bg-success/10", color: "text-success" },
      "user.2fa": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "user.2fa.enable": { icon: Shield, bg: "bg-success/10", color: "text-success" },
      "user.2fa.disable": { icon: Shield, bg: "bg-warning/10", color: "text-warning" },
      "user.2fa.authenticate": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "user.otp.verify": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "user.otp.verify.failed": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "user.password.change": { icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.password.update": { icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.password.reset.request": { icon: Key, bg: "bg-warning/10", color: "text-warning" },
      "user.password.reset.otp.request": { icon: Key, bg: "bg-warning/10", color: "text-warning" },
      "user.password.reset.otp": { icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.password.reset.otp.failed": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "user.password.reset": { icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.password.reset.failed": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "user.signup.failed": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "user.delete.request": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "user.delete.confirm": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "user.delete.cancel": { icon: AlertCircle, bg: "bg-muted/50", color: "text-muted-foreground" },
      "user.delete.execute": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "session.revoked": { icon: History, bg: "bg-warning/10", color: "text-warning" },
      "session.revoked.all": { icon: History, bg: "bg-warning/10", color: "text-warning" },
      "session.revoked.all.others": { icon: History, bg: "bg-warning/10", color: "text-warning" },
      "org.create": { icon: User, bg: "bg-success/10", color: "text-success" },
      "org.update": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "org.delete": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "org.member.add": { icon: User, bg: "bg-success/10", color: "text-success" },
      "org.member.remove": { icon: User, bg: "bg-warning/10", color: "text-warning" },
      "org.member.role": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "org.invite.create": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "org.invite.cancel": { icon: User, bg: "bg-muted/50", color: "text-muted-foreground" },
      "org.invite.accept": { icon: User, bg: "bg-success/10", color: "text-success" },
      "org.transfer.initiated": { icon: User, bg: "bg-warning/10", color: "text-warning" },
      "org.transfer.confirmed": { icon: User, bg: "bg-success/10", color: "text-success" },
      "org.transfer.cancelled": { icon: User, bg: "bg-muted/50", color: "text-muted-foreground" },
      "org.transfer.declined": { icon: User, bg: "bg-warning/10", color: "text-warning" },
      "org.member.invite.resent": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "org.team.updated": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "org.team.deleted": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "organization.role.created": { icon: Shield, bg: "bg-success/10", color: "text-success" },
      "organization.role.updated": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "organization.role.deleted": { icon: Shield, bg: "bg-warning/10", color: "text-warning" },
      "password.policy.changed": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "password.policy.org.changed": { icon: Shield, bg: "bg-primary/10", color: "text-primary" },
      "admin.access.denied": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "admin.users.list": { icon: User, bg: "bg-muted/50", color: "text-muted-foreground" },
      "admin.users.ban": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "admin.users.unban": { icon: User, bg: "bg-success/10", color: "text-success" },
      "admin.users.delete": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "admin.user.delete": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "admin.user.deleted": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "admin.user.created": { icon: User, bg: "bg-success/10", color: "text-success" },
      "admin.user.ban": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "admin.user.unban": { icon: User, bg: "bg-success/10", color: "text-success" },
      "admin.user.role.changed": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "admin.user.password.reset": { icon: Key, bg: "bg-warning/10", color: "text-warning" },
      "admin.organization.banned": { icon: AlertCircle, bg: "bg-warning/10", color: "text-warning" },
      "admin.organization.unbanned": { icon: User, bg: "bg-success/10", color: "text-success" },
      "admin.organization.deleted": { icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
      "admin.org.member.role.changed": { icon: User, bg: "bg-primary/10", color: "text-primary" },
      "admin.session.revoke.all": { icon: History, bg: "bg-warning/10", color: "text-warning" },
      "user.session.get": { icon: History, bg: "bg-muted/50", color: "text-muted-foreground" },
      "user.email.change": { icon: User, bg: "bg-primary/10", color: "text-primary" },
    }

    if (action.startsWith("user.social.login.")) {
      return {
        label: formatActionLabel(action),
        icon: LogIn,
        bg: "bg-primary/10",
        color: "text-primary",
      }
    }

    const config = configs[action]
    return {
      label: formatActionLabel(action),
      icon: config?.icon ?? History,
      bg: config?.bg ?? "bg-muted/50",
      color: config?.color ?? "text-muted-foreground",
    }
  }

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | "ellipsis")[] = [1]
    if (page > 3) pages.push("ellipsis")

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (page < totalPages - 2) pages.push("ellipsis")
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  if (error && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive">Failed to load activity</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setError(null)
                    fetchActivity()
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Security Activity</CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${total} event${total !== 1 ? "s" : ""}`}
                </CardDescription>
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:shrink-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 sm:w-[200px] h-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-between">
                    {actionFilter === "" ? "All Activity" : actionFilter.split(".")[1]
                      ? actionFilter.split(".")[1].charAt(0).toUpperCase() + actionFilter.split(".")[1].slice(1)
                      : actionFilter}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={actionFilter} onValueChange={(v) => handleFilterChange(v as ActionFilter)}>
                    <DropdownMenuRadioItem value="">All Activity</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user.login">Sign Ins</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user.logout">Sign Outs</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user.2fa">Two-Factor Auth</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user.password">Password Changes</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user.email">Email Events</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortToggle}
              >
                {sortOrder === "desc" ? "Newest first" : "Oldest first"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateRange.from ? (
                      <span>
                        {dayjs(dateRange.from).format("MMM D")}
                        {dateRange.to ? ` – ${dayjs(dateRange.to).format("MMM D")}` : " – ..."}
                      </span>
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range) {
                          handleDateChange({ from: range.from, to: range.to })
                        } else {
                          handleDateChange({ from: undefined, to: undefined })
                        }
                      }}
                      numberOfMonths={2}
                    />
                    {(dateRange.from || dateRange.to) && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDateChange({ from: undefined, to: undefined })}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <History className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No activity found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {total === 0 && !actionFilter && !debouncedSearch && !dateRange.from
                    ? "Your security events will appear here"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {logs.map((log) => {
                    const config = getActionConfig(log.action)
                    const Icon = config.icon
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{config.label}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            {log.ipAddress && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span>{log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {log.success ? (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {total === 0 ? "No results" : `${startItem}–${endItem} of ${total}`}
                    </span>
                    <span className="hidden sm:inline text-muted-foreground/40">|</span>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span>Rows:</span>
                      <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="h-7 w-[64px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageNumbers().map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-lg bg-muted/50 p-4">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Regularly review your account activity to ensure there is no suspicious activity. If you see anything unusual, change your password immediately.
          </p>
        </div>
      </div>
    </>
  )
}
