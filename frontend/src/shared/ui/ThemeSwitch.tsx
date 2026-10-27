import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { getThemePreference, setThemePreference } from "@/shared/lib/theme";
import type { ThemePreference } from "@/shared/lib/theme";

const OPTIONS = [
  { value: "system", label: "Auto", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
] as const;

export function ThemeSwitch() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-muted">Tema</legend>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-mint p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label key={value} className="relative block">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => {
                setPreference(value);
                setThemePreference(value);
              }}
              className="peer sr-only"
            />
            <span className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold peer-checked:bg-surface peer-checked:shadow-card peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
              <Icon aria-hidden="true" size={16} />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
