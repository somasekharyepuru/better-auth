"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getPasswordStrength } from "@/lib/password-utils"

interface PasswordStrengthMeterProps {
    password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const { score, checks } = getPasswordStrength(password)

    if (!password) return null

    const strengthColors = [
        "bg-destructive",
        "bg-destructive",
        "bg-warning",
        "bg-warning",
        "bg-success",
    ]

    const strengthLabels = ["Very weak", "Weak", "Fair", "Good", "Strong"]

    return (
        <div className="space-y-2 animate-fade-in">
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i < score ? strengthColors[score - 1] : "bg-muted"
                        )}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span
                    className={cn(
                        "font-medium",
                        score <= 2 && "text-destructive",
                        score === 3 && "text-warning",
                        score >= 4 && "text-success"
                    )}
                >
                    {strengthLabels[score - 1] || "Very weak"}
                </span>
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
                {[
                    { key: "length", label: "8+ characters" },
                    { key: "lowercase", label: "Lowercase" },
                    { key: "uppercase", label: "Uppercase" },
                    { key: "number", label: "Number" },
                    { key: "special", label: "Special char" },
                ].map(({ key, label }) => (
                    <div
                        key={key}
                        className={cn(
                            "flex items-center gap-1",
                            checks[key as keyof typeof checks]
                                ? "text-success"
                                : "text-muted-foreground"
                        )}
                    >
                        {checks[key as keyof typeof checks] ? (
                            <Check className="h-3 w-3" />
                        ) : (
                            <X className="h-3 w-3" />
                        )}
                        {label}
                    </div>
                ))}
            </div>
        </div>
    )
}
