/**
 * Device detection utilities
 *
 * Shared logic for detecting device type from user agent strings.
 */

export type DeviceFilter = 'all' | 'mobile' | 'desktop' | 'other';

export interface DeviceInfo {
  type: string;
  icon: any;
}

/**
 * Get device category from user agent string
 */
export function getDeviceType(userAgent: string): DeviceFilter {
  const ua = userAgent?.toLowerCase() || '';
  if (ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
    return 'mobile';
  }
  if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
    return 'desktop';
  }
  if (ua.includes('android') || ua.includes('ipad') || ua.includes('tablet')) {
    return 'mobile';
  }
  return 'other';
}

/**
 * Get detailed device info from user agent string
 * Returns icon component and display type
 */
export function getDeviceInfo(userAgent: string, icons: {
  Smartphone: any;
  Monitor: any;
  Laptop: any;
  Globe: any;
}): DeviceInfo {
  const ua = userAgent?.toLowerCase() || '';

  if (ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
    return { icon: icons.Smartphone, type: 'Mobile' };
  }
  if (ua.includes('mac')) {
    return { icon: icons.Monitor, type: 'macOS' };
  }
  if (ua.includes('windows')) {
    return { icon: icons.Monitor, type: 'Windows' };
  }
  if (ua.includes('linux')) {
    return { icon: icons.Monitor, type: 'Linux' };
  }
  if (ua.includes('android')) {
    return { icon: icons.Smartphone, type: 'Android' };
  }
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return { icon: icons.Laptop, type: 'Tablet' };
  }
  return { icon: icons.Globe, type: 'Browser' };
}
