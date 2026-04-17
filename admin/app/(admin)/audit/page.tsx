"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { auditApi, adminApi } from "@/lib/auth-client";
import { useDebounce } from "@/lib/use-debounce";
import type { AuditLog } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Eye,
    ArrowLeft,
    User,
    Globe,
    Monitor,
    AlertCircle,
    Info,
    Copy,
    X,
    SlidersHorizontal,
    Calendar,
    CheckCircle2,
    Activity,
    ShieldAlert,
    TrendingUp,
    Clock,
    Search,
    Check,
    RotateCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditFilters {
    userIds: string[];
    userNames: Record<string, string>;
    actions: string[];
    resourceTypes: string[];
    success: "all" | "true" | "false";
    dateFrom: string;
    dateTo: string;
    sortBy: "createdAt" | "action";
    sortOrder: "asc" | "desc";
}

interface AuditStats {
    total: number;
    success: number;
    failed: number;
    today: number;
    thisWeek: number;
}

const ACTION_LABELS: Record<string, string> = {
    "user.login": "User Login",
    "user.logout": "User Logout",
    "user.logout.completed": "User Logout",
    "user.signup": "User Signup",
    "user.login.failed": "Login Failed",
    "user.signup.failed": "Signup Failed",
    "user.password.reset.otp.request": "Password Reset Requested",
    "user.password.reset.otp": "Password Reset",
    "user.password.reset.otp.failed": "Password Reset Failed",
    "user.password.reset.request": "Password Reset Requested",
    "user.password.reset": "Password Reset",
    "user.password.reset.failed": "Password Reset Failed",
    "user.password.change": "Password Changed",
    "user.email.verify": "Email Verified",
    "user.otp.verify": "OTP Verified",
    "user.otp.verify.failed": "OTP Verification Failed",
    "user.2fa.enable": "2FA Enabled",
    "user.2fa.disable": "2FA Disabled",
    "user.2fa.authenticate": "2FA Authenticated",
    "user.create": "User Created",
    "user.update": "User Updated",
    "user.social.login.google": "Google Login",
    "user.social.login.microsoft": "Microsoft Login",
    "user.social.login.github": "GitHub Login",
    "user.social.login.apple": "Apple Login",
    "org.create": "Organization Created",
    "org.update": "Organization Updated",
    "org.delete": "Organization Deleted",
    "org.member.add": "Member Added",
    "org.member.remove": "Member Removed",
    "org.member.role": "Member Role Changed",
    "org.invite.create": "Invitation Sent",
    "org.invite.cancel": "Invitation Cancelled",
    "org.invite.accept": "Invitation Accepted",
    "admin.user.ban": "User Banned",
    "admin.user.unban": "User Unbanned",
};

const COMMON_ACTIONS = [
    "user.login",
    "user.logout",
    "user.signup",
    "user.password.reset",
    "user.email.verify",
    "org.create",
    "org.member.add",
];

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const RESOURCE_TYPES = ["user", "organization", "admin", "session"];
const LOGS_PER_PAGE = 50;

