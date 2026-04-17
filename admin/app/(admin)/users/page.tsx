"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi, authClient } from "@/lib/auth-client";
import { useDebounce } from "@/lib/use-debounce";
import { getInitials } from "@/lib/utils";
import type { UserStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MoreHorizontal,
    Search,
    X,
    UserPlus,
    Shield,
    ShieldOff,
    Key,
    Trash2,
    RefreshCw,
    FileText,
    ChevronLeft,
    ChevronRight,
    Users as UsersIcon,
    Mail,
    Crown,
    ShieldAlert,
    CheckCircle2,
    Loader2,
    Clock,
    Filter,
    RotateCcw,
    SlidersHorizontal,
    Calendar,
    Copy,
    UserCircle,
} from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    banned?: boolean | null;
    banReason?: string | null;
    emailVerified: boolean;
    createdAt: string | Date;
    image?: string | null;
}

interface UserFilters {
    role: ("all" | "user" | "admin")[];
    status: ("all" | "active" | "banned")[];
    emailVerification: ("all" | "verified" | "unverified")[];
    dateRange: DateRange | undefined;
    sortBy: "createdAt" | "name" | "email";
    sortOrder: "asc" | "desc";
}

type DialogType = "ban" | "unban" | "role" | "password" | "impersonate" | "sessions" | "delete" | null;

