import { expect, test } from "@playwright/test";

import { createFlat, signIn } from "./helpers";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("profile picture", () => {
  test("a photo replaces the initial everywhere and can be removed", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await page.route("https://api.cloudinary.com/**", (route) =>
      route.fulfill({
        json: { secure_url: "https://res.cloudinary.com/e2e/image/upload/v1/yo.png" },
      }),
    );
    await page.route("https://res.cloudinary.com/**", (route) =>
      route.fulfill({ body: PIXEL, contentType: "image/png" }),
    );

    await signIn(page, owner);
    await page.goto("/profile");
    await expect(page.locator("main img")).toHaveCount(0);

    await page.locator('input[type="file"]').setInputFiles({
      name: "yo.png",
      mimeType: "image/png",
      buffer: PIXEL,
    });
    await expect(page.getByText("Foto de perfil actualizada.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cambiar foto" })).toBeVisible();
    await expect(page.locator("aside img").first()).toBeVisible();
    await expect(page.locator("main img").first()).toHaveAttribute(
      "src",
      /res\.cloudinary\.com\/e2e\/image\/upload\/.+yo\.png/,
    );

    await page.reload();
    await expect(page.locator("aside img").first()).toBeVisible();

    await page.getByRole("button", { name: "Quitar foto" }).click();
    await expect(page.getByText("Foto de perfil eliminada.")).toBeVisible();
    await expect(page.locator("img")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Subir foto" })).toBeVisible();
  });

  test("files that are not images are refused", async ({ page, request }) => {
    const { owner } = await createFlat(request);
    await signIn(page, owner);
    await page.goto("/profile");
    await page.locator('input[type="file"]').setInputFiles({
      name: "cv.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
    await expect(page.getByRole("alert")).toContainText("Elige una imagen");
  });
});
