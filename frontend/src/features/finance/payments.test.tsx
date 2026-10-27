import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { renderApp, roomie } from "@/test/render";
import { API, server } from "@/test/server";

const marcos = {
  ...roomie,
  id: 2,
  first_name: "Marcos",
  email: "marcos@example.com",
  admin: false,
  paypal_username: "marcos",
};
const lucia = { ...roomie, paypal_username: "lucia" };

function debt(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: "Compra de la semana",
    amount: 15.3,
    roomie_debtor_id: 1,
    roomie_paying_id: 2,
    status: "Pendiente",
    payment_method: null,
    date: "2026-11-02",
    expense_id: 1,
    ...overrides,
  };
}

function setup(debts: unknown[], me = lucia) {
  server.use(
    http.get(`${API}/roomie/1`, () => HttpResponse.json(me)),
    http.get(`${API}/roomie/home/7`, () => HttpResponse.json([me, marcos])),
    http.get(`${API}/expense/roomie/1`, () => HttpResponse.json([])),
    http.get(`${API}/config`, () =>
      HttpResponse.json({ paypal_demo: { enabled: false, client_id: null } }),
    ),
    http.get(`${API}/debts/roomie/1`, ({ request }) => {
      const settled = new URL(request.url).searchParams.get("include_settled");
      return HttpResponse.json(
        settled ? debts : debts.filter((d) => (d as { status: string }).status !== "Confirmada"),
      );
    }),
  );
}

describe("paying a debt", () => {
  it("offers the creditor's PayPal.Me link with the amount filled in", async () => {
    setup([debt(10)]);
    const user = userEvent.setup();
    renderApp("/expenses", true);

    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    const link = await screen.findByRole("link", { name: /Abrir PayPal.Me/ });
    expect(link).toHaveAttribute("href", "https://www.paypal.me/marcos/15.30EUR");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByText("Modo demostración")).not.toBeInTheDocument();
  });

  it("reports a cash payment and shows the debt as waiting for confirmation", async () => {
    let reported: unknown = null;
    setup([debt(10)]);
    server.use(
      http.post(`${API}/debts/10/report`, async ({ request }) => {
        reported = await request.json();
        return HttpResponse.json({ message: "Pago comunicado" });
      }),
    );
    const user = userEvent.setup();
    renderApp("/expenses", true);

    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    server.use(
      http.get(`${API}/debts/roomie/1`, () =>
        HttpResponse.json([debt(10, { status: "Pagada", payment_method: "cash" })]),
      ),
    );
    await user.click(await screen.findByRole("button", { name: "Ya se lo he pagado" }));

    expect(await screen.findByText(/Hemos avisado a Marcos/)).toBeInTheDocument();
    expect(reported).toEqual({ method: "cash" });
    expect(await screen.findByText(/Esperando a que Marcos confirme/)).toBeInTheDocument();
  });

  it("lets the creditor confirm or reject a reported payment", async () => {
    const reportedDebt = debt(11, {
      roomie_debtor_id: 2,
      roomie_paying_id: 1,
      status: "Pagada",
      payment_method: "paypal_me",
    });
    setup([reportedDebt]);
    const calls: string[] = [];
    server.use(
      http.post(`${API}/debts/11/confirm`, () => {
        calls.push("confirm");
        return HttpResponse.json({ message: "Pago confirmado" });
      }),
      http.post(`${API}/debts/11/reject`, () => {
        calls.push("reject");
        return HttpResponse.json({ message: "Pago rechazado" });
      }),
    );
    const user = userEvent.setup();
    renderApp("/expenses", true);

    const card = (await screen.findByText(/Pagado con PayPal/)).closest("li") as HTMLElement;
    expect(within(card).getByRole("list", { name: "Estado del pago" })).toBeInTheDocument();
    await user.click(within(card).getByRole("button", { name: "No lo he recibido" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar que lo he recibido" }));
    expect(calls).toEqual(["reject", "confirm"]);
  });

  it("asks the creditor to confirm directly when no payment was reported", async () => {
    setup([debt(12, { roomie_debtor_id: 2, roomie_paying_id: 1 })]);
    renderApp("/expenses", true);
    expect(await screen.findByRole("button", { name: "Marcar como cobrada" })).toBeInTheDocument();
  });

  it("explains when the creditor has no PayPal.Me username", async () => {
    setup([debt(13)]);
    server.use(
      http.get(`${API}/roomie/home/7`, () =>
        HttpResponse.json([lucia, { ...marcos, paypal_username: null }]),
      ),
    );
    const user = userEvent.setup();
    renderApp("/expenses", true);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    expect(
      await screen.findByText(/aún no ha añadido su usuario de PayPal.Me/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Abrir PayPal.Me/ })).not.toBeInTheDocument();
  });

  it("lists settled debts apart", async () => {
    setup([debt(14, { status: "Confirmada", payment_method: "cash" })]);
    renderApp("/expenses", true);
    expect(await screen.findByText("Deudas saldadas (1)")).toBeInTheDocument();
  });
});
