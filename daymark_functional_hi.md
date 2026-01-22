# Daymark - Product Functionality Document

> **Document Purpose**: This document outlines every feature, user journey, and business capability of Daymark from a pure business perspective. No technical details—only what the product does and how users interact with it.

---

## 1. Product Overview

### What is Daymark?

**Daymark** is a **personal productivity platform** designed to help individuals organize their day through focused priorities, time-blocked schedules, and reflection tools. It's a comprehensive daily planning system that combines task management, time blocking, and productivity utilities into one cohesive experience.

### What Problem Does It Solve?

Daymark addresses the challenge of **daily overwhelm** and **lack of focus**. Many people struggle to:

- Identify what truly matters each day
- Allocate focused time for important work
- Maintain momentum and avoid distractions
- Reflect on progress and learn from their days
- Balance multiple life domains (work, personal, health, etc.)

Daymark provides a structured yet flexible framework to plan, execute, and review each day with intention.

### Who Are the Target Users?

**Primary Users:**
- **Knowledge workers** who need to manage competing priorities
- **Professionals** looking for a structured daily planning system
- **Entrepreneurs/freelancers** managing multiple projects and life areas
- **Students and learners** balancing academics with personal development
- **Anyone seeking a more intentional, focused approach to their days**

**User Characteristics:**
- Values simplicity over complexity
- Prefers focused tools over feature-bloated apps
- Wants a "complete system" not just a task list
- Appreciates reflection and continuous improvement

---

## 2. User Types & Roles

### 2.1 Individual Users (Primary)

The core user type. Every Daymark user starts as an individual user with their own personal productivity workspace.

**What They Can Do:**
- Create and manage daily priorities
- Set up time blocks for their day
- Track discussion items for meetings
- Take daily notes
- Complete end-of-day reviews
- Use productivity tools (Pomodoro, Eisenhower Matrix, Decision Log)
- Connect and sync external calendars
- Organize work by Life Areas
- Customize dashboard preferences
## 3. Complete Feature List

### 3.1 Daily Planning (Core Dashboard)

#### Top Priorities
- **What it does**: Allows users to set 1-5 key priorities for each day
- **Who can use it**: All users
- **Business rules**: 
  - Default limit: 3 priorities per day
  - Configurable: 1-5 priorities per user preference
  - Priorities can be marked as complete/incomplete
  - Incomplete priorities can be "carried forward" to the next day
  - Carried priorities are tracked and won't show in carryover UI again
  - Priorities can be reordered via drag-and-drop
  - Priorities can be moved between Life Areas
- **What triggers it**: User clicks "Add priority" or presses Enter in the input field
- **What happens**: Priority is saved and displayed in the priorities list

#### Discussion Items (To Discuss)
- **What it does**: Track topics to bring up in meetings or conversations
- **Who can use it**: All users
- **Business rules**:
  - Default limit: 3 items per day
  - Configurable: 0-5 items per user preference
  - Items can be edited, deleted, or reordered
  - Items can be moved between Life Areas
- **What triggers it**: User adds a discussion item
- **What happens**: Item appears in the "To Discuss" section

#### Time Blocks (Today's Schedule)
- **What it does**: Visual time-blocked schedule for the day
- **Who can use it**: All users
- **Business rules**:
  - Block types: Deep Work, Meeting, Personal, Break, Admin
  - Configurable default duration: 15, 30, 45, 60, 90, or 120 minutes
  - Configurable default type
  - Can be linked to priorities
  - Time blocks from connected calendars appear automatically
  - Start time defaults to nearest 15-minute interval rounded up
- **What triggers it**: User creates a time block with title, start time, end time, and type
- **What happens**: Block appears in the schedule section

#### Quick Notes
- **What it does**: Freeform daily scratchpad for thoughts, ideas, and quick notes
- **Who can use it**: All users
- **Business rules**:
  - One note per day per Life Area
  - Unlimited text content
  - Auto-saves as user types
- **What triggers it**: User types in the notes area
- **What happens**: Note content is saved automatically

