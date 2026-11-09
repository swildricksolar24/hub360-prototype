import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/Button/Button';
import { TextInput } from '../../../../components/TextInput/TextInput';
import styles from './warehouses.module.css';

/**
 * The pop-over a table header's filter icon opens (DataHeader `onFilter`): a "Contains…" field with Clear and Apply.
 * It sits under the header cell it was opened from; put it inside the table's `tableScroll` box.
 */
export function ColumnFilter({
  anchor,
  label,
  value,
  onApply,
  onClose,
}: {
  /** The header cell the filter belongs to. */
  anchor: HTMLElement | null | undefined;
  label: string;
  value: string;
  /** The text to filter by; empty clears the filter. */
  onApply: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const left = anchor ? anchor.offsetLeft : 0;
  useEffect(() => {
    ref.current?.querySelector('input')?.focus();
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('[role="columnheader"]')) onClose();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className={styles.filter}
      style={{ left }}
      role="dialog"
      aria-label={`Filter ${label}`}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          onApply(text);
        }}
      >
        <TextInput label={`Filter ${label}`} value={text} onChange={e => setText(e.target.value)} placeholder="Contains…" />
        <div className={styles.filterActions}>
          <Button size="small" variant="outline" type="button" onClick={() => onApply('')}>
            Clear
          </Button>
          <Button size="small" variant="brand" type="submit">
            Apply
          </Button>
        </div>
      </form>
    </div>
  );
}
