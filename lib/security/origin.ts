const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const isLoopback = (hostname: string): boolean =>
  LOOPBACK_HOSTS.has(hostname.toLowerCase());

export const DEFAULT_APP_ORIGIN = "http://127.0.0.1:3100";

export const parseAppOrigin = (value: string | undefined): string | null => {
  const candidate = value?.trim() || DEFAULT_APP_ORIGIN;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!isLoopback(url.hostname)) return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (candidate !== url.origin) return null;
    return url.origin;
  } catch {
    return null;
  }
};

export const getAppOrigin = (): string => {
  const parsed = parseAppOrigin(process.env.APP_ORIGIN);
  if (!parsed) {
    throw new Error("APP_ORIGIN must be a loopback http or https origin.");
  }
  return parsed;
};

export const isTrustedOrigin = (
  originHeader: string | null,
  hostHeader: string | null,
  trustedOrigin: string,
): boolean => {
  if (!originHeader || !hostHeader) return false;
  try {
    const origin = new URL(originHeader);
    const trusted = new URL(trustedOrigin);
    if (origin.protocol !== "http:" && origin.protocol !== "https:") return false;
    if (origin.username || origin.password) return false;
    if (originHeader !== origin.origin) return false;
    return (
      origin.origin === trusted.origin &&
      origin.host === trusted.host &&
      origin.host === hostHeader.toLowerCase()
    );
  } catch {
    return false;
  }
};