import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "diabetes-ops-cockpit",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
