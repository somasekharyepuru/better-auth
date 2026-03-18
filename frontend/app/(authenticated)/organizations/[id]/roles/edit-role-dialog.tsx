'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RESOURCES, PERMISSION_DESCRIPTIONS } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Role {
    id: string;
    role: string;
    permission: Record<string, string[]>;
}

interface EditRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId: string;
    role: Role | null;
    onSuccess: () => void;
}

export function EditRoleDialog({ open, onOpenChange, organizationId, role, onSuccess }: EditRoleDialogProps) {
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [initialPermissions, setInitialPermissions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (role && open) {
            const perms = structuredClone(role.permission || {});
            setPermissions(perms);
            setInitialPermissions(structuredClone(role.permission || {}));
        }
    }, [role, open]);

    const handlePermissionToggle = (resource: string, action: string) => {
        setPermissions(prev => {
            const resourcePermissions = prev[resource] || [];
            const newPermissions = { ...prev };

            if (resourcePermissions.includes(action)) {
                newPermissions[resource] = resourcePermissions.filter(a => a !== action);
                if (newPermissions[resource].length === 0) {
                    delete newPermissions[resource];
                }
            } else {
                newPermissions[resource] = [...resourcePermissions, action];
            }

            return newPermissions;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!role) return;

        if (Object.keys(permissions).length === 0) {
            toast.error('Please select at least one permission');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${organizationId}/roles/${role.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions }),
            });

            if (response.ok) {
                toast.success('Role permissions updated successfully');
                onSuccess();
                onOpenChange(false);
            } else {
                let errorMessage = 'Failed to update role';
                try {
                    const error = await response.json();
                    errorMessage = typeof error === 'object' && error !== null && 'message' in error
                        ? String(error.message)
                        : errorMessage;
                } catch {
                    // Response is not JSON, use default message
                }
                toast.error(errorMessage);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update role';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);

    const isResourceChecked = (resource: string, action: string) => {
        return permissions[resource]?.includes(action) || false;
    };

    const isResourceIndeterminate = (resource: string) => {
        const resourcePermissions = permissions[resource] || [];
        const allActions = RESOURCES[resource as keyof typeof RESOURCES];
        return resourcePermissions.length > 0 && resourcePermissions.length < allActions.length;
    };

    const isResourceFullyChecked = (resource: string) => {
        const resourcePermissions = permissions[resource] || [];
        const allActions = RESOURCES[resource as keyof typeof RESOURCES];
        return resourcePermissions.length === allActions.length;
    };

    const handleResourceToggle = (resource: string) => {
        const allActions = RESOURCES[resource as keyof typeof RESOURCES];
        const isFullyChecked = isResourceFullyChecked(resource);

        setPermissions(prev => {
            const newPermissions = { ...prev };
            if (isFullyChecked) {
                delete newPermissions[resource];
            } else {
                newPermissions[resource] = [...allActions];
            }
            return newPermissions;
        });
    };

    const permissionCount = Object.values(permissions).flat().length;
    const initialPermissionCount = Object.values(initialPermissions).flat().length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Role Permissions</DialogTitle>
                    <DialogDescription>
                        Customize permissions for <strong>{role?.role}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                                {initialPermissionCount} → {permissionCount} permissions
                            </Badge>
                            {hasChanges && (
                                <Badge variant="secondary">Unsaved changes</Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Permissions</Label>
                            <ScrollArea className="h-[350px] rounded-md border p-4">
                                <div className="space-y-4">
                                    {Object.entries(RESOURCES).map(([resource, actions]) => (
                                        <div key={resource} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`edit-resource-${resource}`}
                                                    checked={isResourceFullyChecked(resource)}
                                                    onCheckedChange={() => handleResourceToggle(resource)}
                                                />
                                                <Label
                                                    htmlFor={`edit-resource-${resource}`}
                                                    className="font-medium cursor-pointer flex-1"
                                                >
                                                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                                                </Label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-2 gap-2">
                                                {actions.map(action => (
                                                    <div key={action} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`edit-${resource}-${action}`}
                                                            checked={isResourceChecked(resource, action)}
                                                            onCheckedChange={() => handlePermissionToggle(resource, action)}
                                                        />
                                                        <Label
                                                            htmlFor={`edit-${resource}-${action}`}
                                                            className="text-sm cursor-pointer"
                                                        >
                                                            {PERMISSION_DESCRIPTIONS[resource as keyof typeof PERMISSION_DESCRIPTIONS]?.[action] || action}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPermissions(initialPermissions);
                                onOpenChange(false);
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !hasChanges}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
