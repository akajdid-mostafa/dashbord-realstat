import jwt from 'jsonwebtoken';

const TOKEN_TTL: jwt.SignOptions['expiresIn'] = '1h';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in the environment');
  }
  return secret;
}

export interface TokenPayload {
  userId: number;
}

export function signToken(userId: number): string {
  const payload: TokenPayload = { userId };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (
    typeof decoded === 'object' &&
    decoded !== null &&
    typeof (decoded as jwt.JwtPayload).userId === 'number'
  ) {
    return { userId: (decoded as jwt.JwtPayload).userId as number };
  }
  throw new Error('Invalid token payload');
}
