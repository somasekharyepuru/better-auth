import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
} from "lucide-react"

export interface SettingsNavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
}

const orgSettingsItemsBase: SettingsNavItem[] = [
  {
    title: "Dashboard",
    href: "/organizations/[id]",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    href: "/organizations/[id]/members",
    icon: Users,
  },
  {
    title: "Teams",
    href: "/organizations/[id]/teams",
    icon: Briefcase,
  },
  {
    title: "Settings",
    href: "/organizations/[id]/settings",
    icon: Settings,
  },
]

export function getOrgSettingsItems(orgId: string): SettingsNavItem[] {
  return orgSettingsItemsBase.map(item => ({
    ...item,
    href: item.href.replace("[id]", orgId),
  }))
}
