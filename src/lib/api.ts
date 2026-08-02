function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required: the dashboard must target its own backend origin. " +
      "Refusing to fall back to the legacy backend.",
  );
}

export const API_BASE_URL: string = normalizeUrl(apiUrl);

function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...extra,
  };
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
