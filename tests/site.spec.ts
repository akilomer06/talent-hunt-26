import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const events = [
  "code-break",
  "code-canvas",
  "neural-nexus",
  "binary-battle",
  "game-craft",
  "tech-talks",
  "cyber-breach",
  "prompt-pop",
  "shutter-verse",
  "clue-code",
  "trashion",
  "the-voice-over",
  "bgmi",
  "fifa",
  "valorant",
  "bid-wars",
];
const pages = [
  "/",
  "/events/technical",
  "/events/non-technical",
  "/schedule",
  "/register",
  "/about",
  "/venue",
  "/faqs",
  "/contact",
  "/privacy",
  ...events.map((s) => `/events/${s}`),
];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("th26:intro", "seen"));
});
test("every public route loads, hydrates, has one h1 and correct metadata without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const path of pages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.title()).toContain("2K26");
    await expect(page.locator("meta[name=description]")).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(70);
  }
  expect(errors).toEqual([]);
});
test("desktop accessibility on representative pages and all event templates", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/events/technical",
    "/events/non-technical",
    "/events/code-break",
    "/events/shutter-verse",
    "/register",
    "/schedule",
    "/about",
    "/venue",
    "/faqs",
    "/contact",
    "/privacy",
    "/unknown",
  ]) {
    await page.goto(path);
    await page.waitForTimeout(250);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
});
test("search, clear, direct links, back/forward and scroll restoration", async ({
  page,
}) => {
  await page.goto("/events/technical");
  await page.getByRole("searchbox").fill("code");
  await expect(page.getByRole("article")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Explore Code Canvas", exact: true })
    .scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => window.scrollY);
  await page
    .getByRole("link", { name: "Explore Code Canvas", exact: true })
    .click();
  await expect(page).toHaveURL(/code-canvas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Code Canvas",
  );
  await page.goBack();
  await expect(page.getByRole("searchbox")).toHaveValue("code");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(y, -1);
  await page.goForward();
  await expect(page).toHaveURL(/code-canvas$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Code Canvas",
  );
  await page.goto("/events/technical?q=unknown");
  await expect(page.getByText("No matching events.")).toBeVisible();
  await page
    .getByRole("button", { name: /Clear Filters/ })
    .first()
    .click();
  await expect(page.getByRole("article")).toHaveCount(8);
});
test("registration stays disabled and missing URLs reach a real 404", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("link", { name: "Open Registration Form" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Registration details have not yet been announced.", {
      exact: false,
    }),
  ).toBeVisible();
  const response = await page.goto("/events/nonexistent");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "PAGE NOT FOUND." }),
  ).toBeVisible();
});
test("mobile menu traps focus, closes with Escape, navigates, and layouts fit", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /Menu/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Menu/ })).toBeFocused();
  await page.getByRole("button", { name: /Menu/ }).click();
  await dialog.getByRole("link", { name: /Non-Technical Events/ }).click();
  await expect(page).toHaveURL(/non-technical/);
  await expect(dialog).not.toBeVisible();
  for (const path of [
    "/",
    "/events/non-technical",
    "/events/the-voice-over",
    "/register",
    "/about",
    "/contact",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-mobile-home.png`,
    fullPage: true,
  });
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});
test("keyboard accordion, reduced motion and screenshots", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/faqs");
  const question = page.getByRole("button", { name: "Who can participate?" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await page.goto("/");
  await expect(page.getByLabel("Opening animation")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-desktop-home.png`,
    fullPage: true,
  });
  await page.goto("/events/code-break");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-event.png`,
    fullPage: true,
  });
});
test("intro runs once per tab and provides an immediate skip", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    reducedMotion: "no-preference",
  });
  const fresh = await context.newPage();
  await fresh.goto("/", { waitUntil: "domcontentloaded" });
  await fresh.getByRole("button", { name: /Skip Intro/ }).click();
  await expect(fresh.getByLabel("Opening animation")).toHaveCount(0);
  await fresh.reload();
  await expect(fresh.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(fresh.getByLabel("Opening animation")).toHaveCount(0);
  await context.close();
});

test("responsive widths and local-only network requests", async ({ page }) => {
  const external = new Set<string>();
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173")) external.add(r.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/",
      "/events/technical",
      "/events/the-voice-over",
      "/register",
      "/venue",
      "/contact",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${path}`,
      ).toBe(true);
    }
  }
  expect([...external]).toEqual([]);
});

test("carousel rotates automatically and pauses on hover and focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Featured events" });
  await carousel.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(
    carousel.getByRole("heading", { name: /Shutter Verse/ }),
  ).toBeVisible({ timeout: 7500 });
  await carousel.hover();
  await page.waitForTimeout(5700);
  await expect(
    carousel.getByRole("heading", { name: /Shutter Verse/ }),
  ).toBeVisible();
  await carousel.getByRole("button", { name: "Next featured event" }).focus();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(5700);
  await expect(
    carousel.getByRole("heading", { name: /Shutter Verse/ }),
  ).toBeVisible();
});
