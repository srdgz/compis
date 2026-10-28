import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import { mockDemoApi } from "@/test/mockApi";
import { renderApp } from "@/test/render";
import { setViewportWidth } from "@/test/viewport";

describe("responsive navigation", () => {
  it("shows the sidebar with every section and the theme switch on wide screens", async () => {
    mockDemoApi();
    renderApp("/", true);
    await screen.findByRole("heading", { name: "Hola, Lucía" });

    const nav = screen.getByRole("navigation", { name: "Principal" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual([
      "Inicio",
      "Tareas",
      "Compra",
      "Gastos",
      "Calendario",
      "Archivos",
      "Novedades",
      "Compis",
      "Mi perfil",
    ]);
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Más" })).not.toBeInTheDocument();
  });

  it("switches to a bottom bar with a More sheet on narrow screens", async () => {
    setViewportWidth(390);
    mockDemoApi();
    const user = userEvent.setup();
    const { container } = renderApp("/", true);
    await screen.findByRole("heading", { name: "Hola, Lucía" });

    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    expect(screen.queryByRole("group", { name: "Tema" })).not.toBeInTheDocument();

    await user.click(within(nav).getByRole("button", { name: "Más" }));
    const sheet = await screen.findByRole("dialog", { name: "Más" });
    expect(within(sheet).getByRole("link", { name: "Calendario" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Mi perfil" })).toBeInTheDocument();
    expect(within(sheet).getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  it("marks the current page in the navigation", async () => {
    mockDemoApi();
    renderApp("/tasks", true);
    await screen.findByText("Sacar la basura");
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getByRole("link", { name: "Tareas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });
});
