# Frontend -> Mobile Feature Gap Report (Verified)

**Date:** 2026-04-17  
**Method:** Manual code verification across `mobile/` (screens, contexts, `daymark-api`, and backend where relevant)  
**Scope:** Parity gaps vs web frontend after recent mobile work

> Legend:
>
> - CRITICAL: user-facing broken flow / core capability blocked
> - HIGH: major parity gap with meaningful product impact
> - MEDIUM: partial parity / missing enhancements
> - LOW: nice-to-have parity gaps

---

## 1. What Was Fixed Since the 2026-04-16 Report

The following items were listed as **still missing** in the previous report but are **implemented in the current tree** and should no longer be tracked there:

1. **Social provider mismatch on login (old CRITICAL A)** — Login and register use **Microsoft**-labeled primary social actions and only call `signInSocial("google" | "microsoft")`. (`SocialAuthButtons` with Apple still exists in `components/specialized/` but is **not** used by login/register.)
2. **Reset password UX (old HIGH C)** — `app/(auth)/reset-password.tsx` has confirm password + Zod validation, **Resend Code**, and a **success** state with navigation to login.
3. **Organization invitations (old HIGH E)** — `app/(app)/organizations/[id]/invitations.tsx` is backed by real APIs: `listInvitations`, `inviteMember`, `cancelInvitation`, plus resend via cancel + re-invite.
4. **Tools tab vs settings (old MEDIUM L)** — `app/(app)/(tabs)/_layout.tsx` only registers the Tools tab when `settings.toolsTabEnabled !== false`.
5. **Roles list wiring (old HIGH G)** — `roles.tsx` wires **Create** → `roles/create`, **Edit** → `roles/[roleId]/edit`, and **Delete** calls `organizationsApi.roles.delete`.
6. **Teams CRUD (old HIGH F — core flows)** — `teams/create.tsx`, `teams/edit.tsx`, and `teams/add-member.tsx` call `createTeam`, `updateTeam`, and `addTeamMember`; **add member** uses org **member list + search**.
7. **Auth redirect hardening (part of old MEDIUM I)** — `sanitizeRedirectTo` is used on **login**, **register**, and **verify-email**.
8. **TypeScript deprecation config** — `mobile/tsconfig.json` uses `"ignoreDeprecations": "5.0"`.
9. **Calendar OAuth completion (old CRITICAL A)** — `calendarApi.completeOAuthCallback` + `settings/calendars.tsx` deep-link completion.
10. **Apple Calendar / iCloud (old MEDIUM K)** — Backend `APPLE` initiate + mobile **Apple ID + app-specific password** flow + `completeAppleConnection`.
11. **2FA setup UX (old HIGH B)** — QR, manual **secret** + copy, **Share** for backup codes, and **Download .txt** (Expo `File` + `expo-sharing`).
12. **Dashboard time block defaults (old HIGH D)** — `TimeBlocksCard` uses `defaultTimeBlockDuration` / `defaultTimeBlockType`.
13. **Pomodoro vs settings (old HIGH E)** — Pomodoro reads focus/short/long durations from `SettingsContext`.
14. **Dashboard `enabledSections` (old MEDIUM F)** — All section keys + settings toggles; empty list means all enabled.
15. **Calendar month view (old MEDIUM G)** — `month` in `ViewMode` + grid + switcher.
16. **Login / register parity (old MEDIUM H, I)** — `rememberMe`, **EMAIL_NOT_VERIFIED** routing, verify-email **signed-in** continuation, **Toast** on register success, **Terms / Privacy** links (routed under **`(auth)/legal/*`** so unauthenticated users can read them), password length **8–128** and name **≥2 chars** aligned with web signup rules.
17. **Life area restore UX (old MEDIUM A in §2)** — `GET /api/life-areas/archived`, `lifeAreasApi.getArchived`, **Archived** control on `LifeAreaSelector` with list + **Restore** (uses existing `restoreLifeArea`).
18. **LOW shell / help (old §2 D)** — **Quick open** command palette (`CommandPaletteContext` + modal): dashboard **🔎** button, Settings **APP → Quick open**, searchable jumps to main screens + legal/security.
19. **LOW impersonation (old §2 D)** — **`ImpersonationBanner`** when `session.impersonatedBy` is set; **`stopImpersonating`** via `POST /api/auth/admin/stop-impersonating` (`httpAuthClient` + `AuthContext`).
20. **LOW analytics (old §2 E)** — **`POST /api/telemetry/ga4`** (Nest `TelemetryModule`) forwards to **GA4 Measurement Protocol** when **`GA4_MEASUREMENT_ID`** + **`GA4_API_SECRET`** are set; mobile **`logAnalyticsScreen`** / **`logAnalyticsEvent`** in `src/lib/analytics.ts` + `telemetryApi` call the endpoint after authenticated screen changes in `(app)/_layout.tsx`.
21. **LOW data layer (old §2 F)** — **Partial:** server-backed telemetry and existing contexts remain the primary cache; **full TanStack React Query** was not added because `npm install @tanstack/react-query` currently hits **peer dependency conflicts** with the Better Auth / `better-call` stack (`--legacy-peer-deps` is an option for a follow-up migration).

---

## 2. Still Missing (Verified)

**No CRITICAL, HIGH, or substantive MEDIUM gaps** remain from the 2026-04-17 parity list.

### Optional follow-ups

1. **TanStack React Query** — Install with `--legacy-peer-deps` (or resolve upstream `zod` / `better-call` peers) and migrate `SettingsContext` / day queries if you want full web-style cache invalidation on mobile.
2. **GA4 env** — Set `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` on the **backend** so mobile screen events reach Analytics.
3. **Impersonation endpoint** — Confirm `admin/stop-impersonating` matches your **Better Auth** version; adjust `http-auth-client` if your server uses a different path.

---

## 3. Verification Notes

1. **`npx tsc --noEmit`** in `mobile/` — **exit code 0** (2026-04-17).
2. **`npx tsc --noEmit`** in `backend/` — **exit code 0** after `LifeAreasModule` + `TelemetryModule` changes.
3. **`npx jest src/__tests__/auth-full.spec.ts --no-coverage`** — **133 passed** (2026-04-17).
4. **Manual QA:** archived life-area restore with **5-area limit**; backup `.txt` share sheet on device; command palette navigation from cold start; impersonation only if your admin flow issues an impersonated session.

---

## 4. Current Priority Order (Recommended)

1. Configure **GA4** server env vars and verify events in the GA4 **DebugView**.
2. If desired, adopt **React Query** behind `--legacy-peer-deps` and migrate high-traffic queries.
3. Continue routine **manual** OAuth / Apple / deep-link testing unrelated to this document.

---

*This revision supersedes the 2026-04-17 prior draft. Verified against the workspace as of 2026-04-17.*