#### Day Progress
- **What it does**: Visual progress indicator showing priority completion
- **Who can use it**: All users
- **Business rules**:
  - Only appears when at least one priority is completed
  - Shows percentage complete
  - Dynamic dot indicators for each priority
- **What triggers it**: User completes priorities
- **What happens**: Progress bar updates in real-time

### 3.2 End-of-Day Review

- **What it does**: Structured daily reflection prompts
- **Who can use it**: All users
- **Business rules**:
  - Two reflection questions: "What went well?" and "What didn't go as planned?"
  - Can trigger carryover of incomplete priorities to tomorrow
  - Review button visibility:
    - **Celebration mode**: When all priorities complete ("🎉 All Done! Review Day")
    - **Prominent mode**: After 5 PM ("End of Day Review")
    - **Subtle mode**: Before 5 PM ("End Day Early")
  - Review data persists and can be viewed for past days
- **What triggers it**: User clicks the End of Day Review button
- **What happens**: Modal opens for reflection and carryover decision

### 3.3 Life Areas

- **What it does**: Context filters for organizing different life domains
- **Who can use it**: All users
- **Business rules**:
  - Free plan: 2 Life Areas
  - Premium plan: Unlimited Life Areas
  - Each Life Area has: name, color, order
  - Life Areas can be archived (soft delete)
  - Switching Life Area shows different set of priorities, schedule, notes
  - Default Life Area can be set in preferences
  - Priorities and items can be moved between Life Areas
- **What triggers it**: User creates or selects a Life Area
- **What happens**: Dashboard filters to show that Life Area's content

### 3.4 Productivity Tools

#### Pomodoro Timer
- **What it does**: Focus timer with configurable work/break intervals
- **Who can use it**: Premium users (Free plan limited to 3 sessions/day)
- **Business rules**:
  - Three modes: Focus, Short Break, Long Break
  - Configurable durations:
    - Focus: Default 25 minutes
    - Short Break: Default 5 minutes
    - Long Break: Default 15 minutes
  - Sound notification when timer completes (configurable)
  - Browser notification when complete (if permitted)
  - Session counter shows daily completed sessions
  - Timer persists across page refreshes
  - Document title shows remaining time when running
  - Integrates with Focus Sessions for backend tracking
- **What triggers it**: User clicks Play button
- **What happens**: Timer counts down, notifies on completion, suggests next action

#### Eisenhower Matrix
- **What it does**: Four-quadrant task prioritization by urgency and importance
- **Who can use it**: Premium users only
- **Business rules**:
  - Four quadrants:
    1. **Do First** (Urgent & Important)
    2. **Schedule** (Not Urgent & Important)
    3. **Delegate** (Urgent & Not Important)
    4. **Eliminate** (Neither)
  - Tasks can be added to any quadrant
  - Tasks can be moved between quadrants
  - Tasks in quadrants 1 & 2 can be "promoted" to Today's Priorities
  - Tasks can be deleted
  - Tasks are filterable by Life Area
- **What triggers it**: User adds or moves tasks
- **What happens**: Tasks organized visually in the 2x2 matrix

#### Decision Log
- **What it does**: Track important decisions with context and outcomes
- **Who can use it**: Premium users only
- **Business rules**:
  - Each decision has: Title, Date, Context (optional), Decision, Outcome (optional)
  - Searchable by keyword
  - Sortable by date
  - Linked to Life Areas
  - Can link to Priorities and Focus Sessions
- **What triggers it**: User creates a new decision entry
- **What happens**: Decision is logged and searchable for future reference

### 3.5 Calendar Integration

#### Calendar Connections
- **What it does**: Connect external calendars (Google, Microsoft, Apple)
- **Who can use it**: 
  - Free: 1 calendar connection
  - Premium: Multiple calendar connections
- **Business rules**:
  - OAuth-based secure connection
  - Calendar events sync automatically
  - Sync interval: Every 15 minutes (configurable)
  - Events appear as read-only time blocks
  - Sync direction options: Read-only, Write-only, Bidirectional

