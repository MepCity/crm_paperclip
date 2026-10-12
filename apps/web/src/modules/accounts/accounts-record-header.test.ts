import { expect, test } from "vitest";
import {
  AccountBuildingPlaceholder,
  accountsRecordHeaderIdentity,
  formatWebsiteUrl,
} from "./accounts-record-header";
import { accountRecord } from "./test-metadata";

test("builds record header with Account_Name and optional Website link (AD-99)", () => {
  expect(accountsRecordHeaderIdentity(accountRecord({ Account_Name: "Acme Corporation" }))).toEqual(
    {
      title: "Acme Corporation",
      portraitIcon: AccountBuildingPlaceholder,
    },
  );

  expect(
    accountsRecordHeaderIdentity(
      accountRecord({ Account_Name: "Acme Corporation", Website: "acme.com" }),
    ),
  ).toEqual({
    title: "Acme Corporation",
    subtitle: "acme.com",
    subtitleHref: "https://acme.com",
    portraitIcon: AccountBuildingPlaceholder,
  });

  expect(
    accountsRecordHeaderIdentity(
      accountRecord({ Account_Name: "Acme Corporation", Website: "https://acme.com/portal" }),
    ),
  ).toEqual({
    title: "Acme Corporation",
    subtitle: "https://acme.com/portal",
    subtitleHref: "https://acme.com/portal",
    portraitIcon: AccountBuildingPlaceholder,
  });
});

test("omits subtitle when Website is empty or null", () => {
  expect(
    accountsRecordHeaderIdentity(accountRecord({ Account_Name: "Acme Corporation", Website: "" })),
  ).toEqual({
    title: "Acme Corporation",
    portraitIcon: AccountBuildingPlaceholder,
  });

  expect(
    accountsRecordHeaderIdentity(
      accountRecord({ Account_Name: "Acme Corporation", Website: null }),
    ),
  ).toEqual({
    title: "Acme Corporation",
    portraitIcon: AccountBuildingPlaceholder,
  });
});

test("formats website URLs with https prefix when absent", () => {
  expect(formatWebsiteUrl("example.com")).toBe("https://example.com");
  expect(formatWebsiteUrl("http://example.com")).toBe("http://example.com");
  expect(formatWebsiteUrl("https://example.com")).toBe("https://example.com");
  expect(formatWebsiteUrl("  ")).toBeUndefined();
  expect(formatWebsiteUrl(null)).toBeUndefined();
  expect(formatWebsiteUrl(undefined)).toBeUndefined();
});

test("renders building placeholder icon without reference image assets", () => {
  const element = AccountBuildingPlaceholder({ "aria-label": "Account Building" });
  expect(element.type).toBe("svg");
  expect(element.props.role).toBe("img");
  expect(element.props["aria-label"]).toBe("Account Building");
  expect(element.props.viewBox).toBe("0 0 48 48");
});
