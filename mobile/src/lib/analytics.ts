import AsyncStorage from "@react-native-async-storage/async-storage";
import { telemetryApi } from "./daymark-api";

const CLIENT_ID_KEY = "@daymark_ga_client_id";

async function getOrCreateClientId(): Promise<string> {
  let id = await AsyncStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `${Date.now()}.${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

/**
 * Sends a GA4-compatible event through the backend Measurement Protocol proxy
 * when GA4_MEASUREMENT_ID + GA4_API_SECRET are set on the server.
 */
export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, string>,
): Promise<void> {
  try {
    const clientId = await getOrCreateClientId();
    await telemetryApi.logGa4Event({ clientId, eventName, params });
  } catch {
    // Non-blocking telemetry
  }
}

export function logAnalyticsScreen(screenPath: string): void {
  void logAnalyticsEvent("screen_view", {
    screen_path: screenPath.slice(0, 100),
  });
}
