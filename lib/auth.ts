import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(): Promise<TokenPayload | null> {
  const headersList = await headers();
  const authorization = headersList.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.split(' ')[1];
  return verifyToken(token);
}
