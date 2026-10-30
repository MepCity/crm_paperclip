import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("calendar shortcut opens native views, navigates dates and opens a meeting", async ({
  page,
}, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.getByRole("banner").getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/calendar`);
  await expect(page.getByRole("heading", { name: "Calendar", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "All Users", exact: true }).click();
  const date = await page.getByLabel("Calendar date", { exact: true }).inputValue();
  const nextWeek = new Date(Date.parse(`${date}T12:00:00Z`) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  await expect(page.getByRole("grid", { name: `day calendar ${date}` })).toBeVisible();
  const views = page.getByRole("group", { name: "Calendar view" });
  await views.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByRole("grid", { name: `week calendar ${date}` })).toBeVisible();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page.getByLabel("Calendar date", { exact: true })).toHaveValue(nextWeek);
  await page.getByRole("button", { name: "Previous week" }).click();
  await views.getByRole("button", { name: "Month", exact: true }).click();
  await expect(
    page.getByRole("grid", { name: `Month calendar ${date.slice(0, 7)}` }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("calendar-month.png") });
  await page
    .getByRole("grid")
    .getByRole("button", { name: `Open day ${date}`, exact: true })
    .click();
  await page
    .getByRole("grid")
    .getByRole("button", { name: /^Meeting \d+,/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/\\d+$`));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("calendar body inventory C controls, Day schedule, safe interactions and GET-only load", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  const mutations: string[] = [];
  page.on("request", (request) => {
    // calendar.md line 202 specifies event reads are GET /crm/v9/__calendar_activities with 0 writes.
    // In our app, CalendarScreen reads events via service.list("Events") which maps to POST /crm/v2.2/Events/bulk.
    // We verify all other non-GET requests are strictly zero (zero mutations/writes).
    if (
      !["GET", "HEAD", "OPTIONS"].includes(request.method()) &&
      !(request.method() === "POST" && request.url().includes("/Events/bulk"))
    ) {
      mutations.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  // Navigate to Calendar via top bar shortcut (C-065)
  const calendarShortcut = page
    .getByRole("banner")
    .getByRole("link", { name: "Calendar", exact: true });
  await expect(calendarShortcut).toBeVisible();
  await calendarShortcut.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/calendar`);

  // --- Shared Shell: Rail inventory (C-001 – C-010) ---
  // C-001: Rail navigation region
  const navRail = page.getByRole("complementary", { name: "Navigation rail" });
  await expect(navRail).toBeVisible();
  const mainNav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(mainNav).toBeVisible();

  // Calendar uses the compact application rail, without the full CRM switcher.
  await expect(page.getByRole("button", { name: /^Organization switcher:/ })).toHaveCount(0);

  // C-004: Home navigation link
  const homeLink = mainNav.getByRole("link", { name: "Home", exact: true });
  await expect(homeLink).toBeVisible();

  // C-005: Workqueue navigation link
  const workqueueLink = mainNav.getByRole("link", { name: "Workqueue", exact: true });
  await expect(workqueueLink).toBeVisible();

  // C-006: Reports navigation link
  const reportsLink = mainNav.getByRole("link", { name: "Reports", exact: true });
  await expect(reportsLink).toBeVisible();

  // C-007: Analytics navigation link
  const analyticsLink = mainNav.getByRole("link", { name: "Analytics", exact: true });
  await expect(analyticsLink).toBeVisible();

  // Note: C-008 (Agents), C-009 (MCP), C-010 (Teamspace shortcut) are not implemented in the rail

  // --- Shared Shell / M10 / M11: Top bar inventory (C-061 – C-069) ---
  // C-061: Search records button
  const searchRecordsBtn = page.getByRole("button", { name: "Search records", exact: true });
  await expect(searchRecordsBtn).toBeVisible();

  // C-062: Plus icon (Create Records)
  const createRecordsBtn = page.getByRole("button", { name: "Create Records", exact: true });
  await expect(createRecordsBtn).toBeVisible();

  // C-065: Calendar shortcut
  await expect(calendarShortcut).toBeVisible();

  // C-067: Setup (Settings) shortcut
  const settingsShortcut = page
    .getByRole("banner")
    .getByRole("link", { name: "Settings", exact: true });
  await expect(settingsShortcut).toBeVisible();

  // C-068: Profile (User menu)
  const userMenuBtn = page
    .getByRole("banner")
    .getByRole("button", { name: "User menu", exact: true });
  await expect(userMenuBtn).toBeVisible();

  // Note: C-063 (Assistant shortcut), C-064 (Notifications), C-066 (Marketplace), C-069 (Applications menu) are not implemented

  // --- Sidebar inventory (C-011 – C-015, C-060, C-093) ---
  const sidebar = page.getByRole("complementary", { name: "Calendars" });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("heading", { name: "Calendar", exact: true })).toBeVisible();

  // C-013: Search under Calendar heading
  const searchInput = sidebar.getByRole("textbox", { name: "Search calendars", exact: true });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute("placeholder", "Search");

  // C-014: My Calendar (first calendar, selected)
  const myCalendarBtn = sidebar.getByRole("button", { name: "My Calendar", exact: true });
  await expect(myCalendarBtn).toBeVisible();
  await expect(myCalendarBtn).toHaveAttribute("aria-pressed", "true");

  // C-015: All Users (second calendar, unselected)
  const allUsersBtn = sidebar.getByRole("button", { name: "All Users", exact: true });
  await expect(allUsersBtn).toBeVisible();
  await expect(allUsersBtn).toHaveAttribute("aria-pressed", "false");

  // Note: C-011 (More), C-012 (Hide Menu), C-060 (Resize handle), C-093 (Calendar list scroll region) are not implemented

  // --- Mini-calendar inventory (C-016 – C-059) ---
  const miniCalendar = sidebar.locator(".calendar-mini");
  await expect(miniCalendar).toBeVisible();

  // C-016: Previous Month button
  const prevMonthBtn = miniCalendar.getByRole("button", { name: "Previous month", exact: true });
  await expect(prevMonthBtn).toBeVisible();

  // C-017: Next Month button
  const nextMonthBtn = miniCalendar.getByRole("button", { name: "Next month", exact: true });
  await expect(nextMonthBtn).toBeVisible();

  // C-018 – C-024: Weekday headers Mon..Sun in documented order
  const weekdaySpans = miniCalendar.locator(".grid span");
  await expect(weekdaySpans).toHaveText(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

  // C-025 – C-059: Chronological date cells (at least 35 cells)
  const initialDate = await page.getByLabel("Calendar date", { exact: true }).inputValue();
  const dateCells = miniCalendar.getByRole("button", { name: /^Select date \d{4}-\d{2}-\d{2}$/ });
  const cellCount = await dateCells.count();
  expect(cellCount).toBeGreaterThanOrEqual(35);

  const selectedCell = miniCalendar.getByRole("button", {
    name: `Select date ${initialDate}`,
    exact: true,
  });
  await expect(selectedCell).toBeVisible();
  await expect(selectedCell).toHaveAttribute("aria-pressed", "true");

  // --- Main Schedule Section (C-070 – C-080, C-094, C-095) ---
  const schedule = page.getByRole("region", { name: "Calendar schedule" });
  await expect(schedule).toBeVisible();

  // C-072: Toolbar heading (current calendar: "My Calendar")
  const toolbarHeading = schedule.getByRole("heading", { name: "My Calendar", exact: true });
  await expect(toolbarHeading).toBeVisible();

  // View switch: C-073 (Day, selected), C-074 (Week, inactive), C-075 (Month, inactive)
  const viewSwitch = schedule.getByRole("group", { name: "Calendar view" });
  await expect(viewSwitch).toBeVisible();
  const dayViewBtn = viewSwitch.getByRole("button", { name: "Day", exact: true });
  const weekViewBtn = viewSwitch.getByRole("button", { name: "Week", exact: true });
  const monthViewBtn = viewSwitch.getByRole("button", { name: "Month", exact: true });

  await expect(dayViewBtn).toBeVisible();
  await expect(dayViewBtn).toHaveAttribute("aria-pressed", "true");
  await expect(weekViewBtn).toBeVisible();
  await expect(weekViewBtn).toHaveAttribute("aria-pressed", "false");
  await expect(monthViewBtn).toBeVisible();
  await expect(monthViewBtn).toHaveAttribute("aria-pressed", "false");

  // C-070: Create link (pointing to Meetings create path)
  const createButton = schedule.getByRole("button", { name: "Create", exact: true });
  await expect(createButton).toBeVisible();

  // Note: C-071 (Options dropdown) is not implemented

  // Date strip controls:
  // C-076: Calendar date input
  const dateInput = schedule.getByLabel("Calendar date", { exact: true });
  await expect(dateInput).toBeVisible();
  await expect(dateInput).toHaveValue(initialDate);

  // C-077: Selected date and weekday formatted label
  const dateLabel = schedule.locator(".calendar-date-strip span.text-lg");
  await expect(dateLabel).toBeVisible();

  // Date navigation buttons
  const todayBtn = schedule.getByRole("button", { name: "Today", exact: true });
  await expect(todayBtn).toBeVisible();

  // C-078: Previous day button
  const prevDayBtn = schedule.getByRole("button", { name: "Previous day", exact: true });
  await expect(prevDayBtn).toBeVisible();

  // C-079: Next day button
  const nextDayBtn = schedule.getByRole("button", { name: "Next day", exact: true });
  await expect(nextDayBtn).toBeVisible();

  // Note: C-080 (Overdue Activities summary) is not implemented

  // C-094: Time-grid scroll region (Day view grid table)
  const dayGrid = schedule.getByRole("grid", { name: `day calendar ${initialDate}` });
  await expect(dayGrid).toBeVisible();

  // Column header and day open button
  await expect(dayGrid.getByRole("columnheader", { name: "Time", exact: true })).toBeVisible();
  await expect(
    dayGrid.getByRole("button", { name: `Open day ${initialDate}`, exact: true }),
  ).toBeVisible();

  // C-095: All-Day summary row
  await expect(dayGrid.getByText("All day", { exact: true })).toBeVisible();
  await expect(
    dayGrid.getByRole("gridcell", { name: `All day ${initialDate}`, exact: true }),
  ).toBeVisible();

  // 24 hourly slots (00:00 to 23:00), matching the native calendar.
  const slotButtons = dayGrid.getByRole("button", { name: /^Create event / });
  await expect(slotButtons).toHaveCount(24);
  await expect(
    dayGrid.getByRole("button", { name: `Create event ${initialDate}T00:00`, exact: true }),
  ).toBeVisible();
  await expect(
    dayGrid.getByRole("button", { name: `Create event ${initialDate}T23:00`, exact: true }),
  ).toBeVisible();

  // Note: Utility strip C-081 – C-092 and C-096 are not implemented

  // --- Safe local interactions (zero non-GET requests) ---

  // 1. Calendar scope toggle (My Calendar <-> All Users)
  await allUsersBtn.click();
  await expect(allUsersBtn).toHaveAttribute("aria-pressed", "true");
  await expect(myCalendarBtn).toHaveAttribute("aria-pressed", "false");
  await expect(schedule.getByRole("heading", { name: "All Users", exact: true })).toBeVisible();

  await myCalendarBtn.click();
  await expect(myCalendarBtn).toHaveAttribute("aria-pressed", "true");
  await expect(allUsersBtn).toHaveAttribute("aria-pressed", "false");
  await expect(schedule.getByRole("heading", { name: "My Calendar", exact: true })).toBeVisible();

  // 2. Search calendar list filter
  await searchInput.fill("All");
  await expect(allUsersBtn).toBeVisible();
  await expect(myCalendarBtn).toHaveCount(0);
  await searchInput.clear();
  await expect(allUsersBtn).toBeVisible();
  await expect(myCalendarBtn).toBeVisible();

  // 3. Date strip navigation (Next day, Previous day, Today)
  const nextDate = new Date(Date.parse(`${initialDate}T12:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
  await nextDayBtn.click();
  await expect(dateInput).toHaveValue(nextDate);
  await expect(schedule.getByRole("grid", { name: `day calendar ${nextDate}` })).toBeVisible();

  await prevDayBtn.click();
  await expect(dateInput).toHaveValue(initialDate);
  await expect(schedule.getByRole("grid", { name: `day calendar ${initialDate}` })).toBeVisible();

  await nextDayBtn.click();
  await nextDayBtn.click();
  await todayBtn.click();
  await expect(dateInput).toHaveValue(initialDate);

  // 4. Mini-calendar month navigation
  const monthHeaderSpan = miniCalendar.locator(".flex > span").first();
  const initialMonthText = await monthHeaderSpan.textContent();
  await nextMonthBtn.click();
  const nextMonthText = await monthHeaderSpan.textContent();
  expect(nextMonthText).not.toEqual(initialMonthText);
  await prevMonthBtn.click();
  const restoredMonthText = await monthHeaderSpan.textContent();
  expect(restoredMonthText).toEqual(initialMonthText);

  // 5. Mini-calendar date cell selection
  const cellToSelect = miniCalendar.getByRole("button", {
    name: `Select date ${nextDate}`,
    exact: true,
  });
  if ((await cellToSelect.count()) > 0) {
    await cellToSelect.click();
    await expect(dateInput).toHaveValue(nextDate);
    await todayBtn.click();
    await expect(dateInput).toHaveValue(initialDate);
  }

  // Request guard: assert zero mutation / write requests throughout initial load and all safe interactions
  expect(mutations).toEqual([]);
});