const USERS_PER_PAGE = 10;

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        adminUsers: 0,
        bannedUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        activeUsers: 0,
        newThisMonth: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [dialogType, setDialogType] = useState<DialogType>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [banReason, setBanReason] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("");

    // Add User Drawer State
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
    const [forcePasswordChange, setForcePasswordChange] = useState(true);

    // Filter Drawer State
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<UserFilters>({
        role: ["all"],
        status: ["all"],
        emailVerification: ["all"],
        dateRange: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    // Current admin user state
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

    // Temp filters for the drawer state
    const [tempFilters, setTempFilters] = useState<UserFilters>(filters);

    // Sync temp filters when drawer opens
    useEffect(() => {
        if (filterOpen) {
            setTempFilters(filters);
        }
    }, [filterOpen, filters]);

    const fetchUsers = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * USERS_PER_PAGE;
            // Detect search type based on query
            const isEmail = debouncedSearch?.includes('@');

            const result = await adminApi.listUsers({
                limit: debouncedSearch ? 100 : USERS_PER_PAGE, // Fetch more for client-side filtering
                offset: debouncedSearch ? 0 : offset,
                // Search by email if contains @, otherwise search by name
                searchValue: debouncedSearch && isEmail ? debouncedSearch : undefined,
                searchField: debouncedSearch && isEmail ? "email" : undefined,
                searchOperator: "contains",
                sortBy: filters.sortBy,
                sortDirection: filters.sortOrder,
            });

            if (result.data?.users) {
                // Client-side filtering for fields not supported by API
                let filteredUsers = result.data.users;

                // Client-side search for name and ID (API only supports email search reliably)
                if (debouncedSearch && !isEmail) {
                    const query = debouncedSearch.toLowerCase();
                    filteredUsers = filteredUsers.filter(u =>
                        u.name?.toLowerCase().includes(query) ||
                        u.email?.toLowerCase().includes(query) ||
                        u.id.toLowerCase().includes(query)
                    );
                }

                // Filter by role
                if (!filters.role.includes("all")) {
                    filteredUsers = filteredUsers.filter(u =>
                        filters.role.includes(u.role as "user" | "admin" | undefined || "user")
                    );
                }

                // Filter by status (banned)
                if (!filters.status.includes("all")) {
                    filteredUsers = filteredUsers.filter(u => {
                        if (filters.status.includes("banned")) return u.banned;
                        if (filters.status.includes("active")) return !u.banned;
                        return true;
                    });
                }

                // Filter by email verification
                if (!filters.emailVerification.includes("all")) {
                    filteredUsers = filteredUsers.filter(u => {
                        if (filters.emailVerification.includes("verified")) return u.emailVerified;
                        if (filters.emailVerification.includes("unverified")) return !u.emailVerified;
                        return true;
                    });
                }

                // Filter by date range
                if (filters.dateRange?.from) {
                    filteredUsers = filteredUsers.filter(u => {
                        const createdDate = new Date(u.createdAt);
                        // CLONE the date to avoid mutating state
                        const fromDate = new Date(filters.dateRange!.from!);
                        // Reset time portion for accurate date comparison
                        fromDate.setHours(0, 0, 0, 0);
                        return createdDate >= fromDate;
                    });
                }

                if (filters.dateRange?.to) {
                    filteredUsers = filteredUsers.filter(u => {
                        const createdDate = new Date(u.createdAt);
                        // CLONE the date to avoid mutating state
                        const toDate = new Date(filters.dateRange!.to!);
                        toDate.setHours(23, 59, 59, 999);
                        return createdDate <= toDate;
                    });
                }


                setUsers(filteredUsers);
                // When searching, we want to show the count of the filtered results,
                // not the total users in the database
                if (debouncedSearch) {
                    setTotalCount(filteredUsers.length);
                } else {
                    setTotalCount(result.data.total || result.data.users.length);
                }
            } else {
                setUsers([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            // Ensure users is at least empty array on error to avoid rendering issues
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, filters]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await adminApi.getUserStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, []);

    // Get count of active filters
    const getActiveFilterCount = () => {
        let count = 0;
        if (!filters.role.includes("all")) count++;
        if (!filters.status.includes("all")) count++;
        if (!filters.emailVerification.includes("all")) count++;
        if (filters.dateRange?.from || filters.dateRange?.to) count++;
        return count;
    };

    // Reset all filters
    // Reset all filters in the drawer (only resets temp state)
    const resetFilters = () => {
        setTempFilters({
            role: ["all"],
            status: ["all"],
            emailVerification: ["all"],
            dateRange: undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
        });
    };

    // Toggle filter array values (updates temp state)
    const toggleFilterValue = <T extends string>(key: keyof UserFilters, value: T) => {
        setTempFilters(prev => {
            const currentArray = prev[key] as T[];
            if (currentArray.includes(value)) {
                // If removing "all", add the first non-all option, or if removing last option, add "all"
                if (value === "all" && currentArray.length === 1) return prev;
                if (currentArray.filter(v => v !== value).length === 0) {
                    return { ...prev, [key]: ["all"] };
                }
                return { ...prev, [key]: currentArray.filter(v => v !== value) };
            } else {
                // If adding a non-all value, remove "all"
                const newValues = value === "all" ? ["all" as T] : [...currentArray.filter(v => v !== "all"), value];
                return { ...prev, [key]: newValues };
            }
        });
    };

    // Apply filters and close drawer
    // Apply filters and close drawer
    const applyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
        setFilterOpen(false);
    };

    useEffect(() => {
        fetchUsers(currentPage);
        fetchStats();
    }, [fetchUsers, currentPage, fetchStats]);

    // Fetch current admin user
    useEffect(() => {
        const fetchCurrentAdmin = async () => {
            try {
                const session = await authClient.getSession();
                if (session.data?.user?.id) {
                    setCurrentAdminId(session.data.user.id);
                }
            } catch (error) {
                console.error("Failed to fetch current admin:", error);
            }
        };
        fetchCurrentAdmin();
    }, []);

    const handleClearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    const openDialog = (user: User, type: DialogType) => {
        setSelectedUser(user);
        setDialogType(type);
        setBanReason("");
        setNewPassword("");
        setNewRole(user.role || "user");
    };

    const closeDialog = () => {
        setSelectedUser(null);
        setDialogType(null);
    };

    const handleBanUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.banUser(selectedUser.id, banReason);
            toast.success(`User ${selectedUser.email} has been banned`);
            await fetchUsers(currentPage);
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to ban user:", error);
            toast.error(error.message || "Failed to ban user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnbanUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.unbanUser(selectedUser.id);
            toast.success(`User ${selectedUser.email} has been unbanned`);
            await fetchUsers(currentPage);
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to unban user:", error);
            toast.error(error.message || "Failed to unban user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetRole = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.setRole(selectedUser.id, newRole as "user" | "admin");
            toast.success(`Role changed to ${newRole} for ${selectedUser.email}`);
            await fetchUsers(currentPage);
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to set role:", error);
            toast.error(error.message || "Failed to change role");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetPassword = async () => {
        if (!selectedUser || !newPassword) return;
        setActionLoading(true);
        try {
            await adminApi.setPassword(selectedUser.id, newPassword);
            toast.success(`Password updated for ${selectedUser.email}`);
            closeDialog();
        } catch (error: any) {
            console.error("Failed to set password:", error);
            toast.error(error.message || "Failed to set password");
        } finally {
            setActionLoading(false);
        }
    };

    const handleImpersonate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.impersonateUser(selectedUser.id);
            toast.success(`Impersonating ${selectedUser.email}...`);
            // Redirect to user frontend (port 3001) instead of admin panel
            window.location.href = process.env.NEXT_PUBLIC_USER_FRONTEND_URL || 'http://localhost:3001';
        } catch (error: any) {
            console.error("Failed to impersonate:", error);
            toast.error(error.message || "Failed to impersonate user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.removeUser(selectedUser.id);
            toast.success(`User ${selectedUser.email} deleted`);
            if (users.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchUsers(currentPage);
            }
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            toast.error(error.message || "Failed to delete user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeSessions = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.revokeAllSessions(selectedUser.id);
            toast.success(`All sessions revoked for ${selectedUser.email}`);
            closeDialog();
        } catch (error: any) {
            console.error("Failed to revoke sessions:", error);
            toast.error(error.message || "Failed to revoke sessions");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddUserLoading(true);

        try {
            await adminApi.createUser({
                email: newUserEmail,
                name: newUserName,
                role: newUserRole,
                forcePasswordChange,
            });

            toast.success(`User ${newUserName} created successfully. Login credentials sent to ${newUserEmail}`);

            await fetchUsers(currentPage);
            await fetchStats();

            // Reset form and close drawer
            setNewUserEmail("");
            setNewUserName("");
            setNewUserRole("user");
            setForcePasswordChange(true);
            setAddUserOpen(false);
        } catch (error: any) {
            console.error("Failed to create user:", error);
            toast.error(error.message || "Failed to create user");
        } finally {
            setAddUserLoading(false);
        }
    };

    const closeAddUserDrawer = () => {
        setAddUserOpen(false);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserRole("user");
        setForcePasswordChange(true);
    };

    const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);
    const startRecord = (currentPage - 1) * USERS_PER_PAGE + 1;
    const endRecord = Math.min(currentPage * USERS_PER_PAGE, totalCount);

    const getRoleBadge = (role?: string) => {
        if (role === "admin") {
            return (
                <Badge className="bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border-chart-4/30">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                User
            </Badge>
        );
    };

    const isSelfUser = (userId: string) => currentAdminId === userId;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Users</h1>
                        <p className="text-muted-foreground mt-1">Manage all registered users</p>
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
                                            Filter users by role, status, verification, and more
                                        </SheetDescription>
                                    </SheetHeader>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                    {/* Role Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Role</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(["all", "user", "admin"] as const).map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => toggleFilterValue("role", role)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.role.includes(role)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {role === "all" ? "All Roles" : role.charAt(0).toUpperCase() + role.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(["all", "active", "banned"] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => toggleFilterValue("status", status)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.status.includes(status)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Verification Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Email Verification</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(["all", "verified", "unverified"] as const).map((verification) => (
                                                <button
                                                    key={verification}
                                                    type="button"
                                                    onClick={() => toggleFilterValue("emailVerification", verification)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.emailVerification.includes(verification)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {verification === "all"
                                                        ? "All Verification"
                                                        : verification === "verified"
                                                            ? "Verified"
                                                            : "Unverified"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date Range Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Created Date Range
                                        </label>
                                        <div className="space-y-2">
                                            <div className="space-y-2">
                                                <DatePickerWithRange
                                                    date={tempFilters.dateRange}
                                                    setDate={(date) => {
                                                        setTempFilters(prev => ({ ...prev, dateRange: date }));
                                                    }}
                                                    className="w-full"
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
                                                <Select
                                                    value={tempFilters.sortBy}
                                                    onValueChange={(value) => {
                                                        setTempFilters(prev => ({ ...prev, sortBy: value as any }));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="createdAt">Created Date</SelectItem>
                                                        <SelectItem value="name">Name</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">Order</label>
                                                <Select
                                                    value={tempFilters.sortOrder}
                                                    onValueChange={(value) => {
                                                        setTempFilters(prev => ({ ...prev, sortOrder: value as any }));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="desc">Descending</SelectItem>
                                                        <SelectItem value="asc">Ascending</SelectItem>
                                                    </SelectContent>
                                                </Select>
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

                        <Sheet open={addUserOpen} onOpenChange={setAddUserOpen}>
                            <SheetTrigger asChild>
                                <Button className="shadow-lg shadow-primary/20">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle className="text-2xl">Add New User</SheetTitle>
                                    <SheetDescription>
                                        Create a new user account. Login credentials will be sent to their email.
                                    </SheetDescription>
                                </SheetHeader>

                                <form onSubmit={handleCreateUser} className="space-y-6 py-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Full Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Email Address</label>
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Role</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setNewUserRole("user")}
                                                className={`flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors ${newUserRole === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-foreground hover:bg-muted/80"
                                                    }`}
                                            >
                                                <UsersIcon className="h-4 w-4" />
                                                User
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewUserRole("admin")}
                                                className={`flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors ${newUserRole === "admin"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-foreground hover:bg-muted/80"
                                                    }`}
                                            >
                                                <Crown className="h-4 w-4" />
                                                Admin
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium leading-none">
                                                Force Password Change
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setForcePasswordChange(!forcePasswordChange)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${forcePasswordChange
                                                    ? "bg-primary"
                                                    : "bg-muted/80"
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${forcePasswordChange ? "translate-x-6" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {forcePasswordChange
                                                ? "User will be required to change their password on first login."
                                                : "User can log in with the generated password without changing it."}
                                        </p>
                                    </div>

                                    <SheetFooter className="gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeAddUserDrawer}
                                            className="flex-1"
                                            disabled={addUserLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1"
                                            disabled={addUserLoading || !newUserName || !newUserEmail}
                                        >
                                            {addUserLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Create User
                                                </>
                                            )}
                                        </Button>
                                    </SheetFooter>
                                </form>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-2/20 rounded-lg">
                                    <UsersIcon className="h-5 w-5 text-chart-2" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-4/20 rounded-lg">
                                    <Crown className="h-5 w-5 text-chart-4" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Admins</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.adminUsers}</p>
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
                                    <p className="text-sm text-muted-foreground">Active</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.activeUsers}</p>
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
                                    <p className="text-sm text-muted-foreground">Banned</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.bannedUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-3/20 rounded-lg">
                                    <Mail className="h-5 w-5 text-chart-3" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Verified</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.verifiedUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/20 rounded-lg">
                                    <RefreshCw className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Unverified</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.unverifiedUsers}</p>
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
                                    <p className="text-sm text-muted-foreground">New This Month</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.newThisMonth}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-11 pr-11 h-12 bg-muted border-border focus-visible:ring-primary"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? (
                                    <>Found {totalCount} {totalCount === 1 ? "result" : "results"} for "{searchQuery}"</>
                                ) : (
                                    <>Showing {totalCount} {totalCount === 1 ? "user" : "total users"}</>
                                )}
                            </p>
                            <Button
                                onClick={() => fetchUsers(currentPage)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="font-semibold text-foreground">User</TableHead>
                                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                                    <TableHead className="font-semibold text-foreground">Joined</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <p className="text-sm text-muted-foreground">Loading users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="p-4 bg-muted rounded-full">
                                                    <UsersIcon className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">No users found</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {searchQuery
                                                            ? "Try adjusting your search terms"
                                                            : "Get started by adding your first user"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-slate-100 dark:ring-slate-800">
                                                        <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-foreground font-semibold text-sm">
                                                            {getInitials(user.name || user.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground">
                                                            {user.name || "Unnamed User"}
                                                        </p>
                                                        <div className="group flex items-center gap-1">
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {user.id.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted/80 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(user.id);
                                                                    toast.success("User ID copied");
                                                                }}
                                                                title="Copy User ID"
                                                            >
                                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                                            <TableCell>
                                                {user.banned ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30 gap-1 cursor-help">
                                                                <ShieldAlert className="w-3 h-3" />
                                                                Banned
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{user.banReason || "No reason provided"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Badge className="bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 border-chart-3/30 gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    <span className="text-sm">{user.email}</span>
                                                    {user.emailVerified && (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[200px]">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(user, "role")}
                                                            disabled={isSelfUser(user.id)}
                                                            className="gap-2"
                                                        >
                                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                                            <span>Change Role</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(user, "password")}
                                                            className="gap-2"
                                                        >
                                                            <Key className="h-4 w-4 text-muted-foreground" />
                                                            <span>Reset Password</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(user, "sessions")}
                                                            disabled={isSelfUser(user.id)}
                                                            className="gap-2"
                                                        >
                                                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                                            <span>Revoke Sessions</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/audit?userId=${user.id}`)}
                                                            className="gap-2"
                                                        >
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <span>View Audit Logs</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(user, "impersonate")}
                                                            disabled={isSelfUser(user.id) || !!user.banned}
                                                            className="gap-2"
                                                        >
                                                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span>Impersonate</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {user.banned ? (
                                                            <DropdownMenuItem
                                                                onClick={() => openDialog(user, "unban")}
                                                                disabled={isSelfUser(user.id)}
                                                                className="gap-2 text-chart-3"
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                                <span>Unban User</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => openDialog(user, "ban")}
                                                                disabled={isSelfUser(user.id)}
                                                                className="gap-2 text-accent-foreground"
                                                            >
                                                                <ShieldOff className="h-4 w-4" />
                                                                <span>Ban User</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(user, "delete")}
                                                            disabled={isSelfUser(user.id)}
                                                            className="gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span>Delete User</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                                Showing {startRecord} to {endRecord} of {totalCount} users
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

                {/* Action Dialogs */}
                <Dialog open={dialogType === "ban"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Ban User</DialogTitle>
                            <DialogDescription className="text-base">
                                This will ban <span className="font-semibold text-foreground">{selectedUser?.email}</span> and revoke all their sessions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Ban Reason (optional)</label>
                                <Input
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Reason for banning this user..."
                                    className="resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button variant="destructive" onClick={handleBanUser} disabled={actionLoading}>
                                {actionLoading ? "Banning..." : "Ban User"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "unban"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Unban User</DialogTitle>
                            <DialogDescription className="text-base">
                                This will remove the ban from <span className="font-semibold text-foreground">{selectedUser?.email}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleUnbanUser} disabled={actionLoading}>
                                {actionLoading ? "Unbanning..." : "Unban User"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "role"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Change Role</DialogTitle>
                            <DialogDescription className="text-base">
                                Change the role for <span className="font-semibold text-foreground">{selectedUser?.email}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Role</label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            <div className="flex items-center gap-2">
                                                <UsersIcon className="h-4 w-4" />
                                                <span>User</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <Crown className="h-4 w-4 text-chart-4" />
                                                <span>Admin</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleSetRole} disabled={actionLoading}>
                                {actionLoading ? "Saving..." : "Save Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "password"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Reset Password</DialogTitle>
                            <DialogDescription className="text-base">
                                Set a new password for <span className="font-semibold text-foreground">{selectedUser?.email}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">New Password</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleSetPassword} disabled={actionLoading || !newPassword}>
                                {actionLoading ? "Saving..." : "Set Password"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "impersonate"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Impersonate User</DialogTitle>
                            <DialogDescription className="text-base">
                                You will be logged in as <span className="font-semibold text-foreground">{selectedUser?.email}</span>. This session will last 1 hour.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleImpersonate} disabled={actionLoading}>
                                {actionLoading ? "Starting..." : "Start Impersonation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "sessions"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Revoke All Sessions</DialogTitle>
                            <DialogDescription className="text-base">
                                This will sign out <span className="font-semibold text-foreground">{selectedUser?.email}</span> from all devices.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRevokeSessions} disabled={actionLoading}>
                                {actionLoading ? "Revoking..." : "Revoke All Sessions"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogType === "delete"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Delete User</DialogTitle>
                            <DialogDescription className="text-base">
                                This will <span className="font-semibold text-destructive">permanently delete</span> <span className="font-semibold text-foreground">{selectedUser?.email}</span>. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
                                {actionLoading ? "Deleting..." : "Delete User"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
