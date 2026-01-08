"use client";

import { useState } from "react";
import {
  CalendarConnection,
  CalendarSource,
  calendarApi,
  SyncDirection,
  PrivacyMode,
} from "@/lib/daymark-api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Pause,
  Play,
} from "lucide-react";

interface ConnectionCardProps {
  connection: CalendarConnection;
  onRefresh: () => void;
}

const PROVIDER_INFO = {
  GOOGLE: {
    name: "Google Calendar",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: "bg-white",
  },
  MICROSOFT: {
    name: "Microsoft Outlook",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M13 1h10v10H13z"/>
        <path fill="#7FBA00" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
    ),
    color: "bg-white",
  },
  APPLE: {
    name: "Apple iCloud",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#555" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    color: "bg-gray-100",
  },
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DISCONNECTED: { label: "Disconnected", color: "text-gray-500", icon: <AlertCircle className="w-4 h-4" /> },
  CONNECTING: { label: "Connecting...", color: "text-blue-500", icon: <Spinner size="sm" /> },
  INITIAL_SYNC: { label: "Initial sync...", color: "text-blue-500", icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  ACTIVE: { label: "Connected", color: "text-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  SYNCING: { label: "Syncing...", color: "text-blue-500", icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  PAUSED: { label: "Paused", color: "text-yellow-500", icon: <Pause className="w-4 h-4" /> },
  ERROR: { label: "Error", color: "text-red-500", icon: <AlertCircle className="w-4 h-4" /> },
  TOKEN_EXPIRED: { label: "Reconnect required", color: "text-orange-500", icon: <AlertCircle className="w-4 h-4" /> },
};

export function ConnectionCard({ connection, onRefresh }: ConnectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);

  const provider = PROVIDER_INFO[connection.provider];
  const status = STATUS_INFO[connection.status] || STATUS_INFO.DISCONNECTED;

  const loadSources = async () => {
    if (sources.length > 0) return;
    setIsLoadingSources(true);
    try {
      const data = await calendarApi.getSources(connection.id);
      setSources(data);
    } catch (error) {
      console.error("Failed to load sources:", error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const handleExpand = () => {
    if (!isExpanded) {
      loadSources();
    }
    setIsExpanded(!isExpanded);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await calendarApi.triggerSync(connection.id);
      onRefresh();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to disconnect this calendar?")) return;
    setIsDeleting(true);
    try {
      await calendarApi.deleteConnection(connection.id);
      onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEnabled = async () => {
    setIsTogglingEnabled(true);
    try {
      await calendarApi.updateConnection(connection.id, { enabled: !connection.enabled });
      onRefresh();
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  const handleSourceToggle = async (source: CalendarSource) => {
    try {
      await calendarApi.updateSource(source.id, { syncEnabled: !source.syncEnabled });
      setSources(sources.map(s =>
        s.id === source.id ? { ...s, syncEnabled: !s.syncEnabled } : s
      ));
    } catch (error) {
      console.error("Source toggle failed:", error);
    }
  };

  const handleSourceSettingChange = async (
    source: CalendarSource,
    field: "syncDirection" | "privacyMode",
    value: SyncDirection | PrivacyMode
  ) => {
    try {
      await calendarApi.updateSource(source.id, { [field]: value });
      setSources(sources.map(s =>
        s.id === source.id ? { ...s, [field]: value } : s
      ));
    } catch (error) {
      console.error("Source update failed:", error);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${provider.color} rounded-xl flex items-center justify-center shadow-sm`}>
              {provider.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{provider.name}</h3>
              {connection.providerEmail && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connection.providerEmail}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <div className={`flex items-center gap-1 ${status.color}`}>
                  {status.icon}
                  <span className="text-xs">{status.label}</span>
                </div>
                {connection.sources && connection.sources.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {connection.sources.filter(s => s.syncEnabled).length}/{connection.sources.length} calendars synced
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleEnabled}
              disabled={isTogglingEnabled}
              className="h-9 px-3"
            >
              {isTogglingEnabled ? (
                <Spinner size="sm" />
              ) : connection.enabled ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || !connection.enabled}
              className="h-9 px-3"
            >
              {isSyncing ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpand}
              className="h-9 px-3"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {connection.lastSyncAt && (
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
          </div>
        )}

        {connection.errorMessage && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
            {connection.errorMessage}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Calendars</h4>

          {isLoadingSources ? (
            <div className="flex justify-center py-4">
              <Spinner size="md" />
            </div>
          ) : sources.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No calendars found</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={source.syncEnabled}
                      onChange={() => handleSourceToggle(source)}
                      className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.color || "#6B7280" }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {source.name}
                        {source.isPrimary && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {source.eventCount} events
                      </p>
                    </div>
                  </div>

                  {source.syncEnabled && (
                    <div className="flex items-center gap-3">
                      <select
                        value={source.syncDirection}
                        onChange={(e) => handleSourceSettingChange(source, "syncDirection", e.target.value as SyncDirection)}
                        className="text-xs bg-gray-100 dark:bg-gray-600 border-0 rounded-lg px-2 py-1"
                      >
                        <option value="BIDIRECTIONAL">Two-way</option>
                        <option value="READ_ONLY">Read only</option>
                        <option value="WRITE_ONLY">Write only</option>
                      </select>
                      <select
                        value={source.privacyMode}
                        onChange={(e) => handleSourceSettingChange(source, "privacyMode", e.target.value as PrivacyMode)}
                        className="text-xs bg-gray-100 dark:bg-gray-600 border-0 rounded-lg px-2 py-1"
                      >
                        <option value="FULL">Full details</option>
                        <option value="TITLE_ONLY">Title only</option>
                        <option value="BUSY_ONLY">Busy only</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
