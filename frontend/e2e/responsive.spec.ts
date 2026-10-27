import { expect, test } from "@playwright/test";

import { addDebtOwedByMate, createFlat, expectNoAxeViolations, signIn } from "./helpers";

const PAGES = [
  "/",
  "/tasks",
  "/shopping",
  "/expenses",
  "/calendar",
  "/files",
  "/activity",
  "/roomies",
  "/profile",
];

const SIZES = [
  { name: "small phone", width: 320, height: 640, nav: "bottom" },
  { name: "phone", width: 390, height: 844, nav: "bottom" },
  { name: "landscape phone", width: 812, height: 375, nav: "bottom" },
  { name: "tablet", width: 768, height: 1024, nav: "bottom" },
  { name: "laptop", width: 1280, height: 800, nav: "sidebar" },
  { name: "full HD", width: 1920, height: 1080, nav: "sidebar" },
] as const;

for (const size of SIZES) {
  test.describe(`${size.name} (${size.width}x${size.height})`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("navigation adapts and no page scrolls sideways", async ({ page, request }) => {
      const flat = await createFlat(request);
      await addDebtOwedByMate(request, flat);
      await signIn(page, flat.mate);

      const bottomNav = page.getByRole("button", { name: "Más" });
      if (size.nav === "bottom") {
        await expect(bottomNav).toBeVisible();
      } else {
        await expect(bottomNav).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Calendario" })).toBeVisible();
      }

      for (const path of PAGES) {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
      }
    });

    test("interactive controls are at least 24px", async ({ page, request }) => {
      const flat = await createFlat(request);
      await signIn(page, flat.owner);
      for (const path of ["/", "/tasks", "/profile"]) {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        const small = await page.evaluate(() =>
          [...document.querySelectorAll("a, button, select, summary, input:not([type=file])")]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.width > 0 && !element.closest(".sr-only") && (box.width < 24 || box.height < 24)
              );
            })
            .map((element) => element.textContent?.trim() || element.getAttribute("aria-label")),
        );
        expect(small, `small targets on ${path}`).toEqual([]);
      }
    });
  });
}

test.describe("phone sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the More sheet reaches every secondary page and is accessible", async ({
    page,
    request,
  }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.getByRole("button", { name: "Más" }).click();
    const sheet = page.getByRole("dialog", { name: "Más" });
    await expect(sheet.getByRole("link")).toHaveCount(5);
    await expect(sheet.getByRole("group", { name: "Tema" })).toBeVisible();
    await expectNoAxeViolations(page);

    await sheet.getByRole("link", { name: "Calendario" }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
