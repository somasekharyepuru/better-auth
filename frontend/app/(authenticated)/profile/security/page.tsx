"use client"

import { Check, KeyRound, Shield, ChevronRight, Info } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { profileSettingsItems } from "@/lib/profile-settings"
import { SettingsSidebar } from "@/components/settings-sidebar"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function ProfileSecurityPage() {
  const { user, isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const securityContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your password and two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password */}
          <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Password</p>
                <p className="text-xs text-muted-foreground">Change your password</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile/change-password">
                Manage
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  {user?.twoFactorEnabled ? "Your account is protected" : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.twoFactorEnabled && (
                <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                  <Check className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile/two-factor">
                  {user?.twoFactorEnabled ? "Manage" : "Enable"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="password">
              <AccordionTrigger>Best practices for password security</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground pt-4">
                <ul className="list-disc list-inside space-y-1">
                  <li>Use a unique password for each account</li>
                  <li>Make passwords at least 8 characters with a mix of letters, numbers, and symbols</li>
                  <li>Avoid using personal information like birthdays or names</li>
                  <li>Use a password manager to generate and store strong passwords</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2fa">
              <AccordionTrigger>Why enable two-factor authentication?</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground pt-4">
                <p>Two-factor authentication (2FA) adds an extra layer of security by requiring a second form of verification in addition to your password. This means:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Enhanced protection:</strong> Even if someone has your password, they can't access your account without the second factor</li>
                  <li><strong>Early warning:</strong> You'll be notified if someone tries to log in from an unrecognized device</li>
                  <li><strong>Peace of mind:</strong> Your account is significantly more secure against unauthorized access</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sessions">
              <AccordionTrigger>Managing your active sessions</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground pt-4">
                <p>Regularly review your active sessions to ensure no unauthorized access:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check for sessions from locations or devices you don't recognize</li>
                  <li>Revoke any suspicious sessions immediately</li>
                  <li>Log out from devices you no longer use</li>
                  <li>Enable 2FA to prevent unauthorized session creation</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <SettingsSidebar
      items={profileSettingsItems}
      basePath="/profile"
      title="Security"
    >
      {securityContent}
    </SettingsSidebar>
  )
}
