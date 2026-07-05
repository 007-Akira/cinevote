import { requireAdmin } from "@/lib/admin-auth";
import { formatSupabaseError } from "@/lib/supabase/movies";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type PollSettingsRow = {
  id: string;
  is_open: boolean;
  event_status: string;
  poll_starts_at: string | null;
  poll_closes_at: string | null;
  event_date: string | null;
  venue: string | null;
  updated_at: string;
};

type PatchBody = {
  is_open?: unknown;
  event_status?: unknown;
  poll_starts_at?: unknown;
  poll_closes_at?: unknown;
  event_date?: unknown;
  venue?: unknown;
};

const pollSelect =
  "id,is_open,event_status,poll_starts_at,poll_closes_at,event_date,venue,updated_at";

export async function GET() {
  const authError = await getAuthErrorResponse();

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseOrResponse();

  if (supabase instanceof Response) {
    return supabase;
  }

  const firstLookup = await supabase
    .from("poll_settings")
    .select(pollSelect)
    .eq("id", "main")
    .maybeSingle<PollSettingsRow>();
  const lookup = isMissingPollStartsAt(firstLookup.error)
    ? await supabase
        .from("poll_settings")
        .select("id,is_open,event_status,poll_closes_at,event_date,updated_at")
        .eq("id", "main")
        .maybeSingle<Omit<PollSettingsRow, "poll_starts_at" | "venue">>()
    : isMissingVenue(firstLookup.error)
      ? await supabase
          .from("poll_settings")
          .select(
            "id,is_open,event_status,poll_starts_at,poll_closes_at,event_date,updated_at",
          )
          .eq("id", "main")
          .maybeSingle<Omit<PollSettingsRow, "venue">>()
      : firstLookup;
  const data = lookup.data
    ? {
        ...lookup.data,
        poll_starts_at:
          "poll_starts_at" in lookup.data
            ? (lookup.data.poll_starts_at as string | null)
            : null,
        venue: "venue" in lookup.data ? (lookup.data.venue as string | null) : null,
      }
    : null;
  const error = lookup.error;

  if (error) {
    console.error("Admin poll settings lookup failed:", error);

    return Response.json(
      {
        error: "Could not load poll settings.",
        supabase: formatSupabaseError(error),
      },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json(
      { error: 'Poll settings row "main" is missing.' },
      { status: 500 },
    );
  }

  return Response.json({ pollSettings: mapPollSettings(data) });
}

export async function PATCH(request: Request) {
  const authError = await getAuthErrorResponse();

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseOrResponse();

  if (supabase instanceof Response) {
    return supabase;
  }

  let body: PatchBody;

  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const update: Record<string, string | boolean | null> = {
    updated_at: new Date().toISOString(),
  };
  const validationError = applyPatchBody(body, update);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  if (Object.keys(update).length === 1) {
    return Response.json(
      { error: "At least one poll setting must be provided." },
      { status: 400 },
    );
  }

  const { data: currentSettings, error: currentSettingsError } = await supabase
    .from("poll_settings")
    .select(pollSelect)
    .eq("id", "main")
    .maybeSingle<PollSettingsRow>();

  if (currentSettingsError) {
    console.error(
      "Admin poll settings validation lookup failed:",
      currentSettingsError,
    );

    return Response.json(
      {
        error: "Could not validate poll settings.",
        supabase: formatSupabaseError(currentSettingsError),
      },
      { status: 500 },
    );
  }

  if (!currentSettings) {
    return Response.json(
      { error: 'Poll settings row "main" is missing.' },
      { status: 500 },
    );
  }

  const nextStartsAt =
    "poll_starts_at" in update
      ? (update.poll_starts_at as string | null)
      : currentSettings.poll_starts_at;
  const nextClosesAt =
    "poll_closes_at" in update
      ? (update.poll_closes_at as string | null)
      : currentSettings.poll_closes_at;
  const scheduleError = validateScheduleOrder(nextStartsAt, nextClosesAt);

  if (scheduleError) {
    return Response.json({ error: scheduleError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("poll_settings")
    .update(update)
    .eq("id", "main")
    .select(pollSelect)
    .maybeSingle<PollSettingsRow>();

  if (error) {
    console.error("Admin poll settings update failed:", error);

    return Response.json(
      {
        error: "Could not update poll settings.",
        supabase: formatSupabaseError(error),
      },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json(
      { error: 'Poll settings row "main" is missing.' },
      { status: 500 },
    );
  }

  return Response.json({ pollSettings: mapPollSettings(data) });
}

async function getAuthErrorResponse() {
  try {
    if (await requireAdmin()) {
      return null;
    }

    return Response.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    console.error("Admin auth check failed:", error);

    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }
}

function getSupabaseOrResponse() {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client error:", error);

    return Response.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }
}

function applyPatchBody(
  body: PatchBody,
  update: Record<string, string | boolean | null>,
) {
  if ("is_open" in body) {
    if (typeof body.is_open !== "boolean") {
      return "is_open must be a boolean.";
    }

    update.is_open = body.is_open;
  }

  if ("event_status" in body) {
    if (typeof body.event_status !== "string" || !body.event_status.trim()) {
      return "event_status must be a non-empty string.";
    }

    update.event_status = body.event_status.trim();
  }

  if ("poll_starts_at" in body) {
    if (!isNullableDateString(body.poll_starts_at)) {
      return "poll_starts_at must be an ISO date string or null.";
    }

    update.poll_starts_at = body.poll_starts_at;
  }

  if ("poll_closes_at" in body) {
    if (!isNullableDateString(body.poll_closes_at)) {
      return "poll_closes_at must be an ISO date string or null.";
    }

    update.poll_closes_at = body.poll_closes_at;
  }

  if ("event_date" in body) {
    if (!isNullableDateString(body.event_date)) {
      return "event_date must be an ISO date string or null.";
    }

    update.event_date = body.event_date;
  }

  if ("venue" in body) {
    if (body.venue !== null && typeof body.venue !== "string") {
      return "venue must be a string or null.";
    }

    update.venue =
      typeof body.venue === "string" && body.venue.trim()
        ? body.venue.trim()
        : null;
  }

  return null;
}

function isNullableDateString(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value)))
  );
}

function isMissingPollStartsAt(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42703" ||
    Boolean(error?.message?.includes("poll_starts_at"))
  );
}

function isMissingVenue(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || Boolean(error?.message?.includes("venue"));
}

function validateScheduleOrder(startsAt: string | null, closesAt: string | null) {
  if (!startsAt || !closesAt) {
    return null;
  }

  if (new Date(closesAt).getTime() <= new Date(startsAt).getTime()) {
    return "Poll closes at must be after poll starts at.";
  }

  return null;
}

function mapPollSettings(row: PollSettingsRow) {
  return {
    id: row.id,
    isOpen: row.is_open,
    eventStatus: row.event_status,
    pollStartsAt: row.poll_starts_at,
    pollClosesAt: row.poll_closes_at,
    eventDate: row.event_date,
    venue: row.venue,
    updatedAt: row.updated_at,
  };
}
