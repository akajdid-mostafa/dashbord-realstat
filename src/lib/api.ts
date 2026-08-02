function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL: string = normalizeUrl(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
);

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
