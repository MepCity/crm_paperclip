import { describe, expect, it } from "vitest";
import { readBoundedBody } from "./body";

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/x", { method: "POST", body, headers });
}

describe("readBoundedBody", () => {
  it("returns the text when within the cap", async () => {
    expect(await readBoundedBody(post("hello"), 10)).toBe("hello");
  });
  it("returns null when the declared length exceeds the cap", async () => {
    expect(await readBoundedBody(post("x", { "content-length": "999" }), 10)).toBeNull();
  });
  it("returns null for a streamed body over the cap without a declared length", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8));
        controller.enqueue(new Uint8Array(8));
        controller.close();
      },
    });
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect(await readBoundedBody(request, 10)).toBeNull();
  });
  it("returns an empty string for an empty body", async () => {
    expect(await readBoundedBody(new Request("http://localhost/x", { method: "POST" }), 10)).toBe(
      "",
    );
  });
});
