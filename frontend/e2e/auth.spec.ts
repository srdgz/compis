import { expect, test } from "@playwright/test";

import { PASSWORD, createFlat, signIn } from "./helpers";

test.describe("authentication", () => {
  test("anonymous visitors are sent to the sign-in page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Te damos la bienvenida" })).toBeVisible();
  });

  test("the demo account opens the demo flat", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Probar con una cuenta de demostración" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola, Lucía");
    await expect(page.getByText("Así va Piso de Gràcia.")).toBeVisible();
  });

  test("wrong credentials show an error and keep the visitor out", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("nadie@e2e.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "El email o la contraseña no son correctos",
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test("passwords can be revealed and hidden", async ({ page }) => {
    await page.goto("/login");
    const field = page.getByLabel("Contraseña", { exact: true });
    const toggle = page.getByRole("button", { name: "Mostrar contraseña" });
    await field.fill("secreto-123");
    await expect(field).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(field).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(field).toHaveAttribute("type", "password");
  });

  test("signing up requires matching passwords, then leads to creating a home", async ({
    page,
  }) => {
    const email = `nueva.${Date.now()}@e2e.test`;
    await page.goto("/signup");
    await page.getByLabel("Nombre").fill("Nuria");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Repite la contraseña", { exact: true }).fill("otra-distinta-1");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();

    await page.getByLabel("Repite la contraseña", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Cuenta creada. Ya puedes iniciar sesión.")).toBeVisible();

    await signInFromLoginPage(page, email);
    await expect(page.getByRole("heading", { name: "Crear una vivienda nueva" })).toBeVisible();
    await page.getByLabel("Nombre de la vivienda").fill("Mi primer piso");
    await page.getByRole("button", { name: "Crear vivienda" }).click();
    await expect(page.getByText("Así va Mi primer piso.")).toBeVisible();
  });

  test("signing out returns to the sign-in page and closes the session", async ({
    page,
    request,
  }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login$/);
  });
});

async function signInFromLoginPage(
  page: import("@playwright/test").Page,
  email: string,
): Promise<void> {
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
}
