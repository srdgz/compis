import { expect, test } from "@playwright/test";

import { addDebtOwedByMate, createFlat, expectNoAxeViolations, signIn } from "./helpers";

const SIZES = [
  { name: "small phone", width: 320, height: 640, sheet: true },
  { name: "phone", width: 390, height: 844, sheet: true },
  { name: "landscape phone", width: 812, height: 375, sheet: false },
  { name: "tablet", width: 768, height: 1024, sheet: false },
  { name: "laptop", width: 1280, height: 800, sheet: false },
] as const;

test.describe("assistant", () => {
  test("answers what I owe from my own data", async ({ page, request }) => {
    const flat = await createFlat(request);
    await addDebtOwedByMate(request, flat);
    await signIn(page, flat.mate);

    await page.getByRole("button", { name: "Asistente" }).click();
    const drawer = page.getByRole("dialog", { name: "Asistente" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "¿Cuánto debo?" }).click();

    const log = drawer.getByRole("log", { name: "Conversación" });
    await expect(log).toContainText("Debes 15,00 € en total");
    await expect(log).toContainText("Lucia");
    await expect(log).toContainText("Compra E2E");
    await expect(drawer.getByText("Resumen automático")).toBeVisible();

    await drawer.getByLabel("Tu pregunta").fill("¿Qué hay en la lista de la compra?");
    await drawer.getByLabel("Tu pregunta").press("Enter");
    await expect(log).toContainText("La lista de la compra está vacía.");
  });

  test("the creditor sees what they are owed", async ({ page, request }) => {
    const flat = await createFlat(request);
    await addDebtOwedByMate(request, flat);
    await signIn(page, flat.owner);

    await page.getByRole("button", { name: "Asistente" }).click();
    const drawer = page.getByRole("dialog", { name: "Asistente" });
    await drawer.getByRole("button", { name: "¿Quién me debe?" }).click();
    await expect(drawer.getByRole("log")).toContainText("Te deben 15,00 € en total");
    await expect(drawer.getByRole("log")).toContainText("Marcos");
  });

  test("closes with Escape and gives focus back to the button", async ({ page, request }) => {
    const flat = await createFlat(request);
    await signIn(page, flat.owner);
    const trigger = page.getByRole("button", { name: "Asistente" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Asistente" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Asistente" })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`has no accessibility violations while open (${colorScheme})`, async ({
      page,
      request,
    }) => {
      await page.emulateMedia({ colorScheme });
      const flat = await createFlat(request);
      await addDebtOwedByMate(request, flat);
      await signIn(page, flat.mate);
      await page.getByRole("button", { name: "Asistente" }).click();
      const drawer = page.getByRole("dialog", { name: "Asistente" });
      await drawer.getByRole("button", { name: "¿Cuánto debo?" }).click();
      await expect(drawer.getByRole("log")).toContainText("Debes");
      await expectNoAxeViolations(page);
    });
  }
});

for (const size of SIZES) {
  test.describe(`assistant on a ${size.name} (${size.width}x${size.height})`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("fits the screen and keeps the input reachable", async ({ page, request }) => {
      const flat = await createFlat(request);
      await addDebtOwedByMate(request, flat);
      await signIn(page, flat.mate);

      const button = await page.getByRole("button", { name: "Asistente" }).boundingBox();
      expect(button).not.toBeNull();
      expect(button!.x + button!.width).toBeLessThanOrEqual(size.width);
      expect(button!.y + button!.height).toBeLessThanOrEqual(size.height);
      if (size.width < 1024) {
        const nav = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
        expect(button!.y + button!.height).toBeLessThanOrEqual(nav!.y);
      }

      await page.getByRole("button", { name: "Asistente" }).click();
      const drawer = page.getByRole("dialog", { name: "Asistente" });
      await expect(drawer).toBeVisible();
      await page.waitForTimeout(400);
      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
      if (size.sheet) {
        expect(box!.width).toBeGreaterThanOrEqual(size.width - 1);
        expect(box!.y).toBeGreaterThan(0);
      } else {
        expect(box!.height).toBeGreaterThanOrEqual(size.height - 1);
      }

      const input = drawer.getByLabel("Tu pregunta");
      await expect(input).toBeInViewport();
      await input.fill("¿Qué tareas tengo?");
      await input.press("Enter");
      await expect(drawer.getByRole("log")).toContainText("No tienes tareas pendientes.");
      await expect(input).toBeInViewport();
      await expect(drawer.getByRole("button", { name: "Cerrar el asistente" })).toBeInViewport();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  });
}