#### Calendar Views
- **What it does**: Full calendar view with day, week, and month views
- **Who can use it**: All users
- **Business rules**:
  - Three view modes: Day, Week, Month
  - Create, edit, delete events
  - Drag-and-drop to reschedule
  - Events color-coded by calendar source
  - Mini calendar for quick date navigation
  - Keyboard shortcuts for power users

#### Keyboard Shortcuts (Calendar)
| Key | Action |
|-----|--------|
| ← → | Navigate previous/next |
| T | Go to today |
| D | Day view |
| W | Week view |
| M | Month view |
| N | New event |
| Shift+N | Quick focus block |
| R | Refresh |
| S | Toggle sidebar |
| ? | Show shortcuts |

#### Conflict Resolution
- **What it does**: Handle scheduling conflicts between calendars
- **Who can use it**: All users with calendar connections
- **Business rules**:
  - Conflict strategies: Last write wins, Source priority, Manual
  - Optional notifications on conflicts
  - Double-booking alerts (configurable)

#### Focus Block Calendar Sync
- **What it does**: Block time on external calendars during focus sessions
- **Who can use it**: Premium users
- **Business rules**:
  - Configurable per user
  - Creates "busy" time on connected calendars
  - Automatically removes when session ends

### 3.6 Focus Sessions

- **What it does**: Track deep work sessions linked to priorities
- **Who can use it**: All users
- **Business rules**:
  - Can start from Pomodoro timer or from a specific priority
  - Tracks: start time, end time, duration, completion status
  - Session types: Focus, Short Break, Long Break
  - Interrupted sessions are tracked separately
  - Links to priorities for analytics

### 3.7 Profile & Account Management

#### Profile Management
- **What it does**: View and edit user profile
- **Who can use it**: All users
- **Available actions**:
  - Update name
  - View email (not editable)
  - View email verification status
  - View membership date
  - Sign out

#### Password Management
- **What it does**: Change account password
- **Who can use it**: All users
- **Business rules**:
  - Requires current password
  - New password: 8-128 characters
  - Revokes other sessions on change

#### Two-Factor Authentication
- **What it does**: Add extra security layer with TOTP codes
- **Who can use it**: All users
- **Business rules**:
  - Uses authenticator app (Google Authenticator, etc.)
  - Backup codes provided during setup
  - Can be enabled/disabled

### 3.8 Dashboard Preferences

Users can customize their experience:

| Setting | Options | Default |
|---------|---------|---------|
| Max Top Priorities | 1-5 | 3 |
| Max Discussion Items | 0-5 | 3 |
| Default Time Block Duration | 15-120 min | 60 min |
| Default Time Block Type | Deep Work, Meeting, Personal, Break, Admin | Deep Work |
| End of Day Review | Enabled/Disabled | Enabled |
| Auto Carry Forward Priorities | Enabled/Disabled | Enabled |
| Auto Create Next Day | Enabled/Disabled | Enabled |
| Theme | Light, Dark, System | System |

#### Section Visibility
Users can show/hide these dashboard sections:
- Top Priorities
- To Discuss
- Today's Schedule
- Quick Notes
- Day Progress
- End-of-Day Review

#### Tools Preferences
- Show/Hide Tools Tab
- Enable/Disable individual tools:
  - Pomodoro Timer
  - Eisenhower Matrix
  - Decision Log

#### Pomodoro Preferences
- Focus duration (minutes)
- Short break duration (minutes)
- Long break duration (minutes)
- Sound notifications on/off

---

## 4. User Journeys (End-to-End Flows)

### 4.1 Onboarding/Registration Flow

```
1. Land on homepage → Click "Get Started" / "Sign Up"
2. Choose signup method:
   ├─ Social Login (Google/Microsoft)
   │   └→ Redirect to OAuth → Grant permissions → Return → Dashboard
   │
   └─ Email Signup
       ├→ Enter: Full name, Email, Password (8+ chars)
       ├→ Click "Create account"
       ├→ Email verification code sent
       ├→ Enter verification code
       └→ Account created → Dashboard

Success: User lands on main dashboard
Failure: Error message displayed, retry option
```

