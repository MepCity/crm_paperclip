import { describe, expect, it } from "vitest";
import { secureCookies } from "./index";

describe("secureCookies", () => {
  it("uses the public URL protocol, including in production builds", () => {
    expect(secureCookies("http://127.0.0.1:3000")).toBe(false);
    expect(secureCookies("https://crm.example.test")).toBe(true);
  });
});
