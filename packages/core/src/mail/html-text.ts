/**
 * Pure HTML -> plain text conversion for mail bodies (list summaries and
 * plain-text quotes). Regex based; no DOM and no dependencies.
 */

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "li",
  "tr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// A tag whose quoted attribute values may contain `>`.
const TAG_SOURCE = `<(\\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>`;
const PRE_PLACEHOLDER = /\uE000(\d+)\uE000/g;

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = /^#x/i.test(body)
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      const invalid =
        !Number.isFinite(code) ||
        code === 0 ||
        code > 0x10ffff ||
        (code >= 0xd800 && code <= 0xdfff);
      return invalid ? "\uFFFD" : String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? match : named;
  });
}

function stripTags(html: string): string {
  return html.replace(new RegExp(TAG_SOURCE, "g"), (_m, _c, name: string) =>
    name.toLowerCase() === "br" ? "\n" : "",
  );
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 0) return "";
  const room = maxLength - 1;
  let cut = text.slice(0, room);
  if (!/\s/.test(text.charAt(room))) {
    const lastSpace = cut.search(/\s\S*$/);
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }
  return `${cut.trimEnd()}…`;
}

export function htmlToPlainText(html: string, options?: { maxLength?: number }): string {
  const pres: string[] = [];
  const source = html
    .replace(/\uE000/g, "")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(
      /<(script|style|head|template)\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?(?:<\/\1\s*>|$)/gi,
      "",
    )
    .replace(
      /<pre\b(?:"[^"]*"|'[^']*'|[^'">])*>([\s\S]*?)(?:<\/pre\s*>|$)/gi,
      (_m, inner: string) => {
        pres.push(
          decodeEntities(stripTags(inner))
            .replace(/^\r?\n/, "")
            .replace(/\s+$/, ""),
        );
        return `<pre>\uE000${pres.length - 1}\uE000</pre>`;
      },
    );

  let out = "";
  const endsWithBreak = () => out === "" || /\n[ \t]*$/.test(out);
  const breakLine = () => {
    if (!endsWithBreak()) out += "\n";
  };

  const tagRe = new RegExp(TAG_SOURCE, "g");
  let last = 0;
  const addText = (raw: string) => {
    out += decodeEntities(raw.replace(/\s+/g, " "));
  };
  for (let m = tagRe.exec(source); m !== null; m = tagRe.exec(source)) {
    addText(source.slice(last, m.index));
    last = m.index + m[0].length;
    const closing = m[1] === "/";
    const name = (m[2] ?? "").toLowerCase();
    if (name === "br") {
      out += "\n";
    } else if (BLOCK_TAGS.has(name)) {
      breakLine();
      if (name === "li" && !closing) out += "- ";
    }
  }
  addText(source.slice(last).replace(/<[^>]*$/, ""));

  let text = out
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  text = text.replace(PRE_PLACEHOLDER, (_m, i: string) => pres[Number(i)] ?? "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  const max = options?.maxLength;
  return max === undefined ? text : truncate(text, max);
}
