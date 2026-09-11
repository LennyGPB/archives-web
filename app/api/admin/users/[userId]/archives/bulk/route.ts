import { proxyAuthedPost } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return proxyAuthedPost(`/admin/users/${userId}/archives/bulk`, request);
}
