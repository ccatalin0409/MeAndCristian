"use client";

import { useEffect, useState } from "react";

// Cele trei opțiuni de temă. "system" = urmează setarea telefonului/calculatorului.
type Choice = "light" | "dark" | "system";

// Calculează tema reală (light/dark) și o pune pe <html>.
// Pentru "system" citește preferința sistemului de operare.
function applyTheme(choice: Choice) {
  const resolved =
    choice === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : choice;
  document.documentElement.setAttribute("data-theme", resolved);
}

export default function ThemeSelect() {
  // Pornim de la "system" (la fel ca pe server) ca să nu apară erori de hidratare.
  const [choice, setChoice] = useState<Choice>("system");

  // La montare, citim alegerea salvată anterior.
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setChoice(stored);
    }
  }, []);

  // Cât timp suntem pe "system", reacționăm dacă utilizatorul schimbă
  // tema sistemului din mers (ex: trece telefonul pe dark seara).
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  function handleChange(next: Choice) {
    setChoice(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage poate fi indisponibil (mod privat etc.) — ignorăm.
    }
    applyTheme(next);
  }

  return (
    <select
      value={choice}
      onChange={(e) => handleChange(e.target.value as Choice)}
      aria-label="Temă"
      className="rounded-lg border border-border bg-surface text-foreground text-sm px-3 py-2 cursor-pointer"
    >
      <option value="system">După sistem</option>
      <option value="light">Luminoasă</option>
      <option value="dark">Întunecată</option>
    </select>
  );
}
