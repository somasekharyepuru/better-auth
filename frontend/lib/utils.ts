import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Get initials from a name or email
 * @param name - Full name or email address
 * @param maxLength - Maximum number of initials to return (default: 2)
 */
export function getInitials(name: string | null | undefined, maxLength = 2): string {
    if (!name) return "U";

    const parts = name.trim().split(" ");
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase().slice(0, maxLength);
    }

    return parts
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, maxLength);
}

/**
 * Get avatar fallback content (initials) from user data
 */
export function getAvatarFallback(
    name: string | null | undefined,
    email: string | null | undefined,
    maxLength = 2
): string {
    if (name) return getInitials(name, maxLength);
    if (email) return getInitials(email, maxLength);
    return "U";
}
