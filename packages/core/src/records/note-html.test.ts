import { describe, expect, it } from "vitest";
import { sanitizeNoteHtml as clean } from "./note-html";

describe("sanitizeNoteHtml", () => {
  it("keeps toolbar formatting", () => {
    const html = "<p><b>a</b><i>b</i><u>c</u></p><ul><li>x</li></ul><ol><li>y</li></ol>a<br>b";
    expect(clean(html)).toBe(html);
  });
  it("drops event handler attributes", () => {
    expect(clean('<p onclick="x()" style="color:#fff;position:fixed">a</p>')).toBe(
      '<p style="color: #fff">a</p>',
    );
    expect(clean("<img src=x onerror=alert(1)>t")).toBe("t");
  });
  it("drops script, svg, iframe and style with their contents", () => {
    expect(clean("a<script>alert(1)</script>b<style>p{}</style>c")).toBe("abc");
    expect(clean('<svg onload="x()"><g/></svg>ok<iframe src="//e"></iframe>')).toBe("ok");
  });
  it("removes javascript: and data: hrefs, even obfuscated", () => {
    expect(clean('<a href="javascript:alert(1)">l</a>')).toBe("<a>l</a>");
    expect(clean('<a href="data:text/html,x">l</a>')).toBe("<a>l</a>");
    expect(clean('<a href="jav&#x61;script:alert(1)">l</a>')).toBe("<a>l</a>");
    expect(clean('<a href="mailto:a@b.co">l</a>')).toContain('href="mailto:a@b.co"');
  });
  it("handles nested and malformed markup", () => {
    expect(clean("<p><b>a</p>")).toBe("<p><b>a</p>");
    expect(clean("<b <img onerror=1> >x")).not.toMatch(/onerror/);
    expect(clean("1 < 2 <!-- c --> <?x?>")).toBe("1 &lt; 2  ");
    expect(clean("<scr<script>ipt>alert(1)</scr</script>ipt>")).not.toMatch(/<script/i);
    expect(clean('<a href="https://e.com" title="x"')).not.toMatch(/title/);
  });
});
