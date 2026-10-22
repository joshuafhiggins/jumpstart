const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bytes: number[] = [];

  for (let index = 0; index < padded.length; index += 4) {
    const a = BASE64_ALPHABET.indexOf(padded[index]);
    const b = BASE64_ALPHABET.indexOf(padded[index + 1]);
    const c = padded[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(padded[index + 2]);
    const d = padded[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(padded[index + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) {
      throw new Error('Invalid base64url');
    }

    const chunk = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((chunk >> 16) & 255);
    if (padded[index + 2] !== '=') bytes.push((chunk >> 8) & 255);
    if (padded[index + 3] !== '=') bytes.push(chunk & 255);
  }

  return String.fromCharCode(...bytes);
}

/**
 * Reads the JWT `exp` claim in milliseconds.
 * Scheduling only; the signature is not verified.
 */
export function getJwtExpiryMs(token: string): number | null {
  const segment = token.split('.')[1];
  if (!segment) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(segment)) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}
