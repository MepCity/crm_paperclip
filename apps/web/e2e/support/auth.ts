import type { Page } from "@playwright/test";
import { expect } from "./test";

export type AuthCredentials = {
  name: string;
  email: string;
  password: string;
};

const DEFAULT_PASSWORD = "long-password-1";

/** Max wait for auth forms to finish navigation after submit. */
export const AUTH_NAVIGATION_TIMEOUT_MS = 30_000;

/** Registers through the UI with a unique email unless one is provided. */
export async function signUpNewUser(
  page: Page,
  overrides?: Partial<AuthCredentials>,
): Promise<AuthCredentials> {
  const credentials: AuthCredentials = {
    name: overrides?.name ?? "Test User",
    email: overrides?.email ?? `user-${crypto.randomUUID()}@example.test`,
    password: overrides?.password ?? DEFAULT_PASSWORD,
  };

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Name" }).fill(credentials.name);
  await page.getByRole("textbox", { name: "Email" }).fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/orgs/new", { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
  return credentials;
}

/** Signs in through the form and waits until the page leaves /sign-in. Pass `next` to start from a destination query. A sign-in that must fail fills the form in the test instead. */
export async function signIn(
  page: Page,
  credentials: Pick<AuthCredentials, "email" | "password">,
  options?: { next?: string },
): Promise<void> {
  const path =
    options?.next === undefined ? "/sign-in" : `/sign-in?next=${encodeURIComponent(options.next)}`;
  await page.goto(path);
  await page.getByRole("textbox", { name: "Email" }).fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (options?.next !== undefined) {
    await page.waitForURL((url) => new URL(url).pathname === options.next, {
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
    });
  } else {
    await page.waitForURL((url) => new URL(url).pathname !== "/sign-in", {
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
    });
  }
}
