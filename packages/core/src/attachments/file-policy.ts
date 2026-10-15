export type FilePolicyErrorCode = "too_large" | "type_not_allowed" | "malformed";

export class FilePolicyError extends Error {
  code: FilePolicyErrorCode;
  constructor(code: FilePolicyErrorCode, message?: string) {
    super(message ?? code);
    this.name = "FilePolicyError";
    this.code = code;
  }
}

type Kind = "pdf" | "text" | "png" | "jpeg" | "gif" | "docx" | "xlsx" | "pptx";

interface AllowedType {
  kind: Kind;
  mediaType: string;
  /** Additional declared types accepted for the same extension. */
  aliases: string[];
}

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const BY_EXTENSION: Record<string, AllowedType> = {
  pdf: { kind: "pdf", mediaType: "application/pdf", aliases: [] },
  txt: { kind: "text", mediaType: "text/plain", aliases: [] },
  csv: {
    kind: "text",
    mediaType: "text/csv",
    aliases: ["text/plain", "application/csv", "application/vnd.ms-excel"],
  },
  png: { kind: "png", mediaType: "image/png", aliases: [] },
  jpg: { kind: "jpeg", mediaType: "image/jpeg", aliases: [] },
  jpeg: { kind: "jpeg", mediaType: "image/jpeg", aliases: [] },
  gif: { kind: "gif", mediaType: "image/gif", aliases: [] },
  docx: { kind: "docx", mediaType: DOCX, aliases: [] },
  xlsx: { kind: "xlsx", mediaType: XLSX, aliases: [] },
  pptx: { kind: "pptx", mediaType: PPTX, aliases: [] },
};

const OOXML_ROOT: Partial<Record<Kind, string>> = {
  docx: "word/",
  xlsx: "xl/",
  pptx: "ppt/",
};

export const SIGNATURE_BYTES = 16;
/** Upper bound for the ZIP central directory we are willing to parse. */
const MAX_CENTRAL_DIRECTORY = 1_000_000;
const MAX_ZIP_ENTRIES = 5_000;

export function extensionOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot < 0 ? "" : base.slice(dot + 1).toLowerCase();
}

/** Resolves the allow-list entry from the extension and the declared type; throws when they disagree. */
export function resolveAllowedType(declared: {
  fileName: string;
  mediaType?: string;
}): AllowedType {
  const allowed = BY_EXTENSION[extensionOf(declared.fileName)];
  if (!allowed) throw new FilePolicyError("type_not_allowed", "File extension is not allowed");
  if (declared.mediaType) {
    const type = declared.mediaType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (type !== allowed.mediaType && !allowed.aliases.includes(type)) {
      throw new FilePolicyError("type_not_allowed", "Declared type does not match the extension");
    }
  }
  return allowed;
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/** Checks the first bytes against the signature of the allowed kind. Text is checked while streaming. */
export function checkSignature(kind: Kind, head: Uint8Array): void {
  const ok =
    kind === "pdf"
      ? startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])
      : kind === "png"
        ? startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        : kind === "jpeg"
          ? startsWith(head, [0xff, 0xd8, 0xff])
          : kind === "gif"
            ? startsWith(head, [0x47, 0x49, 0x46, 0x38]) &&
              (head[4] === 0x37 || head[4] === 0x39) &&
              head[5] === 0x61
            : kind === "text"
              ? true
              : startsWith(head, [0x50, 0x4b, 0x03, 0x04]);
  if (!ok) throw new FilePolicyError("malformed", "File content does not match its type");
}

/** Incremental UTF-8 text validator (no NUL bytes, no invalid sequences). */
export function createTextValidator(): { write(chunk: Uint8Array): void; end(): void } {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const fail = () => new FilePolicyError("malformed", "File is not valid UTF-8 text");
  return {
    write(chunk) {
      if (chunk.includes(0)) throw fail();
      try {
        decoder.decode(chunk, { stream: true });
      } catch {
        throw fail();
      }
    },
    end() {
      try {
        decoder.decode();
      } catch {
        throw fail();
      }
    },
  };
}

/** Bounded inspection of an OOXML (ZIP) package given its full bytes reader. */
export async function inspectOoxml(
  kind: Kind,
  size: number,
  readRange: (start: number, length: number) => Promise<Uint8Array>,
): Promise<void> {
  const malformed = (msg: string) => new FilePolicyError("malformed", msg);
  const tailLength = Math.min(size, 22 + 65_535);
  const tail = await readRange(size - tailLength, tailLength);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw malformed("ZIP end record not found");
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const entries = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (entries > MAX_ZIP_ENTRIES || cdSize > MAX_CENTRAL_DIRECTORY || cdOffset + cdSize > size) {
    throw malformed("ZIP directory is out of bounds");
  }
  const cd = await readRange(cdOffset, cdSize);
  const cdView = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  const names: string[] = [];
  let pos = 0;
  for (let n = 0; n < entries; n++) {
    if (pos + 46 > cd.length || cdView.getUint32(pos, true) !== 0x02014b50) {
      throw malformed("ZIP directory is corrupt");
    }
    const nameLength = cdView.getUint16(pos + 28, true);
    const extraLength = cdView.getUint16(pos + 30, true);
    const commentLength = cdView.getUint16(pos + 32, true);
    if (pos + 46 + nameLength > cd.length) throw malformed("ZIP directory is corrupt");
    names.push(new TextDecoder().decode(cd.subarray(pos + 46, pos + 46 + nameLength)));
    pos += 46 + nameLength + extraLength + commentLength;
  }
  if (!names.includes("[Content_Types].xml")) throw malformed("Missing content types part");
  const root = OOXML_ROOT[kind];
  if (root && !names.some((name) => name.startsWith(root))) {
    throw malformed("Package does not match its type");
  }
  if (names.some((name) => /(^|\/)vbaProject\.bin$/i.test(name))) {
    throw new FilePolicyError("type_not_allowed", "Macro-enabled files are not allowed");
  }
}

export function isOoxml(kind: Kind): boolean {
  return kind in OOXML_ROOT;
}

export type { AllowedType, Kind };

export type SelectionKind = "record" | "note";
export interface SelectionBudget {
  maxFiles: number;
  maxBytes: number;
}

const BUDGETS: Record<SelectionKind, SelectionBudget> = {
  record: { maxFiles: 10, maxBytes: 100_000_000 },
  note: { maxFiles: 5, maxBytes: 20_000_000 },
};

export function selectionBudget(kind: SelectionKind): SelectionBudget {
  return { ...BUDGETS[kind] };
}

/** Running counter for a selection; add() throws when a limit would be exceeded (limits are inclusive). */
export function createBudgetCounter(budget: SelectionBudget) {
  let files = 0;
  let bytes = 0;
  return {
    add(size: number): void {
      if (files + 1 > budget.maxFiles || bytes + size > budget.maxBytes) {
        throw new FilePolicyError("too_large", "Selection exceeds the allowed budget");
      }
      files += 1;
      bytes += size;
    },
    get files() {
      return files;
    },
    get bytes() {
      return bytes;
    },
  };
}
