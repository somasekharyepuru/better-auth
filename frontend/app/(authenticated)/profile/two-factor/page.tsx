"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Shield, Copy, Check, AlertTriangle, Smartphone, Download, ShieldCheck, ShieldOff, ShieldAlert } from "lucide-react"
import QRCode from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OtpInput } from "@/components/ui/otp-input"
import { Spinner } from "@/components/ui/spinner"
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
    if (!password) { setShowPasswordPrompt(true); return }
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
      setSetupData(null)
      toast.success("Two-factor authentication enabled")
      window.location.reload()
    } catch {
      toast.error("Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!password) { setShowPasswordPrompt(true); return }
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
    if (!password) { setShowPasswordPrompt(true); return }
    setIsAlertOpen(true)
  }

  const copySecret = async () => {
    if (!setupData?.secret) return
    try {
      if (!navigator.clipboard) { toast.error("Clipboard not available"); return }
      await navigator.clipboard.writeText(setupData.secret)
      setCopiedSecret(true)
      toast.success("Secret copied to clipboard")
    } catch { toast.error("Failed to copy secret") }
    finally { setTimeout(() => setCopiedSecret(false), 2000) }
  }

  const copyBackupCodes = async () => {
    if (!setupData?.backupCodes?.length) return
    try {
      if (!navigator.clipboard) { toast.error("Clipboard not available"); return }
      await navigator.clipboard.writeText(setupData.backupCodes.join('\n'))
      setCopiedBackupCodes(true)
      toast.success("Backup codes copied")
    } catch { toast.error("Failed to copy backup codes") }
    finally { setTimeout(() => setCopiedBackupCodes(false), 2000) }
  }

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes?.length) return
    const text = `2FA Backup Codes\n================\n\nKeep these codes safe. Each code can only be used once.\n\n${setupData.backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleDateString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'backup-codes.txt'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success("Backup codes downloaded")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Password prompt card */}
        {showPasswordPrompt && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Confirm your password</CardTitle>
              <CardDescription>Enter your account password to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && (user?.twoFactorEnabled ? handleDisable2FA() : handleEnable2FA())}
              />
              <div className="flex gap-2">
                <Button
                  onClick={user?.twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                  disabled={!password || isEnabling || isDisabling}
                >
                  {(isEnabling || isDisabling) ? <Spinner size="sm" className="mr-2" /> : null}
                  Continue
                </Button>
                <Button variant="ghost" onClick={() => { setShowPasswordPrompt(false); setPassword("") }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2FA enabled state */}
        {user?.twoFactorEnabled && !setupData && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Your account is protected with 2FA</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 shrink-0">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium">2FA is active</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll need your authenticator app in addition to your password when signing in.
                  </p>
                </div>
                {!showPasswordPrompt && (
                  <div className="sm:ml-auto shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleDisableClick}
                      disabled={isDisabling}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      {isDisabling ? <Spinner size="sm" className="mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                      Disable 2FA
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup flow */}
        {setupData && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Set up authenticator</CardTitle>
                  <CardDescription>Scan the QR code with your authenticator app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR code */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-5 rounded-2xl shadow border">
                  <QRCode value={setupData.totpURI} size={176} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Use Google Authenticator, Authy, 1Password, or any TOTP app to scan this code
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground px-2">or enter manually</span>
                <Separator className="flex-1" />
              </div>

              {/* Secret key */}
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-2">Secret key</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono tracking-widest select-all break-all">{setupData.secret}</code>
                  <Button variant="ghost" size="icon" onClick={copySecret} className="shrink-0 h-8 w-8">
                    {copiedSecret ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Backup codes */}
              {setupData.backupCodes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Save your backup codes</p>
                          <p className="text-xs text-muted-foreground">Each code can only be used once</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={copyBackupCodes} className="h-8 gap-1.5 text-xs px-2">
                          {copiedBackupCodes ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" onClick={downloadBackupCodes} className="h-8 gap-1.5 text-xs px-2">
                          <Download className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, i) => (
                        <code key={i} className="rounded-lg border bg-muted/30 px-3 py-2 text-xs font-mono text-center select-all">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Verification */}
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-sm font-medium">Enter the 6-digit code from your app</Label>
                  <p className="text-xs text-muted-foreground mt-1">This confirms your authenticator is set up correctly</p>
                </div>
                <div className="flex justify-center">
                  <OtpInput
                    length={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    autoFocus
                    ariaLabel="6-digit authenticator verification code"
                  />
                </div>
                <Button
                  onClick={handleVerify2FA}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {isVerifying ? <Spinner size="sm" className="mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Verify and enable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2FA disabled — enable prompt */}
        {!user?.twoFactorEnabled && !setupData && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shrink-0">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium">2FA is not enabled</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Protect your account with an authenticator app. You'll need a code each time you sign in.
                  </p>
                </div>
                {!showPasswordPrompt && (
                  <div className="sm:ml-auto shrink-0">
                    <Button onClick={() => setShowPasswordPrompt(true)} disabled={isEnabling}>
                      {isEnabling ? <Spinner size="sm" className="mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                      Set up 2FA
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          Two-factor authentication adds security by requiring a verification code from your phone in addition to your password.
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. Anyone with your password will be able to sign in.
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
    </>
  )
}
