"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Shield,
  Settings,
  Users,
  Trash2,
  Edit,
  Info,
} from "lucide-react";
import { RoleDetailsDialog } from "./role-details-dialog";
import { toast } from "sonner";
import {
  DEFAULT_ROLES,
  RESERVED_ROLES,
  getRoleDisplay,
  type DefaultRoleName,
} from "@/lib/permissions";
import { fetchAPI, APIError } from "@/lib/auth-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Role {
  id: string;
  role: string;
  permission: Record<string, string[]>;
  createdAt: string;
  updatedAt: string | null;
}

interface MemberCount {
  [key: string]: number;
}

interface RolesClientProps {
  organizationId: string;
  organizationName: string;
}

export function RolesClient({
  organizationId,
  organizationName,
}: RolesClientProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberCount, setMemberCount] = useState<MemberCount>({});
  const [loading, setLoading] = useState(true);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<{
    name: string;
    permissions: Record<string, string[]>;
    isDefault: boolean;
  } | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await fetchAPI<Role[]>(
        `/api/organizations/${organizationId}/roles`,
      );
      setRoles(data);
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(`Failed to load roles (${error.status}): ${error.message}`);
      } else {
        toast.error("Failed to load roles: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchMemberCounts = useCallback(async () => {
    try {
      const members = await fetchAPI<any[]>(
        `/api/organizations/${organizationId}/members`,
      );
      const counts: MemberCount = {};
      members.forEach((m: { role: string }) => {
        counts[m.role] = (counts[m.role] || 0) + 1;
      });
      setMemberCount(counts);
    } catch (error) {
      if (error instanceof APIError) {
        console.error(
          "Failed to fetch member counts:",
          error.status,
          error.message,
          error.body,
        );
        toast.error(
          `Failed to load member counts (${error.status}): ${error.message}`,
        );
      } else {
        console.error("Failed to fetch member counts:", error);
        toast.error("Failed to load member counts: Unknown error");
      }
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRoles();
    fetchMemberCounts();
  }, [fetchRoles, fetchMemberCounts]);

  const getPermissionCount = (permissions: Record<string, string[]>) => {
    return Object.values(permissions).flat().length;
  };

  const getRoleBadgeVariant = (roleName: string) => {
    if (roleName === "owner") return "destructive";
    if (roleName === "admin") return "default";
    if (RESERVED_ROLES.includes(roleName as DefaultRoleName))
      return "secondary";
    return "outline";
  };

  const handleDeleteRole = async (role: Role) => {
    if (RESERVED_ROLES.includes(role.role as DefaultRoleName)) {
      toast.error("Cannot delete reserved roles");
      return;
    }

    if (memberCount[role.role] > 0) {
      toast.error(
        `Cannot delete role with ${memberCount[role.role]} member(s)`,
      );
      return;
    }

    // Removed the confirm() check as it's now handled by AlertDialog

    setDeletingRole(role.id);
    try {
      await fetchAPI(`/api/organizations/${organizationId}/roles/${role.id}`, {
        method: "DELETE",
      });

      toast.success("Role deleted successfully");
      fetchRoles();
      fetchMemberCounts();
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(
          `Failed to delete role (${error.status}): ${error.message}`,
        );
      } else {
        toast.error("Failed to delete role: Unknown error");
      }
    } finally {
      setDeletingRole(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage custom roles and permissions for {organizationName}
          </p>
        </div>
        <Button asChild>
          <Link href={`/organizations/${organizationId}/roles/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Roles</CardTitle>
          <CardDescription>
            Built-in roles with predefined permissions that cannot be modified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(DEFAULT_ROLES).map((role) => {
              const display = getRoleDisplay(role.name);
              return (
                <Card
                  key={role.name}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() =>
                    setViewRole({
                      name: role.name,
                      permissions: role.permissions as unknown as Record<string, string[]>,
                      isDefault: true,
                    })
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{display.emoji}</span>
                        {display.label}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(role.name)}>
                          {memberCount[role.name] || 0} users
                        </Badge>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {display.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions)
                        .filter(
                          ([_, actions]) => (actions as string[]).length > 0,
                        )
                        .slice(0, 4)
                        .map(([resource, actions]) => (
                          <Badge
                            key={resource}
                            variant="outline"
                            className="text-xs"
                          >
                            {resource}: {(actions as string[]).length}
                          </Badge>
                        ))}
                      {Object.keys(role.permissions).length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(role.permissions).length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Roles</CardTitle>
          <CardDescription>
            Organization-specific roles with customizable permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No custom roles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create custom roles to customize permissions for your
                organization
              </p>
              <Button asChild>
                <Link href={`/organizations/${organizationId}/roles/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Role
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.role}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(role.permission)
                          .filter(([_, actions]) => actions.length > 0)
                          .slice(0, 3)
                          .map(([resource, actions]) => (
                            <Badge
                              key={resource}
                              variant="outline"
                              className="text-xs"
                            >
                              {resource}: {actions.length}
                            </Badge>
                          ))}
                        {Object.keys(role.permission).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{getPermissionCount(role.permission)} permissions
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{memberCount[role.role] || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setViewRole({
                              name: role.role,
                              permissions: role.permission,
                              isDefault: false,
                            })
                          }
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/organizations/${organizationId}/roles/edit/${role.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={
                                RESERVED_ROLES.includes(
                                  role.role as DefaultRoleName,
                                ) ||
                                memberCount[role.role] > 0 ||
                                deletingRole === role.id
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the "{role.role}" role and
                                remove it from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(role)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RoleDetailsDialog
        open={!!viewRole}
        onOpenChange={(open) => !open && setViewRole(null)}
        roleName={viewRole?.name || ""}
        permissions={viewRole?.permissions || {}}
        isDefault={viewRole?.isDefault}
        memberCount={memberCount[viewRole?.name || ""] || 0}
      />
    </div>
  );
}
