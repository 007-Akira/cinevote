import type { UserProfile } from "@/types";

export const CINEVOTE_DEVICE_ID_KEY = "CINEVOTE_DEVICE_ID";
export const CINEVOTE_PROFILE_KEY = "CINEVOTE_PROFILE";

export function getStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawProfile = window.localStorage.getItem(CINEVOTE_PROFILE_KEY);

  if (!rawProfile) {
    return null;
  }

  try {
    return JSON.parse(rawProfile) as UserProfile;
  } catch {
    window.localStorage.removeItem(CINEVOTE_PROFILE_KEY);
    return null;
  }
}

export function saveProfile(profile: UserProfile) {
  window.localStorage.setItem(CINEVOTE_PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredDeviceId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CINEVOTE_DEVICE_ID_KEY);
}

export function saveDeviceId(deviceId: string) {
  window.localStorage.setItem(CINEVOTE_DEVICE_ID_KEY, deviceId);
}
