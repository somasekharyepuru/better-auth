"use client"

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_AUTH_URL is not set. Configure it in your .env file.")
}

async function revokeWithCredentials(path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(payload.message || "Failed to revoke sessions")
  }

  return response.json().catch(() => ({}))
}

export const sessionManagementApi = {
  async revokeAllExceptCurrent() {
    return revokeWithCredentials("/sessions/me")
  },
  async revokeAllIncludingCurrent() {
    return revokeWithCredentials("/sessions/me/all")
  },
}
