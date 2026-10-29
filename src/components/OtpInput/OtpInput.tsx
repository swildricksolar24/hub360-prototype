import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import styles from './OtpInput.module.css';

export type OtpInputProps = {
  /** Accessible name for the group of cells, e.g. "Verification code". */
  label: string;
  /** Number of cells (the Figma set is one 40×60 cell). */
  length?: number;
  /** Controlled code. Figma's `Label` text property is a cell's digit. */
  value?: string;
  /** Initial code when uncontrolled. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once every cell is filled. */
  onComplete?: (value: string) => void;
  /** Figma `State=Error`. */
  error?: boolean;
  /** Figma `State=Disabled`. */
  disabled?: boolean;
  /** Only digits by default; set to `false` to allow letters. */
  numeric?: boolean;
  /** Focus the first cell on mount. */
  autoFocus?: boolean;
  /** Name for form submission; the joined code is posted as one hidden field. */
  name?: string;
  className?: string;
};

/** OTP Input (Figma "OTP Input*"): one input per character, with paste and arrow-key support. */
export function OtpInput({
  label,
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  error = false,
  disabled = false,
  numeric = true,
  autoFocus,
  name,
  className,
}: OtpInputProps) {
  const controlled = value !== undefined;
  const [draft, setDraft] = useState(defaultValue);
  const code = (controlled ? value : draft).slice(0, length);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const allowed = numeric ? /\d/ : /[\p{L}\p{N}]/u;

  const update = (next: string) => {
    if (!controlled) setDraft(next);
    onChange?.(next);
    if (next.length === length && !next.includes(' ')) onComplete?.(next);
  };

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  // Keep the code as a fixed-length string with spaces for empty cells, trimmed at the end
  const write = (start: number, chars: string) => {
    const cells = Array.from({ length }, (_, i) => code[i] ?? ' ');
    [...chars].forEach((c, k) => {
      if (start + k < length) cells[start + k] = c;
    });
    update(cells.join('').trimEnd());
  };

  const handleInput = (i: number, raw: string) => {
    const chars = [...raw].filter(c => allowed.test(c)).join('');
    if (!chars) return;
    write(i, chars);
    focusCell(i + chars.length);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (code[i] && code[i] !== ' ') write(i, ' ');
      else if (i > 0) {
        write(i - 1, ' ');
        focusCell(i - 1);
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      write(i, ' ');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCell(i + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusCell(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusCell(length - 1);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleInput(i, e.clipboardData.getData('text'));
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={[styles.otp, className].filter(Boolean).join(' ')}
      data-error={error || undefined}
    >
      {Array.from({ length }, (_, i) => {
        const ch = code[i] && code[i] !== ' ' ? code[i] : '';
        return (
          <input
            key={i}
            ref={el => {
              refs.current[i] = el;
            }}
            className={styles.cell}
            type="text"
            inputMode={numeric ? 'numeric' : 'text'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            aria-label={`${label}, character ${i + 1} of ${length}`}
            aria-invalid={error || undefined}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            value={ch}
            onChange={e => handleInput(i, e.target.value.replace(ch, '') || e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={e => handlePaste(i, e)}
            onFocus={e => e.target.select()}
          />
        );
      })}
      {name && <input type="hidden" name={name} value={code.replace(/ /g, '')} />}
    </div>
  );
}
