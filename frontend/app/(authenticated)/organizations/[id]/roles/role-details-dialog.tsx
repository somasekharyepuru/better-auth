"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  PERMISSION_DESCRIPTIONS,
  RESOURCES,
  getRoleDisplay,
  formatRoleName,
  type Resource,
} from "@/lib/permissions";
import {
  Users,
  Building,
  Mail,
  Hash,
  Shield,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";

const RESOURCE_ICONS: Record<Resource, React.ElementType> = {
  user: User,
  organization: Building,
  member: Users,
  invitation: Mail,
  team: Hash,
  ac: Shield,
};

const RESOURCE_LABELS: Record<Resource, string> = {
  user: "Users",
  organization: "Organization",
  member: "Members",
  invitation: "Invitations",
  team: "Teams",
  ac: "Access Control",
};

interface RoleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  permissions: Record<string, string[]>;
  isDefault?: boolean;
  memberCount?: number;
}

export function RoleDetailsDialog({
  open,
  onOpenChange,
  roleName,
  permissions,
  isDefault = false,
  memberCount = 0,
}: RoleDetailsDialogProps) {
  const display = getRoleDisplay(roleName);
  const totalPermissions = Object.values(permissions)
    .flat()
    .filter((a) => a).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <display.icon className="h-5 w-5 text-muted-foreground" />
            {display.label}
            {isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{display.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>
              {totalPermissions}{" "}
              {totalPermissions === 1 ? "permission" : "permissions"}
            </span>
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {(Object.keys(RESOURCES) as Resource[]).map((resource) => {
              const actions = RESOURCES[resource];
              const grantedActions = (permissions[resource] || []) as string[];
              const Icon = RESOURCE_ICONS[resource];

              return (
                <div key={resource}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {RESOURCE_LABELS[resource]}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {grantedActions.length}/{actions.length}
                    </Badge>
                  </div>
                  <div className="grid gap-1.5 ml-6">
                    {actions.map((action) => {
                      const isGranted = grantedActions.includes(action);
                      const description =
                        PERMISSION_DESCRIPTIONS[resource]?.[action] || action;

                      return (
                        <div
                          key={`${resource}-${action}`}
                          className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 ${
                            isGranted
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {isGranted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span>{description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
