function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export const API_BASE_URL: string = normalizeUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
);
