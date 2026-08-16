import { BadgeCheck, PenLine, Stethoscope } from "lucide-react";
import type { Consultation } from "@/types/consultation";
import type { ClinicalRecord } from "@/types/record";
import { formatDateTime } from "@/lib/format";
import { useClinicDirectory } from "@/hooks/useClinicDirectory";

interface ConsultationProvenanceProps {
  consultation: Consultation;
  /** The note, when one exists — carries the sign-off. */
  record?: ClinicalRecord | null;
  className?: string;
}

/**
 * Who did what on this consultation: the doctor who conducted it, and the one
 * who signed the note off.
 *
 * `reviewed_by` is a name captured at save/finalize time, so on a draft it
 * means "last edited by" and only becomes a sign-off once the record is final —
 * the labels say which, rather than implying a signature that isn't there.
 */
export function ConsultationProvenance({
  consultation,
  record,
  className,
}: ConsultationProvenanceProps) {
  const directory = useClinicDirectory();

  const conductedName = directory.nameFor(consultation.doctor_id);
  const conductedBy = consultation.doctor_id
    ? (conductedName ?? "Another doctor in this clinic")
    : "Not recorded";
  const startedAt = consultation.started_at ?? consultation.created_at;

  const isFinal = record?.status === "final";
  const reviewer = record?.reviewed_by?.trim() || null;

  return (
    <div className={`prov ${className ?? ""}`}>
      <span className="prov__item">
        <Stethoscope size={13} className="prov__icon" />
        <span className="prov__k">Conducted by</span>
        <strong className="prov__v">
          {conductedBy}
          {directory.isSelf(consultation.doctor_id) && (
            <span className="prov__you">you</span>
          )}
        </strong>
        {startedAt && <span className="prov__when">{formatDateTime(startedAt)}</span>}
      </span>

      {isFinal ? (
        <span className="prov__item prov__item--final">
          <BadgeCheck size={13} className="prov__icon" />
          <span className="prov__k">Signed off by</span>
          <strong className="prov__v">{reviewer ?? "Unrecorded"}</strong>
          {record?.finalized_at && (
            <span className="prov__when">{formatDateTime(record.finalized_at)}</span>
          )}
        </span>
      ) : (
        <span className="prov__item">
          <PenLine size={13} className="prov__icon" />
          {reviewer ? (
            <>
              <span className="prov__k">Last edited by</span>
              <strong className="prov__v">{reviewer}</strong>
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
