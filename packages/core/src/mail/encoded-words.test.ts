import { describe, expect, it } from "vitest";
import { decodeEncodedWords } from "./encoded-words";

describe("decodeEncodedWords", () => {
  describe("Turkish characters with B and Q encodings", () => {
    it("decodes UTF-8 Base64 (B) encoded Turkish text", () => {
      // "Toplantı özeti"
      const encoded = "=?UTF-8?B?VG9wbGFudMSxIMO2emV0aQ==?=";
      expect(decodeEncodedWords(encoded)).toBe("Toplantı özeti");
    });

    it("decodes UTF-8 Quoted-Printable (Q) encoded Turkish text with underscores and hex escapes", () => {
      // "Toplantı özeti"
      const encoded = "=?UTF-8?Q?Toplant=C4=B1_=C3=B6zeti?=";
      expect(decodeEncodedWords(encoded)).toBe("Toplantı özeti");
    });

    it("decodes Turkish special characters (ğ, ş, ı, ö, ü, ç, İ) in UTF-8 B and Q", () => {
      // "Açık Çay, Ilık Şeker, Doğru Öğün, Güzel Üzüm"
      // UTF-8 bytes in Base64:
      const rawText = "Açık Çay, Ilık Şeker, Doğru Öğün, Güzel Üzüm";
      const bEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(rawText)))}?=`;
      expect(decodeEncodedWords(bEncoded)).toBe(rawText);

      // Q encoding with lowercase/uppercase hex escapes
      const qEncoded =
        "=?UTF-8?Q?A=C3=A7=C4=B1k_=C3=87ay,?= =?UTF-8?Q?_=C4=B1l=C4=B1k_=C5=9Eeker?=";
      expect(decodeEncodedWords(qEncoded)).toBe("Açık Çay, ılık Şeker");
    });

    it("decodes ISO-8859-9 (Turkish Latin-5) Q-encoded text", () => {
      // In ISO-8859-9: ı = 0xFD, ö = 0xF6
      const encoded = "=?iso-8859-9?Q?Toplant=FD_=F6zeti?=";
      expect(decodeEncodedWords(encoded)).toBe("Toplantı özeti");
    });

    it("decodes ISO-8859-9 (Turkish Latin-5) B-encoded text", () => {
      // In ISO-8859-9: "Toplantı özeti" bytes = [0x54, 0x6f, 0x70, 0x6c, 0x61, 0x6e, 0x74, 0xfd, 0x20, 0xf6, 0x7a, 0x65, 0x74, 0x69]
      // Base64 of those bytes: "VG9wbGFudP0g9npldGk="
      const encoded = "=?iso-8859-9?B?VG9wbGFudP0g9npldGk=?=";
      expect(decodeEncodedWords(encoded)).toBe("Toplantı özeti");
    });
  });

  describe("RFC 2047 §6.2 whitespace handling", () => {
    it("discards whitespace between two adjacent encoded-words", () => {
      const input = "=?utf-8?B?Zm9v?= =?utf-8?B?YmFy?=";
      expect(decodeEncodedWords(input)).toBe("foobar");
    });

    it("discards multiple spaces, tabs, and newlines (CRLF) between two adjacent encoded-words", () => {
      const input = "=?utf-8?B?Zm9v?=\r\n \t  =?utf-8?B?YmFy?=";
      expect(decodeEncodedWords(input)).toBe("foobar");
    });

    it("discards whitespace across three or more adjacent encoded-words", () => {
      const input = "=?utf-8?B?YQ==?=   =?utf-8?B?Yg==?=\t=?utf-8?B?Yw==?=";
      expect(decodeEncodedWords(input)).toBe("abc");
    });

    it("concatenates two adjacent encoded-words with no separator", () => {
      const input = "=?utf-8?B?Zm9v?==?utf-8?B?YmFy?=";
      expect(decodeEncodedWords(input)).toBe("foobar");
    });

    it("preserves whitespace between plain text and an encoded-word", () => {
      expect(decodeEncodedWords("Hello =?utf-8?B?V29ybGQ=?=")).toBe("Hello World");
      expect(decodeEncodedWords("=?utf-8?B?SGVsbG8=?= World")).toBe("Hello World");
    });

    it("preserves plain text and surrounding whitespace between two encoded-words", () => {
      const input = "=?utf-8?B?Zm9v?= and =?utf-8?B?YmFy?=";
      expect(decodeEncodedWords(input)).toBe("foo and bar");
    });

    it("preserves leading and trailing whitespace", () => {
      expect(decodeEncodedWords("   =?utf-8?B?SGVsbG8=?=   ")).toBe("   Hello   ");
    });
  });

  describe("RFC 2231 language tag and case-insensitivity", () => {
    it("accepts RFC 2231 language suffix (e.g. utf-8*tr, iso-8859-9*tr-TR)", () => {
      const bEncoded = "=?utf-8*tr?B?VG9wbGFudMSxIMO2emV0aQ==?=";
      expect(decodeEncodedWords(bEncoded)).toBe("Toplantı özeti");

      const qEncoded = "=?ISO-8859-9*tr-TR?Q?Toplant=FD_=F6zeti?=";
      expect(decodeEncodedWords(qEncoded)).toBe("Toplantı özeti");
    });

    it("handles lowercase 'b' and 'q' encoding specifiers", () => {
      expect(decodeEncodedWords("=?utf-8?b?VG9wbGFudMSx?=")).toBe("Toplantı");
      expect(decodeEncodedWords("=?utf-8?q?Toplant=c4=b1?=")).toBe("Toplantı");
    });

    it("handles mixed case charset names (e.g. UtF-8, Iso-8859-1)", () => {
      expect(decodeEncodedWords("=?UtF-8?B?SGVsbG8=?=")).toBe("Hello");
      expect(decodeEncodedWords("=?Iso-8859-1?Q?caf=e9?=")).toBe("café");
    });
  });

  describe("other supported charsets (ISO-8859-1, Windows-1252, US-ASCII)", () => {
    it("decodes ISO-8859-1", () => {
      expect(decodeEncodedWords("=?iso-8859-1?Q?caf=E9?=")).toBe("café");
    });

    it("decodes Windows-1252", () => {
      // 0x80 in windows-1252 is Euro sign €
      expect(decodeEncodedWords("=?windows-1252?Q?=80100?=")).toBe("€100");
    });

    it("decodes US-ASCII", () => {
      expect(decodeEncodedWords("=?us-ascii?Q?Simple_Subject?=")).toBe("Simple Subject");
    });
  });

  describe("error resilience: malformed encodings and unknown charsets", () => {
    it("leaves corrupt base64 raw without throwing", () => {
      const corruptChars = "=?utf-8?B?!!!?=";
      expect(decodeEncodedWords(corruptChars)).toBe(corruptChars);

      const invalidPadding = "=?utf-8?B?VG9w===?=";
      expect(decodeEncodedWords(invalidPadding)).toBe(invalidPadding);

      const invalidLength = "=?utf-8?B?a?=";
      expect(decodeEncodedWords(invalidLength)).toBe(invalidLength);

      // Invalid UTF-8 byte sequence in base64 (0xFF 0xFF -> //8=)
      const invalidUtf8 = "=?utf-8?B?//8=?=";
      expect(decodeEncodedWords(invalidUtf8)).toBe(invalidUtf8);
    });

    it("leaves corrupt Q-encoding raw without throwing", () => {
      const truncatedHex = "=?utf-8?Q?test=3?=";
      expect(decodeEncodedWords(truncatedHex)).toBe(truncatedHex);

      const invalidHex = "=?utf-8?Q?test=ZZ?=";
      expect(decodeEncodedWords(invalidHex)).toBe(invalidHex);

      const invalidUtf8 = "=?utf-8?Q?=FF=FF?=";
      expect(decodeEncodedWords(invalidUtf8)).toBe(invalidUtf8);
    });

    it("leaves unknown charset raw without throwing", () => {
      const unknownB = "=?unknown-charset-xyz?B?VG9wbGFudMSxIMO2emV0aQ==?=";
      expect(decodeEncodedWords(unknownB)).toBe(unknownB);

      const unknownQ = "=?fake-charset?Q?Hello_World?=";
      expect(decodeEncodedWords(unknownQ)).toBe(unknownQ);
    });

    it("preserves whitespace between a valid decoded-word and an unencoded/corrupt word", () => {
      const input1 = "=?utf-8?B?Zm9v?= =?unknown?B?YmFy?=";
      expect(decodeEncodedWords(input1)).toBe("foo =?unknown?B?YmFy?=");

      const input2 = "=?unknown?B?Zm9v?= =?utf-8?B?YmFy?=";
      expect(decodeEncodedWords(input2)).toBe("=?unknown?B?Zm9v?= bar");
    });
  });

  describe("text without encoded words", () => {
    it("returns unchanged text when no encoded-words exist", () => {
      expect(decodeEncodedWords("Re: Monthly invoice #12345")).toBe("Re: Monthly invoice #12345");
      expect(decodeEncodedWords("")).toBe("");
      expect(decodeEncodedWords("   ")).toBe("   ");
    });

    it("returns unchanged text with incomplete or false delimiter patterns", () => {
      expect(decodeEncodedWords("=?not-an-encoded-word")).toBe("=?not-an-encoded-word");
      expect(decodeEncodedWords("=?utf-8?X?something?=")).toBe("=?utf-8?X?something?=");
      expect(decodeEncodedWords("=?utf-8?B?no-closing")).toBe("=?utf-8?B?no-closing");
    });
  });

  describe("typical email header scenarios", () => {
    it("decodes Subject headers with prefix and suffix", () => {
      const header = "Re: =?UTF-8?B?VG9wbGFudMSxIMO2emV0aQ==?= [URGENT]";
      expect(decodeEncodedWords(header)).toBe("Re: Toplantı özeti [URGENT]");
    });

    it("decodes display name in From/To address headers", () => {
      const header = '"=?UTF-8?B?QWxpY2UgRXhhbXBsZQ==?=" <alice@example.com>';
      expect(decodeEncodedWords(header)).toBe('"Alice Example" <alice@example.com>');
    });

    it("decodes unquoted display name with Q-encoding in address header", () => {
      const header = "=?UTF-8?Q?Toplant=C4=B1_Grubu?= <meeting@example.com>";
      expect(decodeEncodedWords(header)).toBe("Toplantı Grubu <meeting@example.com>");
    });
  });
});
