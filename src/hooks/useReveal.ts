import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP stagger-reveal: children matching `selector` inside the returned ref
 * rise + fade in with a gentle stagger on mount (and when `deps` change).
 * Part of the app-wide motion language.
 */
export function useReveal<T extends HTMLElement>(
  selector: string,
  deps: readonly unknown[] = [],
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll(selector);
    if (targets.length === 0) return;
    const tween = gsap.fromTo(
      targets,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "opacity,transform",
      },
    );
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
