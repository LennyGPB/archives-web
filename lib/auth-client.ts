export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  transmissionCredits: number;
};

/** Keys of `auth.errors` in the dictionaries. */
export type AuthErrorCode =
  | "invalidCredentials"
  | "accountUsesGoogle"
  | "emailOrPseudoTaken"
  | "invalidInput"
  | "googleFailed"
  | "rateLimited"
  | "unavailable"
  | "failed";

/**
 * The API answers in French (class-validator, Nest exceptions), so failures
 * travel as codes and the wording is resolved from the active locale's dictionary.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

export function authErrorCode(error: unknown): AuthErrorCode {
  return error instanceof AuthError ? error.code : "failed";
}

type AuthContext = "login" | "register" | "google";

async function codeForResponse(response: Response, context: AuthContext): Promise<AuthErrorCode> {
  const { status } = response;

  if (status === 401) {
    if (context === "google") return "googleFailed";
    // `login` returns 401 both for wrong credentials and for Google-only accounts —
    // the message text is the only way to tell them apart.
    const message = await response
      .clone()
      .json()
      .then((body: { message?: string }) => body.message ?? "")
      .catch(() => "");
    return /google/i.test(message) ? "accountUsesGoogle" : "invalidCredentials";
  }
  if (status === 409) return "emailOrPseudoTaken";
  if (status === 400 || status === 422) return "invalidInput";
  if (status === 429) return "rateLimited";
  if (status === 502 || status === 503) return "unavailable";
  return "failed";
}

async function postAuth(path: string, body: unknown, context: AuthContext): Promise<AuthTokens> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("unavailable");
  }

  if (!response.ok) {
    throw new AuthError(await codeForResponse(response, context));
  }

  let data: Partial<AuthTokens>;
  try {
    data = (await response.json()) as Partial<AuthTokens>;
  } catch {
    throw new AuthError("unavailable");
  }

  if (!data.accessToken || !data.refreshToken) {
    throw new AuthError("failed");
  }

  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export function registerWithCredentials(email: string, password: string, pseudo: string) {
  return postAuth("/api/auth/register", { email, password, pseudo }, "register");
}

export function loginWithCredentials(email: string, password: string) {
  return postAuth("/api/auth/login", { email, password }, "login");
}

export function loginWithGoogle(idToken: string) {
  return postAuth("/api/auth/google", { idToken }, "google");
}

let pendingRefresh: { refreshToken: string; promise: Promise<AuthTokens | null> } | null = null;

/**
 * Best-effort refresh: returns `null` instead of throwing so callers can fall back to signing out.
 *
 * Refresh tokens are single-use (rotated server-side on every call), so two concurrent calls for
 * the same token — e.g. React StrictMode double-invoking the bootstrap effect — would race: the
 * first rotates the token, the second gets rejected as already-revoked and forces a sign-out.
 * Callers racing on the same token instead share one in-flight request.
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
  if (pendingRefresh?.refreshToken === refreshToken) return pendingRefresh.promise;

  const promise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;

      const data = (await response.json()) as Partial<AuthTokens>;
      if (!data.accessToken || !data.refreshToken) return null;
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    } catch {
      return null;
    } finally {
      pendingRefresh = null;
    }
  })();

  pendingRefresh = { refreshToken, promise };
  return promise;
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}

/** Revokes the refresh token session server-side. Failures are silently ignored — the client clears its tokens regardless. */
export async function revokeSession(accessToken: string) {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // best-effort
  }
}

const STORAGE_KEY = "ora_auth_tokens";

export function saveTokens(tokens: AuthTokens) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // storage unavailable (private mode, quota…) — session just won't persist across reloads
  }
}

export function loadTokens(): AuthTokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    return parsed.accessToken && parsed.refreshToken ? (parsed as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
