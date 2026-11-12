"use client";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in <head> before first paint: applies the saved theme so a dark-mode
 * viewer never sees a light flash. With no saved value, CSS follows the OS.
 */
const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// Executable in the server HTML, inert on the client so React doesn't warn about
// rendering a <script>. See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
