import { expect, test } from "vitest";
import { Icons } from "@/components/ui/icon";
import { callsHeaderTitleLink, callsRecordHeaderIdentity } from "./calls-record-header";

const who = { id: "p1", name: "Ada Sample", module: "Contacts" };

test("title is the Who_Id name with module suffix link", () => {
  const record = { id: "c1", fields: { Who_Id: who, Subject: "Intro" } };
  expect(callsRecordHeaderIdentity(record, { orgSlug: "acme" })).toEqual({
    title: "Ada Sample",
    hasPortrait: false,
    recordNavigation: true,
    titleHref: expect.stringContaining("p1"),
    titleSuffix: " - Contacts",
  });
  expect(callsHeaderTitleLink(record)).toEqual({ ...who, suffix: " - Contacts" });
});

test("empty Who_Id falls back to Subject", () => {
  const record = { id: "c1", fields: { Who_Id: null, Subject: "Intro" } };
  expect(callsRecordHeaderIdentity(record).title).toBe("Intro");
  expect(callsHeaderTitleLink(record)).toBeUndefined();
  expect(callsRecordHeaderIdentity({ id: "c1", fields: {} }).title).toBe("");
});
