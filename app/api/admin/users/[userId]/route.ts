import { proxyAuthed } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return proxyAuthed(`/admin/users/${userId}`, request, "GET");
}
