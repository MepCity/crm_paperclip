import { describe, expect, it } from "vitest";
import {
  checkSignature,
  createBudgetCounter,
  createTextValidator,
  extensionOf,
  FilePolicyError,
  type FilePolicyErrorCode,
  inspectOoxml,
  isOoxml,
  type Kind,
  resolveAllowedType,
  selectionBudget,
} from "./file-policy";

const encode = (value: string) => new TextEncoder().encode(value);

function expectPolicyError(action: () => void, code: FilePolicyErrorCode) {
  let error: unknown;
  try {
    action();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(FilePolicyError);
  expect(error).toMatchObject({ code });
}

// Empty ZIP entries are enough to exercise package-directory inspection in memory.
function zip(names: string[]): Uint8Array {
  const localEntries: Uint8Array[] = [];
  const directoryEntries: Uint8Array[] = [];
  let offset = 0;
  for (const name of names) {
    const encoded = encode(name);
    const local = new Uint8Array(30 + encoded.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(26, encoded.length, true);
    local.set(encoded, 30);
    const entry = new Uint8Array(46 + encoded.length);
    const entryView = new DataView(entry.buffer);
    entryView.setUint32(0, 0x02014b50, true);
    entryView.setUint16(4, 20, true);
    entryView.setUint16(6, 20, true);
    entryView.setUint16(28, encoded.length, true);
    entryView.setUint32(42, offset, true);
    entry.set(encoded, 46);
    localEntries.push(local);
    directoryEntries.push(entry);
    offset += local.length;
  }
  const directorySize = directoryEntries.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, names.length, true);
  endView.setUint16(10, names.length, true);
  endView.setUint32(12, directorySize, true);
  endView.setUint32(16, offset, true);
  const archive = new Uint8Array(offset + directorySize + end.length);
  let position = 0;
  for (const part of [...localEntries, ...directoryEntries, end]) {
    archive.set(part, position);
    position += part.length;
  }
  return archive;
}

const inspect = (kind: Kind, archive: Uint8Array) =>
  inspectOoxml(kind, archive.length, async (start, length) => archive.slice(start, start + length));

async function expectInvalidPackage(kind: Kind, archive: Uint8Array, code: FilePolicyErrorCode) {
  const result = inspect(kind, archive);
  await expect(result).rejects.toBeInstanceOf(FilePolicyError);
  await expect(result).rejects.toMatchObject({ code });
}

const packages = [
  ["docx", "word/document.xml"],
  ["xlsx", "xl/workbook.xml"],
  ["pptx", "ppt/presentation.xml"],
] as const;

describe("extensionOf", () => {
  it.each([
    ["FILE.PDF", "pdf"],
    ["a.tar.PDF", "pdf"],
    ["folder/file.TXT", "txt"],
    ["folder\\file.TXT", "txt"],
    ["x/y.z\\file.txt", "txt"],
    ["file", ""],
    ["folder.name/file", ""],
    ["folder.name\\file", ""],
  ])("resolves %s to %s", (name, expected) => {
    expect(extensionOf(name)).toBe(expected);
  });
});

describe("resolveAllowedType", () => {
  it.each([
    ["pdf", "pdf", "application/pdf"],
    ["txt", "text", "text/plain"],
    ["csv", "text", "text/csv"],
    ["png", "png", "image/png"],
    ["jpg", "jpeg", "image/jpeg"],
    ["jpeg", "jpeg", "image/jpeg"],
    ["gif", "gif", "image/gif"],
    ["docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["xlsx", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ])("accepts .%s with or without its declared type", (extension, kind, mediaType) => {
    const fileName = `file.${extension}`;
    expect(resolveAllowedType({ fileName })).toMatchObject({ kind, mediaType });
    expect(resolveAllowedType({ fileName, mediaType })).toMatchObject({ kind, mediaType });
  });

  it.each(["file.exe", "file", "folder.pdf/file"])("rejects %s", (fileName) => {
    expectPolicyError(() => resolveAllowedType({ fileName }), "type_not_allowed");
  });

  it.each(["TEXT/CSV; charset=utf-8", "text/plain", "application/csv", "application/vnd.ms-excel"])(
    "accepts CSV declared as %s",
    (mediaType) => {
      expect(resolveAllowedType({ fileName: "file.csv", mediaType }).kind).toBe("text");
    },
  );

  it("rejects a declared type that disagrees with the extension", () => {
    expectPolicyError(
      () => resolveAllowedType({ fileName: "file.pdf", mediaType: "image/png" }),
      "type_not_allowed",
    );
  });
});

describe("checkSignature", () => {
  const signatures: [Kind, Uint8Array][] = [
    ["pdf", encode("%PDF-")],
    ["png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["jpeg", new Uint8Array([0xff, 0xd8, 0xff])],
    ["gif", encode("GIF87a")],
    ["gif", encode("GIF89a")],
    ...(["docx", "xlsx", "pptx"] as const).map((kind): [Kind, Uint8Array] => [
      kind,
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    ]),
  ];

  it.each(signatures)("checks valid, wrong and truncated %s heads", (kind, head) => {
    expect(() => checkSignature(kind, head)).not.toThrow();
    const wrong = head.slice();
    wrong[0] = 0;
    expectPolicyError(() => checkSignature(kind, wrong), "malformed");
    expectPolicyError(() => checkSignature(kind, head.slice(0, -1)), "malformed");
  });

  it("rejects GIF88a", () => {
    expectPolicyError(() => checkSignature("gif", encode("GIF88a")), "malformed");
  });

  it.each([new Uint8Array(), new Uint8Array([0, 0xff]), encode("plain text")])(
    "leaves text validation to the streaming validator (%j)",
    (head) => {
      expect(() => checkSignature("text", head)).not.toThrow();
    },
  );
});

describe("createTextValidator", () => {
  it("accepts UTF-8 split inside multi-byte characters", () => {
    const validator = createTextValidator();
    const data = encode("aé€😀z");
    for (const byte of data) validator.write(new Uint8Array([byte]));
    expect(() => validator.end()).not.toThrow();
  });

  it("rejects a NUL byte", () => {
    const validator = createTextValidator();
    expectPolicyError(() => validator.write(new Uint8Array([0x61, 0, 0x62])), "malformed");
  });

  it("rejects an invalid UTF-8 sequence", () => {
    const validator = createTextValidator();
    expectPolicyError(() => validator.write(new Uint8Array([0xc3, 0x28])), "malformed");
  });

  it("rejects a truncated multi-byte character only when ended", () => {
    const validator = createTextValidator();
    expect(() => validator.write(new Uint8Array([0xe2, 0x82]))).not.toThrow();
    expectPolicyError(() => validator.end(), "malformed");
  });
});

describe("inspectOoxml", () => {
  it.each(packages)("accepts a minimal %s package", async (kind, rootPart) => {
    await expect(inspect(kind, zip(["[Content_Types].xml", rootPart]))).resolves.toBeUndefined();
  });

  it.each(packages)("rejects %s without content types", async (kind, rootPart) => {
    await expectInvalidPackage(kind, zip([rootPart]), "malformed");
  });

  it.each(packages)("rejects %s without its root folder", async (kind) => {
    await expectInvalidPackage(
      kind,
      zip(["[Content_Types].xml", "other/document.xml"]),
      "malformed",
    );
  });

  it("rejects an archive without an end record", async () => {
    const archive = zip(["[Content_Types].xml", "word/document.xml"]);
    await expectInvalidPackage("docx", archive.slice(0, -22), "malformed");
  });

  it("rejects a directory whose offset plus size exceeds the file size", async () => {
    const archive = zip(["[Content_Types].xml", "word/document.xml"]);
    // The offset itself remains in bounds; adding the unchanged directory size exceeds EOF.
    new DataView(archive.buffer).setUint32(archive.length - 22 + 16, archive.length - 1, true);
    await expectInvalidPackage("docx", archive, "malformed");
  });

  it("rejects a corrupt central directory entry signature", async () => {
    const archive = zip(["[Content_Types].xml", "word/document.xml"]);
    const view = new DataView(archive.buffer);
    const directoryOffset = view.getUint32(archive.length - 22 + 16, true);
    view.setUint32(directoryOffset, 0, true);
    await expectInvalidPackage("docx", archive, "malformed");
  });

  it.each(packages)("rejects macros in any folder or case in %s", async (kind, rootPart) => {
    for (const macro of [
      "vbaProject.bin",
      "other/nested/VBAPROJECT.BIN",
      "elsewhere/vBaPrOjEcT.bIn",
    ]) {
      await expectInvalidPackage(
        kind,
        zip(["[Content_Types].xml", rootPart, macro]),
        "type_not_allowed",
      );
    }
  });
});

describe("isOoxml", () => {
  it.each<[Kind, boolean]>([
    ["docx", true],
    ["xlsx", true],
    ["pptx", true],
    ["pdf", false],
    ["text", false],
    ["png", false],
    ["jpeg", false],
    ["gif", false],
  ])("classifies %s as %s", (kind, expected) => {
    expect(isOoxml(kind)).toBe(expected);
  });
});

describe("selectionBudget", () => {
  it.each([
    ["record", 10, 100_000_000],
    ["note", 5, 20_000_000],
  ] as const)("returns an independent %s budget", (kind, maxFiles, maxBytes) => {
    const budget = selectionBudget(kind);
    expect(budget).toEqual({ maxFiles, maxBytes });
    budget.maxFiles = 0;
    budget.maxBytes = 0;
    expect(selectionBudget(kind)).toEqual({ maxFiles, maxBytes });
  });
});

describe("createBudgetCounter", () => {
  it("accepts exactly ten files and preserves state after a rejected eleventh", () => {
    const counter = createBudgetCounter(selectionBudget("record"));
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({ files: 0, bytes: 0 });
    for (let i = 0; i < 10; i++) counter.add(1);
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({ files: 10, bytes: 10 });
    expectPolicyError(() => counter.add(1), "too_large");
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({ files: 10, bytes: 10 });
  });

  it("accepts exactly 100 MB and preserves state after a rejected extra byte", () => {
    const counter = createBudgetCounter(selectionBudget("record"));
    counter.add(99_999_999);
    expectPolicyError(() => counter.add(2), "too_large");
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({ files: 1, bytes: 99_999_999 });
    counter.add(1);
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({
      files: 2,
      bytes: 100_000_000,
    });
    expectPolicyError(() => counter.add(1), "too_large");
    expect({ files: counter.files, bytes: counter.bytes }).toEqual({
      files: 2,
      bytes: 100_000_000,
    });
  });
});
