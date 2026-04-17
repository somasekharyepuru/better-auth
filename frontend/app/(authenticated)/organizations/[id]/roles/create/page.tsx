"use client";

import { useParams } from "next/navigation";
import {
  useOrganizationDetail,
  useCurrentUserRole,
} from "@/hooks/use-organization-queries";
import { RoleForm } from "@/app/(authenticated)/organizations/[id]/roles/role-form";
import { Loader2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateRolePage() {
  const params = useParams<{ id: string }>();
  const { data: organization, isLoading: orgLoading } = useOrganizationDetail(
    params.id,
  );
  const {
    isOwner,
    isAdmin,
    isLoading: roleLoading,
  } = useCurrentUserRole(params.id);

  const isLoading = orgLoading || roleLoading;
  const canManageRoles = isOwner || isAdmin;

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
          <h1 className="text-3xl font-bold tracking-tight">
            Create Custom Role
          </h1>
          <p className="text-muted-foreground">
            Define permissions for a new custom role
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                Only organization owners and admins can create roles.
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
          Create Custom Role
        </h1>
        <p className="text-muted-foreground">
          Define permissions for a new custom role in {organization?.name || ""}
        </p>
      </div>
      <RoleForm
        organizationId={params.id}
        organizationName={organization?.name || ""}
      />
    </div>
  );
}
