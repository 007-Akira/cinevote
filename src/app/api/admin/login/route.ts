import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminCookieValue,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-auth";

type LoginBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (!verifyAdminPassword(body.password)) {
      return Response.json({ error: "Invalid password." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_COOKIE_NAME,
      createAdminCookieValue(),
      getAdminCookieOptions(),
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin login failed:", error);

    return Response.json(
      { error: "Admin login is not configured." },
      { status: 500 },
    );
  }
}
