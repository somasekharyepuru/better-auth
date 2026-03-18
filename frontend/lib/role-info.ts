export const ROLE_INFO: Record<string, { label: string; description: string; color: string }> = {
  owner: {
    label: "Owner",
    description: "Full control including billing, deletion, and ownership transfer",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  admin: {
    label: "Admin",
    description: "Manage members, settings, and most organization features",
    color: "bg-primary/20 text-primary border-primary/30",
  },
  manager: {
    label: "Manager",
    description: "Manage team members and day-to-day operations",
    color: "bg-accent/20 text-accent-foreground border-accent/30",
  },
  member: {
    label: "Member",
    description: "Standard access to organization resources",
    color: "bg-success/20 text-success border-success/30",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to organization resources",
    color: "bg-muted text-muted-foreground border-border",
  },
}

const CUSTOM_ROLE_STYLE = {
  description: "Custom role with specific permissions",
  color: "bg-violet-500/20 text-violet-700 border-violet-500/30 dark:text-violet-400",
}

function formatRoleName(role: string): string {
  return role
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function getRoleInfo(role: string): { label: string; description: string; color: string } {
  if (ROLE_INFO[role]) return ROLE_INFO[role]
  return {
    label: formatRoleName(role),
    ...CUSTOM_ROLE_STYLE,
  }
}