### 4.2 Login and Account Recovery

#### Standard Login
```
1. Visit login page
2. Choose method:
   ├─ Social login → OAuth flow → Dashboard
   └─ Email/Password
       ├→ Enter credentials
       ├→ Success → Dashboard
       └→ 2FA enabled? → Enter TOTP code → Dashboard

Failure cases:
- Invalid credentials → "Invalid email or password"
- Email not verified → Redirect to verify-email page
- Account banned → "Account suspended" message
```

#### Password Recovery
```
1. Click "Forgot password?"
2. Enter email address
3. Receive reset code via email
4. Enter new password + confirmation
5. Password updated → Auto-login to Dashboard

Failure: Invalid email, expired code, or weak password
```

### 4.3 Core Daily Planning Flow

#### Morning Planning
```
1. Open Daymark (auto-loads today)
2. See greeting: "Good morning, [Name]"
3. Check carryover notification (if incomplete priorities from yesterday)
   └→ Option: Accept carryover to today
4. Add top priorities (up to configured max)
5. Set time blocks for the day
6. Add any discussion items for meetings
7. Begin day with first priority

Each action auto-saves immediately.
```

#### During the Day
```
1. Reference priorities throughout day
2. Complete priorities → Check them off → Progress bar updates
3. Add quick notes as thoughts occur
4. Start focus session on priority (optional) → Timer runs
5. Calendar events appear automatically from connected calendars
6. Navigate between days to review past/future
```

#### End of Day
```
1. After 5 PM → "End of Day Review" button becomes prominent
2. Click review button
3. Modal opens:
   ├→ See incomplete priorities
   ├→ Option: "Carry to tomorrow"
   ├→ Reflect: "What went well?"
   └→ Reflect: "What didn't go as planned?"
4. Save review → Modal closes → Tomorrow's priorities include carried items

All complete? → Celebration notification: "🎉 All Done!"
```

### 4.4 Using Productivity Tools

#### Pomodoro Flow
```
1. Navigate: Dashboard → Tools → Pomodoro Timer
2. Select mode: Focus / Short Break / Long Break
3. Click Play → Timer starts
4. Timer visible in browser tab title
5. Timer completes → Sound plays → Notification appears
6. Choose next action: Start break or continue focus
7. Session counter updates
```

#### Eisenhower Matrix Flow
```
1. Navigate: Dashboard → Tools → Matrix
2. View 4 quadrants with existing tasks
3. Add task to any quadrant → Enter title → Submit
4. Move task between quadrants via buttons
5. Promote task to daily priorities (Q1/Q2 only) → Task becomes today's priority
6. Delete completed or eliminated tasks
```

#### Decision Log Flow
```
1. Navigate: Dashboard → Tools → Decisions
2. Click "New" to add decision
3. Fill in:
   ├→ Title (required)
   ├→ Date (auto-fills today)
   ├→ Context (why was this needed?)
   ├→ Decision (what was decided)
   └→ Outcome (optional, add later)
4. Save → Decision logged
5. Search past decisions by keyword
6. Edit/delete as needed
```

### 4.5 Calendar Integration Flow

```
1. Navigate: Profile → Preferences → Calendar Connections
2. Click "Connect Calendar"
3. Choose provider: Google, Microsoft, or Apple
4. OAuth flow → Grant permissions
5. Calendar sources appear → Toggle which to sync
6. Events appear on Dashboard schedule
7. Navigate: Full calendar view for detailed management

Sync happens automatically every 15 minutes.
Conflicts can be resolved manually or automatically.
```

### 4.6 Life Area Management Flow

```
1. Look at Life Area selector on dashboard
2. Click to switch between areas (e.g., Work → Personal)
3. Each area shows its own priorities, schedule, notes
4. Create new Life Area: Click + → Enter name, pick color
5. Archive unused areas from settings
6. Set default Life Area in preferences
```

---

## 5. Business Rules & Logic

### 5.1 Pricing Rules

