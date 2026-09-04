export function apiBase() {
  const baseUrl = process.env.ORA_API_URL;
  if (!baseUrl) throw new Error("ORA_API_URL is not configured");
  return baseUrl.replace(/\/$/, "");
}

/**
 * Failures are reported as a code, not prose: these routes have no locale
 * context, so the client picks the wording from the active dictionary.
 */
export function unavailable() {
  return Response.json({ code: "unavailable" }, { status: 502 });
}

export async function relay(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return unavailable();
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": contentType },
  });
}

/** Forwards a JSON POST body to the API, without exposing `ORA_API_URL` to the browser. */
export async function proxyPost(path: string, request: Request) {
  try {
    return await relay(
      await fetch(`${apiBase()}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: await request.text(),
        cache: "no-store",
      }),
    );
  } catch {
    return unavailable();
  }
}

/** Forwards the caller's bearer token to an authenticated API endpoint. */
export async function proxyAuthed(path: string, request: Request, method: "GET" | "POST" = "GET") {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    return await relay(
      await fetch(`${apiBase()}${path}`, {
        method,
        headers: { authorization },
        cache: "no-store",
      }),
    );
  } catch {
    return unavailable();
  }
}

/** Forwards the caller's bearer token and JSON body to an authenticated API endpoint. */
export async function proxyAuthedPost(path: string, request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    return await relay(
      await fetch(`${apiBase()}${path}`, {
        method: "POST",
        headers: { authorization, "content-type": "application/json" },
        body: await request.text(),
        cache: "no-store",
      }),
    );
  } catch {
    return unavailable();
  }
}
