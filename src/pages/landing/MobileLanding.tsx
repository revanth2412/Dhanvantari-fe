import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight,
  FileCheck2,
  Headphones,
  Home,
  Languages,
  Layers,
  Mail,
  Mic,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { haptic } from "@/lib/haptics";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const STEPS = [
  {
    icon: Mic,
    n: "01",
    title: "Ambient capture",
    body: "Open MediVaani on any phone and speak naturally. No screen, no typing — just the consultation.",
  },
  {
    icon: Headphones,
    n: "02",
    title: "Acoustic diarization",
    body: "Neural speech isolation separates doctor from patient and filters out clinic noise.",
  },
  {
    icon: WandSparkles,
    n: "03",
    title: "Clinical extraction",
    body: "Complaints, vitals, dosages and ICD-10 suggestions, structured in seconds.",
  },
  {
    icon: FileCheck2,
    n: "04",
    title: "Review & sign",
    body: "Edit inline with full version history, then sign off into your record.",
  },
];

const LANGUAGES = [
  "हिन्दी",
  "Hinglish",
  "తెలుగు",
  "தமிழ்",
  "ಕನ್ನಡ",
  "മലയാളം",
  "বাংলা",
  "मराठी",
  "ગુજરાતી",
  "ਪੰਜਾਬੀ",
];

const FEATURES = [
  {
    icon: Languages,
    title: "Speaks how India speaks",
    body: "Code-switching mid-sentence is the norm in OPD. Dialects and colloquial symptoms normalize into clean clinical terms.",
  },
  {
    icon: Zap,
    title: "A draft before you stand up",
    body: "The structured note is waiting by the time the patient leaves the room.",
  },
  {
    icon: ShieldCheck,
    title: "DPDP Act 2023 aligned",
    body: "Consent-gated capture, encrypted storage, and no patient data used to train models.",
  },
];

const NAV = [
  { id: "top", label: "Home", icon: Home },
  { id: "how", label: "How", icon: Layers },
  { id: "try", label: "Try", icon: Play },
  { id: "why", label: "Why", icon: Sparkles },
  // Short label: five even slots read better than four short ones and a long.
  { id: "contact", label: "Talk", icon: Mail },
];

/** One consultation, trimmed to what reads well on a phone. */
const SIM_DIALOGUE = [
  { who: "doctor", text: "How are your knees feeling lately?" },
  {
    who: "patient",
    text: "Stairs are impossible, doctor. The right knee cracks and swells by evening.",
  },
  {
    who: "doctor",
    text: "There's crepitus in the right patellofemoral compartment and mild effusion.",
  },
  { who: "patient", text: "Do I need surgery?" },
  {
    who: "doctor",
    text: "Not now — Aceclofenac for flare-ups, glucosamine, and quadriceps physiotherapy.",
  },
] as const;

const SIM_NOTE = {
  complaint: "Bilateral knee pain, right worse than left, 6 months",
  assessment: "Primary osteoarthritis, right knee (K-L Grade III)",
  icd10: "M17.11",
  rx: [
    "Tab. Aceclofenac + Paracetamol · 1 BD × 7d",
    "Cap. Diacerein + Glucosamine · 1 OD × 90d",
  ],
};

/**
 * The phone landing page — a separate tree from the desktop one, not a
 * restyling of it. Desktop keeps its full marketing site; this is the
 * decluttered version: one hero, one horizontally-scrubbed explainer, three
 * reasons, and a single floating nav that replaces both the old top header and
 * the old bottom action bar.
 *
 * Every class is `ml-*`, so none of the 2 000-line desktop `mv-*` stylesheet
 * can reach in and fight it.
 */
