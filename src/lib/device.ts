import { getStoredDeviceId, saveDeviceId } from "@/lib/storage";

export function ensureDeviceId() {
  const existingDeviceId = getStoredDeviceId();

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `cinevote-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  saveDeviceId(deviceId);
  return deviceId;
}
