import { proxyAuthed } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return proxyAuthed("/admin/archives", request, "GET");
}
