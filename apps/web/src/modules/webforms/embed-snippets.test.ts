import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  escapeJsString,
  getHostedUrl,
  getIframeEmbedCode,
  getScriptEmbedCode,
  sanitizePublicUrl,
} from "./embed-snippets";

describe("Webform Embed Snippets", () => {
  const validUrl = "https://crm.example.com/f/wfk_live_key123";

  it("sanitizes valid HTTP and HTTPS URLs", () => {
    expect(sanitizePublicUrl(validUrl)).toBe("https://crm.example.com/f/wfk_live_key123");
    expect(sanitizePublicUrl("http://localhost:3000/f/testKey")).toBe(
      "http://localhost:3000/f/testKey",
    );
    expect(sanitizePublicUrl("javascript:alert(1)")).toBe("");
    expect(sanitizePublicUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("escapes HTML characters", () => {
    expect(escapeHtml('<script>alert("xss")&\'</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&amp;&#39;&lt;/script&gt;",
    );
  });

  it("escapes JS string literals", () => {
    expect(escapeJsString("hello\"world'\\test")).toBe("hello\\\"world\\'\\\\test");
  });

  it("generates script embed snippet inserting an iframe without access to host page", () => {
    const code = getScriptEmbedCode(validUrl);
    expect(code).toContain('<script type="text/javascript">');
    expect(code).toContain('ifr.src = "https://crm.example.com/f/wfk_live_key123";');
    expect(code).toContain('ifr.width = "100%";');
    expect(code).toContain('ifr.height = "600";');
    expect(code).toContain("target.parentNode.insertBefore(ifr, target.nextSibling);");
    expect(code).toContain("</script>");
  });

  it("generates iframe snippet with correct attributes", () => {
    const code = getIframeEmbedCode(validUrl);
    expect(code).toBe(
      '<iframe src="https://crm.example.com/f/wfk_live_key123" width="100%" height="600" frameborder="0" style="border:0;" allowfullscreen></iframe>',
    );
  });

  it("escapes malicious URL in iframe and script embed snippets", () => {
    const evilUrl = 'https://crm.example.com/f/key"><script>alert(1)</script>';
    const iframeCode = getIframeEmbedCode(evilUrl);
    expect(iframeCode).not.toContain('"><script>');
    expect(iframeCode).toContain("%22%3E%3Cscript%3E");

    const scriptCode = getScriptEmbedCode(evilUrl);
    expect(scriptCode).not.toContain('"; alert(1);');
  });

  it("generates hosted URL string", () => {
    expect(getHostedUrl(validUrl)).toBe("https://crm.example.com/f/wfk_live_key123");
  });
});
