import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3002";

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