#### Free Plan ($0/month)
| Feature | Limit |
|---------|-------|
| Daily priorities | 3 per day |
| Pomodoro sessions | 3 per day |
| Life Areas | 2 |
| Time blocking | Basic |
| Daily review history | Last 7 days |
| Calendar connections | 1 |
| Mobile app | View only |
| Advanced tools (Matrix, Decisions) | ❌ Not available |

#### Premium Plan ($12/month or $100/year)
| Feature | Limit |
|---------|-------|
| Daily priorities | Unlimited |
| Pomodoro sessions | Unlimited |
| Life Areas | Unlimited |
| Time blocking | Full |
| Daily review history | All history |
| Calendar connections | All calendars |
| Mobile app | Full access |
| Advanced tools | ✅ Available |
| Priority support | 24-hour email response |
| Early access to features | ✅ |

### 5.2 Trial Strategy
- **14-day Premium trial** offered after 7 days of consistent free usage
- No credit card required for trial
- After trial: gentle downgrade to free (not locked out)
- Data never deleted on downgrade

### 5.3 Carryover Logic

When user chooses to carry forward priorities:
1. Only incomplete, not-already-carried priorities are offered
2. All eligible priorities are carried (no limit)
3. Carried priorities marked with `carriedToDate` to prevent re-offering
4. Tomorrow's day is auto-created with carried priorities

### 5.4 Priority Completion Logic

- Clicking priority toggles complete/incomplete
- Progress bar: `(completed / total) × 100%`
- Visual feedback: Checkmark, strikethrough text

### 5.5 Time Block Smart Defaults
- New time block start time: Current time rounded up to nearest 15 minutes
- End time auto-calculates based on default duration
- Time format: 12-hour with AM/PM

### 5.6 Session Management
- Active session tokens expire after inactivity
- Changing password revokes all other sessions
- 2FA code expires after validation window

---

## 6. Notifications & Communications

### 6.1 Email Communications

| Trigger | Email Sent |
|---------|------------|
| Account created | "Welcome to Daymark" |
| Email verification needed | "Verify your email" (OTP code) |
| Password reset requested | "Reset your password" (OTP code) |
| Trial started | "Your Premium trial has started!" |
| Trial Day 4 | "You're crushing it!" (engagement) |
| Trial Day 7 | "Halfway through your trial" |
| Trial Day 12 | "2 days left – here's what you'll lose" |
| Trial Day 14 | "Your trial ends today – special offer inside" |

### 6.2 In-App Prompts

| Condition | Prompt Shown |
|-----------|--------------|
| Hit 3 priorities (free plan) | "You've reached your daily limit. Upgrade for unlimited." |
| Complete 3 Pomodoro sessions (free) | "Great focus! Premium gives unlimited sessions." |
| Try to access Matrix (free) | "Eisenhower Matrix is a Premium feature." |
| After 7 days of engagement | "Try Premium free for 14 days" |

### 6.3 Browser Notifications

| Trigger | Notification |
|---------|--------------|
| Pomodoro timer complete | "Timer Complete! [Mode] session finished." |

**Must grant permission** via browser prompt.

### 6.4 Sound Notifications

- Pomodoro completion: Pleasant chime (different for focus vs. break)
- Configurable on/off in preferences

---

## 7. Content & Data Users Can Manage

### 7.1 What Users Can Create

| Content Type | Create | Edit | Delete |
|--------------|--------|------|--------|
| Priorities | ✅ | ✅ | ✅ |
| Discussion items | ✅ | ✅ | ✅ |
| Time blocks | ✅ | ✅ | ✅ |
| Quick notes | ✅ | ✅ | ✅ |
| Daily reviews | ✅ | ✅ | ❌ |
| Life Areas | ✅ | ✅ | Archive only |
| Eisenhower tasks | ✅ | ✅ | ✅ |
| Decision entries | ✅ | ✅ | ✅ |
| Calendar events | ✅ | ✅ | ✅ |

### 7.2 Information Collected

