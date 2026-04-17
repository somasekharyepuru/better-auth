'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/auth-client';
import { RESOURCES, PERMISSION_DESCRIPTIONS, ROLE_TEMPLATES, RESERVED_ROLES, type Resource, type Permission } from '@/lib/permissions';

type AllActions = 'create' | 'read' | 'update' | 'delete' | 'cancel';

function isValidActionForResource(resource: Resource, action: string): action is AllActions {
  return (RESOURCES[resource] as readonly string[]).includes(action);
}

function hasAction(permissions: Permission, resource: Resource, action: AllActions): boolean {
  const resourcePerms = permissions[resource];
  return resourcePerms?.includes(action as never) ?? false;
}

function toggleActionInPermissions(
  permissions: Permission,
  resource: Resource,
  action: AllActions
): Permission {
  const currentPerms = (permissions[resource] ?? []) as AllActions[];
  const hasExistingAction = currentPerms.includes(action);
  const newPerms = hasExistingAction
    ? currentPerms.filter(a => a !== action)
    : [...currentPerms, action];

  return {
    ...permissions,
    [resource]: newPerms as never,
  };
}
import { ArrowLeft, Save, Shield, CheckCircle2, AlertCircle, Users, Building, Mail, Settings, Hash, Eye, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleFormData {
  name: string;
  description: string;
  permissions: Permission;
}

interface RoleFormProps {
  organizationId: string;
  organizationName: string;
  existingRole?: {
    id: string;
    role: string;
    permission: Record<string, string[]>;
  };
}

const RESOURCE_ICONS: Record<Resource, React.ElementType> = {
  user: Users,
  organization: Building,
  member: Users,
  invitation: Mail,
  team: Hash,
  ac: Shield,
};

const RESOURCE_COLORS: Record<Resource, string> = {
  user: 'text-blue-500',
  organization: 'text-purple-500',
  member: 'text-green-500',
  invitation: 'text-orange-500',
  team: 'text-pink-500',
  ac: 'text-red-500',
};

export function RoleForm({ organizationId, organizationName, existingRole }: RoleFormProps) {
  const router = useRouter();
  const isEditing = !!existingRole;

  const [formData, setFormData] = useState<RoleFormData>({
    name: existingRole?.role || '',
    description: existingRole ? '' : 'Custom role with specific permissions',
    permissions: existingRole?.permission || initializeEmptyPermissions(),
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  function initializeEmptyPermissions(): Permission {
    const perms: Permission = {};
    (Object.keys(RESOURCES) as Resource[]).forEach(resource => {
      perms[resource] = [];
    });
    return perms;
  }

  const togglePermission = (resource: Resource, action: string) => {
    if (!isValidActionForResource(resource, action)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      permissions: toggleActionInPermissions(prev.permissions, resource, action),
    }));
    setIsDirty(true);
  };

  const toggleAllForResource = (resource: Resource, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: checked ? [...RESOURCES[resource]] : [],
      },
    }));
    setIsDirty(true);
  };

  const isResourceFullyChecked = (resource: Resource): boolean => {
    const perms = formData.permissions[resource] || [];
    return perms.length === RESOURCES[resource].length && perms.length > 0;
  };

  const isResourcePartiallyChecked = (resource: Resource): boolean => {
    const perms = formData.permissions[resource] || [];
    return perms.length > 0 && perms.length < RESOURCES[resource].length;
  };

  const applyTemplate = (templateKey: string) => {
    const template = ROLE_TEMPLATES[templateKey];
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: isEditing ? prev.name : template.name,
        description: template.description,
        permissions: { ...template.permissions },
      }));
      setSelectedTemplate(templateKey);
      setIsDirty(true);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (RESERVED_ROLES.includes(formData.name.toLowerCase() as any)) {
      newErrors.name = 'This name is reserved for system roles';
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name = 'Role name can only contain lowercase letters, numbers, and hyphens';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Role name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Role name must be less than 50 characters';
    }

    const totalPermissions = Object.values(formData.permissions).flat().length;
    if (totalPermissions === 0) {
      newErrors.permissions = 'Select at least one permission';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
      };

      if (isEditing && existingRole) {
        await fetchAPI(`/api/organizations/${organizationId}/roles/${existingRole.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Role updated successfully');
      } else {
        await fetchAPI(`/api/organizations/${organizationId}/roles`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Role created successfully');
      }

      router.push(`/organizations/${organizationId}/roles`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionCount = () => {
    return Object.values(formData.permissions).flat().length;
  };

  const getResourcePermissionCount = (resource: Resource): number => {
    return formData.permissions[resource]?.length || 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          {isEditing
            ? 'Modifying role permissions will immediately affect all members with this role.'
            : 'Custom roles allow you to define precise permissions for your organization members.'}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>Basic information about this role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., content-editor, project-lead"
                  value={formData.name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                    setIsDirty(true);
                  }}
                  disabled={isEditing}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role is for..."
                  value={formData.description}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    setIsDirty(true);
                  }}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Configure what actions this role can perform
                  </CardDescription>
                </div>
                <Badge variant={getPermissionCount() > 0 ? 'default' : 'outline'}>
                  {getPermissionCount()} permission{getPermissionCount() !== 1 ? 's' : ''} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {errors.permissions && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.permissions}</AlertDescription>
                </Alert>
              )}

              <Accordion type="multiple" defaultValue={[]}>
                {(Object.keys(RESOURCES) as Resource[]).map(resource => {
                  const Icon = RESOURCE_ICONS[resource];
                  const actions = RESOURCES[resource];
                  const isFullyChecked = isResourceFullyChecked(resource);
                  const isPartiallyChecked = isResourcePartiallyChecked(resource);

                  return (
                    <AccordionItem key={resource} value={resource}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isFullyChecked}
                            className={isPartiallyChecked ? 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500' : ''}
                            onClick={e => {
                              e.stopPropagation();
                              toggleAllForResource(resource, !isFullyChecked);
                            }}
                          />
                          <Icon className={`h-5 w-5 ${RESOURCE_COLORS[resource]}`} />
                          <span className="capitalize font-medium">{resource}</span>
                          <Badge variant="outline" className="ml-2">
                            {getResourcePermissionCount(resource)}/{actions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="ml-8 space-y-3 pt-2">
                          {actions.map(action => {
                            const isChecked = isValidActionForResource(resource, action) && hasAction(formData.permissions, resource, action);
                            return (
                              <div key={action} className="flex items-start gap-3 group">
                                <Checkbox
                                  id={`${resource}-${action}`}
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(resource, action)}
                                  className="mt-0.5"
                                />
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() => togglePermission(resource, action)}
                                >
                                  <Label
                                    htmlFor={`${resource}-${action}`}
                                    className="cursor-pointer font-medium capitalize"
                                  >
                                    {action}
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    {PERMISSION_DESCRIPTIONS[resource][action]}
                                  </p>
                                </div>
                                {isChecked && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>Start with a pre-configured role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${
                      selectedTemplate === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{template.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">{template.name.replace('-', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
              <CardDescription>Current role capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Object.keys(RESOURCES) as Resource[]).map(resource => {
                  const count = getResourcePermissionCount(resource);
                  if (count === 0) return null;

                  const Icon = RESOURCE_ICONS[resource];
                  return (
                    <div key={resource} className="flex items-center gap-2 text-sm">
                      <Icon className={`h-4 w-4 ${RESOURCE_COLORS[resource]}`} />
                      <span className="capitalize flex-1">{resource}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
                {getPermissionCount() === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No permissions selected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || !isDirty}
                  size="lg"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Update Role' : 'Create Role'}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
