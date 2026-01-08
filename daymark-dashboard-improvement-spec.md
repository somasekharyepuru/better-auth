# Daymark Dashboard UX Improvement Specification
**Version:** 1.0  
**Date:** January 8, 2026  
**Purpose:** Comprehensive design improvements for dashboard landing page

---

## Executive Summary

**Core Problem:** The dashboard hides key differentiators (Pomodoro, execution focus) and has interaction patterns that hurt discoverability on mobile and desktop.

**Solution:** Make actions visible by default, improve visual hierarchy, enhance empty states, and polish typography/spacing.

---

## CRITICAL ISSUES (P0 - Must Fix)

### 1. Focus Button Visibility - CRITICAL MOBILE ISSUE ⚠️

**Current State:**
- Focus/Delete/Actions appear on hover only
- Works on desktop, BREAKS on mobile (no hover state)
- Users don't discover the core feature

**Problem:**
- Mobile users: 50%+ of traffic cannot hover
- Desktop users: Hidden actions = low discovery
- Your main differentiator (Pomodoro integration) is invisible

**Solution: Make Actions Always Visible**

#### Option A: Persistent Icon Buttons (Recommended)
```
┌──────────────────────────────────────────────────┐
│ ⬜ Test priority                    [▶️] [⋯]     │
│    💼 Work                                        │
└──────────────────────────────────────────────────┘
```

**Implementation:**
- `[▶️]` = Start Focus (25min Pomodoro) - Always visible
- `[⋯]` = More menu (Delete, Edit, etc.) - Always visible
- On mobile: Both icons visible
- On desktop: Both icons visible (no hover required)

**CSS/Component Structure:**
```jsx
<PriorityCard>
  <Checkbox />
  <PriorityText>Test priority</PriorityText>
  <LifeAreaBadge>💼 Work</LifeAreaBadge>
  <ActionButtons className="always-visible">
    <FocusButton icon="▶️" tooltip="Start 25min focus" />
    <MoreButton icon="⋯" />
  </ActionButtons>
</PriorityCard>
```

#### Option B: Expandable Actions Bar (Alternative)
```
┌──────────────────────────────────────────────────┐
│ ⬜ Test priority                                  │
│    💼 Work                                        │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│    [▶️ Focus 25m]  [📅 Schedule]  [⋯ More]      │
└──────────────────────────────────────────────────┘
```

**When to show:**
- Desktop: On hover (can keep this if you prefer)
- Mobile: Always visible when priority is unchecked
- Tablet: Always visible

**Recommendation:** Use Option A - consistent across all devices, maximum discoverability.

---

### 2. Life Area Tags on Priority Cards

**Current State:**
- Life area selected at top ("• Personal")
- NOT visible on individual priority cards
- Users can't see which life area a priority belongs to at a glance

**Solution: Add Life Area Badge to Each Priority**

```
┌──────────────────────────────────────────────────┐
│ ⬜ Test priority                    [▶️] [⋯]     │
│    💼 Work  ⏱️ 2h estimated                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ⬜ Morning workout                  [▶️] [⋯]     │
│    💪 Health  ⏱️ 45m estimated                   │
└──────────────────────────────────────────────────┘
```

**Implementation:**
```jsx
<PriorityMetadata>
  <LifeAreaBadge 
    icon={priority.life_area.icon} 
    color={priority.life_area.color}
  >
    {priority.life_area.name}
  </LifeAreaBadge>
  {priority.time_estimate && (
    <TimeEstimate>⏱️ {priority.time_estimate}</TimeEstimate>
  )}
</PriorityMetadata>
```

**Design Specs:**
- Badge style: Subtle background color (related to life area)
- Font: 12-13px, medium weight
- Spacing: 4px padding, 2px margin between badges
- Position: Below priority text, left-aligned

**Hours Spent Question:**
- YES, show time estimate if user sets it: "⏱️ 2h estimated"
- NO, don't show actual time spent yet (add this later as analytics feature)
- Keep it optional - not all priorities need time estimates

---

