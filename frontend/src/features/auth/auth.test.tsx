import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { getSession } from "@/shared/api/session";
import { API, server } from "@/test/server";
import { renderApp, roomie } from "@/test/render";

import { validateSignup } from "./pages/SignupPage";

describe("validateSignup", () => {
  it("reports every invalid field", () => {
    expect(validateSignup("", "nope", "123")).toEqual({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it("accepts valid data", () => {
    expect(validateSignup("Ana", "ana@example.com", "password-123")).toEqual({});
  });
});

describe("login", () => {
  it("signs in and lands on the dashboard", async () => {
    server.use(
      http.post(`${API}/login`, () =>
        HttpResponse.json({ token: "t", roomie_id: 1, is_admin: true, home_id: 7 }),
      ),
      http.get(`${API}/roomie/1`, () => HttpResponse.json(roomie)),
      http.get(`${API}/home/7`, () =>
        HttpResponse.json({ id: 7, name: "Piso Test", is_active: true }),
      ),
      http.get(`${API}/task/home/7`, () => HttpResponse.json([])),
      http.get(`${API}/debts/roomie/1`, () => HttpResponse.json([])),
      http.get(`${API}/list/home/7`, () => HttpResponse.json({ id: 2, name: "Lista", home_id: 7 })),
      http.get(`${API}/item/list/2`, () => HttpResponse.json([])),
      http.get(`${API}/blog/home/7`, () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderApp("/login");

    await user.type(screen.getByLabelText("Correo electrónico"), "lucia@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password-123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Hola, Lucía" })).toBeInTheDocument();
    expect(getSession()).toEqual({ token: "t", roomieId: 1 });
  });

  it("shows the server message when credentials are wrong", async () => {
    server.use(
      http.post(`${API}/login`, () =>
        HttpResponse.json({ error: "El email o la contraseña no son correctos" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/login");

    await user.type(screen.getByLabelText("Correo electrónico"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El email o la contraseña no son correctos",
    );
    expect(getSession()).toBeNull();
  });

  it("redirects anonymous visitors to the login page", async () => {
    renderApp("/tasks");
    expect(
      await screen.findByRole("heading", { name: "Te damos la bienvenida" }),
    ).toBeInTheDocument();
  });
});

describe("signup", () => {
  it("shows field errors without calling the API", async () => {
    const user = userEvent.setup();
    renderApp("/signup");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(screen.getByText("Escribe tu nombre.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
  });

  it("creates the account and goes to the login page", async () => {
    server.use(
      http.post(`${API}/signup`, () => HttpResponse.json({ message: "ok" }, { status: 201 })),
    );
    const user = userEvent.setup();
    renderApp("/signup");
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password-123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Te damos la bienvenida" })).toBeInTheDocument(),
    );
  });
});
