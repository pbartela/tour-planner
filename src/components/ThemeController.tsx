import React, { useEffect } from "react";
import { themeChange } from "theme-change";
import { STORAGE_KEYS } from "@/lib/constants/storage";

const themes = [
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "Cupcake", value: "cupcake" },
  { name: "Bumblebee", value: "bumblebee" },
  { name: "Emerald", value: "emerald" },
  { name: "Corporate", value: "corporate" },
  { name: "Synthwave", value: "synthwave" },
  { name: "Retro", value: "retro" },
  { name: "Cyberpunk", value: "cyberpunk" },
  { name: "Valentine", value: "valentine" },
  { name: "Halloween", value: "halloween" },
  { name: "Garden", value: "garden" },
  { name: "Forest", value: "forest" },
  { name: "Aqua", value: "aqua" },
  { name: "Lofi", value: "lofi" },
  { name: "Pastel", value: "pastel" },
  { name: "Fantasy", value: "fantasy" },
  { name: "Wireframe", value: "wireframe" },
  { name: "Black", value: "black" },
  { name: "Luxury", value: "luxury" },
  { name: "Dracula", value: "dracula" },
  { name: "CMYK", value: "cmyk" },
  { name: "Autumn", value: "autumn" },
  { name: "Business", value: "business" },
  { name: "Acid", value: "acid" },
  { name: "Lemonade", value: "lemonade" },
  { name: "Night", value: "night" },
  { name: "Coffee", value: "coffee" },
  { name: "Winter", value: "winter" },
];

export function ThemeController(): React.JSX.Element {
  useEffect(() => {
    // Initialize theme-change library
    // Pass false to prevent subscribing to browser's color scheme changes
    // The library will automatically handle theme switching and localStorage
    themeChange(false);

    // Set initial theme based on localStorage or system preference
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (!stored) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const defaultTheme = prefersDark ? "dark" : "light";
      localStorage.setItem(STORAGE_KEYS.THEME, defaultTheme);
      document.documentElement.setAttribute("data-theme", defaultTheme);
    }
  }, []);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <svg
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-5 w-5 stroke-current md:h-6 md:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          ></path>
        </svg>
      </div>
      <ul className="dropdown-content bg-base-300 rounded-box z-10 w-52 p-2 shadow-2xl">
        {themes.map((theme) => (
          <li key={theme.value}>
            <button
              type="button"
              className="btn btn-sm btn-block btn-ghost justify-start"
              data-set-theme={theme.value}
              data-act-class="btn-active"
            >
              {theme.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
