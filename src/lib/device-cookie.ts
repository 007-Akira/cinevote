import "server-only";

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export const DEVICE_COOKIE_NAME = "cinevote_device";

const maxAgeSeconds = 60 * 24 * 60 * 60;

export type DeviceCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export function getOrCreateTrustedDeviceId(request: NextRequest) {
  const cookieValue = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
  const verifiedDeviceId = verifyDeviceCookie(cookieValue);

  if (verifiedDeviceId) {
    return {
      deviceId: verifiedDeviceId,
      cookieValue: null,
    };
  }

  const deviceId = crypto.randomUUID();

  return {
    deviceId,
    cookieValue: createDeviceCookieValue(deviceId),
  };
}

export function getDeviceCookieOptions(): DeviceCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

function createDeviceCookieValue(deviceId: string) {
  return `${deviceId}.${signDeviceId(deviceId)}`;
}

function verifyDeviceCookie(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  const separatorIndex = cookieValue.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const deviceId = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);
  const expectedSignature = signDeviceId(deviceId);
  const submitted = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (submitted.length !== expected.length) {
    return null;
  }

  return crypto.timingSafeEqual(submitted, expected) ? deviceId : null;
}

function signDeviceId(deviceId: string) {
  return crypto
    .createHmac("sha256", getDeviceCookieSecret())
    .update(deviceId)
    .digest("hex");
}

function getDeviceCookieSecret() {
  const secret = process.env.DEVICE_COOKIE_SECRET;

  if (secret) {
    return secret;
  }

  const fallbackSecret = process.env.ADMIN_COOKIE_SECRET;

  if (!fallbackSecret) {
    throw new Error(
      "Missing DEVICE_COOKIE_SECRET and ADMIN_COOKIE_SECRET for device cookies.",
    );
  }

  console.warn(
    "DEVICE_COOKIE_SECRET is missing. Falling back to ADMIN_COOKIE_SECRET for device cookies.",
  );

  return fallbackSecret;
}
