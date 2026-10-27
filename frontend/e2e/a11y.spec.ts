import { test } from "@playwright/test";

import { addDebtOwedByMate, createFlat, expectNoAxeViolations, signIn } from "./helpers";
import type { Flat } from "./helpers";

const PUBLIC_PAGES = ["/login", "/signup"];
const PRIVATE_PAGES = [
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

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility with real contrast checks (${colorScheme})`, () => {
    test.use({ colorScheme });

    for (const path of PUBLIC_PAGES) {
      test(`${path} has no violations`, async ({ page }) => {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await expectNoAxeViolations(page);
      });
    }

    test("every page of a populated flat has no violations", async ({ page, request }) => {
      const flat: Flat = await createFlat(request);
      await addDebtOwedByMate(request, flat);
      await signIn(page, flat.mate);

      for (const path of PRIVATE_PAGES) {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForLoadState("networkidle");
        await expectNoAxeViolations(page);
      }
    });

    test("the dialogs have no violations", async ({ page, request }) => {
      const flat = await createFlat(request);
      await addDebtOwedByMate(request, flat);
      await signIn(page, flat.mate);

      await page.goto("/tasks");
      await page.getByRole("button", { name: "Nueva tarea" }).click();
      await page.getByRole("dialog", { name: "Nueva tarea" }).waitFor();
      await expectNoAxeViolations(page);

      await page.goto("/expenses");
      await page.getByRole("button", { name: "Pagar", exact: true }).click();
      await page.getByRole("dialog", { name: "Pagar una deuda" }).waitFor();
      await expectNoAxeViolations(page);
    });
  });
}
