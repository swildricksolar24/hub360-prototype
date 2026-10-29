import { useId, useState, type DragEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './UploadFile.module.css';

export type UploadFileProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'title'> & {
  /** Called with the chosen or dropped files. */
  onFiles?: (files: File[]) => void;
  /** First line. Figma: "Drop your image here, or" followed by the "browse" link text. */
  title?: ReactNode;
  /** The link-styled word at the end of the title. */
  browseLabel?: ReactNode;
  /** Second line. Figma: "Supports JPG, PNG, PDF, DOC, XLS, CSV". */
  hint?: ReactNode;
  /** Icon name from the Icon component. Figma uses `photo`. */
  icon?: string;
};

/**
 * Figma "Upload Document › Upload File". `State=Hover` is CSS `:hover`; dragging files over it shows the same fill.
 * The whole area is a <label> for a visually hidden native file input, so click, keyboard and screen readers work.
 */
export function UploadFile({
  onFiles,
  title = 'Drop your image here, or',
  browseLabel = 'browse',
  hint = 'Supports JPG, PNG, PDF, DOC, XLS, CSV',
  icon = 'photo',
  id,
  className,
  disabled,
  ...inputProps
}: UploadFileProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const [dragging, setDragging] = useState(false);

  const onDrag = (e: DragEvent<HTMLLabelElement>, over: boolean) => {
    if (disabled) return;
    e.preventDefault();
    setDragging(over);
  };
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles?.(inputProps.multiple ? files : files.slice(0, 1));
  };

  return (
    <label
      htmlFor={inputId}
      className={[styles.upload, className].filter(Boolean).join(' ')}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onDragOver={e => onDrag(e, true)}
      onDragLeave={e => onDrag(e, false)}
      onDrop={onDrop}
    >
      <svg className={styles.dash} aria-hidden>
        <rect x="0" y="0" width="100%" height="100%" />
      </svg>
      <input
        id={inputId}
        type="file"
        className={styles.input}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={e => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles?.(files);
          e.target.value = '';
        }}
        {...inputProps}
      />
      <Icon name={icon} size={60} />
      <span className={styles.text}>
        <span className={styles.title}>
          {title} <span className={styles.browse}>{browseLabel}</span>
        </span>
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      </span>
    </label>
  );
}
