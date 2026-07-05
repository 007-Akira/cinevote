import { createSupabaseAdminClient } from "@/lib/supabase/server";

type PollSettingsRow = {
  is_open: boolean;
  event_status: string;
  poll_starts_at: string | null;
  poll_closes_at: string | null;
  event_date: string | null;
};

export async function GET() {
  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Public poll status Supabase client error:", error);

    return Response.json(
      { error: "Poll status is not configured." },
      { status: 500 },
    );
  }

  const firstLookup = await supabase
    .from("poll_settings")
    .select("is_open,event_status,poll_starts_at,poll_closes_at,event_date")
    .eq("id", "main")
    .maybeSingle<PollSettingsRow>();
  const lookup = isMissingPollStartsAt(firstLookup.error)
    ? await supabase
        .from("poll_settings")
        .select("is_open,event_status,poll_closes_at,event_date")
        .eq("id", "main")
        .maybeSingle<Omit<PollSettingsRow, "poll_starts_at">>()
    : firstLookup;
  const data = lookup.data
    ? {
        ...lookup.data,
        poll_starts_at: "poll_starts_at" in lookup.data ? lookup.data.poll_starts_at : null,
      }
    : null;
  const error = lookup.error;

  if (error) {
    console.error("Public poll status lookup failed:", error);

    return Response.json(
      { error: "Could not load poll status." },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json(
      { error: 'Poll settings row "main" is missing.' },
      { status: 500 },
    );
  }

  return Response.json({
    isOpen: data.is_open,
    eventStatus: data.event_status,
    pollStartsAt: data.poll_starts_at,
    pollClosesAt: data.poll_closes_at,
    eventDate: data.event_date,
    serverNow: new Date().toISOString(),
  });
}

function isMissingPollStartsAt(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42703" ||
    Boolean(error?.message?.includes("poll_starts_at"))
  );
}
