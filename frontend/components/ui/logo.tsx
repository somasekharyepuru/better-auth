import { cn } from "@/lib/utils";

interface LogoProps {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
    const sizes = {
        sm: { icon: "w-8 h-8", text: "text-lg" },
        md: { icon: "w-10 h-10", text: "text-xl" },
        lg: { icon: "w-12 h-12", text: "text-2xl" },
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {/* Logo Icon - Three bars representing day/progress */}
            <div className={cn("relative", sizes[size].icon)}>
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Left bar */}
                    <rect
                        x="4"
                        y="12"
                        width="6"
                        height="20"
                        rx="3"
                        fill="currentColor"
                        className="text-gray-300"
                    />
                    {/* Middle bar (taller) */}
                    <rect
                        x="17"
                        y="6"
                        width="6"
                        height="28"
                        rx="3"
                        fill="currentColor"
                        className="text-gray-500"
                    />
                    {/* Right bar */}
                    <rect
                        x="30"
                        y="10"
                        width="6"
                        height="22"
                        rx="3"
                        fill="currentColor"
                        className="text-gray-900"
                    />
                </svg>
            </div>

            {/* Logo Text */}
            {showText && (
                <span
                    className={cn(
                        "font-semibold text-gray-900 tracking-tight",
                        sizes[size].text
                    )}
                >
                    Daymark
                </span>
            )}
        </div>
    );
}

// Compact version for small spaces
export function LogoIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-10 h-10", className)}
        >
            {/* Left bar */}
            <rect
                x="4"
                y="12"
                width="6"
                height="20"
                rx="3"
                fill="currentColor"
                className="text-gray-300"
            />
            {/* Middle bar (taller) */}
            <rect
                x="17"
                y="6"
                width="6"
                height="28"
                rx="3"
                fill="currentColor"
                className="text-gray-500"
            />
            {/* Right bar */}
            <rect
                x="30"
                y="10"
                width="6"
                height="22"
                rx="3"
                fill="currentColor"
                className="text-gray-900"
            />
        </svg>
    );
}
