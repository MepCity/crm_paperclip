import { describe, expect, it } from "vitest";
import { sanitizeInboundHtml } from "./inbound-html";

const clean = (h: string) => sanitizeInboundHtml(h).html;

function expectInert(html: string) {
  expect(html).not.toMatch(
    /<script|<iframe|<object|<embed|<svg|<form|<input|<button|<meta|<link|<base/i,
  );
  expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  expect(html).not.toMatch(/(?:href|src)="\s*(?:javascript|vbscript|data):/i);
  expect(html).not.toMatch(/url\s*\(|expression/i);
}

const XSS: [string, string][] = [
  ["basic script", "<script>alert(1)</script>hi"],
  ["mixed-case script", "<ScRiPt>alert(1)</sCrIpT>hi"],
  ["unclosed script", "hi<script>alert(1)"],
  ["unclosed tag", '<img src="x" onerror="alert(1)"'],
  ["img onerror", "<img src=x onerror=alert(1)>"],
  ["img slash separators", "<img/src=x/onerror=alert(1)>"],
  ["entity javascript", '<a href="javascript&#58;alert(1)">x</a>'],
  ["hex entity javascript", '<a href="&#x6A;avascript:alert(1)">x</a>'],
  ["tab in scheme", '<a href="java\tscript:alert(1)">x</a>'],
  ["named colon entity", '<a href="javascript&colon;alert(1)">x</a>'],
  ["vbscript", '<a href="vbscript:msgbox(1)">x</a>'],
  ["data html link", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
  ["svg onload", '<svg onload="alert(1)"><circle/></svg>'],
  ["style url javascript", '<div style="background:url(javascript:alert(1))">x</div>'],
  ["style expression", '<div style="width:expression(alert(1))">x</div>'],
  ["style css escape", '<div style="background:\\75rl(javascript:alert(1))">x</div>'],
  ["style tag", "<style>@import 'http://evil/x.css'; body{background:url(http://evil)}</style>x"],
  ["iframe", '<iframe src="http://evil"></iframe>x'],
  ["object/embed", '<object data="x"></object><embed src="x">y'],
  ["form/input/button", '<form action="http://evil"><input name=a><button>go</button></form>'],
  ["meta refresh", '<meta http-equiv="refresh" content="0;url=http://evil">x'],
  ["link/base", '<link rel=stylesheet href=http://evil><base href="http://evil">x'],
  ["attr breakout", '<a href="x" title="" onmouseover="alert(1)">x</a>'],
  ["comment payload", "<!--><script>alert(1)</script>-->x"],
  ["nested script split", "<scr<script>ipt>alert(1)</scr</script>ipt>"],
  ["img data svg", '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">'],
];

describe("sanitizeInboundHtml XSS", () => {
  it.each(XSS)("neutralises %s", (_n, input) => {
    expectInert(clean(input));
  });

  it("keeps surrounding text for removed elements", () => {
    expect(clean("<ScRiPt>alert(1)</sCrIpT>hi")).toBe("hi");
    expect(clean("<form><input name=a>keep</form>")).toBe("keep");
  });

  it("escapes stray angle brackets", () => {
    expect(clean("1 < 2 and <b>bold")).toBe("1 &lt; 2 and <b>bold</b>");
  });
});

describe("links", () => {
  it("adds target and rel, keeps safe hrefs only", () => {
    expect(clean('<a href="https://ex.com/a?x=1&amp;y=2">go</a>')).toBe(
      '<a href="https://ex.com/a?x=1&amp;y=2" target="_blank" rel="noopener noreferrer nofollow">go</a>',
    );
    expect(clean('<a href="mailto:a@b.com">m</a>')).toContain('href="mailto:a@b.com"');
    expect(clean('<a href="javascript:x">m</a>')).not.toContain("href");
  });
});

describe("images", () => {
  it("maps cid images through cidMap and removes unknown ones", () => {
    const r = sanitizeInboundHtml('<img src="cid:logo1" alt="L"><img src="cid:other">', {
      cidMap: { logo1: "/api/mail/att/1" },
    });
    expect(r.html).toBe('<img src="/api/mail/att/1" alt="L">');
    expect(r.blockedRemoteImages).toBe(0);
  });

  it("does not resolve cid ids from the prototype chain", () => {
    expect(sanitizeInboundHtml('<img src="cid:constructor">', { cidMap: {} }).html).toBe("");
  });

  it("blocks and counts remote images", () => {
    const r = sanitizeInboundHtml(
      '<img src="https://t.example/p.gif" width="1" height="1"><img src="http://t.example/a.png">',
    );
    expect(r.blockedRemoteImages).toBe(2);
    expect(r.html).not.toMatch(/\ssrc=/);
    expect(r.html).toContain('data-blocked-src="https://t.example/p.gif"');
  });

  it("keeps raster data images", () => {
    const r = sanitizeInboundHtml('<img src="data:image/png;base64,AAAA">');
    expect(r.html).toContain('src="data:image/png;base64,AAAA"');
  });
});

describe("newsletter layout", () => {
  it("preserves table layout and safe styling", () => {
    const input =
      '<table width="600" cellpadding="0" align="center" style="background-color:#fff"><tbody><tr><td colspan="2" style="padding:10px;color:#333"><h1>Hi</h1><p>Text <b>bold</b></p></td></tr></tbody></table>';
    const out = clean(input);
    expect(out).toContain(
      '<table width="600" cellpadding="0" align="center" style="background-color: #fff">',
    );
    expect(out).toContain('<td colspan="2" style="padding: 10px; color: #333">');
    expect(out).toContain("<h1>Hi</h1><p>Text <b>bold</b></p></td></tr></tbody></table>");
  });
});