### 3. Progress Bar - Remove Demotivating 0%

**Current State:**
```
0 of 2 priorities completed                    0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Problem:**
- Starts every day at 0% (negative framing)
- Takes up prominent space for demotivating content
- First thing users see is their "failure"

**Solution: Progressive Reveal**

**Morning (0 completed):**
```
2 priorities today
```

**After first completion:**
```
1 of 2 priorities completed 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯
```

**Implementation:**
```jsx
{completedCount === 0 ? (
  <ProgressHeader>
    <span>{totalCount} priorities today</span>
  </ProgressHeader>
) : (
  <ProgressHeader>
    <span>{completedCount} of {totalCount} priorities completed</span>
    {completedCount === totalCount && <span>🎉</span>}
    <ProgressBar 
      value={completedCount} 
      max={totalCount} 
    />
  </ProgressHeader>
)}
```

**Alternative (Simpler):**
Just remove the section entirely and show count in section header:
```
Top 3 Priorities (1 of 3 completed)
```

---

### 4. Schedule Clarity - Distinguish Calendar vs Time Blocks

**Current State:**
```
9:00 AM - 10:00 AM    [Deep Work]    Testing
1:44 PM - 2:09 PM    [Quick Focus]   Focus: Test p...
```

**Problem:**
- Can't tell if "Testing" is from Google Calendar or a time block
- "Deep Work" and "Quick Focus" are confusing labels
- Truncation makes it unclear what the event is

**Solution: Clear Visual Distinction**

```
📅 9:00 AM - 10:00 AM
   Testing
   From Google Calendar

🎯 1:44 PM - 2:09 PM
   Focus: Test priority
   Time Block - Deep Work
   [▶️ Start Focus]
```

**Implementation:**
```jsx
<ScheduleItem type={item.type}>
  {item.type === 'calendar_event' && (
    <>
      <Icon>📅</Icon>
      <Time>{item.start_time} - {item.end_time}</Time>
      <Title>{item.title}</Title>
      <Source>From {item.calendar_name}</Source>
    </>
  )}
  
  {item.type === 'time_block' && (
    <>
      <Icon>🎯</Icon>
      <Time>{item.start_time} - {item.end_time}</Time>
      <Title>{item.priority?.text || 'Focus Block'}</Title>
      <BlockType>{item.block_type_label}</BlockType>
      {item.priority && (
        <ActionButton onClick={() => startFocus(item.priority)}>
          ▶️ Start Focus
        </ActionButton>
      )}
    </>
  )}
</ScheduleItem>
```

**Design Specs:**
- Calendar events: Lighter background, no action button
- Time blocks: Slightly darker background, show action button
- Icons: 📅 for calendar, 🎯 for focus blocks
- Source label: Smaller, lighter text (11px, gray-500)

**Note on "Deep Work" / "Quick Focus":**
You said these are fixed time block types. Consider:
- Renaming to be clearer: "Deep Work Block", "Quick Focus Block"
- OR use icons: 🧠 Deep Work, ⚡ Quick Focus
- Make it obvious these are YOUR blocks, not calendar events

---

### 5. Empty States - Hide or Improve

**Current State: To Discuss Section**
```
💬 To Discuss                          + Add

1  Discussion point
2  Discussion point  
3  Discussion point
```

**Problem:**
- Takes up huge space showing nothing
- Users won't understand what this is for
- Generic "Discussion point" isn't helpful

**Solution: Collapsible Empty State**

**When Empty (Collapsed):**
```
💬 To Discuss (0)                      [+ Add]
```

**When Has Content (Expanded):**
```
💬 To Discuss (3)                      [+ Add]

1  Follow up with John about Q4 budget
2  Review pricing strategy
3  Discuss timeline with Sarah
```

**When User Clicks + Add First Time:**
```
💬 To Discuss                          [+ Add]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick capture for:
• Follow-ups needed
• Topics for meetings  
• Ideas to explore
• Questions to ask

