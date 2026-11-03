import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { HttpResponse, http } from "msw";

import { mockDemoApi } from "@/test/mockApi";
import { renderApp } from "@/test/render";
import { API, server } from "@/test/server";

import { MAX_HISTORY, MAX_MESSAGE_LENGTH, toWireMessages } from "./api";
import type { ChatEntry } from "./api";

interface Body {
  messages: Array<{ role: string; content: string }>;
  locale: string;
}

function mockAssistant(
  reply = "Debes 14,00 € en total.",
  source: "model" | "fallback" = "fallback",
  remaining: number | null = null,
) {
  const bodies: Body[] = [];
  server.use(
    http.post(`${API}/assistant/messages`, async ({ request }) => {
      bodies.push((await request.json()) as Body);
      return HttpResponse.json({ reply, source, remaining_today: remaining });
    }),
  );
  return bodies;
}

async function openAssistant() {
  mockDemoApi();
  const user = userEvent.setup();
  renderApp("/activity", true);
  await user.click(await screen.findByRole("button", { name: "Asistente" }));
  const dialog = await screen.findByRole("dialog", { name: "Asistente" });
  return { user, dialog };
}

describe("assistant drawer", () => {
  it("opens from the floating button and offers suggested questions", async () => {
    const { dialog } = await openAssistant();
    expect(dialog).toHaveAttribute("open");
    for (const name of [
      "¿Cuánto debo?",
      "¿Quién me debe?",
      "¿Qué tareas tengo?",
      "¿Qué hay en la lista de la compra?",
    ]) {
      expect(within(dialog).getByRole("button", { name })).toBeInTheDocument();
    }
    expect(within(dialog).getByRole("log", { name: "Conversación" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Tu pregunta")).toBeInTheDocument();
  });

  it("sends a suggested question with the interface language and shows the reply", async () => {
    const bodies = mockAssistant("Debes 14,00 € en total.", "fallback");
    const { user, dialog } = await openAssistant();
    await user.click(within(dialog).getByRole("button", { name: "¿Cuánto debo?" }));

    expect(await within(dialog).findByText(/Debes 14,00 € en total\./)).toBeInTheDocument();
    expect(within(dialog).getByText("Resumen automático")).toBeInTheDocument();
    expect(bodies).toEqual([
      { messages: [{ role: "user", content: "¿Cuánto debo?" }], locale: "es" },
    ]);
  });

  it("sends with Enter, keeps a new line with Shift+Enter and ignores empty drafts", async () => {
    const bodies = mockAssistant("Hecho.", "model", 17);
    const { user, dialog } = await openAssistant();
    const input = within(dialog).getByLabelText("Tu pregunta");
    const send = within(dialog).getByRole("button", { name: "Enviar" });

    expect(send).toBeDisabled();
    await user.type(input, "   {Enter}");
    expect(bodies).toHaveLength(0);

    await user.clear(input);
    await user.type(input, "hola{Shift>}{Enter}{/Shift}qué tal");
    expect(input).toHaveValue("hola\nqué tal");
    await user.keyboard("{Enter}");

    expect(await within(dialog).findByText(/Hecho\./)).toBeInTheDocument();
    expect(bodies[0]?.messages[0]?.content).toBe("hola\nqué tal");
    expect(input).toHaveValue("");
    expect(within(dialog).queryByText("Resumen automático")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/Te quedan 17 preguntas hoy\./)).toBeInTheDocument();
  });

  it("keeps the conversation when it is closed and opened again", async () => {
    mockAssistant("Respuesta guardada.");
    const { user, dialog } = await openAssistant();
    await user.click(within(dialog).getByRole("button", { name: "¿Qué tareas tengo?" }));
    await within(dialog).findByText(/Respuesta guardada\./);

    await user.click(within(dialog).getByRole("button", { name: "Cerrar el asistente" }));
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    await user.click(screen.getByRole("button", { name: "Asistente" }));
    expect(await screen.findByText(/Respuesta guardada\./)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nueva conversación" }));
    expect(screen.queryByText(/Respuesta guardada\./)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "¿Cuánto debo?" })).toBeInTheDocument();
  });

  it("sends the previous turns as history", async () => {
    const bodies = mockAssistant("Primera respuesta.");
    const { user, dialog } = await openAssistant();
    await user.click(within(dialog).getByRole("button", { name: "¿Cuánto debo?" }));
    await within(dialog).findByText(/Primera respuesta\./);
    await user.type(within(dialog).getByLabelText("Tu pregunta"), "¿Y de tareas?{Enter}");
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]?.messages).toEqual([
      { role: "user", content: "¿Cuánto debo?" },
      { role: "assistant", content: "Primera respuesta." },
      { role: "user", content: "¿Y de tareas?" },
    ]);
  });

  it("shows server errors, including the daily limit, and lets the user retry", async () => {
    let attempts = 0;
    server.use(
      http.post(`${API}/assistant/messages`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json(
            {
              error: "Has llegado al límite de preguntas de hoy.",
              code: "assistant_limit_reached",
            },
            { status: 429 },
          );
        }
        return HttpResponse.json({ reply: "Ya funciona.", source: "model", remaining_today: 3 });
      }),
    );
    const { user, dialog } = await openAssistant();
    await user.click(within(dialog).getByRole("button", { name: "¿Cuánto debo?" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Has llegado al límite de preguntas de hoy.",
    );

    await user.click(within(dialog).getByRole("button", { name: "Reintentar" }));
    expect(await within(dialog).findByText(/Ya funciona\./)).toBeInTheDocument();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has no accessibility violations while open with a conversation", async () => {
    mockAssistant("Debes 14,00 €.\n\n- Marcos: 14,00 €");
    const { user, dialog } = await openAssistant();
    await user.click(within(dialog).getByRole("button", { name: "¿Cuánto debo?" }));
    await within(dialog).findByText(/Marcos: 14,00/);
    const results = await axe.run(dialog, {
      rules: { "color-contrast": { enabled: false } },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
    });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe("toWireMessages", () => {
  const entry = (id: number, role: ChatEntry["role"], content: string): ChatEntry => ({
    id,
    role,
    content,
  });

  it("keeps only the latest turns, starting with a user message", () => {
    const entries = Array.from({ length: 14 }, (_, index) =>
      entry(index, index % 2 === 0 ? "user" : "assistant", `m${index}`),
    );
    const wire = toWireMessages(entries);
    expect(wire.length).toBeLessThanOrEqual(MAX_HISTORY);
    expect(wire[0]?.role).toBe("user");
    expect(wire.at(-1)?.content).toBe("m13");
  });

  it("truncates long assistant answers to the server limit", () => {
    const wire = toWireMessages([
      entry(1, "user", "hola"),
      entry(2, "assistant", "x".repeat(900)),
      entry(3, "user", "gracias"),
    ]);
    expect(wire[1]?.content).toHaveLength(MAX_MESSAGE_LENGTH);
  });
});