export default function AuditLogsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<AuditStats>({
        total: 0,
        success: 0,
        failed: 0,
        today: 0,
        thisWeek: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    const userIdFilter = searchParams.get("userId");
    const orgIdFilter = searchParams.get("orgId");

    const [filterOpen, setFilterOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const debouncedUserSearch = useDebounce(userSearchQuery, 300);
    const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [filters, setFilters] = useState<AuditFilters>({
        userIds: [],
        userNames: {},
        actions: [],
        resourceTypes: [],
        success: "all",
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const [tempFilters, setTempFilters] = useState<AuditFilters>(filters);

    useEffect(() => {
        if (filterOpen) {
            setTempFilters(filters);
        }
    }, [filterOpen, filters]);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const limit = LOGS_PER_PAGE;
            const offset = (currentPage - 1) * LOGS_PER_PAGE;

            const params: Record<string, string | number | boolean> = {
                limit,
                offset,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
            };

            if (filters.userIds.length > 0) {
                params.userIds = filters.userIds.join(",");
            }
            if (filters.actions.length > 0) {
                params.actions = filters.actions.join(",");
            }
            if (filters.resourceTypes.length > 0) {
                params.resourceTypes = filters.resourceTypes.join(",");
            }
            if (filters.success !== "all") {
                params.success = filters.success === "true";
            }
            if (filters.dateFrom) {
                params.startDate = filters.dateFrom;
            }
            if (filters.dateTo) {
                params.endDate = filters.dateTo;
            }

            let result;
            if (userIdFilter) {
                result = await auditApi.getUserLogs(userIdFilter, { limit, offset });
            } else if (orgIdFilter) {
                result = await auditApi.getOrgLogs(orgIdFilter, { limit, offset });
            } else {
                result = await auditApi.listLogs(params);
            }

            setLogs(result.logs || []);
            setTotal(result.total || 0);

            const EXCLUDED_USER_IDS = new Set(['anonymous', 'unknown']);
            const userIds = [...new Set((result.logs || []).map(log => log.userId).filter(id => id && !EXCLUDED_USER_IDS.has(id)))];
            const newUserIds = userIds.filter(id => !(id in userNames));
            if (newUserIds.length > 0) {
                try {
                    const usersResult = await adminApi.listUsers({ limit: 100 });
                    if (usersResult.data?.users) {
                        const names: Record<string, string> = { ...userNames };
                        for (const user of usersResult.data.users) {
                            if (newUserIds.includes(user.id)) {
                                names[user.id] = user.name || user.email?.split('@')[0] || 'Unknown';
                            }
                        }
                        setUserNames(names);
                    }
                } catch (e) {
                    console.error('Failed to fetch user names:', e);
                }
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filters, userIdFilter, orgIdFilter, userNames]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await auditApi.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Search users when debounced query changes
    useEffect(() => {
        const searchUsers = async () => {
            if (debouncedUserSearch.length < 2) {
                setUserSearchResults([]);
                return;
            }
            setIsSearchingUsers(true);
            try {
                const result = await adminApi.listUsers({
                    limit: 20,
                    searchValue: debouncedUserSearch,
                    searchField: debouncedUserSearch.includes('@') ? 'email' : 'name',
                    searchOperator: 'contains',
                });
                if (result.data?.users) {
                    setUserSearchResults(result.data.users);
                }
            } catch (e) {
                console.error('Failed to search users:', e);
            } finally {
                setIsSearchingUsers(false);
            }
        };
        searchUsers();
    }, [debouncedUserSearch]);

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.userIds.length > 0) count++;
        if (filters.actions.length > 0) count++;
        if (filters.resourceTypes.length > 0) count++;
        if (filters.success !== "all") count++;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        return count;
    };

    const toggleAction = (action: string) => {
        setTempFilters(prev => {
            if (prev.actions.includes(action)) {
                return { ...prev, actions: prev.actions.filter(a => a !== action) };
            } else {
                return { ...prev, actions: [...prev.actions, action] };
            }
        });
    };

    const toggleResourceType = (type: string) => {
        setTempFilters(prev => {
            if (prev.resourceTypes.includes(type)) {
                return { ...prev, resourceTypes: prev.resourceTypes.filter(t => t !== type) };
            } else {
                return { ...prev, resourceTypes: [...prev.resourceTypes, type] };
            }
        });
    };

    const setSuccess = (value: "all" | "true" | "false") => {
        setTempFilters(prev => ({ ...prev, success: value }));
    };

    const clearUserFilter = () => {
        setTempFilters(prev => ({ ...prev, userIds: [], userNames: {} }));
        setUserSearchQuery("");
        setUserSearchResults([]);
    };

    const selectUser = (user: { id: string; name: string; email: string }) => {
        setTempFilters(prev => {
            if (prev.userIds.includes(user.id)) {
                return prev;
            }
            return {
                ...prev,
                userIds: [...prev.userIds, user.id],
                userNames: {
                    ...prev.userNames,
                    [user.id]: user.name || user.email?.split('@')[0] || 'Unknown'
                }
            };
        });
        setUserSearchQuery("");
        setUserSearchResults([]);
        setShowUserDropdown(false);
    };

    const removeUser = (userId: string) => {
        setTempFilters(prev => {
            const newUserIds = prev.userIds.filter(id => id !== userId);
            const newUserNames = { ...prev.userNames };
            delete newUserNames[userId];
            return {
                ...prev,
                userIds: newUserIds,
                userNames: newUserNames
            };
        });
    };

    const resetFilters = () => {
        setTempFilters({
            userIds: [],
            userNames: {},
            actions: [],
            resourceTypes: [],
            success: "all",
            dateFrom: "",
            dateTo: "",
            sortBy: "createdAt",
            sortOrder: "desc",
        });
    };

    const applyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
        setFilterOpen(false);
    };

    const handleExport = () => {
        const csv = [
            ["Timestamp", "Action", "User ID", "Resource Type", "Resource ID", "IP Address", "Success", "Error"],
            ...logs.map(log => [
                log.createdAt,
                ACTION_LABELS[log.action] || log.action,
                log.userId,
                log.resourceType || "",
                log.resourceId || "",
                log.ipAddress || "",
                log.success ? "Yes" : "No",
                log.errorMessage || "",
            ]),
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getActionBadgeVariant = (action: string) => {
        if (action.includes("login") || action.includes("create") || action.includes("signup")) return "default";
        if (action.includes("delete") || action.includes("remove") || action.includes("ban") || action.includes("failed")) return "destructive";
        if (action.includes("update") || action.includes("role") || action.includes("change")) return "secondary";
        return "outline";
    };

    const totalPages = Math.ceil(total / LOGS_PER_PAGE);
    const startRecord = (currentPage - 1) * LOGS_PER_PAGE + 1;
    const endRecord = Math.min(currentPage * LOGS_PER_PAGE, total);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {(userIdFilter || orgIdFilter) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push("/audit")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">
                                {userIdFilter ? "User Audit Logs" : orgIdFilter ? "Organization Audit Logs" : "Audit Logs"}
                            </h1>
                            <p className="text-muted-foreground">
                                {userIdFilter
                                    ? `Activity for user ID: ${userIdFilter.slice(0, 8)}...`
                                    : orgIdFilter
                                        ? `Activity for organization ID: ${orgIdFilter.slice(0, 8)}...`
                                        : "View all system activity and security events"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filters
                                    {getActiveFilterCount() > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                            {getActiveFilterCount()}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full p-0 [&>button.absolute.right-4.top-4]:hidden">
                                <div className="p-6 border-b">
                                    <SheetHeader>
                                        <div className="flex items-center justify-between">
                                            <SheetTitle className="text-2xl flex items-center gap-2">
                                                <Filter className="h-5 w-5" />
                                                Filters
                                            </SheetTitle>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={resetFilters}
                                                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                >
                                                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                                    Reset
                                                </Button>
                                                <SheetClose asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                                                        <X className="h-4 w-4" />
                                                        <span className="sr-only">Close</span>
                                                    </Button>
                                                </SheetClose>
                                            </div>
                                        </div>
                                        <SheetDescription>
                                            Filter audit logs by action, resource, status, and more
                                        </SheetDescription>
                                    </SheetHeader>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                    {/* User Filter - Multi-select */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Users
                                        </label>
                                        <div className="space-y-2">
                                            {tempFilters.userIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {tempFilters.userIds.map((userId) => (
                                                        <Badge
                                                            key={userId}
                                                            variant="secondary"
                                                            className="gap-1.5 pl-2 pr-1 py-1"
                                                        >
                                                            <span className="text-xs font-medium">
                                                                {tempFilters.userNames[userId] || userId.slice(0, 8)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeUser(userId)}
                                                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={clearUserFilter}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search users by name or email..."
                                                    value={userSearchQuery}
                                                    onChange={(e) => {
                                                        setUserSearchQuery(e.target.value);
                                                        setShowUserDropdown(true);
                                                    }}
                                                    onFocus={() => setShowUserDropdown(true)}
                                                    className="pl-10 h-10"
                                                />
                                                {userSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUserSearchQuery("");
                                                            setUserSearchResults([]);
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {showUserDropdown && userSearchQuery.length >= 2 && (
                                                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
                                                        {isSearchingUsers ? (
                                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                                Searching...
                                                            </div>
                                                        ) : userSearchResults.length > 0 ? (
                                                            userSearchResults
                                                                .filter(user => !tempFilters.userIds.includes(user.id))
                                                                .map((user) => (
                                                                    <button
                                                                        key={user.id}
                                                                        type="button"
                                                                        onClick={() => selectUser(user)}
                                                                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0"
                                                                    >
                                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-sm font-medium truncate">{user.name || 'Unknown'}</div>
                                                                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                                        </div>
                                                                        <Check className="h-4 w-4 text-primary" />
                                                                    </button>
                                                                ))
                                                        ) : (
                                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                                No users found
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Filter - Multi-select */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Actions</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COMMON_ACTIONS.map((action) => (
                                                <button
                                                    key={action}
                                                    type="button"
                                                    onClick={() => toggleAction(action)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tempFilters.actions.includes(action)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {ACTION_LABELS[action]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resource Type Filter - Multi-select */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Resource Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {RESOURCE_TYPES.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => toggleResourceType(type)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.resourceTypes.includes(type)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Filter - Single select */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(["all", "true", "false"] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setSuccess(status)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.success === status
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {status === "all" ? "All Status" : status === "true" ? "Success" : "Failed"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date Range Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Date Range
                                        </label>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                                                <Input
                                                    type="date"
                                                    value={tempFilters.dateFrom}
                                                    onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                                    className="h-10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                                                <Input
                                                    type="date"
                                                    value={tempFilters.dateTo}
                                                    onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                                    className="h-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sort By */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Sort By</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">Field</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(["createdAt", "action"] as const).map((field) => (
                                                        <button
                                                            key={field}
                                                            type="button"
                                                            onClick={() => {
                                                                setTempFilters(prev => ({ ...prev, sortBy: field }));
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tempFilters.sortBy === field
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-foreground hover:bg-muted/80"
                                                                }`}
                                                        >
                                                            {field === "createdAt" ? "Date" : "Action"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">Order</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(["desc", "asc"] as const).map((order) => (
                                                        <button
                                                            key={order}
                                                            type="button"
                                                            onClick={() => {
                                                                setTempFilters(prev => ({ ...prev, sortOrder: order }));
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tempFilters.sortOrder === order
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-foreground hover:bg-muted/80"
                                                                }`}
                                                        >
                                                            {order === "desc" ? "Newest" : "Oldest"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t mt-auto">
                                    <SheetFooter className="flex-row gap-2 sm:justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFilterOpen(false)}
                                            className="flex-1"
                                        >
                                            Close
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={applyFilters}
                                            className="flex-1"
                                        >
                                            <Filter className="mr-2 h-4 w-4" />
                                            Apply Filters
                                        </Button>
                                    </SheetFooter>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button onClick={handleExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-2/20 rounded-lg">
                                    <Activity className="h-5 w-5 text-chart-2" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Logs</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-1/20 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-chart-1" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Successful</p>
                                    <p className="text-2xl font-bold">{stats.success}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/20 rounded-lg">
                                    <ShieldAlert className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Failed</p>
                                    <p className="text-2xl font-bold">{stats.failed}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Today</p>
                                    <p className="text-2xl font-bold">{stats.today}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-3/20 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-chart-3" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">This Week</p>
                                    <p className="text-2xl font-bold">{stats.thisWeek}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Logs Table */}
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="font-semibold text-foreground">Timestamp</TableHead>
                                    <TableHead className="font-semibold text-foreground">Action</TableHead>
                                    <TableHead className="font-semibold text-foreground">User ID</TableHead>
                                    <TableHead className="font-semibold text-foreground">Resource</TableHead>
                                    <TableHead className="font-semibold text-foreground">IP Address</TableHead>
                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="p-4 bg-muted rounded-full">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">No audit logs found</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {getActiveFilterCount() > 0
                                                            ? "Try adjusting your filters"
                                                            : "No audit logs recorded yet"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="py-4">
                                                <div className="text-xs">
                                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getActionBadgeVariant(log.action)}>
                                                    {ACTION_LABELS[log.action] || log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="group flex items-center gap-1">
                                                    {log.userId === 'anonymous' || log.userId === 'unknown' ? (
                                                        <span className="text-muted-foreground italic text-xs">{log.userId}</span>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium">
                                                                    {userNames[log.userId] || '-'}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                                    {log.userId.slice(0, 8)}...
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(log.userId);
                                                                    toast.success("User ID copied");
                                                                }}
                                                                title="Copy User ID"
                                                            >
                                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {log.resourceType && (
                                                    <div>
                                                        <div className="text-xs font-medium capitalize">{log.resourceType}</div>
                                                        {log.resourceId && (
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {log.resourceId.slice(0, 8)}...
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.ipAddress || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {log.success ? (
                                                    <Badge variant="outline" className="bg-chart-1/20 text-chart-1 border-chart-1/30">
                                                        Success
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Failed
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedLog(log);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {startRecord} to {endRecord} of {total} logs
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1 px-3">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-muted"
                                                    }`}
                                                disabled={isLoading}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedLog?.success ? 'bg-chart-1/20' : 'bg-destructive/20'}`}>
                                <FileText className={`h-5 w-5 ${selectedLog?.success ? 'text-chart-1' : 'text-destructive'}`} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    {selectedLog && (ACTION_LABELS[selectedLog.action] || selectedLog.action)}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    {selectedLog && new Date(selectedLog.createdAt).toLocaleString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                    <span className="text-muted-foreground">•</span>
                                    {selectedLog?.success ? (
                                        <Badge variant="outline" className="bg-chart-1/20 text-chart-1 border-chart-1/30">
                                            Success
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">Failed</Badge>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="flex-1 overflow-y-auto py-4 space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    User Information
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">User</span>
                                        <div className="text-right">
                                            {selectedLog.userId === 'anonymous' || selectedLog.userId === 'unknown' ? (
                                                <span className="text-muted-foreground italic">{selectedLog.userId}</span>
                                            ) : (
                                                <>
                                                    <div className="font-medium">{userNames[selectedLog.userId] || '-'}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{selectedLog.userId}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {selectedLog.sessionId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Session ID</span>
                                            <span className="font-mono text-xs">{selectedLog.sessionId.slice(0, 16)}...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Request Information
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Action</span>
                                        <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                                            {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Raw Action</span>
                                        <span className="font-mono text-xs text-muted-foreground">{selectedLog.action}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">IP Address</span>
                                        <span className="font-mono text-sm">{selectedLog.ipAddress || '-'}</span>
                                    </div>
                                    {(selectedLog.resourceType || selectedLog.resourceId) && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Resource Type</span>
                                                <span className="capitalize">{selectedLog.resourceType || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Resource ID</span>
                                                <span className="font-mono text-xs">{selectedLog.resourceId || '-'}</span>
                                            </div>
                                        </>
                                    )}
                                    {selectedLog.organizationId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Organization ID</span>
                                            <span className="font-mono text-xs">{selectedLog.organizationId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedLog.userAgent && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        Device Information
                                    </h4>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-xs text-muted-foreground break-all font-mono leading-relaxed">
                                            {selectedLog.userAgent}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedLog.errorMessage && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Error Details
                                    </h4>
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                        <p className="text-sm text-destructive">{selectedLog.errorMessage}</p>
                                    </div>
                                </div>
                            )}

                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        Additional Details
                                    </h4>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                        {Object.entries(selectedLog.details).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start gap-4">
                                                <span className="text-sm text-muted-foreground capitalize whitespace-nowrap">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                </span>
                                                <span className="text-sm text-right break-all font-mono">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
