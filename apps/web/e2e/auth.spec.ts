import { expectNoA11yViolations } from "./support/a11y";
import { signIn, signUpNewUser } from "./support/auth";
import { expect, test } from "./support/test";

/**
 * Chromium reports a failed auth response as a console error.
 * The screen does not call console.error; drop only that status line.
 */
function ignoreFailedResponses(errors: string[], statuses: readonly number[]) {
  const next = errors.filter(
    (error) => !statuses.some((status) => error.includes(`status of ${status}`)),
  );
  errors.splice(0, errors.length, ...next);
}

test("sign up opens organization creation", async ({ page }) => {
  await signUpNewUser(page, { name: "Ada Lovelace" });
  await expect(page).toHaveURL("/orgs/new");
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
});

test("sign out returns to sign in and home redirects there", async ({ page }) => {
  await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("a wrong password shows a general error and stays on sign in", async ({
  page,
  pageErrors,
}) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  const form = page.getByRole("form", { name: "Sign in" });
  await form
    .getByRole("textbox", { name: "Email" })
    .fill(`missing-${crypto.randomUUID()}@example.test`);
  await form.getByLabel("Password").fill("wrong-password");
  await form.getByRole("button", { name: "Sign in" }).click();
  const alert = form.getByRole("alert");
  await expect(alert).toHaveText(/Invalid email or password/);
  const unknownEmail = await alert.innerText();

  await form.getByRole("textbox", { name: "Email" }).fill(user.email);
  await form.getByLabel("Password").fill("wrong-password");
  await form.getByRole("button", { name: "Sign in" }).click();
  await expect(alert).toHaveText(unknownEmail);
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText("wrong-password")).toHaveCount(0);
  ignoreFailedResponses(pageErrors, [401]);
});

test("the correct password opens organization creation", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await signIn(page, user);
  await expect(page).toHaveURL("/orgs/new");
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
});

test("signing up again with the same email shows an error", async ({ page, pageErrors }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Name" }).fill(user.name);
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText("An account with this email already exists.")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);
  ignoreFailedResponses(pageErrors, [422]);
});

test("sign in follows a safe next path", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await signIn(page, user, { next: "/dev/ui" });
  await expect(page).toHaveURL("/dev/ui");
});

test("sign in ignores a protocol-relative next path", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/sign-in?next=//example.org");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("sign in ignores a next path that hides a host behind a tab", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/sign-in?next=/%09/example.org");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");

  await page.goto("/sign-in?next=/%09/example.org");
  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("sign in ignores a next path that resolves to a protocol-relative URL", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/sign-in?next=/.//example.org");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");

  await page.goto("/sign-in?next=/.//example.org");
  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("sign in ignores an absolute next URL", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/sign-in?next=https://example.org");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/orgs/new");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("a signed-in visitor is sent from sign in to organization creation", async ({ page }) => {
  await signUpNewUser(page);
  await page.goto("/sign-in");
  await expect(page).toHaveURL("/orgs/new");
});

test("auth screens have no accessibility violations", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("auth links keep the next path", async ({ page }) => {
  await page.goto("/sign-in?next=/dev/ui");
  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/sign-up?next=%2Fdev%2Fui");
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/sign-in?next=%2Fdev%2Fui");
});

test("sign up can be completed from the keyboard", async ({ page }) => {
  const email = `keys-${crypto.randomUUID()}@example.test`;
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Name" }).focus();
  await page.keyboard.type("Keyboard User");
  await page.keyboard.press("Tab");
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type("long-password-1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/orgs/new");
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
});
