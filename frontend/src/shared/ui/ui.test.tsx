import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DUE_LABEL, dueState } from "@/shared/lib/due";
import { getThemePreference } from "@/shared/lib/theme";

import { Avatar, initialsOf, toneFor } from "./Avatar";
import { PasswordField } from "./Field";
import { ThemeSwitch } from "./ThemeSwitch";

describe("Avatar helpers", () => {
  it("builds initials from one or two words", () => {
    expect(initialsOf("lucía")).toBe("L");
    expect(initialsOf("Ana  García López")).toBe("AL");
    expect(initialsOf("   ")).toBe("?");
  });

  it("keeps the same colour for the same name regardless of case", () => {
    expect(toneFor("Marcos")).toBe(toneFor("  marcos "));
    expect(toneFor("Marcos")).toBeGreaterThanOrEqual(1);
    expect(toneFor("Marcos")).toBeLessThanOrEqual(6);
  });

  it("is decorative for assistive technology", () => {
    const { container } = render(<Avatar name="Lucía" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("dueState", () => {
  it("classifies dates relative to today", () => {
    expect(dueState("2026-11-01", "2026-11-02")).toBe("overdue");
    expect(dueState("2026-11-02", "2026-11-02")).toBe("today");
    expect(dueState("2026-11-03", "2026-11-02")).toBe("tomorrow");
    expect(dueState("2026-12-24", "2026-11-02")).toBe("later");
    expect(DUE_LABEL.overdue).toBe("Vencida");
  });
});

describe("PasswordField", () => {
  it("hides the password by default and toggles its visibility", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" defaultValue="secreto-123" />);
    const input = screen.getByLabelText("Contraseña");
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
  });

  it("connects the error message to the input", () => {
    render(<PasswordField label="Contraseña" error="Demasiado corta" />);
    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Demasiado corta");
  });
});

describe("ThemeSwitch", () => {
  it("applies and remembers the selected theme", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitch />);

    expect(screen.getByRole("radio", { name: "Auto" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(getThemePreference()).toBe("dark");

    await user.click(screen.getByRole("radio", { name: "Auto" }));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(getThemePreference()).toBe("system");
  });

  it("is a labelled group of radio buttons", () => {
    render(<ThemeSwitch />);
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
});
