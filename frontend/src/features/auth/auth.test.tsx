import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { getSession } from "@/shared/api/session";
import { API, server } from "@/test/server";
import { renderApp, roomie } from "@/test/render";

import { validateSignup } from "./pages/SignupPage";

describe("validateSignup", () => {
  it("reports every invalid field", () => {
    expect(validateSignup("", "nope", "123", "")).toEqual({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      confirm: "Repite la contraseña.",
    });
  });

  it("accepts valid data", () => {
    expect(validateSignup("Ana", "ana@example.com", "password-123", "password-123")).toEqual({});
  });

  it("requires both passwords to match", () => {
    expect(validateSignup("Ana", "ana@example.com", "password-123", "password-124")).toEqual({
      confirm: "Las contraseñas no coinciden.",
    });
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

describe("authentication pages", () => {
  it("ignore a theme chosen in the app and follow the browser instead", async () => {
    localStorage.setItem("compis.theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
    const { unmount } = renderApp("/login");
    await screen.findByRole("heading", { name: "Te damos la bienvenida" });
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(screen.queryByRole("group", { name: "Tema" })).not.toBeInTheDocument();
    unmount();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});

describe("signup", () => {
  it("catches mismatching passwords before calling the API", async () => {
    const user = userEvent.setup();
    renderApp("/signup");
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password-123");
    await user.type(screen.getByLabelText("Repite la contraseña"), "password-999");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(screen.getByLabelText("Repite la contraseña")).toHaveAttribute("aria-invalid", "true");
  });

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
    await user.type(screen.getByLabelText("Repite la contraseña"), "password-123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Te damos la bienvenida" })).toBeInTheDocument(),
    );
  });
});
