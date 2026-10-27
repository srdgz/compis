import { HttpResponse, http } from "msw";

import { todayIso } from "@/shared/lib/format";

import { API, server } from "./server";

export const lucia = {
  id: 1,
  email: "lucia@example.com",
  first_name: "Lucía",
  last_name: null,
  avatar: null,
  paypal_username: "lucia",
  admin: true,
  is_active: true,
  home_id: 7,
};

export const marcos = {
  ...lucia,
  id: 2,
  email: "marcos@example.com",
  first_name: "Marcos",
  paypal_username: "marcos",
  admin: false,
};

const task = (id: number, name: string, roomieId: number, done: string | null) => ({
  id,
  name,
  date_assigned: "2026-11-03",
  date_done: done,
  roomie_id: roomieId,
  roomie: roomieId === 1 ? lucia : marcos,
});

export const debtOwedToMe = {
  id: 10,
  name: "Compra de la semana",
  amount: 15.3,
  roomie_debtor_id: 2,
  roomie_paying_id: 1,
  status: "Pendiente",
  payment_method: null,
  date: "2026-11-02",
  expense_id: 1,
};

export const debtIOwe = { ...debtOwedToMe, id: 11, roomie_debtor_id: 1, roomie_paying_id: 2 };

export function mockDemoApi() {
  server.use(
    http.get(`${API}/roomie/1`, () => HttpResponse.json(lucia)),
    http.get(`${API}/roomie/home/7`, () => HttpResponse.json([lucia, marcos])),
    http.get(`${API}/home/7`, () =>
      HttpResponse.json({ id: 7, name: "Piso de Gràcia", is_active: true }),
    ),
    http.get(`${API}/task/home/7`, () =>
      HttpResponse.json([
        task(1, "Sacar la basura", 1, null),
        task(2, "Limpiar el baño", 2, "2026-11-01"),
      ]),
    ),
    http.get(`${API}/list/home/7`, () =>
      HttpResponse.json({ id: 3, name: "Lista de la compra", home_id: 7 }),
    ),
    http.get(`${API}/item/list/3`, ({ request }) =>
      HttpResponse.json(
        new URL(request.url).searchParams.get("have_expense")
          ? [{ id: 9, name: "Pan", shopping_list_id: 3, expense_id: 1 }]
          : [{ id: 8, name: "Leche", shopping_list_id: 3, expense_id: null }],
      ),
    ),
    http.get(`${API}/expense/roomie/1`, () =>
      HttpResponse.json([{ id: 5, name: "Supermercado", debt_generated: false, home_id: 7 }]),
    ),
    http.get(`${API}/debts/roomie/1`, () => HttpResponse.json([debtOwedToMe, debtIOwe])),
    http.get(`${API}/config`, () =>
      HttpResponse.json({ paypal_demo: { enabled: false, client_id: null } }),
    ),
    http.get(`${API}/calendar/1`, () =>
      HttpResponse.json([
        { id: 1, title: "Sacar la basura", start: todayIso(), end: todayIso(), type: "task" },
        {
          id: 10,
          title: "Pago de Marcos: 15,30€",
          start: todayIso(),
          end: todayIso(),
          type: "debt",
        },
      ]),
    ),
    http.get(`${API}/file/home/7`, () =>
      HttpResponse.json([
        {
          id: 1,
          name: "Contrato.pdf",
          url: "https://example.com/contrato.pdf",
          upload_date: "2026-10-20",
          home_id: 7,
          expense_id: null,
        },
      ]),
    ),
    http.get(`${API}/blog/home/7`, () =>
      HttpResponse.json([
        {
          id: 1,
          text: "Marcos debe 15,30€ a Lucía",
          roomie_name: "Marcos",
          status: "Hecho",
          amount: 15.3,
          date: "2026-11-02T10:00:00",
          home_id: 7,
        },
      ]),
    ),
  );
}
