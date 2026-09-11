import { proxyAuthed } from "@/lib/api-proxy";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ userArchiveId: string }> }) {
  const { userArchiveId } = await params;
  return proxyAuthed(`/admin/user-archives/${userArchiveId}`, request, "DELETE");
}