[Start typing...]
```

**Implementation:**
```jsx
<Section>
  <SectionHeader>
    <Title>💬 To Discuss ({discussionCount})</Title>
    <AddButton onClick={addDiscussion}>+ Add</AddButton>
  </SectionHeader>
  
  {discussionCount === 0 ? (
    <EmptyState className="collapsed">
      <HelpText>Add discussion topics, follow-ups, or ideas</HelpText>
    </EmptyState>
  ) : (
    <DiscussionList>
      {discussions.map(item => (
        <DiscussionItem key={item.id}>{item.text}</DiscussionItem>
      ))}
    </DiscussionList>
  )}
</Section>
```

**Priority 3 Empty Slot:**
```
┌──────────────────────────────────────────────────┐
│ ⬜ Test priority                    [▶️] [⋯]     │
│    💼 Work                                        │
├──────────────────────────────────────────────────┤
│ ⬜ Another test                     [▶️] [⋯]     │
│    💼 Work                                        │
├──────────────────────────────────────────────────┤
│ [+ Add Priority]                                  │
└──────────────────────────────────────────────────┘
```

**Remove the dashed placeholder box** - just show clean Add button.

---

## MAJOR VISUAL IMPROVEMENTS (P1)

### 6. Visual Hierarchy Enhancement

**Problem:** Everything has similar visual weight. User's eye doesn't know where to focus.

**Solution: Establish Clear Hierarchy**

#### Font Sizes (Current → Proposed)
```
Date: 48px → 32px (too large)
Section Headers: 18px → 20px (increase)
Priority Text: 16px → 18px (increase)
Metadata: 14px → 13px (good)
Helper Text: 14px → 12px (reduce)
```

#### Font Weights
```
Section Headers: 500 → 600 (bolder)
Priority Text: 400 → 500 (medium)
Active Priority: 400 → 600 (bold)
Metadata: 400 → 400 (no change)
Helper Text: 400 → 400 (no change)
```

#### Component Sizing
```
Priority Card Height: Auto → Min 72px (more breathing room)
Section Card Padding: 16px → 20px (more generous)
Priority Card Padding: 12px → 16px (more space)
```

**Implementation:**
```css
/* Typography Scale */
.text-display-lg { font-size: 32px; font-weight: 700; } /* Date */
.text-heading-lg { font-size: 20px; font-weight: 600; } /* Section Headers */
.text-body-lg { font-size: 18px; font-weight: 500; } /* Priorities */
.text-body-md { font-size: 16px; font-weight: 400; } /* Body */
.text-body-sm { font-size: 13px; font-weight: 400; } /* Metadata */
.text-caption { font-size: 12px; font-weight: 400; } /* Helper text */

/* Component Sizing */
.priority-card {
  min-height: 72px;
  padding: 16px;
}

.section-card {
  padding: 20px;
}

.priority-card.active {
  font-weight: 600;
  background: var(--active-bg);
  border-left: 4px solid var(--primary-color);
}
```

---

### 7. Typography Improvements

**Problem:** All text looks flat and similar.

**Solution: Implement Type System**

#### Desktop Typography
```
Component              | Font Size | Weight | Line Height | Color
-----------------------|-----------|--------|-------------|--------
Page Greeting          | 24px      | 500    | 1.2         | Gray-700
Date (Large)           | 32px      | 700    | 1.1         | Gray-900
Section Header         | 20px      | 600    | 1.3         | Gray-900
Priority Text          | 18px      | 500    | 1.4         | Gray-900
Priority (Active)      | 18px      | 600    | 1.4         | Gray-900
Life Area Badge        | 13px      | 500    | 1.2         | Gray-700
Time Estimate          | 13px      | 400    | 1.2         | Gray-600
Schedule Time          | 14px      | 600    | 1.3         | Gray-700
Schedule Title         | 16px      | 500    | 1.4         | Gray-900
Helper Text            | 12px      | 400    | 1.4         | Gray-500
Button Text            | 14px      | 500    | 1          | Primary
```

#### Mobile Typography (Responsive)
```
Component              | Font Size | Weight
-----------------------|-----------|-------
Page Greeting          | 20px      | 500
Date (Large)           | 28px      | 700
Section Header         | 18px      | 600
Priority Text          | 16px      | 500
Life Area Badge        | 12px      | 500
Schedule Time          | 13px      | 600
Schedule Title         | 15px      | 500
```

**Implementation:**
```css
/* Base Typography Classes */
.heading-page { 
  font-size: 24px; 
  font-weight: 500; 
  line-height: 1.2;
  color: var(--gray-700);
}

