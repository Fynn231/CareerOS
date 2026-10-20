import { describe, it, expect } from "vitest";
import { isSafeInternalPath } from "./redirects";

describe("safe internal redirects", () => {
  it("accepts fixed internal paths", () => {
    expect(isSafeInternalPath("/workspace")).toBe(true);
    expect(isSafeInternalPath("/login")).toBe(true);
  });

  it("rejects external or malformed destinations", () => {
    expect(isSafeInternalPath("https://evil.example")).toBe(false);
    expect(isSafeInternalPath("//evil.example")).toBe(false);
    expect(isSafeInternalPath("/workspace\nX")).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
  });
});