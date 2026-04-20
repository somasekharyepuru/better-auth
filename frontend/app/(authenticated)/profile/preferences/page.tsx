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

  return (
    <>
      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Daymark looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground mb-3">Select your preferred theme</p>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                        theme === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Dashboard Sections
            </CardTitle>
            <CardDescription>Choose which sections appear on your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECTION_OPTIONS.map((section) => (
                <button
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    enabledSections.includes(section.key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                    enabledSections.includes(section.key)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}>
                    {enabledSections.includes(section.key) && (
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Productivity Tools
            </CardTitle>
            <CardDescription>Enable or disable productivity features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Tools Tab</Label>
                <p className="text-xs text-muted-foreground">Show Tools in navigation</p>
              </div>
              <Checkbox checked={toolsEnabled} onCheckedChange={(v) => setToolsEnabled(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Pomodoro Timer</Label>
                <p className="text-xs text-muted-foreground">Focus timer with breaks</p>
              </div>
              <Checkbox checked={pomodoroEnabled} onCheckedChange={(v) => setPomodoroEnabled(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Eisenhower Matrix</Label>
                <p className="text-xs text-muted-foreground">Priority matrix view</p>
              </div>
              <Checkbox checked={eisenhowerEnabled} onCheckedChange={(v) => setEisenhowerEnabled(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Decision Log</Label>
                <p className="text-xs text-muted-foreground">Track decisions</p>
              </div>
              <Checkbox checked={decisionLogEnabled} onCheckedChange={(v) => setDecisionLogEnabled(!!v)} />
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Settings */}
        {pomodoroEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Pomodoro Settings
              </CardTitle>
              <CardDescription>Customize your focus timer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Focus (min)</Label>
                  <Input
                    type="number"
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Number(e.target.value))}
                    min={1}
                    max={120}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Short Break</Label>
                  <Input
                    type="number"
                    value={shortBreak}
                    onChange={(e) => setShortBreak(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Long Break</Label>
                  <Input
                    type="number"
                    value={longBreak}
                    onChange={(e) => setLongBreak(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Sound Notifications</Label>
                  <p className="text-xs text-muted-foreground">Play sound when timer ends</p>
                </div>
                <Checkbox checked={pomodoroSoundEnabled} onCheckedChange={(v) => setPomodoroSoundEnabled(!!v)} />
              </div>
              {CALENDAR_UI_ENABLED && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Block Calendar During Focus</Label>
                    <p className="text-xs text-muted-foreground">Mark focus time on calendar</p>
                  </div>
                  <Checkbox checked={focusBlocksCalendar} onCheckedChange={(v) => setFocusBlocksCalendar(!!v)} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Time Block Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time Block Types
            </CardTitle>
            <CardDescription>Manage custom time block categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeBlockTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="font-medium text-sm">{type.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteType(type.id)}
                    disabled={deletingTypeId === type.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {showAddType ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed">
                  <div className="flex gap-1">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setNewTypeColor(color.hex)}
                        className={cn(
                          "w-5 h-5 rounded-full transition-transform",
                          newTypeColor === color.hex && "scale-125 ring-2 ring-offset-1"
                        )}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Type name..."
                    className="flex-1 h-8"
                    onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                  />
                  <Button size="sm" onClick={handleAddType} disabled={isAddingType}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddType(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddType(true)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-dashed w-full text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Type
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Behavior
            </CardTitle>
            <CardDescription>Automation and daily workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Carry Forward</Label>
                <p className="text-xs text-muted-foreground">Move incomplete items to next day</p>
              </div>
              <Checkbox checked={autoCarry} onCheckedChange={(v) => setAutoCarry(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Create Next Day</Label>
                <p className="text-xs text-muted-foreground">Create next day entry automatically</p>
              </div>
              <Checkbox checked={autoCreate} onCheckedChange={(v) => setAutoCreate(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">End-of-Day Review</Label>
                <p className="text-xs text-muted-foreground">Show review prompts at day end</p>
              </div>
              <Checkbox checked={reviewEnabled} onCheckedChange={(v) => setReviewEnabled(!!v)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Default Time Block Duration</Label>
              <p className="text-xs text-muted-foreground mb-2">Default duration in minutes</p>
              <Input
                type="number"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                min={15}
                max={480}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSavePreferences} disabled={isSaving}>
            {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
            Save Preferences
          </Button>
        </div>
      </div>
    </>
  );
}
