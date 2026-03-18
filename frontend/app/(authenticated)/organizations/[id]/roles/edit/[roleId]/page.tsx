"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useOrganizationDetail,
  useCurrentUserRole,
} from "@/hooks/use-organization-queries";
import { RoleForm } from "@/app/(authenticated)/organizations/[id]/roles/role-form";
import { Loader2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface RoleData {
  id: string;
  role: string;
  permission: Record<string, string[]>;
}

export default function EditRolePage() {
  const params = useParams<{ id: string; roleId: string }>();
  const { data: organization, isLoading: orgLoading } = useOrganizationDetail(
    params.id,
  );
  const {
    isOwner,
    isAdmin,
    isLoading: roleLoading,
  } = useCurrentUserRole(params.id);

  const [role, setRole] = useState<RoleData | null>(null);
  const [roleFetchLoading, setRoleFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoading = orgLoading || roleLoading || roleFetchLoading;
  const canManageRoles = isOwner || isAdmin;

  useEffect(() => {
    if (roleLoading) return;
    if (!canManageRoles) {
      setRoleFetchLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${params.id}/roles/${params.roleId}`,
          { credentials: "include" },
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Failed to fetch role");
        }

        const data = await response.json();
        setRole(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load role";
        setError(message);
        toast.error(message);
      } finally {
        setRoleFetchLoading(false);
      }
    };

    fetchRole();
  }, [params.id, params.roleId, canManageRoles, roleLoading]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
          <p className="text-muted-foreground">
            Modify permissions for a custom role
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                Only organization owners and admins can edit roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
          <p className="text-muted-foreground">
            Modify permissions for a custom role
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Role Not Found</h3>
              <p className="text-sm text-muted-foreground">
                {error || "The role you are looking for does not exist."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Role: {role.role}
        </h1>
        <p className="text-muted-foreground">
          Modify permissions for {role.role} in {organization?.name || ""}
        </p>
      </div>
      <RoleForm
        organizationId={params.id}
        organizationName={organization?.name || ""}
        existingRole={role}
      />
    </div>
  );
}