export function MobileLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeNav, setActiveNav] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  /* Scribe simulator */
  const [simLine, setSimLine] = useState(-1);
  const [simPlaying, setSimPlaying] = useState(false);
  const simRef = useRef<HTMLDivElement | null>(null);
  /* Autoplay is a one-shot: re-scrolling past shouldn't restart it mid-read. */
  const simAutoPlayed = useRef(false);

  /* Time-saving simulator */
  const [patientsPerDay, setPatientsPerDay] = useState(28);
  const [minsPerNote, setMinsPerNote] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(6);

  /* A tap on the nav wins over the observer until the scroll settles. */
  const navLock = useRef(0);

  /* The hero intro is CSS, not GSAP: `gsap.from` hides an element and reveals
     it as the tween runs, so anything that stops the tween (a stalled ticker,
     a chunk that failed) leaves the hero blank. A keyframe can't fail that
     way, and reduced motion resets it to plainly visible. */

  /* ---------- section reveals ----------
     IntersectionObserver, not ScrollTrigger: content is visible by default and
     only *animates* on entry, so a missed callback can never leave a section
     stuck at zero opacity. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-lift]"));
    if (targets.length === 0 || reducedMotion()) return;

    targets.forEach((el) => el.classList.add("ml-lift"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ml-lift--in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ---------- depth: blobs drift against the page ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const blobs = Array.from(root.querySelectorAll<HTMLElement>("[data-drift]"));
    const setters = blobs.map((el) =>
      gsap.quickTo(el, "y", { duration: 0.6, ease: "power2.out" }),
    );

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        blobs.forEach((el, i) =>
          setters[i](window.scrollY * Number(el.dataset.drift) * 0.06),
        );
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* ---------- the horizontal rail ----------
     A natively swipeable, snapping rail rather than a pinned scroll-jack:
     on a phone that's the gesture people already know, and it can't fight the
     page scroll. GSAP does the depth — cards away from centre sit back. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".ml-step"));
    if (cards.length === 0) return;

    const soft = !reducedMotion();
    let frame = 0;
    const paint = () => {
      frame = 0;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let best = Infinity;
      cards.forEach((card, i) => {
        const centre = card.offsetLeft + card.offsetWidth / 2;
        const away = Math.abs(centre - mid) / track.clientWidth;
        if (away < best) {
          best = away;
          closest = i;
        }
        if (soft) {
          gsap.set(card, {
            scale: gsap.utils.clamp(0.92, 1, 1 - away * 0.14),
            opacity: gsap.utils.clamp(0.5, 1, 1 - away * 0.7),
          });
        }
      });
      setActiveStep(closest);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    paint();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* ---------- which section the bubble sits under ----------
     One section is active at a time: whichever's top edge is nearest the top
     of the viewport without having passed it. Picking "any intersecting
     section" lit up two entries at once whenever a short section sat inside
     the same band as the next one. */
  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(`ml-${item.id}`));
    if (sections.every((el) => !el)) return;

    const pick = () => {
      if (Date.now() < navLock.current) return;

      /* Whichever section's middle is nearest the middle of the screen.
         The previous rule ("last section whose top has passed a line") plus a
         bottom-of-page override meant that tapping Why — which lands near the
         end of the page — hit the override and jumped the bubble to Talk. */
      const middle = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Infinity;
      sections.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActiveNav(best);
    };

    // IntersectionObserver drives the recompute (scroll events aren't needed,
    // and it keeps working when the browser throttles them).
    const observer = new IntersectionObserver(pick, {
      threshold: [0, 0.05, 0.25, 0.5, 0.75, 1],
    });
    sections.forEach((el) => el && observer.observe(el));
    pick();
    return () => observer.disconnect();
  }, []);

  function goTo(id: string, index: number) {
    haptic("bubble");
    setActiveNav(index);
    // Hold the selection while the smooth scroll travels past other sections.
    navLock.current = Date.now() + 1200;
    document
      .getElementById(`ml-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- scribe simulator: starts itself when scrolled to ----------
     Plays once, the first time the card is on screen, so the section
     demonstrates itself instead of waiting for a tap. Tapping play still
     works, and a replay is always a tap away. */
  useEffect(() => {
    const card = simRef.current;
    if (!card || simAutoPlayed.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const shown = entries.some((e) => e.isIntersecting);
        if (!shown || simAutoPlayed.current) return;
        simAutoPlayed.current = true;
        observer.disconnect();
        setSimLine(0);
        setSimPlaying(true);
      },
      // A low ratio on purpose: the card can be taller than a short phone's
      // viewport, and a high threshold would then never be reachable.
      { threshold: 0.25 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!simPlaying) return;
    const timer = window.setInterval(() => {
      setSimLine((prev) => {
        if (prev >= SIM_DIALOGUE.length - 1) {
          window.clearInterval(timer);
          setSimPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [simPlaying]);

  const simDone = simLine >= SIM_DIALOGUE.length - 1;

  function toggleSim() {
    haptic("bubble");
    if (simDone) {
      setSimLine(-1);
      setSimPlaying(true);
      return;
    }
    setSimPlaying((p) => !p);
    if (simLine < 0) setSimLine(0);
  }

  /* Same arithmetic as the desktop calculator: MediVaani still costs ~1.4 min
     of review per note, so only the remainder is time returned. */
  const savedPerNote = Math.max(0, minsPerNote - 1.4);
  const weeklyHours = (patientsPerDay * savedPerNote * daysPerWeek) / 60;
  const annualHours = weeklyHours * 50;

  return (
    <div className="ml-root" ref={rootRef}>
      <span className="ml-blob ml-blob--1" data-drift="1" aria-hidden />
      <span className="ml-blob ml-blob--2" data-drift="-1.4" aria-hidden />

      {/* ---------------- hero ---------------- */}
      <header className="ml-hero" id="ml-top">
        <div className="ml-brand" data-rise>
          <BrandMark size={26} />
          <span>
            MediVaani<b>AI</b>
          </span>
        </div>

        <span className="ml-live" data-rise>
          <i />
          Ambient scribe · live
        </span>

        <h1 className="ml-title" data-rise>
          More eye contact.
          <span className="ml-title__grad">Zero take-home charting.</span>
        </h1>

        <p className="ml-sub" data-rise>
          MediVaani listens during the consultation, understands Indian languages, and
          hands you a structured, ICD-10 coded note before the patient leaves.
        </p>

        <div className="ml-cta" data-rise>
          <Link
            className="ml-btn ml-btn--primary"
            to="/login"
            onClick={() => haptic("medium")}
          >
            <Mic size={17} />
            Start free workspace
            <ArrowRight size={15} />
          </Link>
          <Link className="ml-btn ml-btn--ghost" to="/login">
            Doctor sign in
          </Link>
        </div>

        {/* Depth: a live-capture card floating over the ambient wash. */}
        <div className="ml-card" data-rise>
          <div className="ml-card__top">
            <span className="ml-card__dot" />
            Consultation in progress
            <span className="ml-card__tag">Capturing</span>
          </div>
          <div className="ml-wave" aria-hidden>
            {Array.from({ length: 26 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 9) * 0.1}s` }} />
            ))}
          </div>
          <p className="ml-card__line">
            <b>Dr. Nair:</b> “Does the pain travel to your left arm?”
          </p>
          <div className="ml-card__note">
            <span className="ml-card__note-k">
              <Sparkles size={12} /> Extracted
            </span>
            Exertional angina · Stage 2 HTN · <b>I20.9</b>
          </div>
        </div>
      </header>

      {/* ---------------- how it works: swipeable rail ---------------- */}
      <section className="ml-steps" id="ml-how">
        <div className="ml-steps__head" data-lift>
          <span className="ml-tag">How it works</span>
          <h2>Four steps. None of them yours.</h2>
        </div>
        <div className="ml-steps__track" ref={trackRef}>
          {STEPS.map(({ icon: Icon, n, title, body }) => (
            <article className="ml-step" key={n}>
              <span className="ml-step__n">{n}</span>
              <span className="ml-step__icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="ml-dots" role="tablist" aria-label="Steps">
          {STEPS.map(({ n, title }, i) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={activeStep === i}
              aria-label={title}
              className={`ml-dot ${activeStep === i ? "ml-dot--on" : ""}`}
              onClick={() => {
                haptic("bubble");
                const card =
                  trackRef.current?.querySelectorAll<HTMLElement>(".ml-step")[i];
                card?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }}
            />
          ))}
        </div>
      </section>

      {/* ---------------- try it: scribe + time saved ---------------- */}
      <section className="ml-try" id="ml-try">
        <div className="ml-try__head" data-lift>
          <span className="ml-tag">Try it</span>
          <h2>Watch a note write itself.</h2>
        </div>

        <div className="ml-sim" data-lift ref={simRef}>
          <div className="ml-sim__bar">
            <span className="ml-sim__who">Orthopaedics OPD · 64M</span>
            <button type="button" className="ml-sim__play" onClick={toggleSim}>
              {simPlaying ? <Pause size={14} /> : <Play size={14} />}
              {simPlaying ? "Pause" : simDone ? "Replay" : "Play"}
            </button>
          </div>

          <div className="ml-sim__stream">
            {SIM_DIALOGUE.map((line, i) => (
              <p
                key={i}
                className={`ml-sim__line ml-sim__line--${line.who} ${
                  i <= simLine ? "ml-sim__line--in" : ""
                }`}
              >
                <b>{line.who === "doctor" ? "Dr. Nair" : "Patient"}</b>
                {line.text}
              </p>
            ))}
            {simLine < 0 && <p className="ml-sim__hint">Press play to hear the room.</p>}
          </div>

          <div className={`ml-sim__note ${simDone ? "ml-sim__note--in" : ""}`}>
            <span className="ml-sim__note-k">
              <Sparkles size={12} /> Extracted note
            </span>
            <p>
              <b>Complaint</b> {SIM_NOTE.complaint}
            </p>
            <p>
              <b>Assessment</b> {SIM_NOTE.assessment} · <em>{SIM_NOTE.icd10}</em>
            </p>
            <ul>
              {SIM_NOTE.rx.map((rx) => (
                <li key={rx}>{rx}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- time saved ---- */}
        <div className="ml-roi" data-lift>
          <span className="ml-tag">Time saved</span>
          <h3>Your practice, in hours.</h3>

          <label className="ml-slider">
            <span>
              Patients a day <b>{patientsPerDay}</b>
            </span>
            <input
              type="range"
              min={5}
              max={80}
              value={patientsPerDay}
              onChange={(e) => setPatientsPerDay(Number(e.target.value))}
            />
          </label>

          <label className="ml-slider">
            <span>
              Minutes charting each <b>{minsPerNote}</b>
            </span>
            <input
              type="range"
              min={2}
              max={15}
              value={minsPerNote}
              onChange={(e) => setMinsPerNote(Number(e.target.value))}
            />
          </label>

          <label className="ml-slider">
            <span>
              Clinic days a week <b>{daysPerWeek}</b>
            </span>
            <input
              type="range"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            />
          </label>

          <div className="ml-roi__out">
            <div className="ml-roi__big">
              <strong>{weeklyHours.toFixed(1)}</strong>
              <span>hours a week</span>
            </div>
            <div className="ml-roi__small">
              <strong>{Math.round(annualHours)}</strong>
              <span>hours a year</span>
            </div>
          </div>
          <p className="ml-roi__note">
            Assumes MediVaani still needs about 1.4 minutes of review per note — that part
            is counted against it, not for it.
          </p>
        </div>
      </section>

      {/* ---------------- languages ticker ---------------- */}
      <section className="ml-langs" data-lift>
        <span className="ml-tag ml-tag--center">Understands the room</span>
        <div className="ml-marquee" aria-label="Supported Indian languages">
          <div className="ml-marquee__row">
            {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
              <span key={i}>{lang}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- why ---------------- */}
      <section className="ml-why" id="ml-why">
        <div className="ml-why__head" data-lift>
          <span className="ml-tag">Why MediVaani</span>
          <h2>Built for a real OPD, not a demo.</h2>
        </div>
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article className="ml-feature" key={title} data-lift>
            <span className="ml-feature__icon">
              <Icon size={18} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ---------------- close ---------------- */}
      <section className="ml-close" id="ml-contact" data-lift>
        <h2>
          Start with your <span className="ml-title__grad">next patient.</span>
        </h2>
        <p>Free to try. No card, no setup call, no EMR migration.</p>
        <Link
          className="ml-btn ml-btn--primary"
          to="/login"
          onClick={() => haptic("medium")}
        >
          <Mic size={17} />
          Start free workspace
        </Link>
        <Link className="ml-btn ml-btn--ghost" to="/contact">
          <Mail size={15} /> Talk to us
        </Link>
      </section>

      <footer className="ml-footer">
        <div className="ml-brand ml-brand--sm">
          <BrandMark size={20} />
          <span>
            MediVaani<b>AI</b>
          </span>
        </div>
        <p>Ambient clinical documentation for Indian practices.</p>
        <span className="ml-footer__legal">
          DPDP Act 2023 aligned · © {new Date().getFullYear()} MediVaani
        </span>
      </footer>

      {/* ---------------- the one nav ---------------- */}
      <nav
        className="ml-nav"
        aria-label="Landing sections"
        style={{ "--ml-slots": NAV.length } as React.CSSProperties}
      >
        <span
          className="ml-nav__bubble"
          style={{ transform: `translateX(${activeNav * 100}%)` }}
          aria-hidden
        />
        {NAV.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            type="button"
            className={`ml-nav__item ${activeNav === i ? "ml-nav__item--on" : ""}`}
            aria-current={activeNav === i ? "true" : undefined}
            onClick={() => goTo(id, i)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
