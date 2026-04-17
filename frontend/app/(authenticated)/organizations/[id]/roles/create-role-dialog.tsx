"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  RESOURCES,
  PERMISSION_DESCRIPTIONS,
  ROLE_TEMPLATES,
  formatRoleName,
} from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const resetForm = () => {
    setRoleName("");
    setPermissions({});
    setSelectedTemplate(null);
  };

  useEffect(() => {
    resetForm();
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handlePermissionToggle = (resource: string, action: string) => {
    setPermissions((prev) => {
      const resourcePermissions = prev[resource] || [];
      const newPermissions = { ...prev };

      if (resourcePermissions.includes(action)) {
        newPermissions[resource] = resourcePermissions.filter(
          (a) => a !== action,
        );
        if (newPermissions[resource].length === 0) {
          delete newPermissions[resource];
        }
      } else {
        newPermissions[resource] = [...resourcePermissions, action];
      }

      return newPermissions;
    });
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = ROLE_TEMPLATES[templateKey];
    if (template) {
      setPermissions({ ...template.permissions });
      setSelectedTemplate(templateKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (Object.keys(permissions).length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${organizationId}/roles`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: roleName.trim(),
            permissions,
          }),
        },
      );

      if (response.ok) {
        toast.success("Role created successfully");
        resetForm();
        onSuccess();
        handleOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create role");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  const isResourceChecked = (resource: string, action: string) => {
    return permissions[resource]?.includes(action) || false;
  };

  const isResourceIndeterminate = (resource: string) => {
    const resourcePermissions = permissions[resource] || [];
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    return (
      resourcePermissions.length > 0 &&
      resourcePermissions.length < allActions.length
    );
  };

  const isResourceFullyChecked = (resource: string) => {
    const resourcePermissions = permissions[resource] || [];
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    return resourcePermissions.length === allActions.length;
  };

  const handleResourceToggle = (resource: string) => {
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    const isFullyChecked = isResourceFullyChecked(resource);

    setPermissions((prev) => {
      const newPermissions = { ...prev };
      if (isFullyChecked) {
        delete newPermissions[resource];
      } else {
        newPermissions[resource] = [...allActions];
      }
      return newPermissions;
    });
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Create a new role with custom permissions for your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="permissions" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., content-editor, billing-manager"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {Object.entries(RESOURCES).map(([resource, actions]) => (
                      <div key={resource} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`resource-${resource}`}
                            checked={isResourceFullyChecked(resource)}
                            onCheckedChange={() =>
                              handleResourceToggle(resource)
                            }
                          />
                          <Label
                            htmlFor={`resource-${resource}`}
                            className="font-medium cursor-pointer flex-1"
                          >
                            {resource.charAt(0).toUpperCase() +
                              resource.slice(1)}
                          </Label>
                        </div>
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {actions.map((action) => (
                            <div
                              key={action}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`${resource}-${action}`}
                                checked={isResourceChecked(resource, action)}
                                onCheckedChange={() =>
                                  handlePermissionToggle(resource, action)
                                }
                              />
                              <Label
                                htmlFor={`${resource}-${action}`}
                                className="text-sm cursor-pointer"
                              >
                                {PERMISSION_DESCRIPTIONS[
                                  resource as keyof typeof PERMISSION_DESCRIPTIONS
                                ]?.[action] || action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g., content-editor"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Label>Quick Templates</Label>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-3">
                  {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate === key
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <template.icon className="h-5 w-5 text-muted-foreground" />
                              <h4 className="font-medium">
                                {formatRoleName(template.name)}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(template.permissions)
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
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
