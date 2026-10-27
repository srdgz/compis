import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

const API = "http://localhost:5001/api";
export const PASSWORD = "password-123";

export interface Person {
  name: string;
  email: string;
  id: number;
  token: string;
}

let counter = 0;

function unique(name: string): string {
  counter += 1;
  return `${name.toLowerCase()}.${Date.now()}.${counter}@e2e.test`;
}

async function call<T>(
  request: APIRequestContext,
  method: "get" | "post" | "put",
  path: string,
  token: string | null,
  data?: unknown,
): Promise<T> {
  const response = await request[method](`${API}${path}`, {
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  expect(response.ok(), `${method.toUpperCase()} ${path} -> ${response.status()}`).toBeTruthy();
  return (await response.json()) as T;
}

export async function createPerson(request: APIRequestContext, name: string): Promise<Person> {
  const email = unique(name);
  await call(request, "post", "/signup", null, { email, password: PASSWORD, first_name: name });
  const login = await call<{ token: string; roomie_id: number }>(request, "post", "/login", null, {
    email,
    password: PASSWORD,
  });
  return { name, email, id: login.roomie_id, token: login.token };
}

export interface Flat {
  owner: Person;
  mate: Person;
  homeId: number;
}

export async function createFlat(request: APIRequestContext): Promise<Flat> {
  const owner = await createPerson(request, "Lucia");
  const mate = await createPerson(request, "Marcos");
  const home = await call<{ home_id: number; shopping_list_id: number }>(
    request,
    "post",
    "/home",
    owner.token,
    { name: "Piso E2E" },
  );
  await call(request, "post", `/home/${home.home_id}`, owner.token, { email: mate.email });
  return { owner, mate, homeId: home.home_id };
}

export async function addDebtOwedByMate(
  request: APIRequestContext,
  flat: Flat,
  total = 30,
): Promise<void> {
  const list = await call<{ id: number }>(
    request,
    "get",
    `/list/home/${flat.homeId}`,
    flat.owner.token,
  );
  const items: number[] = [];
  for (const name of ["Leche", "Pan"]) {
    const item = await call<{ id: number }>(request, "post", "/item", flat.owner.token, {
      name,
      shopping_list_id: list.id,
    });
    items.push(item.id);
  }
  const expense = await call<{ expense: { id: number } }>(
    request,
    "post",
    "/expense",
    flat.owner.token,
    { expense_name: "Compra E2E", item_ids: items },
  );
  await call(request, "post", "/debts", flat.owner.token, {
    expense_id: expense.expense.id,
    debtor_ids: [flat.mate.id],
    total_amount: total,
  });
}

export async function signIn(page: Page, person: Pick<Person, "email">): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(person.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Hola,/);
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
  );
  expect(summary).toEqual([]);
}
