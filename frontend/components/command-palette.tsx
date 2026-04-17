"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  ChevronRight,
  History,
  House,
  KeyRound,
  LogOut,
  MonitorPlay,
  Plus,
  Search,
  Settings,
  Shield,
  User,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { authClient } from "@/lib/auth-client"

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession()
      setUser(session.data?.user || null)
    }
    fetchUser()
  }, [])

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value)
      } else {
        setOpen(value)
      }
    },
    [isControlled, onOpenChange]
  )

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [setIsOpen])

  const runCommand = React.useCallback((command: () => void) => {
    setIsOpen(false)
    command()
  }, [setIsOpen])

  const handleSignOut = async () => {
    await authClient.signOut()
    router.replace("/login")
  }

  return (
    <>
      {/* Desktop search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted border border-transparent hover:border-border"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <span className="ml-auto text-xs text-muted-foreground/60">⌘K</span>
      </button>

      {/* Mobile search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <House className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/organizations"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Organizations</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
          </CommandGroup>

          {user && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                <CommandItem onSelect={() => runCommand(() => router.push("/organizations/create"))}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Organization</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/change-password"))}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/two-factor"))}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Two-Factor Auth</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/sessions"))}>
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  <span>Active Sessions</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/activity"))}>
                  <History className="mr-2 h-4 w-4" />
                  <span>Account Activity</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Account">
                <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/organizations"))}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Organizations</span>
                  <CommandShortcut>⌘O</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(handleSignOut)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                  <CommandShortcut>⌘Q</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {!user && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem onSelect={() => runCommand(() => router.push("/login"))}>
                  <ChevronRight className="mr-2 h-4 w-4" />
                  <span>Sign in</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/signup"))}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create account</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
