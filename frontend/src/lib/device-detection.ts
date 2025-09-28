export type DeviceType = "mobile" | "tablet" | "desktop";

export function parseDeviceTypeFromUA(ua: string): DeviceType {
  const userAgent = ua.toLowerCase();

  if (/ipad|android(?!.*mobile)|tablet/i.test(userAgent)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}