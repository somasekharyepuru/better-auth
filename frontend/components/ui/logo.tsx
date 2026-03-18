import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
    size?: LogoSize;
    showText?: boolean;
    className?: string;
}

const SIZE_CONFIG = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-12 h-12", text: "text-2xl" },
} as const;

function LogoSvg({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="4" y="12" width="6" height="20" rx="3" fill="currentColor" className="text-muted-foreground/40" />
            <rect x="17" y="6" width="6" height="28" rx="3" fill="currentColor" className="text-muted-foreground/70" />
            <rect x="30" y="10" width="6" height="22" rx="3" fill="currentColor" className="text-primary" />
        </svg>
    );
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
    const config = SIZE_CONFIG[size];

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn("relative", config.icon)}>
                <LogoSvg className="w-full h-full" />
            </div>
            {showText && (
                <span
                    className={cn(
                        "font-semibold text-foreground tracking-tight",
                        config.text
                    )}
                >
                    Auth
                </span>
            )}
        </div>
    );
}

export function LogoIcon({ className }: { className?: string }) {
    return <LogoSvg className={cn("w-10 h-10", className)} />;
}
