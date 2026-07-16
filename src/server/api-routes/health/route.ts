import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "melody-islands",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
    modules: [
      "core",
      "curriculum",
      "audio",
      "scoring",
      "skill-model",
      "session",
      "companion",
      "progress",
    ],
  });
}
