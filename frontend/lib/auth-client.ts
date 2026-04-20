import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL;

if (!baseURL) {
    throw new Error("NEXT_PUBLIC_AUTH_URL is not set. Configure it in your .env file.");
}

export const authClient = createAuthClient({
    baseURL,
    plugins: [
        adminClient(),
        emailOTPClient(),
        organizationClient({
            teams: { enabled: true },
        }),
        twoFactorClient({
            onTwoFactorRedirect() {
                window.location.href = "/verify-2fa";
            },
        }),
    ],
});
