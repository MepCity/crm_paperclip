import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./html-text";

describe("htmlToPlainText", () => {
  it("returns empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText("  \n ")).toBe("");
  });

  it("drops script, style, head, template and comments", () => {
    const html =
      "<head><title>T</title></head><style>p{}</style><script>alert(1)</script><template><b>x</b></template><!-- hidden -->Hello";
    expect(htmlToPlainText(html)).toBe("Hello");
  });

  it("turns br into newline and separates blocks", () => {
    expect(htmlToPlainText("a<br>b<br/>c")).toBe("a\nb\nc");
    expect(htmlToPlainText("<div>a</div><p>b</p><h1>c</h1><blockquote>d</blockquote>")).toBe(
      "a\nb\nc\nd",
    );
    expect(htmlToPlainText("<table><tr><td>a</td></tr><tr><td>b</td></tr></table>")).toBe("a\nb");
  });

  it('prefixes list items with "- "', () => {
    expect(htmlToPlainText("<ul><li>one</li><li>two</li></ul>")).toBe("- one\n- two");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToPlainText("&amp; &lt; &gt; &quot; &#39; &apos; a&nbsp;b")).toBe(
      "& < > \" ' ' a b",
    );
    expect(htmlToPlainText("&#65;&#x42;&#x1F600;")).toBe("AB😀");
  });

  it("maps invalid code points to U+FFFD", () => {
    expect(htmlToPlainText("&#1114112;&#xD800;&#0;")).toBe("\uFFFD\uFFFD\uFFFD");
  });

  it("does not double-decode entities", () => {
    expect(htmlToPlainText("&amp;lt;")).toBe("&lt;");
  });

  it("collapses whitespace and blank lines and trims", () => {
    expect(htmlToPlainText("  a   \t b  ")).toBe("a b");
    expect(htmlToPlainText("a<br><br><br><br>b")).toBe("a\n\nb");
  });

  it("preserves whitespace inside pre", () => {
    expect(htmlToPlainText("<p>x</p><pre>  a\n    b &lt;c&gt;</pre><p>y</p>")).toBe(
      "x\n  a\n    b <c>\ny",
    );
  });

  it('does not leak attribute values containing ">"', () => {
    expect(htmlToPlainText("<a title=\"a>b\" href='x>y'>link</a> end")).toBe("link end");
  });

  it("truncates at the last space with an ellipsis", () => {
    const out = htmlToPlainText("hello wonderful world", { maxLength: 15 });
    expect(out).toBe("hello…");
    expect(htmlToPlainText("hello wonderful world", { maxLength: 100 })).toBe(
      "hello wonderful world",
    );
    const exact = htmlToPlainText("hello world foo", { maxLength: 12 });
    expect(exact).toBe("hello world…");
    expect(exact.length).toBeLessThanOrEqual(12);
  });

  it("hard-cuts a single long word and respects the limit", () => {
    const out = htmlToPlainText("abcdefghij", { maxLength: 5 });
    expect(out).toBe("abcd…");
  });

  it("handles Turkish characters", () => {
    expect(htmlToPlainText("<p>Şöyle güzel çalışıyor İĞÜ</p><p>ışık &amp; ölçü</p>")).toBe(
      "Şöyle güzel çalışıyor İĞÜ\nışık & ölçü",
    );
    expect(htmlToPlainText("Çok güzel bir gün", { maxLength: 10 })).toBe("Çok güzel…");
  });
});
