const TURKISH_ASCII: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

const MAX_SLUG_LENGTH = 40;

/** Suggests an organization slug from a display name. */
export function slugify(value: string): string {
  const mapped = value.replace(/[çÇğĞıİöÖşŞüÜ]/g, (letter) => TURKISH_ASCII[letter] ?? letter);
  const hyphenated = mapped
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return hyphenated.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
}
