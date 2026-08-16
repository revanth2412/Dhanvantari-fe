import { BadgeCheck, PenLine, Stethoscope } from "lucide-react";
import type { Consultation } from "@/types/consultation";
import type { ClinicalRecord } from "@/types/record";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

interface ConsultationProvenanceProps {
  consultation: Consultation;
  /** The note, when one exists — carries the signature. */
  record?: ClinicalRecord | null;
  className?: string;
}

/**
 * Who did what on this consultation: the doctor who conducted it, and the one
 * who signed the note off.
 *
 * Every name here is server-derived — `doctor_name` on the consultation,
 * `reviewed_by` / `finalized_by` on the record — so nothing is inferred and a
 * client can't misattribute a signature. `reviewed_by` is stamped on every
 * save, so on a draft it means "last edited by"; the labels say which rather
 * than implying a signature that isn't there.
 */
export function ConsultationProvenance({
  consultation,
  record,
  className,
}: ConsultationProvenanceProps) {
  const { doctor } = useAuth();

  const isSelf = Boolean(consultation.doctor_id && consultation.doctor_id === doctor?.id);
  const conductedBy =
    consultation.doctor_name ??
    (consultation.doctor_id ? "Another doctor in this clinic" : "Not recorded");
  const startedAt = consultation.started_at ?? consultation.created_at;

  const isFinal = record?.status === "final";
  const signedBy = record?.finalized_by?.trim() || null;
  const editedBy = record?.reviewed_by?.trim() || null;

  return (
    <div className={`prov ${className ?? ""}`}>
      <span className="prov__item">
        <Stethoscope size={13} className="prov__icon" />
        <span className="prov__k">Conducted by</span>
        <strong className="prov__v">
          {conductedBy}
          {isSelf && <span className="prov__you">you</span>}
        </strong>
        {startedAt && <span className="prov__when">{formatDateTime(startedAt)}</span>}
      </span>

      {isFinal ? (
        <span className="prov__item prov__item--final">
          <BadgeCheck size={13} className="prov__icon" />
          <span className="prov__k">Signed off by</span>
          <strong className="prov__v">{signedBy ?? editedBy ?? "Unrecorded"}</strong>
          {record?.finalized_at && (
            <span className="prov__when">{formatDateTime(record.finalized_at)}</span>
          )}
        </span>
      ) : (
        <span className="prov__item">
          <PenLine size={13} className="prov__icon" />
          {editedBy ? (
            <>
              <span className="prov__k">Last edited by</span>
              <strong className="prov__v">{editedBy}</strong>
              <span className="prov__when">not signed off yet</span>
            </>
          ) : (
            <span className="prov__k">Not signed off yet</span>
          )}
        </span>
      )}
    </div>
  );
}
