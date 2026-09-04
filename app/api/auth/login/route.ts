import { proxyPost } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyPost("/auth/login", request);
}
