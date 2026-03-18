"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  ShieldCheck,
  ClipboardList,
  User,
  Eye,
  Settings,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ROLE_INFO, getRoleInfo } from "@/lib/role-info";

interface AvailableRole {
  name: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isDefault: boolean;
}

const DEFAULT_ROLE_LIST: AvailableRole[] = [
  {
    name: "admin",
    label: "Admin",
    description: "Full control except deleting the organization",
    icon: ShieldCheck,
    isDefault: true,
  },
  {
    name: "manager",
    label: "Manager",
    description: "Can manage members, invitations, and teams",
    icon: ClipboardList,
    isDefault: true,
  },
  {
    name: "member",
    label: "Member",
    description: "Read-only access to organization data",
    icon: User,
    isDefault: true,
  },
  {
    name: "viewer",
    label: "Viewer",
    description: "Read-only access to teams",
    icon: Eye,
    isDefault: true,
  },
];

interface CustomRole {
  id: string;
  role: string;
  permission: Record<string, string[]>;
}

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  member: {
    id: string;
    userId: string;
    role: string;
    user: { name: string; email: string };
  } | null;
  onSuccess: () => void;
  updateRoleFn: (memberId: string, newRole: string) => Promise<void>;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  organizationId,
  member,
  onSuccess,
  updateRoleFn,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && member) {
      setSelectedRole(member.role);
      fetchCustomRoles();
    }
  }, [open, member]);

  const fetchCustomRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${organizationId}/roles`,
        { credentials: "include" },
      );
      if (response.ok) {
        const data = await response.json();
        setCustomRoles(data);
      }
    } catch {
      // Silently fail — custom roles are optional
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!member || selectedRole === member.role) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      await updateRoleFn(member.id, selectedRole);
      onSuccess();
      onOpenChange(false);
    } catch {
      // Error handled by updateRoleFn
    } finally {
      setSaving(false);
    }
  };

  const allRoles: AvailableRole[] = [
    ...DEFAULT_ROLE_LIST,
    ...customRoles.map((cr) => ({
      name: cr.role,
      label: cr.role
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      description: `Custom role with ${Object.values(cr.permission).flat().length} permissions`,
      icon: Settings,
      isDefault: false,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Change the role for{" "}
            <strong>{member?.user.name || member?.user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Current role:</span>
          <Badge className={getRoleInfo(member?.role || "member").color}>
            {member?.role === "owner" && <Crown className="mr-1 h-3 w-3" />}
            {getRoleInfo(member?.role || "member").label}
          </Badge>
        </div>

        <Separator />

        <ScrollArea className="max-h-[350px] pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {allRoles.map((role) => {
                const isSelected = selectedRole === role.name;
                const isCurrent = member?.role === role.name;
                const Icon = role.icon;

                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => setSelectedRole(role.name)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {role.label}
                        </span>
                        {!role.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {role.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedRole === member?.role}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Update Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
