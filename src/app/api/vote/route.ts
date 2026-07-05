import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEVICE_COOKIE_NAME,
  getDeviceCookieOptions,
  getOrCreateTrustedDeviceId,
} from "@/lib/device-cookie";
import { hashRequestSignal } from "@/lib/hash";
import {
  getActiveMovieById,
  mapMovieRow,
  movieSelect,
} from "@/lib/supabase/movies";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const departments = [
  "CSE",
  "ECE",
  "CSE(AI)",
  "ER",
  "CIVIL",
  "MECH",
  "EEE",
  "CHEM",
] as const;

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

const voteRequestSchema = z
  .object({
    deviceId: z.string().trim().optional(),
    movieId: z.string().trim().min(1, "movieId is required."),
    profile: z
      .object({
        name: z.string().trim().min(2).max(80),
        year: z.enum(years),
        department: z.enum(departments),
      })
      .strict(),
  })
  .strict();

type VoteRequestBody = z.infer<typeof voteRequestSchema>;

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type AttemptStatus =
  | "success"
  | "invalid_payload"
  | "invalid_movie"
  | "duplicate_vote"
  | "poll_closed"
  | "poll_not_started"
  | "schedule_missing"
  | "rate_limited"
  | "server_error";

type AttemptContext = {
  ipHash: string;
  userAgentHash: string | null;
  deviceId: string;
  movieId?: string | null;
};

