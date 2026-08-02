export const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://realestat-eight.vercel.app',
  'https://dashbord-realstat-two.vercel.app',
  'https://realstat-eta.vercel.app',
] as const;

export type AllowedOrigin = (typeof allowedOrigins)[number];

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  return typeof origin === 'string' && (allowedOrigins as readonly string[]).includes(origin);
}

export function corsHeaders(origin: string | null | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin',
    ...corsOptions,
  };

  if (isAllowedOrigin(origin) && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
