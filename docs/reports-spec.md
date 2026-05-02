# Daymark Reports — Full Specification

> App: Daymark (personal productivity)
> Data layer: PostgreSQL via Prisma
> Scope: Personal reports (per user) — all data is user-scoped

---

## Table of Contents

1. [Daily Planning & Priorities](#1-daily-planning--priorities)
2. [Focus & Time Blocking](#2-focus--time-blocking)
3. [Pomodoro / Focus Sessions](#3-pomodoro--focus-sessions)
4. [Habits](#4-habits)
5. [Life Areas](#5-life-areas)
6. [Eisenhower Matrix](#6-eisenhower-matrix)
7. [Decision Log](#7-decision-log)
8. [Calendar Sync Health](#8-calendar-sync-health)
9. [Cross-Domain Summary Reports](#9-cross-domain-summary-reports)
10. [Implementation Notes](#10-implementation-notes)

---

## 1. Daily Planning & Priorities

### 1.1 Daily Completion Rate

**Purpose:** Show what % of top priorities the user actually completes each day, and how that trend changes over time.

**Data sources:**

- `top_priority` — `completed`, `dayId`, `createdAt`
- `day` — `date`, `userId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Completion rate (daily) | `completed / total` per day (ratio 0–1) |
| 7-day rolling avg | avg of last 7 daily rates |
| 30-day rolling avg | avg of last 30 daily rates |
| Best day | day with 100% rate, most recent |
| Worst streak | consecutive days below 50% |

**Filters:** date range, life area

**Visualisation:**

- Line chart: completion % over time (with 7-day rolling avg overlay)
- Bar chart: daily count of set vs completed priorities

**API shape:**

```ts
GET /api/reports/priorities/completion?from=&to=&lifeAreaId=

Response:
{
  days: [{ date, set, completed, rate }],
  summary: { avgRate, best, worst, streak }
}
```

---

### 1.2 Carried-Forward Analysis

**Purpose:** Identify which priorities keep getting deferred and how many times they are carried forward — a direct signal of chronic procrastination or misaligned goals.

**Data sources:**

- `top_priority` — `title`, `carriedToDate`, `completed`, `dayId`
- `day` — `date`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Total carried-forward events | count rows where `carriedToDate IS NOT NULL` |
| Avg carry count per priority | group by explicit carry chain (`sourcePriorityId` or `carryChainId`) |
| Top 10 most-carried priorities | rank by carry count descending |
| Eventually completed rate | % of carried priorities that eventually complete |

**Data contract note:** carry-chain metrics should use a stable linkage key (`sourcePriorityId` or `carryChainId`).
Title similarity can be used only as a clearly labeled fallback estimate.

**Filters:** date range, minimum carry count

**Visualisation:**

- Ranked list: priority title → carry count → status (completed / still open)
- Histogram: distribution of carry counts (1x, 2x, 3x+)

**API shape:**

```ts
GET /api/reports/priorities/carried-forward?from=&to=

Response:
{
  items: [{ title, carryCount, completed, lastCarriedDate }],
  summary: { totalCarryEvents, eventuallyCompletedRate }
}
```

---

### 1.3 Priority Throughput

**Purpose:** Measure overall productivity volume — how many priorities are set and how many are closed over time.

**Data sources:**

- `top_priority`, `day`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Avg priorities set per day | total set / active days |
| Avg priorities completed per day | total completed / active days |
| Throughput ratio | completed / set (higher = more realistic planning) |
| Over-planning days | days where set > user's `maxTopPriorities` setting |

**Filters:** date range, life area

**Visualisation:**

- Stacked bar: set vs completed per week
- Trend line: throughput ratio over time

---

### 1.4 Daily Review Trends

**Purpose:** Surface patterns in what goes well and what doesn't across daily reviews to help users identify systemic blockers or recurring wins.

**Data sources:**

- `daily_review` — `wentWell`, `didntGoWell`, `dayId`
- `day` — `date`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Review completion rate | days with review / total days |
| Review streak | consecutive days with review |
| Word frequency (went well) | top 20 words/phrases (stop-word filtered) |
| Word frequency (didn't go well) | top 20 words/phrases |
| Avg review length | char count over time (engagement proxy) |

**Note:** Word frequency requires lightweight text processing on the backend (no ML required — simple tokenisation + stop-word list).

**Visualisation:**

- Completion streak calendar (GitHub-style heatmap)
- Two word clouds or ranked keyword lists (went well vs didn't go well)

---

### 1.5 Days Without Review

**Purpose:** Show how many days in a period had no end-of-day review completed, and flag declining reflection habits.

**Data sources:**

- `daily_review`, `day`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Days with review | count days with `daily_review` record |
| Days without review | total active days − days with review |
| Longest gap | max consecutive days without review |
| Current gap | days since last review |

**Visualisation:**

- Calendar heatmap (reviewed / not reviewed)
- Trend: review frequency per week

---

## 2. Focus & Time Blocking

### 2.1 Focus Hours by Period

**Purpose:** Show how many hours of planned focus time the user schedules, and whether that's growing or shrinking.

**Data sources:**

- `time_block` — `startTime`, `endTime`, `category`, `dayId`
- `day` — `date`, `userId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Total scheduled focus hours | `SUM(endTime - startTime)` where `category = 'focus'` |
| Avg hours/day | total / active days |
| Peak focus day | day with most scheduled hours |
| Focus time trend | week-over-week change |

**Filters:** date range, life area, type

**Visualisation:**

- Bar chart: daily/weekly total hours
- Line: trend over time

**API shape:**

```ts
GET /api/reports/time-blocks/hours?from=&to=&lifeAreaId=&typeId=

Response:
{
  periods: [{ date, hours, blockCount }],
  summary: { totalHours, avgPerDay, peak }
}
```

---

### 2.2 Time Block Category Breakdown

**Purpose:** Show where the user's scheduled time actually goes across categories (focus, meetings, admin, etc.).

**Data sources:**

- `time_block` — `category`, `startTime`, `endTime`

**Categories (from schema):** `focus`, `meeting`, `admin`, `personal`

**Clarification:** `category` and `type` are separate dimensions.
Custom labels from `TimeBlockType` belong in type reports (2.3), not category grouping.

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Hours per category | SUM per category |
| % distribution | category hours / total hours |
| Trend per category | week-over-week change |
| Focus ratio | focus hours / total hours (key health metric) |

**Visualisation:**

- Donut chart: distribution by category
- Stacked bar: category split per week

---

### 2.3 Time Block Type Distribution

**Purpose:** Show which user-defined time block types (Deep Work, Review, Learning, etc.) dominate the schedule.

**Data sources:**

- `time_block` — `type`, `startTime`, `endTime`
- `time_block_type` — `name`, `color`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Hours per type | SUM per type |
| % of total | type hours / total |
| Most used type | highest hour count |
| Least used type | lowest hour count (non-zero) |

**Visualisation:**

- Horizontal bar chart (color-coded by type color from `time_block_type`)

---

### 2.4 Calendar vs Manual Blocks

**Purpose:** Understand how much of the user's schedule is reactive (pulled from calendar) vs intentionally planned.

**Data sources:**

- `time_block` — `isFromCalendar`, `startTime`, `endTime`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Manual hours | SUM where `isFromCalendar = false` |
| Calendar-driven hours | SUM where `isFromCalendar = true` |
| Manual % | manual / total |
| Trend | change in ratio over time |

**Insight note:** A high calendar-driven ratio may indicate the user is reactive; a high manual ratio indicates intentional planning.

**Visualisation:**

- Stacked bar: manual vs calendar per week
- Trend line: manual % over time

---

### 2.5 Schedule Density

**Purpose:** Surface over-scheduled and under-scheduled days to help users find their optimal planning load.

**Data sources:**

- `time_block` — `startTime`, `endTime`, `dayId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Avg hours/day | SUM duration / days |
| Over-scheduled days | days > 8h planned |
| Under-scheduled days | days < 2h planned (on working days) |
| Ideal range days | 4–7h planned (configurable) |

**Visualisation:**

- Distribution histogram: days by hours planned
- Calendar heatmap: color intensity = hours scheduled

---

## 3. Pomodoro / Focus Sessions

### 3.1 Focus Session Completion Rate

**Purpose:** Track what % of started focus sessions the user actually completes vs abandons.

**Data sources:**

- `focus_session` — `completed`, `interrupted`, `startedAt`, `timeBlockId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Completion rate | `completed = true` / total sessions |
| Interruption rate | `interrupted = true` / total sessions |
| Avg sessions/day | total sessions / active days |
| Best day | highest completion rate |
| Worst day | lowest completion rate |

**Filters:** date range, session type

**Visualisation:**

- Line chart: daily completion rate
- Donut: overall completed / interrupted / abandoned

**Status rules:**

- `completed`: `completed = true`
- `interrupted`: `completed = false AND interrupted = true`
- `abandoned`: `completed = false AND interrupted = false`

**API shape:**

```ts
GET /api/reports/focus-sessions/completion?from=&to=

Response:
{
  days: [{ date, total, completed, interrupted, abandoned }],
  summary: { completionRate, interruptionRate, abandonedRate, totalSessions }
}
```

---

### 3.2 Total Deep Work Time

**Purpose:** Measure cumulative actual focus time (vs scheduled time) using session duration records.

**Data sources:**

- `focus_session` — `duration`, `targetDuration`, `completed`, `startedAt`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Total focus minutes | `SUM(duration)` |
| Avg session length | `AVG(duration)` |
| Effective vs target | `SUM(duration)` vs `SUM(targetDuration)` |
| Focus time by day/week | grouped SUM |

**Note:** `duration` is in minutes (per schema). Separate `completed = true` sessions for "actual" deep work.
`targetDuration` is also treated as minutes for report calculations.

**Visualisation:**

- Bar chart: daily/weekly actual focus minutes
- Line: target vs actual trend

---

### 3.3 Interruption Frequency & Patterns

**Purpose:** Find when focus is most often broken — by time of day, day of week, or period — to help users protect productive hours.

**Data sources:**

- `focus_session` — `interrupted`, `startedAt`, `endedAt`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Interruptions by hour of day | count `interrupted = true` grouped by `EXTRACT(hour FROM startedAt)` |
| Interruptions by day of week | grouped by `DOW` |
| Avg time before interruption | `AVG(endedAt - startedAt)` where `interrupted = true` |
| Interruption trend | week-over-week change |

**Visualisation:**

- Heatmap: hour of day × day of week (interruption frequency)
- Bar chart: interruptions by hour

---

### 3.4 Best Focus Days & Times

**Purpose:** Identify when the user is most productive (least interrupted, highest completion, longest sessions).

**Data sources:**

- `focus_session` — `startedAt`, `completed`, `duration`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Best hour of day | highest avg `duration` + `completed = true` |
| Best day of week | lowest interruption rate |
| Focus productivity score | composite: completion rate × avg duration |

**Visualisation:**

- Heatmap: productivity score by hour × weekday
- Ranked list: top 3 best hours, top 3 worst hours

---

### 3.5 Focus Trends (Week-over-Week)

**Purpose:** Show whether the user's focus capacity is improving over time.

**Data sources:**

- `focus_session`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Weekly total sessions | count per week |
| Weekly completed sessions | count where `completed = true` |
| Weekly deep work minutes | SUM duration per week |
| WoW change | (current week − previous week) / previous week |

**Visualisation:**

- Multi-line chart: sessions, completions, minutes per week

---

## 4. Habits

### 4.1 Habit Completion Rate

**Purpose:** Show per-habit and overall completion rates across any date range.

**Data sources:**

- `habit_log` — `habitId`, `date`, `completed`
- `habit` — `name`, `emoji`, `color`, `frequency`, `isActive`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Per-habit rate | `completed = true` / expected days in range |
| Overall rate | total completions / total expected |
| Best habit | highest rate |
| Worst habit | lowest rate (active only) |
| Trend | 4-week rolling change per habit |

**Expected days** calculation depends on `habit.frequency`:

- `DAILY`: every day in range
- `WEEKLY`: specific `frequencyDays` in range
- `X_PER_WEEK`: `targetCount × fullWeeks + proratedPartialWeek`
- `X_PER_MONTH`: `targetCount × fullMonths + proratedPartialMonth`

**Boundary rule:** for partial weeks/months, expected counts are prorated by the fraction of the period in range.

**Filters:** date range, life area, active only

**Visualisation:**

- Table: habit name → rate → streak → trend arrow
- Bar chart: completion rate per habit (sorted descending)

**API shape:**

```ts
GET /api/reports/habits/completion?from=&to=&lifeAreaId=

Response:
{
  habits: [{
    id, name, emoji, color,
    completionRate, expected, completed,
    currentStreak, bestStreak, trend
  }],
  summary: { overallRate, bestHabit, worstHabit }
}
```

---

### 4.2 Habit Streaks

**Purpose:** Show current streak, best-ever streak, and streak history per habit.

**Data sources:**

- `habit_log` — `habitId`, `date`, `completed`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Current streak | consecutive days up to today where `completed = true` |
| Best streak | max consecutive window in all-time history |
| Streak broken date | last date where streak was lost |
| Days to beat best | `bestStreak - currentStreak` |

**Streak calculation rules:**

- For `DAILY` habits: consecutive calendar days
- For `WEEKLY` habits: consecutive scheduled weeks
- Skip non-scheduled days (don't break streak on non-frequency days)

**Visualisation:**

- Per-habit: streak progress bar (current vs best)
- All habits: ranked list by current streak descending
- Calendar heatmap per habit (GitHub contributions style, color = habit color)

---

### 4.3 Habit Consistency Score (30-day)

**Purpose:** A single score (0–100) per habit showing consistency over the rolling last 30 days, smoothed to prevent gaming.

**Formula:**

```
consistency = (completions_last_30_days / expected_last_30_days) × 100
```

With bonus for streak (streak > 7 → +5 pts, streak > 14 → +10 pts, capped at 100).

**Data sources:**

- `habit_log` (last 30 days)

**Visualisation:**

- Score card per habit
- Gauge / radial chart for each habit

---

### 4.4 Habits by Life Area

**Purpose:** Show which life areas have healthy habit adherence and which are neglected.

**Data sources:**

- `habit` — `lifeAreaId`
- `habit_log`
- `life_area` — `name`, `color`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Habits per life area | count |
| Avg completion rate per area | mean of habit rates in that area |
| Best life area | highest avg rate |
| Neglected life area | lowest avg rate with active habits |

**Visualisation:**

- Grouped bar: life area → habit completion rate
- Radar/spider chart: all life areas with completion rate on each axis

---

### 4.5 Habit Failure Patterns

**Purpose:** Find which days of the week habits are most commonly skipped — allowing users to protect or adjust those days.

**Data sources:**

- `habit_log` — `date`, `completed`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Skip rate by day of week | `completed = false` / expected, grouped by `DOW` |
| Most-skipped day | DOW with highest skip rate |
| Safest day | DOW with lowest skip rate |

**Filters:** date range, specific habit, life area

**Visualisation:**

- Bar chart: Mon–Sun skip rate (%) per habit or aggregate
- Heatmap: habit × day-of-week (completion rate intensity)

---

### 4.6 Habit Portfolio Health

**Purpose:** Give a birds-eye view of the user's full habit system — how many are active, paused, archived, and whether the portfolio is growing or contracting.

**Data sources:**

- `habit` — `isActive`, `isArchived`, `createdAt`, `archivedAt` (required for archival trend)

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Active habits | count where `isActive = true AND isArchived = false` |
| Paused habits | `isActive = false AND isArchived = false` |
| Archived habits | `isArchived = true` |
| Habits added last 30d | `createdAt > now - 30d` |
| Habits archived last 30d | `archivedAt > now - 30d` |

**Visualisation:**

- Summary cards: Active / Paused / Archived counts
- Timeline: habit creation and archival events over time

---

## 5. Life Areas

### 5.1 Time Distribution by Life Area

**Purpose:** Show how much scheduled time (time blocks) is allocated to each life area.

**Data sources:**

- `time_block` — `startTime`, `endTime`, `dayId`
- `day` — `lifeAreaId`, `date`
- `life_area` — `name`, `color`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Hours per life area | SUM block duration grouped by lifeAreaId |
| % distribution | area hours / total hours |
| Trend | week-over-week shift in distribution |
| Unassigned time | blocks where `day.lifeAreaId IS NULL` |

**Filters:** date range

**Visualisation:**

- Donut chart: time split by life area (color from `life_area.color`)
- Stacked bar per week: life area time
- Sankey diagram (optional, advanced): priorities → life area → time blocks

---

### 5.2 Life Area Balance Score

**Purpose:** Answer "Am I neglecting any part of my life?" — a composite health index per life area.

**Formula:**

```
balanceScore(area) = 0.4 × habitRate + 0.4 × priorityCompletionRate + 0.2 × timeHoursNorm
```

Where `timeHoursNorm` = area hours / max area hours (normalised 0–1).

**Data sources:**

- `habit`, `habit_log`, `life_area`, `top_priority`, `day`, `time_block`

**Metrics:**
| Metric | Output |
|--------|--------|
| Per-area balance score | 0–100 |
| Most balanced area | highest score |
| Most neglected area | lowest score |
| Balance variance | `STDEV` of all scores (low = well-balanced) |

**Visualisation:**

- Radar/spider chart: life areas on axes, score as area fill
- Ranked list: life areas sorted by balance score

---

### 5.3 Priority Focus by Life Area

**Purpose:** Show where the user's top priorities concentrate — which life areas get the most intention.

**Data sources:**

- `top_priority` — `dayId`, `completed`
- `day` — `lifeAreaId`
- `life_area`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Priorities set per area | count per lifeAreaId |
| Priorities completed per area | count where `completed = true` |
| Completion rate per area | completed / set |
| Area share of total priorities | area count / total count |

**Visualisation:**

- Grouped bar: set vs completed per life area
- Pie: area share of all priorities

---

### 5.4 Eisenhower Tasks by Life Area

**Purpose:** Cross-reference which life areas drive urgent/important work (Q1) vs long-term growth (Q2).

**Data sources:**

- `eisenhower_task` — `lifeAreaId`, `quadrant`, `createdAt`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Q1 count per area | quadrant=1 per lifeAreaId |
| Q2 count per area | quadrant=2 per lifeAreaId |
| Q3/Q4 count per area | quadrant=3/4 per lifeAreaId |
| Proactivity ratio per area | Q2 / (Q1+Q2) |

**Visualisation:**

- Stacked bar: quadrant breakdown per life area
- Matrix: life areas on Y-axis, quadrants on X-axis (bubble size = count)

---

## 6. Eisenhower Matrix

### 6.1 Quadrant Distribution Over Time

**Purpose:** Track whether the user is becoming more proactive (more Q2) or reactive (more Q1) over time.

**Data sources:**

- `eisenhower_task` — `quadrant`, `createdAt`, `userId`

**Quadrant labels:**
| Quadrant | Label |
|----------|-------|
| 1 | Urgent + Important (Do) |
| 2 | Not Urgent + Important (Schedule) |
| 3 | Urgent + Not Important (Delegate) |
| 4 | Not Urgent + Not Important (Eliminate) |

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Count per quadrant | grouped count |
| % per quadrant | quadrant count / total |
| Q1/Q2 ratio | Q1 count / Q2 count (lower = more proactive) |
| Trend | monthly change in Q1% and Q2% |

**Filters:** date range, life area

**Visualisation:**

- Classic 2×2 matrix: bubble size per quadrant = task count
- Line chart: Q1% vs Q2% over time (convergence = growing maturity)
- Donut: current quadrant split

---

### 6.2 Task Promotion Rate

**Purpose:** Show how effectively Q2 tasks get elevated to daily priorities — a key indicator of strategic execution.

**Data sources:**

- `eisenhower_task` — `promotedDate`, `promotedPriorityId`, `quadrant`, `createdAt`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Promotion rate | promoted tasks / total tasks |
| Avg time to promotion | `AVG(promotedDate - createdAt)` |
| Q2 promotion rate | promoted where `quadrant = 2` / Q2 total |
| Never-promoted tasks | tasks with null `promotedDate` older than 30d |

**Visualisation:**

- Funnel: created → promoted → completed (as top priority)
- Histogram: days from created to promoted

---

### 6.3 Task Aging

**Purpose:** Identify stale tasks — tasks sitting in quadrants without action for too long.

**Data sources:**

- `eisenhower_task` — `createdAt`, `updatedAt`, `promotedDate`, `quadrant`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Avg task age per quadrant | `AVG(now - createdAt)` grouped by quadrant |
| Stale tasks (>30d, unpromoted) | filter by age + null `promotedDate` |
| Oldest task | max `now - createdAt` |

**Visualisation:**

- Box plot: age distribution per quadrant
- List: top 10 oldest unpromoted tasks (with quadrant + life area)

---

### 6.4 Q1 vs Q2 Ratio Trend

**Purpose:** Measure whether the user is becoming more strategically driven over time — a core Eisenhower effectiveness metric.

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Monthly Q1:Q2 ratio | Q1 count / Q2 count per month |
| Direction | ratio decreasing over time = improving proactivity |

**Visualisation:**

- Line chart: ratio over time (annotate below 1.0 = healthy zone)

---

## 7. Decision Log

### 7.1 Decision Volume Over Time

**Purpose:** Track cadence of decision-making — are users logging decisions regularly?

**Data sources:**

- `decision_entry` — `date`, `userId`, `lifeAreaId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Decisions per week/month | count grouped by period |
| Total decisions | all-time count |
| Avg per week | total / weeks active |
| Trend | MoM change |

**Filters:** date range, life area

**Visualisation:**

- Bar chart: decisions per week
- Calendar heatmap: intensity = decisions that day

---

### 7.2 Decision → Outcome Tracking

**Purpose:** Show what % of logged decisions have an outcome recorded — a proxy for follow-through and learning.

**Data sources:**

- `decision_entry` — `outcome`, `date`, `outcomeRecordedAt` (required for accurate timing)

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Decisions with outcome | count where `outcome IS NOT NULL` |
| Decisions without outcome | count where `outcome IS NULL` |
| Outcome rate | with outcome / total |
| Avg time to outcome | time between `date` and `outcomeRecordedAt` |

**Visualisation:**

- Donut: with outcome vs without
- List: oldest decisions awaiting outcome (follow-up prompt)

---

### 7.3 Decision by Life Area

**Purpose:** Understand which life areas generate the most decisions and which are most neglected in decision-making.

**Data sources:**

- `decision_entry` — `lifeAreaId`
- `life_area` — `name`, `color`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Count per area | grouped count |
| % distribution | area count / total |
| Outcome rate per area | outcomes / decisions per area |

**Visualisation:**

- Horizontal bar: decisions per area (color-coded)
- Comparison: decision distribution vs time distribution vs habit distribution

---

### 7.4 Focus Time per Decision

**Purpose:** Show how much deep work time is linked to specific decisions — which decisions required the most focused thinking.

**Data sources:**

- `decision_focus_session` — `decisionId`, `focusSessionId`
- `focus_session` — `duration`
- `decision_entry` — `title`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Focus minutes per decision | SUM focus_session.duration grouped by decisionId |
| Top 10 most-focused decisions | ranked by total minutes |
| Avg focus per decision | mean across all linked decisions |
| Decisions with no focus time | count with no linked sessions |

**Visualisation:**

- Ranked list: decision title → total focus minutes
- Bar chart: decisions sorted by focus time

---

## 8. Calendar Sync Health

### 8.1 Sync Health Dashboard

**Purpose:** For power users with calendar connected — show reliability of the sync pipeline.

**Data sources:**

- `sync_audit_log` — `action`, `status`, `eventsProcessed`, `eventsCreated`, `eventsUpdated`, `eventsDeleted`, `durationMs`, `createdAt`
- `calendar_connection` — `status`, `lastSyncAt`, `provider`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Sync success rate | `status = 'success'` / total syncs |
| Avg sync duration | `AVG(durationMs)` |
| Events processed / day | SUM `eventsProcessed` grouped by date |
| Last successful sync | max `createdAt` where `status = 'success'` |
| Connection status | live from `calendar_connection.status` |

**Filters:** connection/provider, date range

**Visualisation:**

- Status card per connection: last sync, status badge, error if any
- Bar chart: events processed per day
- Line: sync duration trend (detect degradation)

---

### 8.2 Conflict Resolution Stats

**Purpose:** Show how many calendar conflicts were detected and how quickly (or whether) they were resolved.

**Data sources:**

- `calendar_conflict` — `conflictType`, `resolved`, `resolvedAt`, `createdAt`, `connectionId`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Total conflicts | count |
| Resolution rate | resolved / total |
| Avg time to resolve | `AVG(resolvedAt - createdAt)` |
| Unresolved conflicts | count where `resolved = false` |
| Conflicts by type | grouped by `conflictType` |

**Visualisation:**

- Summary cards: total / resolved / unresolved
- Bar: conflicts by type
- Timeline: conflict events with resolved markers

---

## 9. Cross-Domain Summary Reports

### 9.1 Weekly Review Report

**Purpose:** A single report consolidating the week's productivity across all tools — the primary narrative report. Designed to replace a manual weekly review.

**Data sources:** All productivity models — priorities, time blocks, focus sessions, habits, decisions, eisenhower tasks.

**Sections:**

```
┌─────────────────────────────────────────────────────┐
│  Week of [date range]                               │
├────────────┬────────────────────────────────────────┤
│ Priorities │ X set, Y completed (Z%)                │
│            │ Top 3 incomplete (list)                │
├────────────┼────────────────────────────────────────┤
│ Focus      │ X hours scheduled, Y hours actual      │
│            │ Z sessions (A% complete)               │
├────────────┼────────────────────────────────────────┤
│ Habits     │ X/Y habits on track                    │
│            │ Best: [habit], Needs attention: [habit]│
├────────────┼────────────────────────────────────────┤
│ Decisions  │ X decisions logged, Y with outcomes    │
├────────────┼────────────────────────────────────────┤
│ Life Areas │ Most focused: [area]                   │
│            │ Most neglected: [area]                 │
├────────────┼────────────────────────────────────────┤
│ Daily Rev. │ X/7 reviews completed                  │
│            │ Common wins: [keywords]                │
│            │ Common blockers: [keywords]            │
└────────────┴────────────────────────────────────────┘
```

**API shape:**

```ts
GET /api/reports/summary/weekly?date=2025-04-21

Response:
{
  week: { from, to },
  priorities: { set, completed, rate, incomplete: [] },
  focus: { scheduledHours, actualMinutes, sessions, completionRate },
  habits: { onTrack, total, best, needsAttention },
  decisions: { count, withOutcome },
  lifeAreas: { mostFocused, mostNeglected },
  dailyReview: { completed, total, wins: [], blockers: [] }
}
```

**Visualisation:** Single-page report layout (shareable / printable)

---

### 9.2 Monthly Productivity Score

**Purpose:** A composite score (0–100) showing overall productivity health for the month. A personal "scorecard".

**Weights:**
| Component | Weight | Source |
|-----------|--------|--------|
| Priority completion rate | 25% | `top_priority` |
| Focus session completion rate | 20% | `focus_session` |
| Habit adherence rate | 25% | `habit_log` |
| Daily review rate | 15% | `daily_review` |
| Life area balance | 15% | Composite from all areas |

**Formula:**

```
score = 0.25 × priorityRate + 0.20 × focusRate + 0.25 × habitRate
      + 0.15 × reviewRate + 0.15 × balanceScore
```

All inputs are 0–1. Output is `score × 100` (rounded).

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Monthly score | formula above |
| MoM change | score delta from previous month |
| Best month | max score all-time |
| Score trend | last 6 months line |
| Component breakdown | per-weight contribution |

**Visualisation:**

- Big score number with trend arrow
- Stacked radar: 5 components
- Line: last 6 months score trend

---

### 9.3 Streak & Consistency Dashboard

**Purpose:** A single dashboard showing all "streak" type metrics across habits, daily planning, and focus work — gamification layer.

**Data sources:**

- `habit_log` — habit streaks
- `day` — daily planning streaks (days with at least 1 priority set)
- `focus_session` — focus streaks (days with at least 1 completed session)
- `daily_review` — review streaks

**Metrics:**
| Streak | Source | Current | Best |
|--------|--------|---------|------|
| Daily planning | `day + top_priority` | X days | Y days |
| Focus sessions | `focus_session.completed` | X days | Y days |
| Daily review | `daily_review` | X days | Y days |
| Per-habit streaks | `habit_log` | per habit | per habit |

**Visualisation:**

- Grid of streak cards (current streak + best ever + mini calendar)
- All-time longest streaks leaderboard (personal)

---

### 9.4 Goal Velocity

**Purpose:** Show rate of progress — are priorities being completed faster or slower over rolling 4-week windows?

**Data sources:**

- `top_priority` — `completed`, `dayId`
- `day` — `date`

**Metrics:**
| Metric | Calculation |
|--------|-------------|
| Completions per week | count `completed = true` per week |
| Velocity trend | week-over-week change |
| Acceleration | second derivative of velocity (speeding up vs slowing) |
| Projected completions | rolling avg extrapolated forward |

**Visualisation:**

- Line chart: completions/week with trend line
- Annotation: weeks above/below personal average

---

## 10. Implementation Notes

### Backend API conventions

```
Base path:  /api/reports/
Auth:       Bearer token (session-based, user-scoped)
Caching:    Reports cached for 5 min (Redis or in-memory) keyed by userId + params
Pagination: Not needed — reports are aggregated, not paginated
```

### Date range handling

- All reports accept `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Default range: last 30 days if omitted
- All dates are stored in UTC; frontend converts to user timezone for display
- User timezone stored in `UserSettings` (if added) or derived from browser

### Schema changes required

The following fields are required to support metrics in this spec without approximation:

| Model            | Field               | Type                       | Purpose                                              |
| ---------------- | ------------------- | -------------------------- | ---------------------------------------------------- |
| `top_priority`   | `carryChainId`      | `String?`                  | Stable chain key for carried-forward analysis        |
| `top_priority`   | `sourcePriorityId`  | `String?` (self-reference) | Optional direct lineage to original priority         |
| `habit`          | `archivedAt`        | `DateTime?`                | Accurate "archived in last 30d" and archive timeline |
| `decision_entry` | `outcomeRecordedAt` | `DateTime?`                | Accurate time-to-outcome metric                      |

Migration/backfill guidance:

- For existing carried priorities, generate `carryChainId` by walking carry links in chronological order; if no lineage is recoverable, leave `NULL` and exclude from chain-dependent aggregates.
- For already archived habits with unknown archive timestamp, set `archivedAt` to migration time and mark historical archive metrics as partial before migration.
- For decisions where `outcome` is already present and no event history exists, set `outcomeRecordedAt` to `updatedAt` as a fallback and tag pre-migration values as estimated.
- Add indexes for query performance: `top_priority(carryChainId)`, `habit(archivedAt)`, `decision_entry(outcomeRecordedAt)`.

### Metric normalization conventions

- All API rate fields are ratios in range `0..1`.
- Frontend display may render percentages by multiplying by 100.
- Composite scores (for example monthly score) multiply final ratio by 100 at output.

### Division-by-zero and sparse-data guards

- Any metric with denominator `0` returns `null` (not `0`) unless explicitly overridden.
- Ratios such as `Q1/Q2` return `null` when denominator is `0`.
- Week-over-week `%` change returns `null` when previous period is `0`.
- Trends should render `null` as "insufficient data".

### Common query patterns

**Completion rate per day:**

```sql
SELECT d.date,
       COUNT(tp.id) AS total,
       COUNT(tp.id) FILTER (WHERE tp.completed) AS completed,
       ROUND(COUNT(tp.id) FILTER (WHERE tp.completed)::numeric / NULLIF(COUNT(tp.id), 0), 4) AS rate
FROM day d
LEFT JOIN top_priority tp ON tp."dayId" = d.id
WHERE d."userId" = $1
  AND d.date BETWEEN $2 AND $3
GROUP BY d.date
ORDER BY d.date;
```

**Habit streak (consecutive days):**

```sql
-- Use window functions with gaps-and-islands pattern
WITH ordered AS (
  SELECT date,
         date - ROW_NUMBER() OVER (ORDER BY date)::int AS grp
  FROM habit_log
  WHERE "habitId" = $1 AND completed = true
)
SELECT MIN(date) AS streak_start, MAX(date) AS streak_end, COUNT(*) AS length
FROM ordered
GROUP BY grp
ORDER BY streak_end DESC;
```

**Focus hours by week:**

```sql
SELECT DATE_TRUNC('week', d.date) AS week,
       SUM(EXTRACT(EPOCH FROM (tb."endTime" - tb."startTime")) / 3600) AS hours
FROM time_block tb
JOIN day d ON d.id = tb."dayId"
WHERE d."userId" = $1
  AND d.date BETWEEN $2 AND $3
GROUP BY week
ORDER BY week;
```

### Report page structure (frontend)

Each report page follows:

```
[Header: title + date range picker + export button]
[Summary cards: 3–4 KPI tiles]
[Primary chart: main visualisation]
[Secondary section: supporting charts or table]
[Insights: 2–3 auto-generated text callouts]
```

### Suggested build order

| Phase | Reports                                    | Rationale                               |
| ----- | ------------------------------------------ | --------------------------------------- |
| 1     | Habit completion rate, Habit streaks       | Highest data density, most user-visible |
| 2     | Weekly review report                       | Drives retention, uses all models       |
| 3     | Focus session completion, Focus hours      | Pomodoro is a core feature              |
| 4     | Daily completion rate, Carried-forward     | Core daily planning feedback            |
| 5     | Life area balance, Eisenhower distribution | Deeper strategic insights               |
| 6     | Monthly score, Goal velocity               | Gamification / long-term engagement     |
| 7     | Calendar sync health, Decision log         | Power-user / completeness               |

### Export formats

- PDF: weekly/monthly summary reports
- CSV: raw data export per report (for power users)
- Share link: read-only public URL for a specific report snapshot (optional, future)
