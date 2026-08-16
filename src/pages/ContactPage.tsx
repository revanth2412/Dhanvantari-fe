import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  Headphones,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";

const CONTACT_EMAIL = "revanth.sharma5198@gmail.com";

/**
 * Support desk. There is no mail endpoint on the backend, so this page does not
 * pretend to send anything: it hands over the address, with a one-tap copy and
 * a pre-addressed mail-client link.
 */
export function ContactPage() {
  const { doctor, status } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [copiedEmail, setCopiedEmail] = useState(false);

  const isAuthed = status === "approved";
  const mailtoBody = doctor
    ? `\n\n—\n${doctor.full_name}${doctor.clinic_name ? ` · ${doctor.clinic_name}` : ""}\n${doctor.email}`
    : "";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopiedEmail(true);
    toast({
      kind: "success",
      title: "Email Copied",
      message: `${CONTACT_EMAIL} copied to clipboard.`,
    });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <main className="page contact-page-root">
      <div className="contact-nav-row">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isAuthed ? navigate("/dashboard") : navigate("/landing"))}
        >
          <ArrowLeft size={15} /> {isAuthed ? "Back to Dashboard" : "Back to Home"}
        </Button>

        <div className="contact-status-chip">
          <span className="contact-live-dot" />
          <span>Support Desk Online</span>
        </div>
      </div>

      <header className="contact-hero-header">
        <div className="contact-badge">
          <Headphones size={13} className="mv-text-emerald" />
          <span>MEDIVAANI SUPPORT &amp; INQUIRIES</span>
        </div>
        <h1>Get in Touch with MediVaani</h1>
        <p className="contact-hero-desc">
          Questions about deploying MediVaani AI in your clinic, technical assistance, or
          custom integrations — write to our clinical intelligence engineering team and
          we&rsquo;ll take it from there.
        </p>
      </header>

      <div className="contact-grid contact-grid--simple">
        {/* Primary: the email address itself */}
        <div className="contact-info-card contact-info-card--primary">
          <div className="contact-icon-bubble">
            <Mail size={22} />
          </div>
          <span className="contact-card-sub">DIRECT INQUIRIES &amp; SUPPORT</span>
          <strong className="contact-email-text">{CONTACT_EMAIL}</strong>
          <p className="contact-card-text">
            Reaches our lead engineering and clinical integration team directly. Include
            your clinic name and, for a technical issue, roughly when it happened — it
            makes the logs far easier to trace.
          </p>

          <div className="contact-card-actions">
            <button
              type="button"
              className="contact-action-btn contact-action-btn--copy"
              onClick={handleCopyEmail}
            >
              {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedEmail ? "Copied!" : "Copy Email"}</span>
            </button>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                "MediVaani Inquiry",
              )}&body=${encodeURIComponent(mailtoBody)}`}
              className="contact-action-btn contact-action-btn--mail"
            >
              <Send size={14} />
              <span>Open Mail Client</span>
            </a>
          </div>
        </div>

        {/* What to expect back */}
        <div className="contact-info-card">
          <div className="contact-telemetry-item">
            <div className="contact-t-icon">
              <Clock size={16} className="mv-text-emerald" />
            </div>
            <div>
              <strong>Average Response Time</strong>
              <span>Under 2 hours during OPD business hours</span>
            </div>
          </div>

          <div className="contact-telemetry-item">
            <div className="contact-t-icon">
              <Building2 size={16} className="mv-text-amber" />
            </div>
            <div>
              <strong>Clinic &amp; Hospital Onboarding</strong>
              <span>Assisted multi-doctor OPD setup &amp; training</span>
            </div>
          </div>

          <div className="contact-telemetry-item">
            <div className="contact-t-icon">
              <ShieldCheck size={16} className="mv-text-emerald" />
            </div>
            <div>
              <strong>DPDP Act 2023 &amp; Data Security</strong>
              <span>Dedicated healthcare compliance desk</span>
            </div>
          </div>

          <p className="contact-privacy-note contact-privacy-note--block">
            <ShieldCheck size={13} className="mv-text-emerald" />
            <span>
              Please don&rsquo;t include patient-identifying details in a support email —
              a consultation ID is enough for us to investigate.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
