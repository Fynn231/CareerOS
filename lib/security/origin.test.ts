import { describe, it, expect } from "vitest";
import { getAppOrigin, isTrustedOrigin, parseAppOrigin } from "./origin";

describe("app origin validation", () => {
  it("defaults to the local app origin", () => {
    delete process.env.APP_ORIGIN;
    expect(getAppOrigin()).toBe("http://127.0.0.1:3100");
  });

  it("rejects non-loopback origins", () => {
    expect(parseAppOrigin("https://example.com:3100")).toBeNull();
    expect(parseAppOrigin("http://evil.example")).toBeNull();
  });

  it("rejects malformed origins and paths", () => {
    expect(parseAppOrigin("http://127.0.0.1:3100/foo")).toBeNull();
    expect(parseAppOrigin("127.0.0.1:3100")).toBeNull();
    expect(parseAppOrigin("http://user:pass@127.0.0.1:3100")).toBeNull();
    expect(parseAppOrigin("HTTP://127.0.0.1:3100")).toBeNull();
    expect(parseAppOrigin("http://127.0.0.1:3100?x=1")).toBeNull();
    expect(parseAppOrigin("ftp://127.0.0.1:3100")).toBeNull();
  });

  it("rejects non-canonical incoming origins", () => {
    const trusted = "http://127.0.0.1:3100";
    expect(isTrustedOrigin("http://user:pass@127.0.0.1:3100", "127.0.0.1:3100", trusted)).toBe(false);
    expect(isTrustedOrigin("http://127.0.0.1:3100/path", "127.0.0.1:3100", trusted)).toBe(false);
    expect(isTrustedOrigin("HTTP://127.0.0.1:3100", "127.0.0.1:3100", trusted)).toBe(false);
  });

  it("canonicalizes scheme and port", () => {
    process.env.APP_ORIGIN = "HTTPS://LOCALHOST:3100/";
    expect(parseAppOrigin(process.env.APP_ORIGIN)).toBeNull();
    delete process.env.APP_ORIGIN;
  });

  it("requires matching canonical origin and host", () => {
    const trusted = "http://127.0.0.1:3100";
    expect(isTrustedOrigin("http://127.0.0.1:3100", "127.0.0.1:3100", trusted)).toBe(true);
    expect(isTrustedOrigin("https://127.0.0.1:3100", "127.0.0.1:3100", trusted)).toBe(false);
    expect(isTrustedOrigin("http://127.0.0.1:3100", "localhost:3100", trusted)).toBe(false);
  });
});