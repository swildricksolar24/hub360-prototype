import type { ReactNode } from 'react';
import styles from './requiredMark.module.css';

/**
 * A field label whose text ends in " *" (e.g. "Country *") gets its asterisk drawn in Semantic Text/Error, the same red
 * as the required marks built into labels elsewhere, so every required field marks itself the same way. Other labels
 * pass through unchanged. Shared by TextInput, TextArea, NumericInput and Dropdown.
 */
export function withRequiredMark(label: ReactNode): ReactNode {
  if (typeof label !== 'string' || !label.endsWith(' *')) return label;
  return (
    <>
      {label.slice(0, -1)}
      <span className={styles.mark}>*</span>
    </>
  );
}
