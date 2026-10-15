export type Charset = "UTF-8" | "ISO-8859-1";

export type CsvErrorCode =
  | "malformed_csv"
  | "empty_file"
  | "no_header"
  | "duplicate_header"
  | "too_many_columns"
  | "too_many_rows"
  | "bad_encoding";

export class CsvError extends Error {
  constructor(
    readonly code: CsvErrorCode,
    readonly line?: number,
  ) {
    super(line === undefined ? code : `${code} (line ${line})`);
    this.name = "CsvError";
  }
}

const MAX_CONSECUTIVE_BLANK_ROWS = 10;

function decode(bytes: Uint8Array, charset: Charset): string {
  let text: string;
  if (charset === "ISO-8859-1") {
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += 8192) {
      parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    }
    text = parts.join("");
  } else {
    try {
      text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch {
      throw new CsvError("bad_encoding");
    }
  }
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

const isBlankRow = (row: string[]) => row.every((c) => c.trim() === "");

export function parseCsv(
  bytes: Uint8Array,
  opts: { charset: Charset; maxColumns: number; maxRows: number },
): { headers: string[]; rows: string[][] } {
  const text = decode(bytes, opts.charset);
  if (text.trim() === "") throw new CsvError("empty_file");

  let headers: string[] | null = null;
  const rows: string[][] = [];
  let blankRun = 0;
  let done = false;

  const pushRow = (row: string[], line: number) => {
    if (row.length > opts.maxColumns) throw new CsvError("too_many_columns", line);
    if (isBlankRow(row)) {
      if (headers) {
        blankRun += 1;
        if (blankRun > MAX_CONSECUTIVE_BLANK_ROWS) done = true;
      }
      return;
    }
    blankRun = 0;
    if (!headers) {
      const trimmed = row.map((c) => c.trim());
      if (trimmed.some((c) => c === "")) throw new CsvError("no_header", line);
      const seen = new Set<string>();
      for (const h of trimmed) {
        const key = h.toLowerCase();
        if (seen.has(key)) throw new CsvError("duplicate_header", line);
        seen.add(key);
      }
      headers = trimmed;
      return;
    }
    if (row.length > headers.length) throw new CsvError("malformed_csv", line);
    if (rows.length >= opts.maxRows) throw new CsvError("too_many_rows", line);
    while (row.length < headers.length) row.push("");
    rows.push(row);
  };

  const n = text.length;
  let i = 0;
  let line = 1;
  while (i < n && !done) {
    const startLine = line;
    const row: string[] = [];
    let field = "";
    let rowEnded = false;
    while (!rowEnded) {
      if (text[i] === '"' && field === "") {
        const openLine = line;
        i += 1;
        let closed = false;
        while (i < n) {
          const ch = text[i] as string;
          if (ch === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
              continue;
            }
            closed = true;
            i += 1;
            break;
          }
          if (ch === "\r") {
            if (text[i + 1] === "\n") i += 1;
            line += 1;
            field += "\n";
          } else if (ch === "\n") {
            line += 1;
            field += "\n";
          } else {
            field += ch;
          }
          i += 1;
        }
        if (!closed) throw new CsvError("malformed_csv", openLine);
        const next = text[i];
        if (next !== undefined && next !== "," && next !== "\r" && next !== "\n") {
          throw new CsvError("malformed_csv", line);
        }
      }
      // unquoted remainder (or nothing after a quoted field)
      while (i < n) {
        const ch = text[i] as string;
        if (ch === "," || ch === "\r" || ch === "\n") break;
        field += ch;
        i += 1;
      }
      row.push(field);
      field = "";
      if (i >= n) {
        rowEnded = true;
      } else if (text[i] === ",") {
        i += 1;
        if (i >= n) {
          row.push("");
          rowEnded = true;
        }
      } else {
        if (text[i] === "\r" && text[i + 1] === "\n") i += 1;
        i += 1;
        line += 1;
        rowEnded = true;
      }
    }
    pushRow(row, startLine);
  }

  if (!headers) throw new CsvError("empty_file");
  return { headers, rows };
}

const NUMERIC = /^[+-]?\d+(\.\d+)?$/;

export function neutralizeCell(value: string): string {
  if (value === "") return value;
  const first = value[0] as string;
  if ("=+-@\t\r".includes(first) && !NUMERIC.test(value)) return `'${value}`;
  return value;
}

function quoteCell(raw: string): string {
  const value = neutralizeCell(raw);
  if (/[",\r\n]/.test(value) || value !== value.trim()) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const lines = [headers, ...rows].map((r) => r.map(quoteCell).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
