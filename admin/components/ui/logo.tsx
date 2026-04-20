import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg";

/** `light` = fixed slate (e.g. login). `theme` = semantic tokens for dark/light UI chrome. */
export type LogoPalette = "light" | "theme";

interface LogoProps {
    size?: LogoSize;
    showText?: boolean;
    className?: string;
    /** Default `theme` for admin shell; use `light` on light-only surfaces. */
    palette?: LogoPalette;
}

const APP_NAME = "Daymark";

const SIZE_CONFIG = {
    xs: { icon: "w-7 h-7", text: "text-base" },
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-12 h-12", text: "text-2xl" },
} as const;

function LogoSvg({ className, palette }: { className?: string; palette: LogoPalette }) {
    const barShort = palette === "light" ? "text-slate-300" : "text-muted-foreground/45";
    const barTall = palette === "light" ? "text-slate-400" : "text-muted-foreground/80";

    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            <rect x="4" y="12" width="6" height="20" rx="3" fill="currentColor" className={barShort} />
            <rect x="17" y="6" width="6" height="28" rx="3" fill="currentColor" className={barTall} />
            <rect x="30" y="10" width="6" height="22" rx="3" className="fill-primary" />
        </svg>
    );
}

export function Logo({
    size = "md",
    showText = true,
    className,
    palette = "theme",
}: LogoProps) {
    const config = SIZE_CONFIG[size];
    const wordClass = palette === "light" ? "text-slate-900" : "text-foreground";

    return (
        <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
            <div className={cn("relative shrink-0", config.icon)}>
                <LogoSvg className="h-full w-full" palette={palette} />
            </div>
            {showText && (
                <span className={cn("min-w-0 truncate font-semibold tracking-tight", wordClass, config.text)}>
                    {APP_NAME}
                </span>
            )}
        </div>
    );
}

export function LogoIcon({ className, palette = "theme" }: { className?: string; palette?: LogoPalette }) {
    return <LogoSvg className={cn("h-10 w-10", className)} palette={palette} />;
}