export async function POST(request: NextRequest) {
  let trustedDevice: ReturnType<typeof getOrCreateTrustedDeviceId>;

  try {
    trustedDevice = getOrCreateTrustedDeviceId(request);
  } catch (error) {
    console.error("Device cookie setup failed:", error);
    return Response.json({ error: "Could not verify device." }, { status: 500 });
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown-ip";
  const userAgent = request.headers.get("user-agent");
  const attemptContext: AttemptContext = {
    ipHash: hashRequestSignal(ipAddress) ?? hashRequestSignal("unknown-ip")!,
    userAgentHash: hashRequestSignal(userAgent),
    deviceId: trustedDevice.deviceId,
  };

  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client error:", error);

    return jsonWithDeviceCookie(
      request,
      { error: "Voting is not configured." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  if (!isAllowedOrigin(request)) {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "invalid_payload",
      reason: "origin_blocked",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Request origin is not allowed." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  const rateLimit = await getRateLimitStatus(supabase, attemptContext);

  if (rateLimit.isLimited) {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "rate_limited",
      reason: rateLimit.reason,
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
      trustedDevice.cookieValue,
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "invalid_payload",
      reason: "invalid_json",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Invalid JSON body." },
      { status: 400 },
      trustedDevice.cookieValue,
    );
  }

  const parsedBody = voteRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "invalid_payload",
      reason: "validation_failed",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Invalid vote request." },
      { status: 400 },
      trustedDevice.cookieValue,
    );
  }

  const body = parsedBody.data;
  attemptContext.movieId = body.movieId;

  const pollSettings = await getPollSettings(supabase);

  if (pollSettings.error || !pollSettings.data) {
    console.error("Poll settings lookup failed:", pollSettings.error);
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "server_error",
      reason: "poll_settings_lookup_failed",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Voting is not configured." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const pollGate = getPollGateError({
    isOpen: pollSettings.data.is_open,
    pollStartsAt: pollSettings.data.poll_starts_at,
    pollClosesAt: pollSettings.data.poll_closes_at,
    now: new Date(),
  });

  if (pollGate) {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: pollGate.status,
      reason: pollGate.reason,
    });

    return jsonWithDeviceCookie(
      request,
      { error: pollGate.message },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  const { movie, error: movieError, seedError } = await getActiveMovieById(
    supabase,
    body.movieId,
  );

  if (seedError) {
    console.error("Movie catalog seed failed during vote:", {
      movieId: body.movieId,
      seedError,
    });
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "server_error",
      reason: "movie_catalog_seed_failed",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Could not prepare voting." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  if (movieError || !movie) {
    console.error("Movie lookup failed:", {
      movieId: body.movieId,
      movieError,
    });
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "invalid_movie",
      reason: "inactive_or_missing_movie",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Invalid movie selection." },
      { status: 400 },
      trustedDevice.cookieValue,
    );
  }

  const existingVote = await getExistingVote(supabase, trustedDevice.deviceId);

  if (existingVote) {
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "duplicate_vote",
      reason: "device_already_voted",
    });

    return jsonWithDeviceCookie(
      request,
      {
        error: "Already voted.",
        vote: existingVote.vote,
        movie: existingVote.movie,
      },
      { status: 409 },
      trustedDevice.cookieValue,
    );
  }

  const suspiciousReason = await getSuspiciousProfileReason(supabase, body);
  const { data: voter, error: voterError } = await upsertVoterProfile({
    supabase,
    deviceId: trustedDevice.deviceId,
    profile: body.profile,
    ipHash: attemptContext.ipHash,
    userAgentHash: attemptContext.userAgentHash,
  });

  if (voterError || !voter) {
    console.error("Voter upsert failed:", {
      deviceId: trustedDevice.deviceId,
      voterError,
    });
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "server_error",
      reason: "voter_upsert_failed",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Could not save voter profile." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const votedAt = new Date().toISOString();
  const { vote, error: voteError } = await insertVote({
    supabase,
    movieId: body.movieId,
    voterId: voter.id,
    deviceId: trustedDevice.deviceId,
    ipHash: attemptContext.ipHash,
    userAgentHash: attemptContext.userAgentHash,
    votedAt,
  });

  if (isUniqueViolation(voteError)) {
    console.error("Duplicate vote insert blocked:", {
      deviceId: trustedDevice.deviceId,
      movieId: body.movieId,
    });

    const duplicateVote = await getExistingVote(supabase, trustedDevice.deviceId);
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "duplicate_vote",
      reason: "unique_constraint",
    });

    return jsonWithDeviceCookie(
      request,
      {
        error: "Already voted.",
        vote: duplicateVote?.vote ?? null,
        movie: duplicateVote?.movie ?? null,
      },
      { status: 409 },
      trustedDevice.cookieValue,
    );
  }

  if (voteError || !vote) {
    console.error("Vote insert failed:", {
      deviceId: trustedDevice.deviceId,
      movieId: body.movieId,
      voterId: voter.id,
      voteError,
    });
    await logVoteAttempt(supabase, {
      ...attemptContext,
      status: "server_error",
      reason: "vote_insert_failed",
    });

    return jsonWithDeviceCookie(
      request,
      { error: "Could not record vote." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  await logVoteAttempt(supabase, {
    ...attemptContext,
    status: "success",
    reason: suspiciousReason,
  });

  return jsonWithDeviceCookie(
    request,
    {
      success: true,
      vote: {
        movieId: vote.movie_id,
        deviceId: vote.device_id,
        votedAt: vote.voted_at,
      },
      movie: mapMovieRow(movie),
    },
    { status: 200 },
    trustedDevice.cookieValue,
  );
}

async function getPollSettings(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const firstLookup = await supabase
    .from("poll_settings")
    .select("id,is_open,event_status,poll_starts_at,poll_closes_at")
    .eq("id", "main")
    .single();

  if (!isMissingPollStartsAt(firstLookup.error)) {
    return firstLookup;
  }

  const fallbackLookup = await supabase
    .from("poll_settings")
    .select("id,is_open,event_status,poll_closes_at")
    .eq("id", "main")
    .single();

  return {
    ...fallbackLookup,
    data: fallbackLookup.data
      ? {
          ...fallbackLookup.data,
          poll_starts_at: null,
        }
      : null,
  };
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set([request.nextUrl.origin]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    allowedOrigins.add(new URL(siteUrl).origin);
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const originUrl = new URL(origin);
      const requestHostname = request.headers.get("host")?.split(":")[0];

      if (
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1" ||
        originUrl.hostname === request.nextUrl.hostname ||
        originUrl.hostname === requestHostname ||
        isPrivateIpv4(originUrl.hostname)
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return allowedOrigins.has(origin);
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

async function getRateLimitStatus(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  context: AttemptContext,
) {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const ipAttempts = await supabase
    .from("vote_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", context.ipHash)
    .gte("created_at", since);

  if (ipAttempts.error) {
    console.error("IP rate limit lookup failed:", ipAttempts.error);
    return { isLimited: false, reason: null };
  }

  if ((ipAttempts.count ?? 0) >= 20) {
    return { isLimited: true, reason: "ip_attempt_limit" };
  }

  const deviceAttempts = await supabase
    .from("vote_attempts")
    .select("id", { count: "exact", head: true })
    .eq("device_id", context.deviceId)
    .gte("created_at", since);

  if (deviceAttempts.error) {
    console.error("Device rate limit lookup failed:", deviceAttempts.error);
    return { isLimited: false, reason: null };
  }

  if ((deviceAttempts.count ?? 0) >= 5) {
    return { isLimited: true, reason: "device_attempt_limit" };
  }

  return { isLimited: false, reason: null };
}

async function logVoteAttempt(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  {
    ipHash,
    userAgentHash,
    deviceId,
    movieId = null,
    status,
    reason = null,
  }: AttemptContext & {
    status: AttemptStatus;
    reason?: string | null;
  },
) {
  const { error } = await supabase.from("vote_attempts").insert({
    ip_hash: ipHash,
    user_agent_hash: userAgentHash,
    device_id: deviceId,
    movie_id: movieId,
    status,
    reason,
  });

  if (error) {
    console.error("Vote attempt logging failed:", error);
  }
}

async function getSuspiciousProfileReason(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  body: VoteRequestBody,
) {
  const { count, error } = await supabase
    .from("voters")
    .select("id", { count: "exact", head: true })
    .eq("name", body.profile.name)
    .eq("year_of_study", body.profile.year)
    .eq("department", body.profile.department);

  if (error) {
    console.error("Suspicious profile lookup failed:", error);
    return null;
  }

  return (count ?? 0) > 0 ? "suspicious_duplicate_profile" : null;
}

async function upsertVoterProfile({
  supabase,
  deviceId,
  profile,
  ipHash,
  userAgentHash,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  deviceId: string;
  profile: VoteRequestBody["profile"];
  ipHash: string;
  userAgentHash: string | null;
}) {
  const firstAttempt = await supabase
    .from("voters")
    .upsert(
      {
        device_id: deviceId,
        name: profile.name,
        year_of_study: profile.year,
        department: profile.department,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
      },
      { onConflict: "device_id" },
    )
    .select("id")
    .single<{ id: string }>();

  if (!isMissingSchemaColumn(firstAttempt.error)) {
    return firstAttempt;
  }

  console.error("Voter hash columns are unavailable, retrying core upsert:", {
    error: firstAttempt.error,
  });

  return supabase
    .from("voters")
    .upsert(
      {
        device_id: deviceId,
        name: profile.name,
        year_of_study: profile.year,
        department: profile.department,
      },
      { onConflict: "device_id" },
    )
    .select("id")
    .single<{ id: string }>();
}

async function getExistingVote(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  deviceId: string,
) {
  const { data, error } = await supabase
    .from("votes")
    .select(`movie_id,device_id,voted_at,movies(${movieSelect})`)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    console.error("Existing vote lookup failed:", {
      deviceId,
      error,
    });
  }

  if (!data) {
    return null;
  }

  const movie = Array.isArray(data.movies) ? data.movies[0] : data.movies;

  return {
    vote: {
      movieId: data.movie_id,
      deviceId: data.device_id,
      votedAt: data.voted_at,
    },
    movie: movie ? mapMovieRow(movie) : null,
  };
}

function isUniqueViolation(error: SupabaseError | null) {
  return error?.code === "23505";
}

async function insertVote({
  supabase,
  movieId,
  voterId,
  deviceId,
  ipHash,
  userAgentHash,
  votedAt,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  movieId: string;
  voterId: string;
  deviceId: string;
  ipHash: string;
  userAgentHash: string | null;
  votedAt: string;
}) {
  const insertPayload = {
    movie_id: movieId,
    voter_id: voterId,
    device_id: deviceId,
    ip_hash: ipHash,
    user_agent_hash: userAgentHash,
    voted_at: votedAt,
  };
  const firstAttempt = await supabase
    .from("votes")
    .insert(insertPayload)
    .select("movie_id,device_id,voted_at")
    .single();

  if (!isMissingSchemaColumn(firstAttempt.error)) {
    return {
      vote: firstAttempt.data,
      error: firstAttempt.error,
    };
  }

  console.error("Vote hash columns are unavailable, retrying core insert:", {
    error: firstAttempt.error,
  });

  const retryAttempt = await supabase
    .from("votes")
    .insert({
      movie_id: movieId,
      voter_id: voterId,
      device_id: deviceId,
      voted_at: votedAt,
    })
    .select("movie_id,device_id,voted_at")
    .single();

  return {
    vote: retryAttempt.data,
    error: retryAttempt.error,
  };
}

function getPollGateError({
  isOpen,
  pollStartsAt,
  pollClosesAt,
  now,
}: {
  isOpen: boolean;
  pollStartsAt: string | null;
  pollClosesAt: string | null;
  now: Date;
}) {
  if (!isOpen) {
    return {
      status: "poll_closed" as const,
      reason: "manual_close",
      message: "Poll is closed",
    };
  }

  if (!pollStartsAt && !pollClosesAt) {
    return null;
  }

  if (!pollStartsAt || !pollClosesAt) {
    return {
      status: "schedule_missing" as const,
      reason: "partial_schedule",
      message: "Poll schedule is not configured",
    };
  }

  const startsAt = new Date(pollStartsAt).getTime();
  const closesAt = new Date(pollClosesAt).getTime();
  const currentTime = now.getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(closesAt)) {
    return {
      status: "schedule_missing" as const,
      reason: "invalid_schedule",
      message: "Poll schedule is not configured",
    };
  }

  if (currentTime < startsAt) {
    return {
      status: "poll_not_started" as const,
      reason: "before_start",
      message: "Poll has not started yet",
    };
  }

  if (currentTime >= closesAt) {
    return {
      status: "poll_closed" as const,
      reason: "after_close",
      message: "Poll is closed",
    };
  }

  return null;
}

function jsonWithDeviceCookie(
  request: NextRequest,
  body: unknown,
  init: ResponseInit,
  deviceCookieValue: string | null,
) {
  const response = NextResponse.json(body, init);

  if (deviceCookieValue) {
    response.cookies.set(
      DEVICE_COOKIE_NAME,
      deviceCookieValue,
      getDeviceCookieOptions(),
    );
  }

  return response;
}

function isMissingSchemaColumn(error: SupabaseError | null) {
  return (
    error?.code === "PGRST204" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("column")
  );
}

function isMissingPollStartsAt(error: SupabaseError | null) {
  return (
    error?.code === "42703" ||
    Boolean(error?.message?.includes("poll_starts_at"))
  );
}