.heading-section {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--gray-900);
  margin-bottom: 16px;
}

.priority-text {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--gray-900);
}

.priority-text.active {
  font-weight: 600;
}

.metadata-badge {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--gray-700);
}

.helper-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--gray-500);
}

/* Responsive */
@media (max-width: 768px) {
  .heading-page { font-size: 20px; }
  .heading-section { font-size: 18px; }
  .priority-text { font-size: 16px; }
}
```

---

### 8. Spacing & Layout Improvements

**Problem:** Inconsistent spacing creates visual clutter.

**Solution: Spacing System**

#### Spacing Scale
```
xs:  4px   (tight elements)
sm:  8px   (related items)
md:  12px  (component padding)
lg:  16px  (section padding)
xl:  20px  (card padding)
2xl: 24px  (section gaps)
3xl: 32px  (major sections)
```

#### Grid Layout Spacing
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px; /* 2xl */
  padding: 24px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
  }
}
```

#### Card Internal Spacing
```css
.card {
  padding: 20px; /* xl */
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-header {
  margin-bottom: 16px; /* lg */
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px; /* md */
}
```

#### Priority Card Spacing
```css
.priority-card {
  padding: 16px; /* lg */
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px; /* md */
  min-height: 72px;
}

.priority-card:hover {
  background: var(--gray-50);
}

.priority-card + .priority-card {
  margin-top: 8px; /* sm */
}

.priority-metadata {
  display: flex;
  gap: 8px; /* sm */
  margin-top: 4px; /* xs */
}
```

---

### 9. Color & Visual Interest

**Problem:** Too much white/gray, no energy or personality.

**Solution: Subtle Color System**

#### Life Area Colors (Pastel/Subtle)
```css
/* Don't use bright colors - use subtle tints */
.life-area-work {
  --color: #3B82F6;
  --bg: #EFF6FF;
  --border: #DBEAFE;
}

.life-area-personal {
  --color: #8B5CF6;
  --bg: #F5F3FF;
  --border: #EDE9FE;
}

.life-area-health {
  --color: #10B981;
  --bg: #ECFDF5;
  --border: #D1FAE5;
}

.life-area-learning {
  --color: #F59E0B;
  --bg: #FFFBEB;
  --border: #FEF3C7;
}

.life-area-family {
  --color: #EC4899;
  --bg: #FDF2F8;
  --border: #FCE7F3;
}
```

#### Usage
```jsx
<LifeAreaBadge 
  className="life-area-work"
  style={{
    color: 'var(--color)',
    background: 'var(--bg)',
    border: '1px solid var(--border)'
  }}
>
  💼 Work
</LifeAreaBadge>
```

#### Card Backgrounds (Subtle States)
```css
.card {
  background: white;
}

.priority-card:hover {
  background: var(--gray-50);
}

.priority-card.active {
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
}

.schedule-item.time-block {
  background: var(--blue-50);
}

.schedule-item.calendar-event {
  background: var(--gray-50);
}
```

#### Action Button Colors
```css
.btn-focus {
  background: var(--blue-500);
  color: white;
}

.btn-focus:hover {
  background: var(--blue-600);
}

.icon-button {
  color: var(--gray-600);
}

.icon-button:hover {
  color: var(--gray-900);
  background: var(--gray-100);
}
```

---

### 10. Quick Notes Enhancement

**Current State:**
```
📝 Quick Notes

Jot down your thoughts, meeting notes, or ideas...
```

**Improved State:**

