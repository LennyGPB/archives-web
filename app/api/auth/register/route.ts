import { apiBase, relay, unavailable } from "@/lib/api-proxy";

export const runtime = "nodejs";

/**
 * Web sign-ups also join the public waitlist — this only happens here, not in
 * the shared `ora-api` register endpoint, so the mobile app isn't affected.
 * Best-effort: the waitlist call never blocks or fails the registration response.
 */
function joinWaitlist(bodyText: string) {
  try {
    const { email } = JSON.parse(bodyText) as { email?: string };
    if (!email) return;

    fetch(`${apiBase()}/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // malformed body — the registration request itself will surface the error
  }
}

export async function POST(request: Request) {
  const bodyText = await request.text();

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: bodyText,
      cache: "no-store",
    });
  } catch {
    return unavailable();
  }

  if (response.ok) {
    joinWaitlist(bodyText);
  }

  return relay(response);
}
