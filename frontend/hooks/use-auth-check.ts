"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface UseAuthCheckOptions {
  redirectIfAuthenticated?: boolean
  redirectTo?: string
}

export function useAuthCheck({
  redirectIfAuthenticated = true,
  redirectTo,
}: UseAuthCheckOptions = {}) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        if (cancelled) return

        const authenticated = !!session?.data?.user
        setIsAuthenticated(authenticated)

        if (redirectIfAuthenticated && authenticated) {
          const activeOrgId = session.data?.session?.activeOrganizationId
          const destination = redirectTo
            ?? (activeOrgId ? `/organizations/${activeOrgId}` : "/organizations")
          router.replace(destination)
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false)
        }
      }
    }
    void checkAuth()

    return () => {
      cancelled = true
    }
  }, [router, redirectIfAuthenticated, redirectTo])

  return { isChecking, isAuthenticated }
}