```
📝 Quick Notes                                     [Expand ⤢]

[Type / for commands...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Quick actions:
/todo → Add to priorities
/meet → Schedule time  
/decide → Log decision
```

**Implementation:**
```jsx
<QuickNotes>
  <Header>
    <Title>📝 Quick Notes</Title>
    <ExpandButton onClick={toggleExpand}>
      {expanded ? 'Collapse ⤓' : 'Expand ⤢'}
    </ExpandButton>
  </Header>
  
  <TextArea 
    placeholder="Type / for commands..."
    onKeyDown={handleSlashCommands}
  />
  
  {showQuickActions && (
    <QuickActionsHint>
      💡 Quick actions:
      /todo → Add to priorities
      /meet → Schedule time
      /decide → Log decision
    </QuickActionsHint>
  )}
</QuickNotes>
```

**Slash Commands to Implement:**
- `/todo [text]` → Creates priority
- `/meet [text]` → Opens schedule dialog
- `/decide [text]` → Opens decision log
- `/focus` → Starts Pomodoro timer
- `/` → Shows command menu

---

### 11. "End of Day" Button Improvements

**Current State:** Prominent button in top-right always visible.

**Solution: Contextual Appearance**

**Before 5 PM:**
- Move to overflow menu or make less prominent
- Small text link: "End Day Early"

**After 5 PM:**
```
[🌙 End of Day Review]  ← Larger, more prominent
```

**After all priorities complete:**
```
[🎉 All Done! Review Your Day]  ← Animated, celebratory
```

**Implementation:**
```jsx
function EndOfDayButton() {
  const currentHour = new Date().getHours();
  const allComplete = priorities.every(p => p.completed);
  
  if (allComplete) {
    return (
      <Button className="btn-celebrate" onClick={openReview}>
        🎉 All Done! Review Your Day
      </Button>
    );
  }
  
  if (currentHour >= 17) {
    return (
      <Button className="btn-primary" onClick={openReview}>
        🌙 End of Day Review
      </Button>
    );
  }
  
  return (
    <TextButton className="btn-subtle" onClick={openReview}>
      End Day Early
    </TextButton>
  );
}
```

---

## MOBILE OPTIMIZATIONS (P1)

### 12. Mobile Responsive Layout

**Problem:** 4-quadrant desktop layout won't work on mobile.

**Solution: Single Column Stack**

#### Desktop (2 columns)
```
┌─────────────────┬─────────────────┐
│  Priorities     │  Schedule       │
├─────────────────┼─────────────────┤
│  To Discuss     │  Quick Notes    │
└─────────────────┴─────────────────┘
```

#### Mobile (1 column, reordered by priority)
```
┌─────────────────┐
│  Priorities     │  ← Most important
├─────────────────┤
│  Schedule       │  ← Next most important
├─────────────────┤
│  Quick Notes    │  ← Quick capture
├─────────────────┤
│  To Discuss     │  ← Least critical
└─────────────────┘
```

**Implementation:**
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* Tablet */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  /* Reorder for mobile priority */
  .priorities-section { order: 1; }
  .schedule-section { order: 2; }
  .notes-section { order: 3; }
  .discuss-section { order: 4; }
}

/* Mobile */
@media (max-width: 640px) {
  .dashboard-grid {
    gap: 16px;
    padding: 16px;
  }
  
  .card {
    padding: 16px;
  }
  
  .priority-card {
    padding: 12px;
    min-height: 64px;
  }
}
```

#### Mobile Navigation
```jsx
<MobileHeader>
  <DateSelector />
  <Actions>
    <LifeAreaDropdown />
    <CalendarButton />
    <ToolsButton />
    <MenuButton />
  </Actions>
