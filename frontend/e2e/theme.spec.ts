import { expect, test } from "@playwright/test";

import { createFlat, signIn } from "./helpers";

const LIGHT_BACKGROUND = "rgb(245, 250, 249)";
const DARK_BACKGROUND = "rgb(10, 26, 26)";

async function background(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.describe("theme", () => {
  test.use({ colorScheme: "light" });

  test("the sign-in pages show no theme control and follow the browser", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("group", { name: "Tema" })).toHaveCount(0);
    expect(await background(page)).toBe(LIGHT_BACKGROUND);

    await page.emulateMedia({ colorScheme: "dark" });
    expect(await background(page)).toBe(DARK_BACKGROUND);
  });

  test("a theme chosen in the sidebar persists but never leaks into the sign-in pages", async ({
    page,
    request,
  }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    expect(await background(page)).toBe(LIGHT_BACKGROUND);

    await page.getByRole("group", { name: "Tema" }).getByText("Oscuro").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await background(page)).toBe(DARK_BACKGROUND);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    expect(await background(page)).toBe(LIGHT_BACKGROUND);

    await signIn(page, owner);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("group", { name: "Tema" }).getByText("Auto").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  });
});