**User Profile:**
- Name
- Email
- Profile image (optional)
- Password (hashed, never stored in plain text)
- Account creation date
- Email verification status
- 2FA status

**Activity Data:**
- Daily priorities and completion status
- Time blocks and focus sessions
- Discussion items and notes
- Review reflections
- Tool usage (Matrix tasks, decisions)
- Calendar sync data

### 7.3 What Users Can View

- Any past day's data (premium: unlimited, free: last 7 days)
- Complete priority history
- All decisions and outcomes
- Calendar sync status and health
- Account membership date

---

## 8. Search, Filters & Sorting

### 8.1 Search Capabilities

| Area | Searchable? | What's Searched |
|------|-------------|-----------------|
| Decision Log | ✅ | Title, context, decision, outcome |
| Calendar events | ❌ | - |
| Priorities | ❌ | - |
| Quick notes | ❌ | - |

### 8.2 Filters

| Area | Available Filters |
|------|-------------------|
| Dashboard | Life Area selector |
| Calendar | Calendar source visibility toggles |
| Eisenhower | Life Area (implicit) |
| Decision Log | Life Area (implicit) |

### 8.3 Sorting

| Area | Sortable? | Sort Options |
|------|-----------|--------------|
| Priorities | ✅ | Drag-and-drop order |
| Discussion items | ✅ | Drag-and-drop order |
| Decision Log | ✅ | By date (newest first) |
| Eisenhower Matrix | ❌ | - |

---

## 9. Reports & Analytics (User-Facing)

### 9.1 Dashboard Information

| Metric | Visibility |
|--------|------------|
| Daily progress percentage | Always visible when priorities exist |
| Completed vs total priorities | Shown in progress ring |
| Today's focus sessions count | Visible in Pomodoro page |

### 9.2 Visual Analytics

- **Progress Ring**: Shows percentage of daily priorities completed
- **Progress Bar**: Visual representation on dashboard

### 9.3 Exportable Data

Currently not available - future feature consideration.

---

## 10. Admin/Back-office Capabilities

### 10.1 Organization Management

For organization owners/admins:
- Create organization
- Invite members via email
- Assign roles to members
- Remove members
- View organization details

### 10.2 User Management

Within organizations:
- View all members
- Change member roles
- Accept/reject invitations

### 10.3 System Health

Backend health endpoints (internal use):
- Application health check
- Database connectivity check
- Email service check

---

## 11. Integrations (From User Perspective)

### 11.1 Payment Options

Currently not implemented - future integration with Stripe or similar.

### 11.2 Social Login Options

| Provider | Status |
|----------|--------|
| Google | ✅ Available |
| Microsoft | ✅ Available |
| Apple | Planned |

### 11.3 Calendar Integrations

| Provider | Status | Features |
|----------|--------|----------|
| Google Calendar | ✅ | Full sync, bidirectional |
| Microsoft Outlook | ✅ | Full sync, bidirectional |
| Apple Calendar | ✅ | Full sync, bidirectional |

### 11.4 Connected Services

- **OAuth Providers**: Google, Microsoft for authentication
- **Email Service**: For verification codes and notifications
- **Browser APIs**: Notifications, Web Audio (for sounds)

---

## 12. Mobile App Features

### 12.1 Available Screens

| Screen | Features |
|--------|----------|
| **Dashboard** | View/manage priorities, discussion, schedule, notes |
| **Calendar** | View calendar and time blocks |
| **Tools** | Access Pomodoro, Matrix, Decisions (based on settings) |
| **Profile** | Account settings and preferences |

### 12.2 Mobile-Specific Features

| Feature | Description |
|---------|-------------|
| **Pull to Refresh** | Swipe down to reload data |
| **Haptic Feedback** | Tactile responses for interactions |
| **Date Picker** | Native spinner for date selection |
| **Tab Navigation** | Bottom tabs for main sections |
| **Section Tabs** | Swipe between Priorities, Discuss, Schedule, Notes |

### 12.3 Device Features Used

