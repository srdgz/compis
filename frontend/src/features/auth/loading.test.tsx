import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { renderApp } from "@/test/render";
import { API, server } from "@/test/server";

describe("sign-in loading states", () => {
  it("shows the loading state only on the button that was pressed", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`${API}/login`, async () => {
        await gate;
        return HttpResponse.json({ error: "El servidor no responde" }, { status: 503 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/login");

    await user.click(screen.getByRole("button", { name: "Probar con una cuenta demo" }));

    const demo = await screen.findByRole("button", { name: "Entrando" });
    expect(demo).toHaveAttribute("aria-busy", "true");
    expect(demo).toBeDisabled();
    expect(demo).toHaveTextContent("Entrando");
    const submit = screen.getByRole("button", { name: "Entrar" });
    expect(submit).toBeDisabled();
    expect(submit).not.toHaveAttribute("aria-busy");

    release();
    expect(await screen.findByRole("alert")).toHaveTextContent("El servidor no responde");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Probar con una cuenta demo" })).toBeEnabled(),
    );
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("shows the loading state on Entrar when the form is sent", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`${API}/login`, async () => {
        await gate;
        return HttpResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/login");

    await user.type(screen.getByLabelText("Correo electrónico"), "lucia@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password-123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const submit = await screen.findByRole("button", { name: "Entrando" });
    expect(submit).toHaveAttribute("aria-busy", "true");
    const demo = screen.getByRole("button", { name: "Probar con una cuenta demo" });
    expect(demo).toBeDisabled();
    expect(demo).not.toHaveAttribute("aria-busy");

    release();
    await screen.findByRole("alert");
  });
});
