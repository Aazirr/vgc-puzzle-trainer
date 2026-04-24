import { NextRequest, NextResponse } from "next/server";

function getBackendBase(): string {
  const apiBase = (process.env.AUTH_API_BASE ?? process.env.API_URL ?? "").trim().replace(/\/+$/, "");
  if (apiBase) return apiBase;
  return "http://localhost:3001";
}

export async function POST(request: NextRequest) {
  const backendBase = getBackendBase();

  try {
    const body = await request.json();

    const response = await fetch(`${backendBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data ?? { error: "unknown" }, {
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend unreachable";
    return NextResponse.json(
      { error: "proxy_error", message: `Auth backend unreachable at ${backendBase}. ${message}` },
      { status: 503 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 204 });
}

