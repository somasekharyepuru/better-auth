"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebounce } from "@/lib/use-debounce";
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
import {
    MoreHorizontal,
    Search,
    X,
    ShieldOff,
    ShieldCheck,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Building2,
    Users,
    Ban,
    CheckCircle2,
    Loader2,
    Filter,
    SlidersHorizontal,
    Calendar,
    Copy,
    Eye,
    RotateCcw,
} from "lucide-react";

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: string | Date;
    memberCount: number;
    banned: boolean;
    banReason?: string | null;
    bannedAt?: string | null;
}

interface OrganizationStats {
    totalOrganizations: number;
    activeOrganizations: number;
    bannedOrganizations: number;
    newThisMonth: number;
    totalMembers: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface OrganizationFilters {
    banned: ("all" | "true" | "false")[];
    dateFrom: string;
    dateTo: string;
    sortBy: "createdAt" | "name" | "memberCount";
    sortOrder: "asc" | "desc";
}

const ORGANIZATIONS_PER_PAGE = 10;

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: ORGANIZATIONS_PER_PAGE,
        total: 0,
        totalPages: 0,
    });
    const [stats, setStats] = useState<OrganizationStats>({
        totalOrganizations: 0,
        activeOrganizations: 0,
        bannedOrganizations: 0,
        newThisMonth: 0,
        totalMembers: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [dialogType, setDialogType] = useState<"ban" | "delete" | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [banReason, setBanReason] = useState("");

    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<OrganizationFilters>({
        banned: ["all"],
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const [tempFilters, setTempFilters] = useState<OrganizationFilters>(filters);

    useEffect(() => {
        if (filterOpen) {
            setTempFilters(filters);
        }
    }, [filterOpen, filters]);

    const fetchOrganizations = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ORGANIZATIONS_PER_PAGE.toString(),
            });

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }

            if (!filters.banned.includes("all")) {
                filters.banned.forEach(b => params.append("banned", b));
            }

            if (filters.dateFrom) {
                params.append("dateFrom", filters.dateFrom);
            }

            if (filters.dateTo) {
                params.append("dateTo", filters.dateTo);
            }

            params.append("sortBy", filters.sortBy);
            params.append("sortOrder", filters.sortOrder);

            const response = await fetch(`${API_BASE}/api/admin/organizations?${params}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch organizations");
            }

            const data = await response.json();
            setOrganizations(data.organizations || []);
            setPagination(data.pagination || { page: 1, limit: ORGANIZATIONS_PER_PAGE, total: 0, totalPages: 0 });
        } catch (error) {
            console.error("Failed to fetch organizations:", error);
            setOrganizations([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, filters]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/stats/organizations`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch stats");
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, []);

    const getActiveFilterCount = () => {
        let count = 0;
        if (!filters.banned.includes("all")) count++;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        return count;
    };

    const resetFilters = () => {
        setTempFilters({
            banned: ["all"],
            dateFrom: "",
            dateTo: "",
            sortBy: "createdAt",
            sortOrder: "desc",
        });
    };

    const toggleFilterValue = <T extends string>(key: keyof OrganizationFilters, value: T) => {
        setTempFilters(prev => {
            const currentArray = prev[key] as T[];
            if (currentArray.includes(value)) {
                if (value === "all" && currentArray.length === 1) return prev;
                if (currentArray.filter(v => v !== value).length === 0) {
                    return { ...prev, [key]: ["all"] };
                }
                return { ...prev, [key]: currentArray.filter(v => v !== value) };
            } else {
                const newValues = value === "all" ? ["all" as T] : [...currentArray.filter(v => v !== "all"), value];
                return { ...prev, [key]: newValues };
            }
        });
    };

    const applyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
        setFilterOpen(false);
    };

    useEffect(() => {
        fetchOrganizations(currentPage);
        fetchStats();
    }, [fetchOrganizations, currentPage, fetchStats]);

    const handleClearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    const openDialog = (org: Organization, type: "ban" | "delete") => {
        setSelectedOrg(org);
        setDialogType(type);
        setBanReason("");
    };

    const closeDialog = () => {
        setSelectedOrg(null);
        setDialogType(null);
    };

    const handleBan = async () => {
        if (!selectedOrg) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${selectedOrg.id}/ban`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: banReason || undefined }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to ban organization");
            }

            toast.success(`Organization "${selectedOrg.name}" has been banned`);
            await fetchOrganizations(currentPage);
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to ban organization:", error);
            toast.error(error.message || "Failed to ban organization");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnban = async (org: Organization) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${org.id}/unban`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to unban organization");
            }

            toast.success(`Organization "${org.name}" has been unbanned`);
            await fetchOrganizations(currentPage);
            await fetchStats();
        } catch (error: any) {
            console.error("Failed to unban organization:", error);
            toast.error(error.message || "Failed to unban organization");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedOrg) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${selectedOrg.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete organization");
            }

            toast.success(`Organization "${selectedOrg.name}" deleted`);
            if (organizations.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchOrganizations(currentPage);
            }
            await fetchStats();
            closeDialog();
        } catch (error: any) {
            console.error("Failed to delete organization:", error);
            toast.error(error.message || "Failed to delete organization");
        } finally {
            setActionLoading(false);
        }
    };

    const totalPages = Math.ceil(pagination.total / ORGANIZATIONS_PER_PAGE);
    const startRecord = (currentPage - 1) * ORGANIZATIONS_PER_PAGE + 1;
    const endRecord = Math.min(currentPage * ORGANIZATIONS_PER_PAGE, pagination.total);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
                        <p className="text-muted-foreground mt-1">Manage all organizations in the system</p>
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
                                            Filter organizations by status, date range, and more
                                        </SheetDescription>
                                    </SheetHeader>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                    {/* Banned Status Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(["all", "false", "true"] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => toggleFilterValue("banned", status)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFilters.banned.includes(status)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {status === "all" ? "All Status" : status === "true" ? "Banned" : "Active"}
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
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                                                <Input
                                                    type="date"
                                                    value={tempFilters.dateFrom}
                                                    onChange={(e) => {
                                                        setTempFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                                                    }}
                                                    className="h-10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                                                <Input
                                                    type="date"
                                                    value={tempFilters.dateTo}
                                                    onChange={(e) => {
                                                        setTempFilters(prev => ({ ...prev, dateTo: e.target.value }));
                                                    }}
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
                                                        <SelectItem value="memberCount">Member Count</SelectItem>
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
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-2/20 rounded-lg">
                                    <Building2 className="h-5 w-5 text-chart-2" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Organizations</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.totalOrganizations}</p>
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
                                    <p className="text-2xl font-bold text-foreground">{stats.activeOrganizations}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/20 rounded-lg">
                                    <Ban className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Banned</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.bannedOrganizations}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">New This Month</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.newThisMonth}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card/80 backdrop-blur">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-3/20 rounded-lg">
                                    <Users className="h-5 w-5 text-chart-3" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Members</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
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
                                placeholder="Search by name, slug, or ID..."
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
                                    <>Found {pagination.total} {pagination.total === 1 ? "result" : "results"} for "{searchQuery}"</>
                                ) : (
                                    <>Showing {pagination.total} {pagination.total === 1 ? "organization" : "total organizations"}</>
                                )}
                            </p>
                            <Button
                                onClick={() => fetchOrganizations(currentPage)}
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

                {/* Organizations Table */}
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="font-semibold text-foreground">Organization</TableHead>
                                    <TableHead className="font-semibold text-foreground">Slug</TableHead>
                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                    <TableHead className="font-semibold text-foreground">Members</TableHead>
                                    <TableHead className="font-semibold text-foreground">Created</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <p className="text-sm text-muted-foreground">Loading organizations...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : organizations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="p-4 bg-muted rounded-full">
                                                    <Building2 className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">No organizations found</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {searchQuery
                                                            ? "Try adjusting your search terms"
                                                            : "No organizations exist yet"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    organizations.map((org) => (
                                        <TableRow
                                            key={org.id}
                                            className="border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${org.banned ? 'bg-destructive/20' : 'bg-primary/10'} ring-2 ring-slate-100 dark:ring-slate-800`}>
                                                        <Building2 className={`h-5 w-5 ${org.banned ? 'text-destructive' : 'text-primary'}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground">{org.name}</p>
                                                        <div className="group flex items-center gap-1">
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {org.id.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted/80 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(org.id);
                                                                    toast.success("Organization ID copied");
                                                                }}
                                                                title="Copy Organization ID"
                                                            >
                                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 font-mono text-xs">
                                                    {org.slug}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {org.banned ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30 gap-1 cursor-help">
                                                                <Ban className="w-3 h-3" />
                                                                Banned
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{org.banReason || "No reason provided"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Badge className="bg-chart-1/20 text-chart-1 hover:bg-chart-1/30 border-chart-1/30 gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span className="text-sm">{org.memberCount}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(org.createdAt).toLocaleDateString("en-US", {
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
                                                            onClick={() => router.push(`/organizations/${org.id}`)}
                                                            className="gap-2"
                                                        >
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                            <span>View Details</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {org.banned ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUnban(org)}
                                                                className="gap-2 text-chart-1"
                                                            >
                                                                <ShieldCheck className="h-4 w-4" />
                                                                <span>Unban</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => openDialog(org, "ban")}
                                                                className="gap-2 text-accent-foreground"
                                                            >
                                                                <ShieldOff className="h-4 w-4" />
                                                                <span>Ban</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => openDialog(org, "delete")}
                                                            className="gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span>Delete</span>
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
                                Showing {startRecord} to {endRecord} of {pagination.total} organizations
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

                {/* Ban Dialog */}
                <Dialog open={dialogType === "ban"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <ShieldOff className="h-5 w-5 text-accent-foreground" />
                                Ban Organization
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Banning <span className="font-semibold text-foreground">{selectedOrg?.name}</span> will prevent all members from accessing the organization.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Ban Reason (optional)</label>
                                <Input
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Reason for banning this organization..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button variant="destructive" onClick={handleBan} disabled={actionLoading}>
                                {actionLoading ? "Banning..." : "Ban Organization"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={dialogType === "delete"} onOpenChange={closeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Delete Organization</DialogTitle>
                            <DialogDescription className="text-base">
                                This will <span className="font-semibold text-destructive">permanently delete</span> <span className="font-semibold text-foreground">{selectedOrg?.name}</span> and remove all members. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                                {actionLoading ? "Deleting..." : "Delete Organization"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
