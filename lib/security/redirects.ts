export const SAFE_INTERNAL_PATHS = ["/workspace", "/login"] as const;

export const isSafeInternalPath = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (/[\\\r\n]/.test(value)) return false;
  try {
    const parsed = new URL(value, "http://localhost");
    return parsed.origin === "http://localhost";
  } catch {
    return false;
  }
};

export const fixedInternalRedirect = (path: "/workspace" | "/login"): string => path;