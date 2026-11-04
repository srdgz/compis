import { act, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Home } from "lucide-react";
import { afterEach, beforeEach, vi } from "vitest";

import { useDelayed } from "@/shared/lib/useDelayed";

import { Button } from "./Button";
import { Loading, SLOW_LOADING_MESSAGE, SLOW_LOADING_MS, StatTile } from "./Feedback";

describe("Button loading state", () => {
  it("is blocked, busy and shows the bouncing dots next to its label", () => {
    const { container } = render(<Button loading>Crear tarea</Button>);
    const button = screen.getByRole("button", { name: "Crear tarea" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".loading-dot")).toHaveLength(3);
    expect(container.querySelector(".loading-dots")).toHaveAttribute("aria-hidden", "true");
  });

  it("swaps its text for the loading label so it reads well without animation", () => {
    render(
      <Button loading loadingLabel="Guardando">
        Crear tarea
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Guardando" })).toBeInTheDocument();
    expect(screen.queryByText("Crear tarea")).not.toBeInTheDocument();
  });

  it("keeps the accessible name of icon-only buttons and replaces the icon", () => {
    const { container } = render(
      <Button loading iconOnly aria-label="Enviar">
        <span data-testid="icon" />
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".loading-dot")).toHaveLength(3);
  });

  it("shows nothing extra when it is not loading", () => {
    const { container } = render(<Button loadingLabel="Guardando">Crear tarea</Button>);
    expect(screen.getByRole("button", { name: "Crear tarea" })).toBeEnabled();
    expect(container.querySelector(".loading-dot")).toBeNull();
  });
});

describe("Loading skeletons", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("announces the loading state once and hides the decorative skeleton", () => {
    const { container } = render(<Loading variant="people" rows={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    const decorative = container.querySelector("[aria-hidden='true']");
    expect(decorative?.querySelectorAll(".skeleton").length).toBeGreaterThanOrEqual(6);
  });

  it("renders the requested number of rows for every variant", () => {
    for (const variant of ["list", "people", "compact"] as const) {
      const { container, unmount } = render(<Loading variant={variant} rows={4} />);
      expect(container.querySelectorAll("[aria-hidden='true'] > div")).toHaveLength(4);
      unmount();
    }
    const { container } = render(<Loading variant="page" rows={2} />);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(6);
  });

  it("explains the wait when the server is slow to answer", () => {
    render(<Loading />);
    expect(screen.queryByText(SLOW_LOADING_MESSAGE)).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(SLOW_LOADING_MS);
    });
    expect(screen.getByText(SLOW_LOADING_MESSAGE)).toBeInTheDocument();
  });
});

describe("StatTile loading", () => {
  it("shows a skeleton instead of the placeholder value", () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <StatTile to="/" icon={Home} label="Debes" value="–" loading />
      </MemoryRouter>,
    );
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(container.querySelector(".skeleton")).not.toBeNull();
    expect(screen.queryByText("–")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <StatTile to="/" icon={Home} label="Debes" value="14,00 €" />
      </MemoryRouter>,
    );
    expect(screen.getByText("14,00 €")).toBeInTheDocument();
    expect(container.querySelector(".skeleton")).toBeNull();
  });
});

describe("useDelayed", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("turns true after the delay and resets when it stops being active", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayed(active, 1000), {
      initialProps: { active: true },
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(true);
    rerender({ active: false });
    expect(result.current).toBe(false);
    rerender({ active: true });
    expect(result.current).toBe(false);
  });
});
