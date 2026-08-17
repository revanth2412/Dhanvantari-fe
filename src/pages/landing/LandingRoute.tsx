import { lazy, Suspense } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileLanding } from "@/pages/landing/MobileLanding";

/* The desktop marketing site is a large tree with its own simulator, ROI
   calculator and FAQ. A phone never mounts it — and never downloads it. */
const DesktopLanding = lazy(() =>
  import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);

/**
 * Picks the landing experience by viewport.
 *
 * Two component trees rather than one responsive tree: the phone gets a
 * decluttered page built for a thumb, and the desktop page stays byte-for-byte
 * what it was. 820px is the app-wide mobile breakpoint.
 */
export function LandingRoute() {
  const isMobile = useMediaQuery("(max-width: 820px)");

  if (isMobile) return <MobileLanding />;

  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <DesktopLanding />
    </Suspense>
  );
}
