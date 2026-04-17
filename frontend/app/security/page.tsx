"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect security to profile/two-factor
export default function SecurityPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/profile/two-factor");
    }, [router]);

    return null;
}
