import {
  User,
  Settings,
  Shield,
  MonitorPlay,
  History,
  KeyRound,
  Trash2,
  Building2,
} from "lucide-react"

export interface SettingsNavItem {
  title: string
  href: string
  icon: typeof User
}

const allProfileSettingsItems: SettingsNavItem[] = [
  { title: "Profile", href: "/profile", icon: User },
  { title: "Organizations", href: "/profile/organizations", icon: Building2 },
  { title: "Preferences", href: "/profile/preferences", icon: Settings },
  { title: "Two-Factor Auth", href: "/profile/two-factor", icon: Shield },
  { title: "Active Sessions", href: "/profile/sessions", icon: MonitorPlay },
  { title: "Security Activity", href: "/profile/activity", icon: History },
  { title: "Change Password", href: "/profile/change-password", icon: KeyRound },
  { title: "Delete Account", href: "/profile/delete-account", icon: Trash2 },
]

export const profileSettingsItems = allProfileSettingsItems

export function getProfileSettingsItems(userRole?: string | null): SettingsNavItem[] {
  if (userRole === "admin") return allProfileSettingsItems
  return allProfileSettingsItems.filter((item) => item.href !== "/profile/organizations")
}
