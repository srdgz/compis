import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import sharp from "sharp";

const OUT = resolve(process.cwd(), "../docs/screenshots");
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

test.describe.configure({ mode: "serial" });

async function save(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  mkdirSync(OUT, { recursive: true });
  const png = await page.screenshot();
  writeFileSync(resolve(OUT, `${name}.webp`), await sharp(png).webp({ quality: 86 }).toBuffer());
}

async function demoLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Probar con una cuenta de demostración" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola, Lucía");
}

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP, colorScheme: "light" });

  test("sign-in, dashboard, tasks and payments in the light theme", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Te damos la bienvenida" })).toBeVisible();
    await save(page, "login");

    await demoLogin(page);
    await save(page, "dashboard-light");

    await page.goto("/tasks");
    await expect(page.getByText("Pagar el recibo del agua")).toBeVisible();
    await save(page, "tasks");

    await page.goto("/expenses");
    await expect(page.getByRole("button", { name: "Pagar", exact: true })).toBeVisible();
    await save(page, "expenses");

    await page.getByRole("button", { name: "Pagar", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Pagar una deuda" })).toBeVisible();
    await save(page, "pay-dialog");
  });
});

test.describe("dark theme", () => {
  test.use({ viewport: DESKTOP, colorScheme: "dark" });

  test("dashboard in the dark theme", async ({ page }) => {
    await demoLogin(page);
    await save(page, "dashboard-dark");
  });
});

test.describe("phone", () => {
  test.use({ viewport: PHONE, colorScheme: "light", deviceScaleFactor: 2, isMobile: true });

  test("mobile dashboard and navigation sheet", async ({ page }) => {
    await demoLogin(page);
    await save(page, "mobile-dashboard");

    await page.getByRole("button", { name: "Más" }).click();
    await expect(page.getByRole("dialog", { name: "Más" })).toBeVisible();
    await save(page, "mobile-menu");
  });
});
