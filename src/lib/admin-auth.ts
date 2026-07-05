import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "cinevote_admin";

const maxAgeSeconds = 60 * 60 * 12;

type AdminCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge?: number;
  expires?: Date;
};

export async function requireAdmin() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return verifyAdminCookie(cookieValue);
}

export function createAdminCookieValue() {
  const issuedAt = Date.now().toString();
  const signature = signAdminPayload(issuedAt);

  return `${issuedAt}.${signature}`;
}

export function getAdminCookieOptions(): AdminCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getExpiredAdminCookieOptions(): AdminCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };
}

export function verifyAdminPassword(password: unknown) {
  const adminPassword = requireAdminEnv("ADMIN_PASSWORD");

  if (typeof password !== "string") {
    return false;
  }

  const submitted = Buffer.from(password);
  const expected = Buffer.from(adminPassword);

  if (submitted.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(submitted, expected);
}

function verifyAdminCookie(cookieValue: string | undefined) {
  if (!cookieValue) {
    return false;
  }

  const [issuedAt, signature] = cookieValue.split(".");

  if (!issuedAt || !signature) {
    return false;
  }

  const issuedAtNumber = Number(issuedAt);

  if (
    !Number.isFinite(issuedAtNumber) ||
    Date.now() - issuedAtNumber > maxAgeSeconds * 1000
  ) {
    return false;
  }

  const expectedSignature = signAdminPayload(issuedAt);
  const submitted = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (submitted.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(submitted, expected);
}

function signAdminPayload(payload: string) {
  return crypto
    .createHmac("sha256", requireAdminEnv("ADMIN_COOKIE_SECRET"))
    .update(payload)
    .digest("hex");
}

function requireAdminEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}
