import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getWinningMovie } from "@/lib/winning-movie";

type PollStatus =
  | "not_started"
  | "active"
  | "closed"
  | "schedule_missing";

type PollSettingsRow = {
  is_open: boolean;
  event_status: string;
  poll_starts_at: string | null;
  poll_closes_at: string | null;
  event_date: string | null;
  venue: string | null;
};

export async function GET() {
  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Public screening info Supabase client error:", error);

    return Response.json(
      { error: "Screening info is not configured." },
      { status: 500 },
    );
  }

  const pollLookup = await getPollSettings(supabase);

  if (pollLookup.error) {
    console.error("Public screening info poll lookup failed:", pollLookup.error);

    return Response.json(
      { error: "Could not load screening info." },
      { status: 500 },
    );
  }

  const serverNow = new Date();
  const pollStatus = getPollStatus(pollLookup.data, serverNow);
  const basePayload = {
    pollStatus,
    isOpen: pollLookup.data?.is_open ?? false,
    pollStartsAt: pollLookup.data?.poll_starts_at ?? null,
    pollClosesAt: pollLookup.data?.poll_closes_at ?? null,
    eventDate: pollLookup.data?.event_date ?? null,
    venue: pollLookup.data?.venue ?? null,
  };

  if (pollStatus !== "closed") {
    return Response.json({
      ...basePayload,
      winningMovie: null,
    });
  }

  const winningMovieLookup = await getWinningMovie(supabase);

  if (winningMovieLookup.error) {
    console.error("Public screening info winner lookup failed:", winningMovieLookup.error);
    return Response.json(
      { error: winningMovieLookup.error.message },
      { status: 500 },
    );
  }

  return Response.json({
    ...basePayload,
    winningMovie: winningMovieLookup.winningMovie,
  });
}

async function getPollSettings(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const firstLookup = await supabase
    .from("poll_settings")
    .select(
      "is_open,event_status,poll_starts_at,poll_closes_at,event_date,venue",
    )
    .eq("id", "main")
    .maybeSingle<PollSettingsRow>();

  if (isMissingVenue(firstLookup.error)) {
    const fallbackLookup = await supabase
      .from("poll_settings")
      .select("is_open,event_status,poll_starts_at,poll_closes_at,event_date")
      .eq("id", "main")
      .maybeSingle<Omit<PollSettingsRow, "venue">>();

    return {
      data: fallbackLookup.data
        ? {
            ...fallbackLookup.data,
            venue: null,
          }
        : null,
      error: fallbackLookup.error,
    };
  }

  return firstLookup;
}

function getPollStatus(
  settings: PollSettingsRow | null,
  serverNow: Date,
): PollStatus {
  if (!settings || !settings.poll_starts_at || !settings.poll_closes_at) {
    return "schedule_missing";
  }

  const startsAt = new Date(settings.poll_starts_at).getTime();
  const closesAt = new Date(settings.poll_closes_at).getTime();
  const now = serverNow.getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(closesAt)) {
    return "schedule_missing";
  }

  if (!settings.is_open || now >= closesAt) {
    return "closed";
  }

  if (now < startsAt) {
    return "not_started";
  }

  return "active";
}

function isMissingVenue(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || Boolean(error?.message?.includes("venue"));
}
