import { describe, expect, it } from "vitest";
import { rewriteCidReferences } from "./cid-references";

describe("rewriteCidReferences", () => {
  describe("three quote styles", () => {
    it("handles double-quoted, single-quoted, and unquoted attributes", () => {
      const parts = [
        { contentId: "img1", url: "https://example.com/1.png" },
        { contentId: "img2", url: "https://example.com/2.png" },
        { contentId: "img3", url: "https://example.com/3.png" },
      ];

      const html =
        "<img src=\"cid:img1\" alt=\"first\"><img src='cid:img2' alt='second'><img src=cid:img3 alt=third>";
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        "<img src=\"https://example.com/1.png\" alt=\"first\"><img src='https://example.com/2.png' alt='second'><img src=https://example.com/3.png alt=third>",
      );
      expect(result.unresolved).toEqual([]);
    });

    it("handles self-closing tags with different quote styles", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];

      expect(rewriteCidReferences('<img src="cid:logo" />', parts).html).toBe(
        '<img src="https://example.com/logo.png" />',
      );
      expect(rewriteCidReferences("<img src='cid:logo' />", parts).html).toBe(
        "<img src='https://example.com/logo.png' />",
      );
      expect(rewriteCidReferences("<img src=cid:logo/>", parts).html).toBe(
        "<img src=https://example.com/logo.png/>",
      );
    });
  });

  describe("angle brackets in content-id", () => {
    it("matches when HTML has angle brackets but parts list does not", () => {
      const parts = [{ contentId: "photo@domain.com", url: "https://cdn.example.com/photo.jpg" }];
      const html = '<img src="cid:<photo@domain.com>">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://cdn.example.com/photo.jpg">');
      expect(result.unresolved).toEqual([]);
    });

    it("matches when parts list has angle brackets but HTML does not", () => {
      const parts = [{ contentId: "<photo@domain.com>", url: "https://cdn.example.com/photo.jpg" }];
      const html = '<img src="cid:photo@domain.com">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://cdn.example.com/photo.jpg">');
      expect(result.unresolved).toEqual([]);
    });

    it("matches when both HTML and parts list have angle brackets", () => {
      const parts = [{ contentId: "<photo@domain.com>", url: "https://cdn.example.com/photo.jpg" }];
      const html = '<img src="cid:<photo@domain.com>">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://cdn.example.com/photo.jpg">');
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("case-insensitivity", () => {
    it("matches content-id case-insensitively", () => {
      const parts = [{ contentId: "logo@domain.com", url: "https://example.com/logo.png" }];
      const html = '<img src="cid:LOGO@DOMAIN.COM">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://example.com/logo.png">');
      expect(result.unresolved).toEqual([]);
    });

    it("matches when part content-id is uppercase and HTML cid is lowercase", () => {
      const parts = [{ contentId: "LOGO@DOMAIN.COM", url: "https://example.com/logo.png" }];
      const html = '<img src="cid:logo@domain.com">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://example.com/logo.png">');
      expect(result.unresolved).toEqual([]);
    });

    it("handles case-insensitive scheme (CID:, Cid:)", () => {
      const parts = [{ contentId: "img1", url: "https://example.com/1.png" }];
      expect(rewriteCidReferences('<img src="CID:img1">', parts).html).toBe(
        '<img src="https://example.com/1.png">',
      );
      expect(rewriteCidReferences('<img src="Cid:img1">', parts).html).toBe(
        '<img src="https://example.com/1.png">',
      );
    });

    it("handles uppercase tag and attribute names", () => {
      const parts = [{ contentId: "img1", url: "https://example.com/1.png" }];
      expect(rewriteCidReferences('<IMG SRC="cid:img1">', parts).html).toBe(
        '<IMG SRC="https://example.com/1.png">',
      );
      expect(rewriteCidReferences('<BODY BACKGROUND="cid:img1">', parts).html).toBe(
        '<BODY BACKGROUND="https://example.com/1.png">',
      );
    });
  });

  describe("URL-encoded content-id", () => {
    it("decodes RFC 2392 percent-encoded characters in cid references", () => {
      const parts = [
        { contentId: "foo@bar.com", url: "https://example.com/foo.png" },
        { contentId: "my image.png", url: "https://example.com/my-image.png" },
      ];
      const html = '<img src="cid:foo%40bar.com"><img src="cid:my%20image.png">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<img src="https://example.com/foo.png"><img src="https://example.com/my-image.png">',
      );
      expect(result.unresolved).toEqual([]);
    });

    it("decodes percent-encoded angle brackets in cid references", () => {
      const parts = [{ contentId: "part1@domain.com", url: "https://example.com/part1.png" }];
      const html = '<img src="cid:%3Cpart1%40domain.com%3E">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://example.com/part1.png">');
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("unmatched cids", () => {
    it("leaves unmatched cid attributes unmodified in HTML and collects them in unresolved", () => {
      const html =
        '<img src="cid:missing1" alt="one"><img src="cid:<missing2@domain.com>" alt="two">';
      const result = rewriteCidReferences(html, []);

      expect(result.html).toBe(
        '<img src="cid:missing1" alt="one"><img src="cid:<missing2@domain.com>" alt="two">',
      );
      expect(result.unresolved).toEqual(["missing1", "missing2@domain.com"]);
    });

    it("decodes URL-encoded unresolved cids", () => {
      const html = '<img src="cid:missing%20photo.png">';
      const result = rewriteCidReferences(html, []);

      expect(result.html).toBe('<img src="cid:missing%20photo.png">');
      expect(result.unresolved).toEqual(["missing photo.png"]);
    });

    it("keeps matched cids replaced while recording unmatched ones", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const html = '<img src="cid:logo"><img src="cid:missing">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<img src="https://example.com/logo.png"><img src="cid:missing">');
      expect(result.unresolved).toEqual(["missing"]);
    });
  });

  describe("same cid twice", () => {
    it("replaces all occurrences when the cid matches", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const html = '<header><img src="cid:logo"></header><footer><img src="cid:logo"></footer>';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<header><img src="https://example.com/logo.png"></header><footer><img src="https://example.com/logo.png"></footer>',
      );
      expect(result.unresolved).toEqual([]);
    });

    it("records unmatched duplicate cid only once in unresolved", () => {
      const html =
        '<img src="cid:missing"><img src="cid:missing"><img src="cid:other"><img src="cid:missing">';
      const result = rewriteCidReferences(html, []);

      expect(result.html).toBe(
        '<img src="cid:missing"><img src="cid:missing"><img src="cid:other"><img src="cid:missing">',
      );
      expect(result.unresolved).toEqual(["missing", "other"]);
    });

    it("de-duplicates case-insensitively in unresolved", () => {
      const html = '<img src="cid:MISSING"><img src="cid:missing">';
      const result = rewriteCidReferences(html, []);

      expect(result.html).toBe('<img src="cid:MISSING"><img src="cid:missing">');
      expect(result.unresolved).toEqual(["MISSING"]);
    });
  });

  describe("text nodes containing cid: are untouched", () => {
    it("does not rewrite cid: references inside paragraph text", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const html = '<p>Check out cid:logo or src="cid:logo" for details.</p>';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<p>Check out cid:logo or src="cid:logo" for details.</p>');
      expect(result.unresolved).toEqual([]);
    });

    it("replaces image tag while keeping paragraph text untouched", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const html = '<p>The icon is cid:logo</p><img src="cid:logo">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<p>The icon is cid:logo</p><img src="https://example.com/logo.png">',
      );
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("URL attribute escaping", () => {
    it("escapes ampersands in replacement URLs", () => {
      const parts = [
        {
          contentId: "chart",
          url: "https://cdn.example.com/chart?token=abc&size=large&format=png",
        },
      ];
      const html = '<img src="cid:chart">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<img src="https://cdn.example.com/chart?token=abc&amp;size=large&amp;format=png">',
      );
      expect(result.unresolved).toEqual([]);
    });

    it("escapes double quotes in replacement URLs", () => {
      const parts = [
        {
          contentId: "quote-test",
          url: 'https://cdn.example.com/view?file="special"&type=png',
        },
      ];
      const html = '<img src="cid:quote-test">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<img src="https://cdn.example.com/view?file=&quot;special&quot;&amp;type=png">',
      );
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("background attribute", () => {
    it("rewrites background attributes on body, table, and td elements", () => {
      const parts = [
        { contentId: "bg-body", url: "https://example.com/body-bg.png" },
        { contentId: "bg-table", url: "https://example.com/table-bg.png" },
        { contentId: "bg-td", url: "https://example.com/td-bg.png" },
      ];
      const html =
        "<body background=\"cid:bg-body\"><table background='cid:bg-table'><tr><td background=cid:bg-td>Content</td></tr></table></body>";
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        "<body background=\"https://example.com/body-bg.png\"><table background='https://example.com/table-bg.png'><tr><td background=https://example.com/td-bg.png>Content</td></tr></table></body>",
      );
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("non-target attributes and elements", () => {
    it("does not rewrite cid in href or data-src attributes", () => {
      const parts = [{ contentId: "link", url: "https://example.com/file" }];
      const html = '<a href="cid:link">Download</a><img data-src="cid:link">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<a href="cid:link">Download</a><img data-src="cid:link">');
      expect(result.unresolved).toEqual([]);
    });

    it("does not mistake alt attribute containing src=cid for an attribute", () => {
      const parts = [{ contentId: "real", url: "https://example.com/real.png" }];
      const html = '<img alt="Check src=\'cid:fake\' here" src="cid:real">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(
        '<img alt="Check src=\'cid:fake\' here" src="https://example.com/real.png">',
      );
      expect(result.unresolved).toEqual([]);
    });

    it("does not touch cid references inside comments or script tags", () => {
      const parts = [{ contentId: "img", url: "https://example.com/img.png" }];
      const html =
        '<!-- <img src="cid:img"> --><script>var x = \'<img src="cid:img">\';</script><style>body { background: url("cid:img"); }</style>';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe(html);
      expect(result.unresolved).toEqual([]);
    });
  });

  describe("pure function contract / HTML preservation", () => {
    it("preserves non-matching HTML, whitespace, and formatting verbatim", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const input =
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>   <div class="header"   style="margin: 0;">\n<img   src = "cid:logo"   alt="Company Logo"   />\n</div></body></html>';
      const result = rewriteCidReferences(input, parts);

      expect(result.html).toBe(
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>   <div class="header"   style="margin: 0;">\n<img   src = "https://example.com/logo.png"   alt="Company Logo"   />\n</div></body></html>',
      );
      expect(result.unresolved).toEqual([]);
    });

    it("handles empty HTML input", () => {
      const result = rewriteCidReferences("", []);
      expect(result.html).toBe("");
      expect(result.unresolved).toEqual([]);
    });

    it("handles HTML without any tags", () => {
      const result = rewriteCidReferences("Just plain text with cid:foo", []);
      expect(result.html).toBe("Just plain text with cid:foo");
      expect(result.unresolved).toEqual([]);
    });

    it("handles HTML with stray less-than signs in text", () => {
      const parts = [{ contentId: "logo", url: "https://example.com/logo.png" }];
      const html = '<p>1 < 2 and 3 > 2</p><img src="cid:logo">';
      const result = rewriteCidReferences(html, parts);

      expect(result.html).toBe('<p>1 < 2 and 3 > 2</p><img src="https://example.com/logo.png">');
      expect(result.unresolved).toEqual([]);
    });
  });
});
