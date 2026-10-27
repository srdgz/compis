import { useState } from "react";

import { getThemePreference, setThemePreference } from "@/shared/lib/theme";
import type { ThemePreference } from "@/shared/lib/theme";

import { SelectField } from "./Field";

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);

  return (
    <SelectField
      label="Tema"
      value={preference}
      onChange={(event) => {
        const next = event.target.value as ThemePreference;
        setPreference(next);
        setThemePreference(next);
      }}
    >
      <option value="system">Automático</option>
      <option value="light">Claro</option>
      <option value="dark">Oscuro</option>
    </SelectField>
  );
}