</MobileHeader>
```

#### Touch Targets (Mobile)
```css
/* Minimum touch target: 44px x 44px */
.btn-mobile,
.icon-button-mobile {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-mobile {
  width: 28px;
  height: 28px;
}
```

---

### 13. Mobile Interaction Patterns

**Swipe Actions on Priorities (Nice to Have)**
```
Swipe Right → Complete
Swipe Left → Delete / More Options
Long Press → Drag to Reorder
```

**Implementation Hint:**
```jsx
import { useSwipeable } from 'react-swipeable';

function PriorityCard({ priority }) {
  const handlers = useSwipeable({
    onSwipedRight: () => completePriority(priority.id),
    onSwipedLeft: () => showMoreMenu(priority.id),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
  
  return (
    <div {...handlers} className="priority-card">
      {/* card content */}
    </div>
  );
}
```

**Bottom Sheet Modals (Mobile)**

Instead of dropdowns, use bottom sheets for:
- Life area selector
- Time block creation
- More actions menu

```jsx
<MobileSheet open={showLifeAreas} onClose={close}>
  <SheetHeader>Select Life Area</SheetHeader>
  <LifeAreaOptions>
    <Option>💼 Work</Option>
    <Option>🏠 Personal</Option>
    <Option>💪 Health</Option>
    <Option>📚 Learning</Option>
  </LifeAreaOptions>
</MobileSheet>
```

---

## DISCOVERY & ONBOARDING (P2)

### 14. First-Time User Experience

**When Dashboard is Empty:**

```
┌─────────────────────────────────────────────────┐
│ 👋 Welcome to Daymark, Somasekhar!              │
│                                                  │
│ Let's plan your day in 3 steps:                 │
│                                                  │
│ 1️⃣ Add your top 3 priorities                   │
│    What must get done today?                    │
│    [+ Add Your First Priority]                  │
│                                                  │
│ 2️⃣ Schedule your time                          │
│    When will you work on them?                  │
│                                                  │
│ 3️⃣ Start focusing                              │
│    Use built-in Pomodoro timer                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**After First Priority Added:**

```
┌─────────────────────────────────────────────────┐
│ ⬜ Test priority                   [▶️] [⋯]     │
│    💼 Work                                       │
│    ⤷ Click ▶️ to start a 25-minute focus       │
│       session on this priority                  │
└─────────────────────────────────────────────────┘
```

**Implementation:**
```jsx
function Dashboard() {
  const { priorities, isFirstTime } = useDashboard();
  
  if (priorities.length === 0 && isFirstTime) {
    return <OnboardingView />;
  }
  
  if (priorities.length === 1 && isFirstTime) {
    return (
      <DashboardView>
        <Tooltip target="focus-button" position="below">
          👉 Click here to start your first focus session
        </Tooltip>
      </DashboardView>
    );
  }
  
  return <DashboardView />;
}
```

---

### 15. Feature Discovery Hints

**Progressive Tooltips (Show Once)**

**Day 1:** After adding first priority
```
💡 Pro tip: Click [▶️] to start a Pomodoro focus session
   Work in 25-minute bursts with 5-minute breaks
   [Got It]
```

**Day 3:** If no Pomodoro used yet
```
🎯 Focus Mode
   Users who use Pomodoro complete 2x more priorities
   [Try It Now] [Maybe Later]
```

**Day 5:** If life areas not used
```
🏷️ Organize with Life Areas
   Separate Work, Personal, Health priorities
   [Set Up Life Areas] [Skip]
```

**Day 7:** After consistent use
```
🛠️ Power Tools Available
   Check out Tools menu for:
   • Eisenhower Matrix (prioritization)
   • Decision Log (track choices)
   [Explore Tools]
```

**Implementation:**
```jsx
function useFeatureDiscovery() {
  const [discoveries, setDiscoveries] = useState({
    pomodoro: false,
    lifeAreas: false,
    tools: false
  });
  
  useEffect(() => {
    const daysSinceSignup = getDaysSinceSignup();
    const pomodoroUsed = hasUsedPomodoro();
    const lifeAreasSetup = hasLifeAreas();
    
    if (daysSinceSignup >= 3 && !pomodoroUsed && !discoveries.pomodoro) {
      showTooltip('pomodoro');
    }
    
    // ... similar logic for other features
  }, []);
}
```

---

## TOOLS MENU DISCOVERABILITY (P2)

### 16. Make Tools Menu More Prominent

**Current State:** "Tools" in header - easy to miss

**Solution: Multiple Discovery Paths**

#### Path 1: Contextual Prompts
**In Priority Overflow Menu:**
```
[⋯] More Options
  ✏️ Edit
  📅 Schedule
  ✨ Prioritize with Matrix  ← Links to Eisenhower
  🗑️ Delete
```

**After Multiple Priorities:**
```
💡 Tip: Having trouble prioritizing?
   Use the Eisenhower Matrix to sort by urgency/importance
   [Open Matrix] [Dismiss]
```

#### Path 2: Header Improvements
```
┌─────────────────────────────────────────────────┐
│ Daymark    📅 Calendar   🛠️ Tools [2]    Profile │
                                    ↑
                            Badge showing new features
└─────────────────────────────────────────────────┘
```

**Tools Dropdown:**
```
🛠️ Tools

Planning Tools:
  📊 Eisenhower Matrix
  📝 Decision Log

Focus Tools:
  ⏱️ Pomodoro Timer
  🎯 Focus Mode Settings

More:
  ⚙️ Settings
  ❓ Help & Tips
```

#### Path 3: Floating Action Button (Mobile)
```
[+] FAB on mobile opens:
  → Add Priority
  → Start Focus
  → Open Tools
  → Quick Note
```

**Implementation:**
```jsx
<ToolsMenu>
  <MenuTrigger>
    🛠️ Tools
    {hasNewFeatures && <Badge>New</Badge>}
  </MenuTrigger>
  
  <MenuContent>
    <MenuSection title="Planning Tools">
      <MenuItem icon="📊" href="/tools/matrix">
        Eisenhower Matrix
        <HelpText>Sort by urgency & importance</HelpText>
      </MenuItem>
      <MenuItem icon="📝" href="/tools/decisions">
        Decision Log
        <HelpText>Track important choices</HelpText>
      </MenuItem>
    </MenuSection>
    
    <MenuSection title="Focus Tools">
      <MenuItem icon="⏱️" onClick={openPomodoro}>
        Pomodoro Timer
      </MenuItem>
    </MenuSection>
  </MenuContent>
</ToolsMenu>
```

---

## COMPONENT SPECIFICATIONS

### Priority Card Component (Final Spec)

```jsx
<PriorityCard 
  className={cn(
    "priority-card",
    priority.completed && "completed",
    priority.active && "active"
  )}
>
  <DragHandle />
  
  <Checkbox 
    checked={priority.completed}
    onChange={() => togglePriority(priority.id)}
  />
  
  <Content>
    <Title className="priority-text">
      {priority.text}
    </Title>
    
    <Metadata className="priority-metadata">
      <LifeAreaBadge 
        icon={priority.life_area.icon}
        color={priority.life_area.color}
      >
        {priority.life_area.name}
      </LifeAreaBadge>
      
      {priority.time_estimate && (
        <TimeEstimate>
          ⏱️ {priority.time_estimate}
        </TimeEstimate>
      )}
      
      {priority.scheduled_time && (
        <ScheduledTime>
          📅 {priority.scheduled_time}
        </ScheduledTime>
      )}
    </Metadata>
  </Content>
  
  <Actions className="priority-actions">
    <IconButton
      icon="▶️"
      tooltip="Start 25min focus"
      onClick={() => startFocus(priority)}
      variant="primary"
    />
    
    <IconButton
      icon="⋯"
      tooltip="More options"
      onClick={() => showMoreMenu(priority)}
      variant="ghost"
    />
  </Actions>
</PriorityCard>
```

**Styling:**
```css
.priority-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-height: 72px;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
}

.priority-card:hover {
  background: var(--gray-50);
}

.priority-card.active {
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
  font-weight: 600;
}

.priority-card.completed {
  opacity: 0.6;
}

.priority-card.completed .priority-text {
  text-decoration: line-through;
  color: var(--gray-500);
}

.priority-metadata {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.priority-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

/* Mobile */
@media (max-width: 640px) {
  .priority-card {
    padding: 12px;
    min-height: 64px;
  }
  
  .priority-text {
    font-size: 16px;
  }
}
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical (Do This Week)
1. ✅ Make Focus button always visible (no hover-only)
2. ✅ Add life area badges to priority cards
3. ✅ Fix progress bar (hide 0% or remove)
4. ✅ Distinguish calendar vs time blocks in schedule
5. ✅ Hide empty "To Discuss" section

**Estimated Time:** 8-12 hours

### Phase 2: Visual Polish (Next Week)
6. ✅ Typography improvements (font sizes, weights)
7. ✅ Spacing system implementation
8. ✅ Color system for life areas
9. ✅ Quick Notes enhancement
10. ✅ "End of Day" button contextual logic

**Estimated Time:** 12-16 hours

### Phase 3: Mobile (Week 3)
11. ✅ Mobile responsive layout
12. ✅ Touch target optimization
13. ✅ Bottom sheet modals
14. ✅ Swipe actions (optional)

**Estimated Time:** 16-20 hours

### Phase 4: Discovery (Week 4)
15. ✅ First-time onboarding
16. ✅ Progressive tooltips
17. ✅ Tools menu improvements
18. ✅ Feature discovery system

**Estimated Time:** 12-16 hours

---

## TESTING CHECKLIST

### Desktop Tests
- [ ] Priorities display correctly with life area badges
- [ ] Focus button visible without hover
- [ ] Schedule distinguishes calendar vs blocks
- [ ] Empty states hide/collapse appropriately
- [ ] Typography is readable and hierarchical
- [ ] Colors are subtle and not overwhelming
- [ ] Spacing feels consistent
- [ ] Actions are discoverable

### Mobile Tests
- [ ] Single column layout works
- [ ] Touch targets are 44px minimum
- [ ] Focus button works on touch
- [ ] Bottom sheets appear correctly
- [ ] Text is readable (not too small)
- [ ] No horizontal scroll
- [ ] Sections reorder correctly

### Cross-Browser Tests
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] iOS Safari
- [ ] Android Chrome

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces priorities
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets meet guidelines

---

## DESIGN TOKENS (For Developers)

```javascript
// colors.js
export const colors = {
  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Primary (Blue)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  // Life Areas
  lifeAreas: {
    work: { color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
    personal: { color: '#8B5CF6', bg: '#F5F3FF', border: '#EDE9FE' },
    health: { color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5' },
    learning: { color: '#F59E0B', bg: '#FFFBEB', border: '#FEF3C7' },
    family: { color: '#EC4899', bg: '#FDF2F8', border: '#FCE7F3' },
  }
};

// spacing.js
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
};

// typography.js
export const typography = {
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.3,
    relaxed: 1.4,
  }
};
```

---

## FINAL NOTES

### What Makes This Work
1. **Always-visible actions** solve the mobile hover problem
2. **Life area badges** show organization at a glance
3. **Subtle progress** avoids demotivation
4. **Clear schedule types** reduce confusion
5. **Smart empty states** don't waste space
6. **Visual hierarchy** guides the eye
7. **Consistent spacing** feels professional
8. **Subtle colors** add personality without overwhelming
9. **Mobile-first** ensures it works everywhere
10. **Progressive disclosure** onboards without annoying

### What Not to Do
❌ Don't add more features before fixing these issues
❌ Don't rely on hover states for critical actions
❌ Don't show empty states that waste space
❌ Don't use bright, saturated colors
❌ Don't make text too small on mobile
❌ Don't ignore first-time user experience
❌ Don't hide your best features (Pomodoro!)

### Next Steps After Implementation
1. Get 5-10 people to test on their phones
2. Watch them use it (don't explain anything)
3. Note where they get confused
4. Iterate based on real usage
5. A/B test the progress bar variants
6. Track which features users discover
7. Measure time to first Pomodoro session

---

**Remember: The goal is to make execution (Pomodoro) as prominent as planning. That's your differentiator.**

Good luck! 🚀
