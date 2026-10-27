import { expect, test } from "@playwright/test";

import { addDebtOwedByMate, createFlat, signIn } from "./helpers";

test.describe("paying a debt", () => {
  test("the debtor reports a cash payment and the creditor confirms it", async ({
    browser,
    request,
  }) => {
    const flat = await createFlat(request);
    await addDebtOwedByMate(request, flat, 30);

    const matePage = await (await browser.newContext()).newPage();
    await signIn(matePage, flat.mate);
    await matePage.goto("/expenses");
    await expect(matePage.getByText("Debes en total").locator("..")).toContainText("15,00");
    await matePage.getByRole("button", { name: "Pagar", exact: true }).click();
    await matePage.getByRole("button", { name: "Ya se lo he pagado" }).click();
    await expect(matePage.getByText("Hemos avisado a Lucia")).toBeVisible();
    await expect(matePage.getByText("Esperando a que Lucia confirme")).toBeVisible();

    const ownerPage = await (await browser.newContext()).newPage();
    await signIn(ownerPage, flat.owner);
    await ownerPage.goto("/expenses");
    await expect(ownerPage.getByText("Pagado en efectivo.")).toBeVisible();
    await ownerPage.getByRole("button", { name: "Confirmar que lo he recibido" }).click();
    await expect(ownerPage.getByText("Pago confirmado. La deuda queda saldada.")).toBeVisible();
    await expect(ownerPage.getByText("Deudas saldadas (1)")).toBeVisible();
    await expect(ownerPage.getByText("Nadie te debe nada")).toBeVisible();

    await matePage.reload();
    await expect(matePage.getByText("No debes nada")).toBeVisible();
  });

  test("the creditor can reject a payment that never arrived", async ({ browser, request }) => {
    const flat = await createFlat(request);
    await addDebtOwedByMate(request, flat, 20);

    const matePage = await (await browser.newContext()).newPage();
    await signIn(matePage, flat.mate);
    await matePage.goto("/expenses");
    await matePage.getByRole("button", { name: "Pagar", exact: true }).click();
    await matePage.getByRole("button", { name: "Ya se lo he pagado" }).click();
    await expect(matePage.getByText("Esperando a que Lucia confirme")).toBeVisible();

    const ownerPage = await (await browser.newContext()).newPage();
    await signIn(ownerPage, flat.owner);
    await ownerPage.goto("/expenses");
    await ownerPage.getByRole("button", { name: "No lo he recibido" }).click();
    await expect(ownerPage.getByText("Hemos devuelto la deuda a pendiente.")).toBeVisible();

    await matePage.reload();
    await expect(matePage.getByRole("button", { name: "Pagar", exact: true })).toBeVisible();
  });

  test("a PayPal.Me link carries the creditor's username and the exact amount", async ({
    browser,
    request,
  }) => {
    const flat = await createFlat(request);
    await addDebtOwedByMate(request, flat, 24.5);

    const ownerPage = await (await browser.newContext()).newPage();
    await signIn(ownerPage, flat.owner);
    await ownerPage.goto("/profile");
    await ownerPage.getByLabel("Usuario de PayPal.Me").fill("https://paypal.me/luciademo");
    await ownerPage.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(ownerPage.getByText("Perfil actualizado.")).toBeVisible();

    const matePage = await (await browser.newContext()).newPage();
    await signIn(matePage, flat.mate);
    await matePage.goto("/expenses");
    await matePage.getByRole("button", { name: "Pagar", exact: true }).click();
    const link = matePage.getByRole("link", { name: /Abrir PayPal.Me/ });
    await expect(link).toHaveAttribute("href", "https://www.paypal.me/luciademo/12.25EUR");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(matePage.getByText("Modo demostración")).toHaveCount(0);
  });

  test("an invalid PayPal.Me username is rejected before saving", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.goto("/profile");
    await page.getByLabel("Usuario de PayPal.Me").fill("nombre con espacios");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Usa entre 3 y 20 letras o números, sin espacios.")).toBeVisible();
  });
});
