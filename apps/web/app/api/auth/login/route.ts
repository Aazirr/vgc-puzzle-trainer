import type { NextRequest } from "next/server";
import { proxyToBackend, optionsResponse } from "@/lib/proxy";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "login");
}

export async function OPTIONS() {
  return optionsResponse();
}

