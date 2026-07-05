import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  getExpiredAdminCookieOptions,
  requireAdmin,
} from "@/lib/admin-auth";

export async function POST() {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", getExpiredAdminCookieOptions());

  return Response.json({ success: true });
}
