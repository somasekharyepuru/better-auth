"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { adminApi } from "@/lib/auth-client";
import type { DashboardStats } from "@/lib/types";

const DEFAULT_STATS: DashboardStats = {
    totalUsers: 0,
    adminUsers: 0,
    bannedUsers: 0,
    newThisWeek: 0,
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminApi.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            description: "Registered users",
            color: "text-chart-2",
        },
        {
            title: "Admin Users",
            value: stats.adminUsers,
            icon: ShieldCheck,
            description: "With admin privileges",
            color: "text-chart-1",
        },
        {
            title: "Banned Users",
            value: stats.bannedUsers,
            icon: ShieldX,
            description: "Currently banned",
            color: "text-destructive",
        },
        {
            title: "New This Week",
            value: stats.newThisWeek,
            icon: Clock,
            description: "Recent registrations",
            color: "text-chart-4",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome to the Auth Admin Dashboard</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isLoading ? "..." : stat.value}
                                </div>
                                <p className="text-xs text-muted-foreground">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>Navigate to <strong>Users</strong> to manage user accounts, ban/unban users, or impersonate users for debugging.</p>
                </CardContent>
            </Card>
        </div>
    );
}
