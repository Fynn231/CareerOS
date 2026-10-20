import { headers } from "next/headers";
import { DEFAULT_APP_ORIGIN, getAppOrigin, isTrustedOrigin } from "./origin";

export const isSameOrigin = (origin: string | null, host: string | null): boolean =>
  isTrustedOrigin(origin, host, DEFAULT_APP_ORIGIN);

export const assertSameOrigin = async (): Promise<void> => {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");

  let trustedOrigin: string;
  try {
    trustedOrigin = getAppOrigin();
  } catch {
    throw new Error("Same-origin request required.");
  }

  if (!isTrustedOrigin(origin, host, trustedOrigin)) {
    throw new Error("Same-origin request required.");
  }
};