"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Shield, Copy, Check, AlertTriangle, Smartphone, Download, ShieldCheck, ShieldOff } from "lucide-react"
import QRCode from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { SettingsSidebar } from "@/components/settings-sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { profileSettingsItems } from "@/lib/profile-settings"
import { useSession } from "@/components/session-provider"

interface SetupData {
  totpURI: string
  secret: string
  backupCodes: string[]
}

function extractSecretFromTotpURI(totpURI: string): string {
  try {
    const url = new URL(totpURI)
    return url.searchParams.get("secret") || ""
  } catch {
    return ""
  }
}

export default function TwoFactorPage() {
  const { user, isLoading } = useSession()
  const [isEnabling, setIsEnabling] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [password, setPassword] = useState("")
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const router = useRouter()

  const handleEnable2FA = async () => {
    if (!password) {
      setShowPasswordPrompt(true)
      return
    }

    setIsEnabling(true)
    try {
      const result = await authClient.twoFactor.enable({ password })

      if (result.error) {
        toast.error("Failed to enable 2FA", { description: result.error.message })
        return
      }

      if (result.data) {
        const data = result.data as { totpURI: string; backupCodes?: string[] }
        setSetupData({
          totpURI: data.totpURI || "",
          secret: extractSecretFromTotpURI(data.totpURI || ""),
          backupCodes: data.backupCodes || [],
        })
        setPassword("")
        setShowPasswordPrompt(false)
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsEnabling(false)
    }
  }

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) return

    setIsVerifying(true)
    try {
      const result = await authClient.twoFactor.verifyTotp({ code: verificationCode })

      if (result.error) {
        toast.error("Invalid code", { description: "Please check the code and try again." })
        return
      }

      // We don't need to manually update user state here as useSession should reflect changes eventually,
      // but for immediate UI feedback we might want to reload or just show success. 
      // Since useSession uses SWR or similar, it might revalidate. 
      // For now, let's just clear setup data and show toast.
      setSetupData(null)
      toast.success("Two-factor authentication enabled")
      // Force a reload to get fresh session data if needed, or let the user navigate
      window.location.reload()
    } catch {
      toast.error("Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!password) {
      setShowPasswordPrompt(true)
      return
    }

    setIsDisabling(true)
    setIsAlertOpen(false)
    try {
      const result = await authClient.twoFactor.disable({ password })

      if (result.error) {
        toast.error("Failed to disable 2FA", { description: result.error.message })
        return
      }

      setPassword("")
      setShowPasswordPrompt(false)
      toast.success("Two-factor authentication disabled")
      window.location.reload()
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsDisabling(false)
    }
  }

  const handleDisableClick = () => {
    if (!password) {
      setShowPasswordPrompt(true)
      return
    }
    setIsAlertOpen(true)
  }

  const copySecret = async () => {
    if (setupData?.secret) {
      try {
        if (!navigator.clipboard) {
          toast.error("Clipboard not available")
          return
        }
        await navigator.clipboard.writeText(setupData.secret)
        setCopiedSecret(true)
        toast.success("Secret copied to clipboard")
      } catch {
        toast.error("Failed to copy secret")
      } finally {
        setTimeout(() => setCopiedSecret(false), 2000)
      }
    }
  }

  const copyBackupCodes = async () => {
    if (setupData?.backupCodes?.length) {
      try {
        if (!navigator.clipboard) {
          toast.error("Clipboard not available")
          return
        }
        const codesText = setupData.backupCodes.join('  \n')
        await navigator.clipboard.writeText(codesText)
        setCopiedBackupCodes(true)
        toast.success("Backup codes copied to clipboard")
      } catch {
        toast.error("Failed to copy backup codes")
      } finally {
        setTimeout(() => setCopiedBackupCodes(false), 2000)
      }
    }
  }

  const downloadBackupCodes = () => {
    if (setupData?.backupCodes?.length) {
      const codesText = `2FA Backup Codes\n================\n\nKeep these codes safe. Each code can only be used once.\n\n${setupData.backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleDateString()}`
      const blob = new Blob([codesText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'backup-codes.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Backup codes downloaded")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const content = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h2>
        <p className="text-muted-foreground">Add an extra layer of security to your account</p>
      </div>

      {/* Password Prompt */}
      {showPasswordPrompt && (
        <Card className="animate-fade-in-scale border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Confirm your password</CardTitle>
            <CardDescription>Enter your password to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={user?.twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                disabled={!password}
              >
                {isEnabling || isDisabling ? <Spinner size="sm" className="mr-2" /> : null}
                Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPasswordPrompt(false)
                  setPassword("")
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2FA Status Cards */}
      {user?.twoFactorEnabled ? (
        <Card variant="elevated" className="animate-fade-in-up delay-100">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto animate-fade-in-scale">
                <ShieldCheck className="w-10 h-10 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">2FA is enabled</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
              {!showPasswordPrompt && (
                <Button
                  variant="outline"
                  onClick={handleDisableClick}
                  disabled={isDisabling}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isDisabling ? <Spinner size="sm" className="mr-2" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                  Disable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : setupData ? (
        <Card variant="elevated" className="animate-fade-in-up delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Set up authenticator
            </CardTitle>
            <CardDescription>Scan the QR code with your authenticator app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-lg border">
                <QRCode value={setupData.totpURI} size={180} />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Use an app like Google Authenticator, Authy, or 1Password to scan this code
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground px-2">or enter manually</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual Secret Entry */}
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Secret key</p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-background px-4 py-2.5 rounded-lg text-sm font-mono tracking-wider border select-all">
                  {setupData.secret}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Backup Codes */}
            {setupData.backupCodes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Save these backup codes</p>
                        <p className="text-xs text-muted-foreground">Each code can only be used once</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyBackupCodes}
                        className="h-8 px-2"
                      >
                        {copiedBackupCodes ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="ml-1.5 text-xs">Copy</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadBackupCodes}
                        className="h-8 px-2"
                      >
                        <Download className="w-4 h-4" />
                        <span className="ml-1.5 text-xs">Download</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {setupData.backupCodes.map((code, i) => (
                      <code key={i} className="bg-muted/50 px-3 py-2 rounded-lg text-xs font-mono text-center border select-all">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Verification */}
            <div className="space-y-3">
              <Label htmlFor="verificationCode">Enter code from app</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
              />
            </div>

            <Button
              onClick={handleVerify2FA}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? <Spinner size="sm" className="mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Verify and enable
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="animate-fade-in-up delay-100">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Enable 2FA</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Use an authenticator app like Google Authenticator or Authy for added security.
                </p>
              </div>
              {!showPasswordPrompt && (
                <Button onClick={() => setShowPasswordPrompt(true)} disabled={isEnabling} size="lg">
                  {isEnabling ? <Spinner size="sm" className="mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  Set up 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info text */}
      <p className="text-sm text-muted-foreground text-center animate-fade-in delay-200">
        Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
      </p>
    </div>
  )

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable two-factor authentication? This will make your account less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsSidebar
        items={profileSettingsItems}
        basePath="/profile"
        title="Two-Factor Authentication"
      >
        {content}
      </SettingsSidebar>
    </>
  )
}
