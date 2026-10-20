import { describe, it, expect } from "vitest";
import { isSameOrigin } from "./same-origin";

describe("same-origin guard", () => {
  it("accepts matching origin and host", () => {
    expect(isSameOrigin("http://127.0.0.1:3100", "127.0.0.1:3100")).toBe(true);
  });

  it("rejects missing or mismatched values", () => {
    expect(isSameOrigin(null, "127.0.0.1:3100")).toBe(false);
    expect(isSameOrigin("http://evil.example", "127.0.0.1:3100")).toBe(false);
    expect(isSameOrigin("not-a-url", "127.0.0.1:3100")).toBe(false);
    expect(isSameOrigin("https://127.0.0.1:3100", "127.0.0.1:3100")).toBe(false);
  });
});