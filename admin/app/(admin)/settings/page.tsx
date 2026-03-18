"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SettingsPage() {
    const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_AUTH_URL || "");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Configure admin dashboard settings</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Configure the Better Auth API endpoint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Auth API URL</label>
                        <Input
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="http://localhost:3002"
                        />
                        <p className="text-xs text-muted-foreground">
                            Set this in your .env file as NEXT_PUBLIC_AUTH_URL
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Features</CardTitle>
                    <CardDescription>Available admin actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>List all users with search and pagination</li>
                        <li>Create new user accounts</li>
                        <li>Ban/unban users with optional reason</li>
                        <li>Change user roles (admin, user, custom)</li>
                        <li>Reset user passwords</li>
                        <li>Impersonate users for debugging</li>
                        <li>View and revoke user sessions</li>
                        <li>Delete user accounts</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
