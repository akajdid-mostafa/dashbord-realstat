export function missingRequiredFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): (keyof T)[] {
  return fields.filter((field) => {
    const value = body[field];
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    );
  });
}

export function parseNumericId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function isValidEnum<T extends string>(value: unknown, enumValues: readonly T[]): value is T {
  return typeof value === 'string' && (enumValues as readonly string[]).includes(value);
}

export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function parseJsonField(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
