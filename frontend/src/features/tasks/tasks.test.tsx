import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { API, server } from "@/test/server";
import { renderApp, roomie } from "@/test/render";

const marcos = {
  ...roomie,
  id: 2,
  first_name: "Marcos",
  email: "marcos@example.com",
  admin: false,
};

function task(id: number, name: string, roomieId: number, done: string | null = null) {
  return {
    id,
    name,
    date_assigned: "2026-11-03",
    date_done: done,
    roomie_id: roomieId,
    roomie: roomieId === 1 ? roomie : marcos,
  };
}

function setup(tasks = [task(1, "Sacar la basura", 2), task(2, "Limpiar el baño", 1)]) {
  server.use(
    http.get(`${API}/roomie/1`, () => HttpResponse.json(roomie)),
    http.get(`${API}/roomie/home/7`, () => HttpResponse.json([roomie, marcos])),
    http.get(`${API}/task/home/7`, () => HttpResponse.json(tasks)),
  );
}

describe("TasksPage", () => {
  it("lists the pending tasks of the home and filters mine", async () => {
    setup();
    const user = userEvent.setup();
    renderApp("/tasks", true);

    await screen.findByText("Sacar la basura");
    const main = screen.getByRole("main");
    expect(within(main).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByLabelText("Solo las mías"));
    const items = within(screen.getByRole("main")).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Limpiar el baño");
  });

  it("marks a task as done", async () => {
    setup();
    let completed = false;
    server.use(
      http.put(`${API}/task/1`, () => {
        completed = true;
        return HttpResponse.json({ message: "Tarea completada" });
      }),
    );
    const user = userEvent.setup();
    renderApp("/tasks", true);

    const row = (await screen.findByText("Sacar la basura")).closest("li") as HTMLElement;
    await user.click(
      within(row).getByRole("button", { name: "Marcar «Sacar la basura» como hecha" }),
    );
    expect(await screen.findByText(/marcada como hecha/)).toBeInTheDocument();
    expect(completed).toBe(true);
  });

  it("shows an empty state when nothing matches", async () => {
    setup([task(1, "Hecha ya", 1, "2026-11-01")]);
    renderApp("/tasks", true);
    expect(await screen.findByText("No hay tareas que mostrar")).toBeInTheDocument();
  });

  it("asks the user to create a home when they have none", async () => {
    server.use(http.get(`${API}/roomie/1`, () => HttpResponse.json({ ...roomie, home_id: null })));
    renderApp("/tasks", true);
    expect(
      await screen.findByRole("heading", { name: "Crear una vivienda nueva" }),
    ).toBeInTheDocument();
  });
});
