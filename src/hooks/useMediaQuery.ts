import { useEffect, useState } from "react";

/**
 * Live `matchMedia` result. Used to pick a whole component tree (not just
 * styles) per breakpoint — the landing page ships an entirely separate mobile
 * experience rather than bending the desktop markup with CSS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
