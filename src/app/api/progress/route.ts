import { NextRequest, NextResponse } from "next/server";
import type { ProgressSnapshot } from "@/modules/core";

export const runtime = "nodejs";

/**
 * Progress API — Azure-ready sync endpoint.
 *
 * In-memory store for demo / single-instance App Service.
 * Enhance module: swap for Azure Cosmos DB / Table Storage / PostgreSQL
 * without changing the client payload shape.
 *
 * COPPA: payload must not include child PII beyond nickname + avatar.
 */

const globalStore = globalThis as unknown as {
  __melodyProgress?: Map<string, ProgressSnapshot>;
};

function store(): Map<string, ProgressSnapshot> {
  if (!globalStore.__melodyProgress) {
    globalStore.__melodyProgress = new Map();
  }
  return globalStore.__melodyProgress;
}

function assertKidSafe(body: ProgressSnapshot): string | null {
  if (!body?.profile?.id || !body.profile.nickname) {
    return "Invalid profile";
  }
  if (body.profile.nickname.length > 40) {
    return "Nickname too long";
  }
  // Reject accidental PII-looking fields if someone extends the client carelessly
  const banned = ["email", "phone", "birthday", "fullName", "address"];
  const raw = JSON.stringify(body.profile);
  for (const key of banned) {
    if (raw.toLowerCase().includes(`"${key.toLowerCase()}"`)) {
      return `Disallowed field in profile: ${key}`;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("profileId");
  if (!id) {
    return NextResponse.json(
      { error: "profileId query required" },
      { status: 400 },
    );
  }
  const snap = store().get(id);
  if (!snap) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(snap);
}

export async function POST(req: NextRequest) {
  let body: ProgressSnapshot;
  try {
    body = (await req.json()) as ProgressSnapshot;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const err = assertKidSafe(body);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  store().set(body.profile.id, body);

  return NextResponse.json({
    ok: true,
    profileId: body.profile.id,
    storedAt: new Date().toISOString(),
    backend: process.env.PROGRESS_BACKEND ?? "memory",
  });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("profileId");
  if (!id) {
    return NextResponse.json(
      { error: "profileId query required" },
      { status: 400 },
    );
  }
  store().delete(id);
  return NextResponse.json({ ok: true });
}
