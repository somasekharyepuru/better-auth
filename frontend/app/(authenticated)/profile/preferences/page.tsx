"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings-context";
import { useTimeBlockTypes } from "@/lib/time-block-types-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CALENDAR_UI_ENABLED } from "@/lib/feature-flags";
import {
  Moon,
  Sun,
  Monitor,
  Grid3X3,
  Wrench,
  Timer,
  Calendar,
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  Settings,
} from "lucide-react";

const SECTION_OPTIONS = [
  { key: "priorities", label: "Top Priorities", description: "Main focus items" },
  { key: "discussion", label: "To Discuss", description: "Meeting items" },
  { key: "schedule", label: "Today's Schedule", description: "Time blocks" },
  { key: "notes", label: "Quick Notes", description: "Freeform notes" },
  { key: "progress", label: "Day Progress", description: "Priority progress" },
  { key: "review", label: "End-of-Day Review", description: "Daily reflection" },
];

const AVAILABLE_COLORS = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Red", hex: "#EF4444" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Orange", hex: "#F97316" },
];

function SectionHeader({ icon: Icon, title, description, color = "text-primary", bg = "bg-primary/10" }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
    </div>
  );
}

export default function PreferencesPage() {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, isLoading: isSettingsLoading, updateSettings } = useSettings();
  const { types: timeBlockTypes, addType, deleteType, isLoading: isTypesLoading } = useTimeBlockTypes();

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#6366F1");
  const [isAddingType, setIsAddingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  const [enabledSections, setEnabledSections] = useState<string[]>([]);
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [defaultType, setDefaultType] = useState("Deep Work");
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [autoCarry, setAutoCarry] = useState(true);
  const [autoCreate, setAutoCreate] = useState(true);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(true);
  const [eisenhowerEnabled, setEisenhowerEnabled] = useState(true);
  const [decisionLogEnabled, setDecisionLogEnabled] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [pomodoroSoundEnabled, setPomodoroSoundEnabled] = useState(true);
  const [focusBlocksCalendar, setFocusBlocksCalendar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabledSections(settings.enabledSections);
      setDefaultDuration(settings.defaultTimeBlockDuration);
      setDefaultType(settings.defaultTimeBlockType);
      setReviewEnabled(settings.endOfDayReviewEnabled);
      setAutoCarry(settings.autoCarryForward);
      setAutoCreate(settings.autoCreateNextDay);
      setToolsEnabled(settings.toolsTabEnabled);
      setPomodoroEnabled(settings.pomodoroEnabled);
      setEisenhowerEnabled(settings.eisenhowerEnabled);
      setDecisionLogEnabled(settings.decisionLogEnabled);
      setFocusDuration(settings.pomodoroFocusDuration);
      setShortBreak(settings.pomodoroShortBreak);
      setLongBreak(settings.pomodoroLongBreak);
      setPomodoroSoundEnabled(settings.pomodoroSoundEnabled);
      setFocusBlocksCalendar(settings.focusBlocksCalendar);
    }
  }, [settings]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        enabledSections,
        defaultTimeBlockDuration: defaultDuration,
        defaultTimeBlockType: defaultType,
        endOfDayReviewEnabled: reviewEnabled,
        autoCarryForward: autoCarry,
        autoCreateNextDay: autoCreate,
        toolsTabEnabled: toolsEnabled,
        pomodoroEnabled,
        eisenhowerEnabled,
        decisionLogEnabled,
        pomodoroFocusDuration: focusDuration,
        pomodoroShortBreak: shortBreak,
        pomodoroLongBreak: longBreak,
        pomodoroSoundEnabled,
        focusBlocksCalendar,
      });
      addToast({ type: "success", title: "Preferences saved", duration: 3000 });
    } catch {
      addToast({ type: "error", title: "Failed to save preferences", duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    setIsAddingType(true);
    try {
      await addType({ name: newTypeName.trim(), color: newTypeColor });
      setNewTypeName("");
      setNewTypeColor("#6366F1");
      setShowAddType(false);
    } catch {
      addToast({ type: "error", title: "Failed to add type", duration: 3000 });
    } finally {
      setIsAddingType(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    setDeletingTypeId(id);
    try {
      await deleteType(id);
    } catch {
      addToast({ type: "error", title: "Failed to delete type", duration: 3000 });
    } finally {
      setDeletingTypeId(null);
    }
  };

  const toggleSection = (key: string) => {
    setEnabledSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <SectionHeader icon={Moon} title="Appearance" description="Customize how the app looks" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm">Theme</Label>
            <div className="flex gap-2">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard sections */}
      <Card>
        <CardHeader>
          <SectionHeader icon={Grid3X3} title="Dashboard Sections" description="Choose which sections appear on your dashboard" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTION_OPTIONS.map((section) => {
              const isEnabled = enabledSections.includes(section.key);
              return (
                <button
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    isEnabled ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                    isEnabled ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isEnabled && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Productivity tools */}
      <Card>
        <CardHeader>
          <SectionHeader icon={Wrench} title="Productivity Tools" description="Enable or disable productivity features" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <ToggleRow label="Tools Tab" description="Show the Tools tab in navigation" checked={toolsEnabled} onChange={setToolsEnabled} />
            <ToggleRow label="Pomodoro Timer" description="Focus timer with short and long breaks" checked={pomodoroEnabled} onChange={setPomodoroEnabled} />
            <ToggleRow label="Eisenhower Matrix" description="Priority matrix for task management" checked={eisenhowerEnabled} onChange={setEisenhowerEnabled} />
            <ToggleRow label="Decision Log" description="Track important decisions" checked={decisionLogEnabled} onChange={setDecisionLogEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro settings */}
      {pomodoroEnabled && (
        <Card>
          <CardHeader>
            <SectionHeader icon={Timer} title="Pomodoro Timer" description="Customize your focus and break durations" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Focus (min)", value: focusDuration, onChange: setFocusDuration, min: 1, max: 120 },
                { label: "Short break", value: shortBreak, onChange: setShortBreak, min: 1, max: 30 },
                { label: "Long break", value: longBreak, onChange: setLongBreak, min: 1, max: 60 },
              ].map(({ label, value, onChange, min, max }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-sm">{label}</Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                  />
                </div>
              ))}
            </div>
            <div className="divide-y divide-border border rounded-lg overflow-hidden">
              <ToggleRow label="Sound notifications" description="Play sound when timer ends" checked={pomodoroSoundEnabled} onChange={setPomodoroSoundEnabled} />
              {CALENDAR_UI_ENABLED && (
                <ToggleRow label="Block calendar during focus" description="Mark focus time on your calendar" checked={focusBlocksCalendar} onChange={setFocusBlocksCalendar} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time block types */}
      <Card>
        <CardHeader>
          <SectionHeader icon={Calendar} title="Time Block Types" description="Manage custom categories for time blocks" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isTypesLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              {timeBlockTypes.length > 0 && (
                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                  {timeBlockTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                        <span className="text-sm font-medium">{type.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteType(type.id)}
                        disabled={deletingTypeId === type.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        {deletingTypeId === type.id ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {showAddType ? (
                <div className="rounded-lg border border-dashed p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setNewTypeColor(color.hex)}
                        title={color.name}
                        className={cn(
                          "h-5 w-5 rounded-full transition-transform",
                          newTypeColor === color.hex && "scale-125 ring-2 ring-offset-1"
                        )}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Type name..."
                      className="flex-1 h-9"
                      onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddType} disabled={isAddingType || !newTypeName.trim()} className="h-9">
                      {isAddingType ? <Spinner size="sm" /> : "Add"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddType(false)} className="h-9">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddType(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add new type
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Behaviour */}
      <Card>
        <CardHeader>
          <SectionHeader icon={Zap} title="Behaviour" description="Automation and daily workflow settings" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <ToggleRow label="Auto carry forward" description="Move incomplete items to the next day" checked={autoCarry} onChange={setAutoCarry} />
            <ToggleRow label="Auto create next day" description="Automatically create the next day entry" checked={autoCreate} onChange={setAutoCreate} />
            <ToggleRow label="End-of-day review" description="Show review prompts at the end of each day" checked={reviewEnabled} onChange={setReviewEnabled} />
            <div className="px-6 py-4 space-y-2">
              <Label className="text-sm font-medium">Default time block duration</Label>
              <p className="text-xs text-muted-foreground">Duration in minutes for new time blocks</p>
              <Input
                type="number"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                min={15}
                max={480}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences} disabled={isSaving}>
          {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
