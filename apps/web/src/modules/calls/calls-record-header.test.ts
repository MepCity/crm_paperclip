import { expect, test } from "vitest";
import { Icons } from "@/components/ui/icon";
import { callsHeaderTitleLink, callsRecordHeaderIdentity } from "./calls-record-header";

const who = { id: "p1", name: "Ada Sample", module: "Contacts" };

test("title is the Who_Id name with module suffix link", () => {
  const record = { id: "c1", fields: { Who_Id: who, Subject: "Intro" } };
  expect(callsRecordHeaderIdentity(record)).toEqual({
    title: "Ada Sample",
    subtitle: "Contacts",
    hasPortrait: true,
    portraitIcon: Icons.phone,
    recordNavigation: true,
  });
  expect(callsHeaderTitleLink(record)).toEqual({ ...who, suffix: "- Contacts" });
});

test("title with orgSlug in context includes titleHref", () => {
  const record = { id: "c1", fields: { Who_Id: who, Subject: "Intro" } };
  expect(callsRecordHeaderIdentity(record, { orgSlug: "test-org" })).toEqual({
    title: "Ada Sample",
    titleHref: "/crm/test-org/tab/Contacts/p1",
    subtitle: "Contacts",
    hasPortrait: true,
    portraitIcon: Icons.phone,
    recordNavigation: true,
  });
  expect(callsHeaderTitleLink(record)).toEqual({ ...who, suffix: "- Contacts" });
});

test("empty Who_Id falls back to Subject", () => {
  const record = { id: "c1", fields: { Who_Id: null, Subject: "Intro" } };
  expect(callsRecordHeaderIdentity(record).title).toBe("Intro");
  expect(callsHeaderTitleLink(record)).toBeUndefined();
  expect(callsRecordHeaderIdentity({ id: "c1", fields: {} }).title).toBe("");
});
