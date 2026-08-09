import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldShellProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  icon?: ReactNode;
  id: string;
  children: ReactNode;
}

function FieldShell({
  label,
  required,
  error,
  hint,
  icon,
  id,
  children,
}: FieldShellProps) {
  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field__label" htmlFor={id}>
          {label} {required && <em>*</em>}
        </label>
      )}
      <div className={`ui-field__wrap ${icon ? "ui-field__wrap--icon" : ""}`}>
        {icon && <span className="ui-field__icon">{icon}</span>}
        {children}
      </div>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  required,
  className,
  id: idProp,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      hint={hint}
      icon={icon}
      id={id}
    >
      <input
        id={id}
        required={required}
        className={`ui-field__input ${error ? "ui-field__input--error" : ""} ${className ?? ""}`}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  ...rest
}: TextAreaFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} id={id}>
      <textarea
        id={id}
        required={required}
        className={`ui-field__input ${error ? "ui-field__input--error" : ""} ${className ?? ""}`}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  children,
  ...rest
}: SelectFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} id={id}>
      <select
        id={id}
        required={required}
        className={`ui-field__input ${error ? "ui-field__input--error" : ""} ${className ?? ""}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface CheckFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export function CheckField({ label, ...rest }: CheckFieldProps) {
  return (
    <label className="ui-check">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}
