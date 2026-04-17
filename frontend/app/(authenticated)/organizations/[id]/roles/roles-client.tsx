"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Shield, Users, Trash2, Info } from "lucide-react";
import { RoleDetailsDialog } from "./role-details-dialog";
import { toast } from "sonner";
import {
  DEFAULT_ROLES,
  RESERVED_ROLES,
  getRoleDisplay,
  type DefaultRoleName,
} from "@/lib/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit } from "lucide-react";
import {
  useCurrentUserRole,
  useOrganizationMembers,
  useInvalidateOrgQueries,
} from "@/hooks/use-organization-queries";

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
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberCount, setMemberCount] = useState<MemberCount>({});
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState<{
    name: string;
    permissions: Record<string, string[]>;
    isDefault: boolean;
  } | null>(null);
  const {
    isOwner,
    isAdmin,
    isLoading: roleLoading,
  } = useCurrentUserRole(organizationId);
  const { data: membersList = [] } = useOrganizationMembers(organizationId);
  const { invalidateMembers } = useInvalidateOrgQueries();

  // Only owner and admin can manage roles
  const canManageRoles = isOwner || isAdmin;

  useEffect(() => {
    if (roleLoading) return;
    if (canManageRoles) {
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [organizationId, canManageRoles, roleLoading]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${organizationId}/roles`,
        {
          credentials: "include",
        },
      );
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        const error = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        toast.error(
          error.message || `Failed to load roles (${response.status})`,
        );
        throw new Error(
          error.message || `HTTP ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to load roles");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (membersList.length > 0) {
      const counts: MemberCount = {};
      membersList.forEach((m: any) => {
        counts[m.role] = (counts[m.role] || 0) + 1;
      });
      setMemberCount(counts);
    }
  }, [membersList]);

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

    if (!confirm(`Are you sure you want to delete the "${role.role}" role?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${organizationId}/roles/${role.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        toast.success("Role deleted successfully");
        fetchRoles();
        invalidateMembers(organizationId);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage custom roles and permissions for {organizationName}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage custom roles and permissions for {organizationName}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                Only organization owners and admins can manage roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage custom roles and permissions for {organizationName}
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/organizations/${organizationId}/roles/create`)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Role
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
                        <display.icon className="h-5 w-5 text-muted-foreground" />
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
                      {(
                        Object.entries(role.permissions ?? {}) as [
                          string,
                          string[],
                        ][]
                      )
                        .filter(
                          ([resource, actionsArr]) => actionsArr.length > 0,
                        )
                        .slice(0, 4)
                        .map(([resource, actions]) => (
                          <Badge
                            key={resource}
                            variant="outline"
                            className="text-xs"
                          >
                            {resource}: {actions.length}
                          </Badge>
                        ))}
                      {Object.keys(role.permissions || {}).length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(role.permissions || {}).length - 4} more
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
              <p className="text-sm text-muted-foreground">
                Create custom roles to customize permissions for your
                organization
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.role}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(
                          Object.entries(role.permission) as [
                            string,
                            string[],
                          ][]
                        )
                          .filter(
                            ([resource, actionsArr]) => actionsArr.length > 0,
                          )
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setViewRole({
                                name: role.role,
                                permissions: role.permission,
                                isDefault: false,
                              })
                            }
                          >
                            <Info className="mr-2 h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/organizations/${organizationId}/roles/edit/${role.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Permissions
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteRole(role)}
                            disabled={
                              RESERVED_ROLES.includes(
                                role.role as DefaultRoleName,
                              ) || memberCount[role.role] > 0
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
