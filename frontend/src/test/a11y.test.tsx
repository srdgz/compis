import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import { mockDemoApi } from "./mockApi";
import { renderApp } from "./render";

async function violations(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
    },
  });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
  );
}

const PUBLIC_PAGES: Array<[string, string]> = [
  ["/login", "Te damos la bienvenida"],
  ["/signup", "Crea tu cuenta"],
];

const PRIVATE_PAGES: Array<[string, string]> = [
  ["/", "Hola, Lucía"],
  ["/tasks", "Sacar la basura"],
  ["/shopping", "Leche"],
  ["/expenses", "Supermercado"],
  ["/calendar", "Pago de Marcos: 15,30€"],
  ["/files", "Contrato.pdf"],
  ["/activity", "Marcos debe 15,30€ a Lucía"],
  ["/roomies", "Marcos"],
  ["/profile", "Tus datos"],
  ["/does-not-exist", "Esta dirección no existe"],
];

describe("accessibility (axe, WCAG 2.2 AA rules except contrast)", () => {
  it.each(PUBLIC_PAGES)("%s has no violations", async (route, marker) => {
    const { container } = renderApp(route);
    await screen.findByText(marker);
    expect(await violations(container)).toEqual([]);
  });

  it.each(PRIVATE_PAGES)("%s has no violations", async (route, marker) => {
    mockDemoApi();
    const { container } = renderApp(route, true);
    await screen.findAllByText(marker);
    expect(await violations(container)).toEqual([]);
  });

  it("the new task dialog has no violations", async () => {
    mockDemoApi();
    const user = userEvent.setup();
    const { container } = renderApp("/tasks", true);
    await user.click(await screen.findByRole("button", { name: "Nueva tarea" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Nueva tarea");
    expect(await violations(container)).toEqual([]);
  });

  it("the pay debt dialog has no violations", async () => {
    mockDemoApi();
    const user = userEvent.setup();
    const { container } = renderApp("/expenses", true);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    await screen.findByRole("link", { name: /Abrir PayPal.Me/ });
    expect(await violations(container)).toEqual([]);
  });
});
