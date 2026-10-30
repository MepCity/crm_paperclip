import { expect, test } from "vitest";
import { translator } from "./catalogs";
import { builtInViewLabel } from "./record-labels";

test("translates built-in view names and preserves user-created names", () => {
  const t = translator("tr");
  expect(
    builtInViewLabel(
      { name: "All Leads", systemDefined: true, isDefault: true },
      "Leads",
      "Müşteri Adayları",
      t,
    ),
  ).toBe("Tüm Müşteri Adayları");
  expect(
    builtInViewLabel(
      { name: "All Leads", systemDefined: false, isDefault: false },
      "Leads",
      "Müşteri Adayları",
      t,
    ),
  ).toBe("All Leads");
  expect(
    builtInViewLabel(
      { name: "All Leads", systemDefined: false, isDefault: true },
      "Leads",
      "Müşteri Adayları",
      t,
    ),
  ).toBe("All Leads");
  expect(
    builtInViewLabel(
      { name: "My Contacts", systemDefined: true, isDefault: false },
      "Contacts",
      "Kişiler",
      t,
    ),
  ).toBe("Bana Ait Kişiler");
});

test.each([
  ["Campaigns", "Kampanyalar", "My Active Campaigns", "Bana Ait Aktif Kampanyalar"],
  ["Campaigns", "Kampanyalar", "Unread Campaigns", "Görüntülenmemiş Kampanyalar"],
  ["Cases", "Servis Dosyaları", "Open Cases", "Açık Servis Dosyaları"],
  ["Cases", "Servis Dosyaları", "Escalated Cases", "Eskale Edilmiş Servis Dosyaları"],
  ["Cases", "Servis Dosyaları", "Today's Cases", "Bugünün Servis Dosyaları"],
  ["Solutions", "Çözümler", "Unread Solutions", "Görüntülenmemiş Çözümler"],
])(
  "translates the system view %s / %s / %s and preserves identical custom names",
  (module, plural, name, expected) => {
    const view = { name, systemDefined: true, isDefault: false };
    expect(builtInViewLabel(view, module, plural, translator("tr"))).toBe(expected);
    expect(builtInViewLabel(view, module, module, translator("en"))).toBe(name);
    expect(
      builtInViewLabel({ ...view, systemDefined: false }, module, plural, translator("tr")),
    ).toBe(name);
  },
);
