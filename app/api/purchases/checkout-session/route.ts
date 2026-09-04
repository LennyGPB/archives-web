import { proxyAuthedPost } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyAuthedPost("/purchases/checkout-session", request);
}
