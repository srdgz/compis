import { expect, test } from "@playwright/test";

import { createFlat, signIn } from "./helpers";

test.describe("running the household", () => {
  test("tasks can be created, completed and deleted", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.goto("/tasks");

    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await page.getByLabel("Qué hay que hacer").fill("Sacar el reciclaje");
    await page.getByRole("button", { name: "Crear tarea" }).click();
    await expect(page.getByText("Tarea creada.")).toBeVisible();
    await expect(page.getByText("Sacar el reciclaje", { exact: true })).toBeVisible();
    await expect(page.getByText("Hoy", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Marcar «Sacar el reciclaje» como hecha" }).click();
    await expect(page.getByText("«Sacar el reciclaje» marcada como hecha.")).toBeVisible();
    await expect(page.getByText("No hay tareas que mostrar")).toBeVisible();

    await page.getByLabel("Mostrar").selectOption("done");
    await expect(page.getByText("Sacar el reciclaje", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Eliminar «Sacar el reciclaje»" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Tarea eliminada.")).toBeVisible();
  });

  test("a shopping list becomes an expense that can be split", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.goto("/shopping");

    for (const item of ["Leche", "Pan"]) {
      await page.getByLabel("Añadir elemento").fill(item);
      await page.getByRole("button", { name: "Añadir", exact: true }).click();
      await expect(page.getByLabel(item, { exact: true })).toBeVisible();
    }
    await page.getByLabel("Leche", { exact: true }).check();
    await page.getByLabel("Pan", { exact: true }).check();
    await page.getByRole("button", { name: /Registrar compra \(2\)/ }).click();
    await page.getByLabel("Nombre del gasto").fill("Supermercado");
    await page.getByRole("dialog").getByRole("button", { name: "Registrar compra" }).click();
    await expect(page.getByText("Compra registrada. Ya puedes repartir el gasto.")).toBeVisible();

    await page.goto("/expenses");
    await page.getByRole("button", { name: "Repartir" }).click();
    await page.getByLabel("Importe total (€)").fill("45,90");
    await page.getByLabel("Marcos").check();
    await expect(page.getByText("Cada persona pone 22,95")).toBeVisible();
    await page.getByRole("button", { name: "Repartir gasto" }).click();
    await expect(page.getByText("Gasto repartido.")).toBeVisible();
    await expect(page.getByText("Te deben en total").locator("..")).toContainText("22,95");
  });

  test("only the administrator can add and remove roomies", async ({ browser, request }) => {
    const flat = await createFlat(request);
    const ownerPage = await (await browser.newContext()).newPage();
    await signIn(ownerPage, flat.owner);
    await ownerPage.goto("/roomies");
    await expect(ownerPage.getByText("Añadir a alguien")).toBeVisible();
    await expect(ownerPage.getByRole("button", { name: "Quitar de la vivienda" })).toBeVisible();

    const matePage = await (await browser.newContext()).newPage();
    await signIn(matePage, flat.mate);
    await matePage.goto("/roomies");
    await expect(matePage.getByRole("heading", { name: "Roomies" })).toBeVisible();
    await expect(matePage.getByText("Añadir a alguien")).toHaveCount(0);
    await expect(matePage.getByRole("button", { name: "Quitar de la vivienda" })).toHaveCount(0);

    await ownerPage.getByRole("button", { name: "Quitar de la vivienda" }).click();
    await ownerPage.getByRole("dialog").getByRole("button", { name: "Quitar" }).click();
    await expect(ownerPage.getByText("Roomie quitado de la vivienda.")).toBeVisible();
  });

  test("the activity feed and calendar reflect what happened", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.goto("/tasks");
    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await page.getByLabel("Qué hay que hacer").fill("Regar las plantas");
    await page.getByRole("button", { name: "Crear tarea" }).click();
    await expect(page.getByText("Tarea creada.")).toBeVisible();

    await page.goto("/activity");
    await expect(page.getByText("Nueva tarea asignada: Regar las plantas")).toBeVisible();
    await page.goto("/calendar");
    await expect(page.getByText("Regar las plantas")).toBeVisible();
  });
});
