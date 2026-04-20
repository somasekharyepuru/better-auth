"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { History, Info, LogIn, LogOut, Shield, Key, User, Search, ChevronDown, Calendar as CalendarIcon, LucideIcon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

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

  // Debounce search input
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

  // Re-fetch when any server-side param changes
  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  // Reset page when filters change
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
    const configs: Record<string, { label: string; icon: LucideIcon; bg: string; color: string }> = {
      "user.signup": { label: "Account Created", icon: User, bg: "bg-success/10", color: "text-success" },
      "user.login": { label: "Signed In", icon: LogIn, bg: "bg-primary/10", color: "text-primary" },
      "user.logout": { label: "Signed Out", icon: LogOut, bg: "bg-muted/50", color: "text-muted-foreground" },
      "user.email.verify": { label: "Email Verified", icon: Shield, bg: "bg-success/10", color: "text-success" },
      "user.2fa.enable": { label: "2FA Enabled", icon: Shield, bg: "bg-success/10", color: "text-success" },
      "user.2fa.disable": { label: "2FA Disabled", icon: Shield, bg: "bg-warning/10", color: "text-warning" },
      "user.password.reset": { label: "Password Reset", icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.password.update": { label: "Password Changed", icon: Key, bg: "bg-primary/10", color: "text-primary" },
      "user.update": { label: "Profile Updated", icon: User, bg: "bg-primary/10", color: "text-primary" },
    }
    return (
      configs[action] || {
        label: action,
        icon: History,
        bg: "bg-muted/50",
        color: "text-muted-foreground",
      }
    )
  }

  // Generate page numbers for pagination
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
      <>
        <div className="space-y-6">
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
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
      </>
    )
  }

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  const activityContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : `${total} event${total !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Filter: {actionFilter === "" ? "All" : actionFilter.split(".")[1] || actionFilter}
                  <ChevronDown className="w-4 h-4 ml-2" />
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
              Sort: {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange.from ? (
                    <span>
                      {format(dateRange.from, "MMM d")} - {dateRange.to ? format(dateRange.to, "MMM d") : "..."}
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
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {total === 0 && !actionFilter && !debouncedSearch && !dateRange.from
                  ? "No activity found"
                  : "No matching activity found"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const config = getActionConfig(log.action)
                      const Icon = config.icon
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              <span className="font-medium">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{log.ipAddress || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.success ? (
                              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                Success
                              </span>
                            ) : (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                Failed
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {logs.map((log) => {
                  const config = getActionConfig(log.action)
                  const Icon = config.icon
                  return (
                    <div key={log.id} className="p-4 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{config.label}</p>
                            {log.success ? (
                              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full shrink-0">
                                Success
                              </span>
                            ) : (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full shrink-0">
                                Failed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                          {log.ipAddress && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              IP: {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {startItem}-{endItem} of {total}</span>
                  <span className="hidden sm:inline">|</span>
                  <div className="flex items-center gap-1">
                    <span className="hidden sm:inline">Rows per page:</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="h-8 w-[70px]">
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
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
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

      <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Regularly review your account activity to ensure there's no suspicious activity. If you see anything unusual, change your password immediately.
        </p>
      </div>
    </div>
  )

  return (
    <>
      {activityContent}
    </>
  )
}
