import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyToBackend(req, `/api/${path.join("/")}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
