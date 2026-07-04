import { NextRequest } from "next/server";
import { hashRequestSignal } from "@/lib/hash";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const departments = new Set([
  "CSE",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "AI/DS",
  "MCA",
  "Other",
]);

const years = new Set(["1st Year", "2nd Year", "3rd Year", "4th Year"]);

type VoteRequestBody = {
  deviceId?: unknown;
  movieId?: unknown;
  profile?: {
    name?: unknown;
    year?: unknown;
    department?: unknown;
  };
};

type SupabaseError = {
  code?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  let body: VoteRequestBody;

  try {
    body = (await request.json()) as VoteRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validateVoteRequest(body);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const deviceId = body.deviceId as string;
  const movieId = body.movieId as string;
  const profile = body.profile as {
    name: string;
    year: string;
    department: string;
  };

  const supabase = createSupabaseAdminClient();

  const { data: pollSettings, error: pollSettingsError } = await supabase
    .from("poll_settings")
    .select("is_voting_open")
    .eq("id", "main")
    .single();

  if (pollSettingsError || !pollSettings) {
    return Response.json(
      { error: "Poll settings are not configured." },
      { status: 500 },
    );
  }

  if (!pollSettings.is_voting_open) {
    return Response.json({ error: "Poll is closed." }, { status: 403 });
  }

  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .select(
      "id,title,language,genre,runtime,rating,hook,summary,why_screen,poster_url,backdrop_url",
    )
    .eq("id", movieId)
    .eq("is_active", true)
    .single();

  if (movieError || !movie) {
    return Response.json({ error: "Selected movie was not found." }, { status: 400 });
  }

  const existingVote = await getExistingVote(deviceId);

  if (existingVote) {
    return Response.json(
      {
        error: "Already voted.",
        vote: existingVote.vote,
        movie: existingVote.movie,
      },
      { status: 409 },
    );
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const ipHash = hashRequestSignal(ipAddress);
  const userAgentHash = hashRequestSignal(userAgent);

  const { data: voter, error: voterError } = await supabase
    .from("voters")
    .upsert(
      {
        device_id: deviceId,
        name: profile.name.trim(),
        year_of_study: profile.year,
        department: profile.department,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
      },
      { onConflict: "device_id" },
    )
    .select("id")
    .single();

  if (voterError || !voter) {
    return Response.json(
      { error: "Could not save voter profile." },
      { status: 500 },
    );
  }

  const votedAt = new Date().toISOString();
  const { data: vote, error: voteError } = await supabase
    .from("votes")
    .insert({
      movie_id: movieId,
      voter_id: voter.id,
      device_id: deviceId,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      voted_at: votedAt,
    })
    .select("movie_id,device_id,voted_at")
    .single();

  if (isUniqueViolation(voteError)) {
    const duplicateVote = await getExistingVote(deviceId);

    return Response.json(
      {
        error: "Already voted.",
        vote: duplicateVote?.vote ?? null,
        movie: duplicateVote?.movie ?? null,
      },
      { status: 409 },
    );
  }

  if (voteError || !vote) {
    return Response.json({ error: "Could not record vote." }, { status: 500 });
  }

  return Response.json({
    success: true,
    vote: {
      movieId: vote.movie_id,
      deviceId: vote.device_id,
      votedAt: vote.voted_at,
    },
    movie: mapMovieRow(movie),
  });
}

function validateVoteRequest(body: VoteRequestBody) {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }

  if (typeof body.deviceId !== "string" || !body.deviceId.trim()) {
    return "deviceId is required.";
  }

  if (typeof body.movieId !== "string" || !body.movieId.trim()) {
    return "movieId is required.";
  }

  if (!body.profile || typeof body.profile !== "object") {
    return "profile is required.";
  }

  if (typeof body.profile.name !== "string" || !body.profile.name.trim()) {
    return "profile.name is required.";
  }

  if (typeof body.profile.year !== "string" || !years.has(body.profile.year)) {
    return "profile.year is invalid.";
  }

  if (
    typeof body.profile.department !== "string" ||
    !departments.has(body.profile.department)
  ) {
    return "profile.department is invalid.";
  }

  return null;
}

async function getExistingVote(deviceId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("votes")
    .select(
      "movie_id,device_id,voted_at,movies(id,title,language,genre,runtime,rating,hook,summary,why_screen,poster_url,backdrop_url)",
    )
    .eq("device_id", deviceId)
    .maybeSingle();

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

function mapMovieRow(row: {
  id: string;
  title: string;
  language: string;
  genre: string;
  runtime: string;
  rating: string;
  hook: string;
  summary: string;
  why_screen: string;
  poster_url: string;
  backdrop_url: string;
}) {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    genre: row.genre,
    runtime: row.runtime,
    rating: row.rating,
    hook: row.hook,
    summary: row.summary,
    whyScreen: row.why_screen,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
  };
}

function isUniqueViolation(error: SupabaseError | null) {
  return error?.code === "23505";
}
