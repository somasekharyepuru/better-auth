import {
  User,
  Shield,
  MonitorPlay,
  History,
} from "lucide-react"

export interface SettingsNavItem {
  title: string
  href: string
  icon: typeof User
}

export const profileSettingsItems: SettingsNavItem[] = [
  {
    title: "Overview",
    href: "/profile",
    icon: User,
  },
  {
    title: "Security",
    href: "/profile/security",
    icon: Shield,
  },
  {
    title: "Sessions",
    href: "/profile/sessions",
    icon: MonitorPlay,
  },
  {
    title: "Activity",
    href: "/profile/activity",
    icon: History,
  },
]
