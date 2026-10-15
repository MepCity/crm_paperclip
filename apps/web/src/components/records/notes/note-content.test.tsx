import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  isNoteContentEmpty,
  NOTE_CONTENT_MAX,
  NOTE_TITLE_MAX,
  NoteContent,
  noteContentText,
} from "./note-content";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mount(html: string) {
  return render(<NoteContent html={html} />).container.firstElementChild as HTMLElement;
}

function assertSafe(root: HTMLElement) {
  expect(root.querySelector("script,iframe,object,embed,svg,img,style,link,meta")).toBeNull();
  for (const el of Array.from(root.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith("on")).toBe(false);
      if (attr.name === "href") expect(/^(https?:|mailto:)/i.test(attr.value)).toBe(true);
      if (attr.name === "style") expect(/url\(|expression/i.test(attr.value)).toBe(false);
    }
  }
}

describe("XSS", () => {
  test.each([
    "<script>alert(1)</script>ok",
    '<img src=x onerror="alert(1)">ok',
    '<p onclick="alert(1)">ok</p>',
    '<a href="javascript:alert(1)">ok</a>',
    '<a href=" JaVaScRiPt:alert(1)">ok</a>',
    '<a href="data:text/html,<script>alert(1)</script>">ok</a>',
    '<a href="vbscript:x">ok</a>',
    '<p style="background:url(javascript:alert(1))">ok</p>',
    '<p style="width:expression(alert(1))">ok</p>',
    '<svg onload="alert(1)"><circle/></svg>ok',
    '<iframe src="https://evil.com"></iframe>ok',
    '<a href="https://a.com"><script>alert(1)</script>ok</a>',
  ])("%s", (html) => {
    const root = mount(html);
    assertSafe(root);
    expect(root.textContent).not.toContain("alert(1)");
  });

  test("bad link keeps its text only", () => {
    const root = mount('<a href="javascript:x">click</a>');
    expect(root.querySelector("a")).toBeNull();
    expect(root.textContent).toBe("click");
  });

  test("disallowed tag is unwrapped", () => {
    const root = mount("<table><tr><td>cell</td></tr></table><h1>head</h1>");
    expect(root.querySelector("table,h1")).toBeNull();
    expect(root.textContent).toContain("cell");
    expect(root.textContent).toContain("head");
  });
});

describe("formatting", () => {
  test("keeps inline formatting and structure", () => {
    const root = mount(
      "<p><b>b</b><i>i</i><u>u</u><s>s</s><strike>k</strike><sub>2</sub><sup>3</sup></p><p>a<br>b</p><blockquote>q</blockquote>",
    );
    for (const t of ["b", "i", "u", "s", "strike", "sub", "sup", "br", "blockquote"]) {
      expect(root.querySelector(t)).not.toBeNull();
    }
    expect(root.querySelectorAll("p")).toHaveLength(2);
  });

  test("lists, list types and indent", () => {
    const root = mount(
      '<ul style="list-style-type:square"><li>a</li></ul><ol style="list-style-type: lower-alpha"><li>b</li></ol><div style="margin-left:40px">x</div>',
    );
    expect((root.querySelector("ul") as HTMLElement).style.listStyleType).toBe("square");
    expect((root.querySelector("ol") as HTMLElement).style.listStyleType).toBe("lower-alpha");
    expect((root.querySelector("div") as HTMLElement).style.marginLeft).toBe("40px");
  });

  test("colors and font color", () => {
    const root = mount(
      '<span style="color:#ff0000;background-color:rgba(1,2,3,0.5)">a</span><font color="#00f">b</font>',
    );
    const spans = root.querySelectorAll("span");
    expect((spans[0] as HTMLElement).style.color).toBe("rgb(255, 0, 0)");
    expect((spans[0] as HTMLElement).style.backgroundColor).toBe("rgba(1, 2, 3, 0.5)");
    expect((spans[1] as HTMLElement).style.color).toBe("rgb(0, 0, 255)");
    expect(root.querySelector("font")).toBeNull();
  });

  test("links get target and rel", () => {
    const root = mount('<a href="https://a.com">a</a><a href="mailto:x@y.co">m</a>');
    const links = root.querySelectorAll("a");
    expect(links).toHaveLength(2);
    for (const a of Array.from(links)) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
    expect(links[1]?.getAttribute("href")).toBe("mailto:x@y.co");
  });
});

describe("edge cases", () => {
  test("empty and whitespace render an empty element", () => {
    expect(mount("").childNodes).toHaveLength(0);
    expect(mount("   \n ").childNodes).toHaveLength(0);
  });
  test("className applied", () => {
    const { container } = render(<NoteContent html="<p>x</p>" className="foo" />);
    expect(container.firstElementChild?.className).toBe("foo");
  });
  test("server path shows escaped plain text", () => {
    vi.stubGlobal("DOMParser", undefined);
    const out = renderToString(
      <NoteContent html={'<p onclick="x">hi <script>evil()</script><b>there</b> &lt;b&gt;</p>'} />,
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("evil");
    expect(out).toContain("hi");
    expect(out).toContain("there");
    expect(out).toContain("&lt;b&gt;");
  });
  test("re-exports contract constants and helpers", () => {
    expect(NOTE_TITLE_MAX).toBe(120);
    expect(NOTE_CONTENT_MAX).toBe(65_535);
    expect(noteContentText("<p>test</p>")).toBe("test");
    expect(isNoteContentEmpty("<p><br></p>")).toBe(true);
  });
});
