import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", uptime: process.uptime() });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
