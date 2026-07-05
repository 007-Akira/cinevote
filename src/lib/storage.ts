import type { UserProfile, Vote } from "@/types";

export const CINEVOTE_DEVICE_ID_KEY = "CINEVOTE_DEVICE_ID";
export const CINEVOTE_PROFILE_KEY = "CINEVOTE_PROFILE";
export const CINEVOTE_VOTE_KEY = "CINEVOTE_VOTE";
const CINEVOTE_STORAGE_VERSION_KEY = "CINEVOTE_STORAGE_VERSION";
const CINEVOTE_STORAGE_VERSION = "departments-v2";

export function getStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!hasCurrentStorageVersion()) {
    clearVotingStorage();
    return null;
  }

  let rawProfile: string | null;

  try {
    rawProfile = window.localStorage.getItem(CINEVOTE_PROFILE_KEY);
  } catch {
    return null;
  }

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
  try {
    window.localStorage.setItem(
      CINEVOTE_STORAGE_VERSION_KEY,
      CINEVOTE_STORAGE_VERSION,
    );
    window.localStorage.setItem(CINEVOTE_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Local storage can be blocked on some mobile/private browser settings.
  }
}

export function getStoredDeviceId() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!hasCurrentStorageVersion()) {
    clearVotingStorage();
    return null;
  }

  try {
    return window.localStorage.getItem(CINEVOTE_DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveDeviceId(deviceId: string) {
  try {
    window.localStorage.setItem(CINEVOTE_DEVICE_ID_KEY, deviceId);
  } catch {
    // The server also assigns a trusted device cookie for API requests.
  }
}

export function getStoredVote(): Vote | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!hasCurrentStorageVersion()) {
    clearVotingStorage();
    return null;
  }

  let rawVote: string | null;

  try {
    rawVote = window.localStorage.getItem(CINEVOTE_VOTE_KEY);
  } catch {
    return null;
  }

  if (!rawVote) {
    return null;
  }

  try {
    return JSON.parse(rawVote) as Vote;
  } catch {
    window.localStorage.removeItem(CINEVOTE_VOTE_KEY);
    return null;
  }
}

export function saveVote(vote: Vote) {
  try {
    window.localStorage.setItem(
      CINEVOTE_STORAGE_VERSION_KEY,
      CINEVOTE_STORAGE_VERSION,
    );
    window.localStorage.setItem(CINEVOTE_VOTE_KEY, JSON.stringify(vote));
  } catch {
    // If local storage is unavailable, the API still prevents duplicate votes.
  }
}

function hasCurrentStorageVersion() {
  try {
    return (
      window.localStorage.getItem(CINEVOTE_STORAGE_VERSION_KEY) ===
      CINEVOTE_STORAGE_VERSION
    );
  } catch {
    return false;
  }
}

function clearVotingStorage() {
  try {
    window.localStorage.removeItem(CINEVOTE_PROFILE_KEY);
    window.localStorage.removeItem(CINEVOTE_VOTE_KEY);
    window.localStorage.removeItem(CINEVOTE_DEVICE_ID_KEY);
    window.localStorage.setItem(
      CINEVOTE_STORAGE_VERSION_KEY,
      CINEVOTE_STORAGE_VERSION,
    );
  } catch {
    // Storage is optional; failing closed simply shows onboarding again.
  }
}
