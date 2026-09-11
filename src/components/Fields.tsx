import { useId, useState } from 'react';
import { parseNumber } from '../domain/numbers';
import type { Translator } from '../i18n/messages';

type NumberProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  required?: boolean;
  t: Translator;
};

/** Draft text remains visible until valid; invalid/unknown values never become zero. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 1e7,
  required = false,
  t,
}: NumberProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<'' | 'invalidNumber' | 'requiredNumber' | 'invalidRange'>('');
  const commit = (input: string) => {
    const number = parseNumber(input);
    const message =
      number === 'invalid'
        ? 'invalidNumber'
        : number === null
          ? required
            ? 'requiredNumber'
            : ''
          : number < min || number > max
            ? 'invalidRange'
            : '';
    setError(message);
    if (!message && number !== 'invalid') {
      onChange(number);
      setDraft(null);
    }
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`number-wrap ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={draft ?? (value === null ? '' : String(value))}
          placeholder="—"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setError('');
          }}
          onBlur={(e) => {
            if (draft !== null) commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setDraft(null);
              setError('');
            }
          }}
        />
        {unit && <span dir="ltr">{unit}</span>}
      </div>
      {error && (
        <small id={`${id}-error`} className="field-error" role="alert">
          {t(error)}
        </small>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 160,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