| Feature | Usage |
|---------|-------|
| Haptics | Feedback on taps and navigation |
| Safe Area | Proper display around notch/home indicator |
| Keyboard Avoidance | Forms stay visible when keyboard opens |

### 12.4 Mobile Limitations

- Settings changes require web app (mobile is view/edit only for settings)
- Calendar connections managed via web
- 2FA setup via web only

---

## 13. Edge Cases & Exceptions

### 13.1 Error Handling

| Scenario | User Experience |
|----------|-----------------|
| Failed to save priority | Action reverts, error toast appears |
| Network offline | Operations fail with error message |
| Session expired | Redirect to login page |
| Invalid form input | Inline validation message |
| Calendar sync failed | Error status shown on connection card |
| Failed focus session start | Toast with error message |

### 13.2 Error Messages

| Error | Message Shown |
|-------|---------------|
| Invalid login | "Invalid email or password" |
| Email not verified | Redirect to verification page |
| Weak password | "Password must be at least 8 characters" |
| Empty required field | "[Field] is required" |
| API failure | "An unexpected error occurred. Please try again." |
| Calendar disconnected | "Calendar connection lost. Reconnect?" |

### 13.3 Retry & Recovery

| Scenario | Recovery Action |
|----------|-----------------|
| API call fails | Retry automatically or show retry button |
| Token expired | Redirect to login |
| Calendar sync issues | Manual refresh button, reconnect option |
| Data conflict | Conflict resolution dialog (calendar) |

### 13.4 Support/Help Features

- **Help Page**: Accessible from dashboard header
- **Calendar Help**: Full guide on using calendar features
- **Eisenhower Info Modal**: "How to use" popup with instructions
- **Keyboard Shortcuts Modal**: Shows all available shortcuts (calendar)

### 13.5 Data Protection

- Users always maintain access to their data
- Downgrade doesn't delete data (just limits access)
- No forced data deletion
- 30-day money-back guarantee (premium)

---

## Appendix A: Navigation Structure

### Web Application

```
Homepage (Landing)
├── /login         - Sign in
├── /signup        - Create account
├── /forgot-password - Password recovery
├── /reset-password  - Enter new password
├── /verify-email    - Email verification
└── /verify-2fa      - Two-factor verification

Dashboard (Authenticated)
├── /              - Main dashboard (Daily planning)
├── /calendar      - Full calendar view
├── /tools         - Tools hub
│   ├── /pomodoro  - Focus timer
│   ├── /matrix    - Eisenhower Matrix
│   └── /decisions - Decision Log
├── /profile       - Account & Preferences
│   ├── /change-password
│   └── /two-factor
├── /settings
│   └── /calendars - Calendar connections
├── /organizations - Team management
└── /help          - Documentation
```

### Mobile Application

```
Tab Bar Navigation
├── Home (Dashboard)
├── Calendar
├── Tools
└── Profile

Stack Navigation
├── /tools/pomodoro
├── /tools/matrix
├── /tools/decisions
├── /settings/*
└── /help
```

---

## Appendix B: Keyboard Shortcuts Reference

### Dashboard
- Standard text editing shortcuts apply

### Calendar Page
| Key | Action |
|-----|--------|
| ← | Previous period |
| → | Next period |
| T | Today |
| D | Day view |
| W | Week view |
| M | Month view |
| N | New event |
| ⇧N | New focus block |
| R | Refresh |
| S | Toggle sidebar |
| ? | Show shortcuts |
| Esc | Close modal/shortcuts |

---

## Appendix C: Status Reference

### Calendar Connection Status

| Status | Meaning |
|--------|---------|
| Disconnected | Not connected |
| Connecting | OAuth in progress |
| Initial Sync | First-time sync running |
| Active | Connected and syncing |
| Syncing | Currently syncing |
| Paused | Sync paused by user |
| Error | Connection error |
| Token Expired | Re-authentication needed |

### Focus Session Status

| Status | Meaning |
|--------|---------|
| Running | Timer active |
| Paused | Timer paused |
| Completed | Successfully finished |
| Interrupted | Stopped before completion |

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Product: Daymark Personal Productivity Platform*
