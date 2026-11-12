import type { HTMLAttributes, ReactNode } from 'react';
import styles from './ActionBanner.module.css';

export type ActionBannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** The headline, e.g. "1 job failed · out of labels" (Large/Bold, Gray Text/Strong). */
  title: ReactNode;
  /** What happened and what to do about it (Medium/Regular, Gray Text/Weak). */
  children?: ReactNode;
  /**
   * The fixes, at the right. Figma's two actions: Button Small outline "Send to Another Printer" (Clear / Base) and
   * Button Small brand "Retry Job" (Solid / Teal / Base). On a narrow card they wrap under the text.
   */
  actions?: ReactNode;
};

/**
 * Figma "Action Banner" (Base, "- Action Banner" page, 3506:3; error only for now): a problem that needs the
 * person's action, with the fixes beside it. A card on Surfaces/Overlay with a 2px Semantic Fill/Error Strongest edge,
 * the title and explanation on the left and the two action buttons on the right: outline "Send to Another Printer"
 * and brand "Retry Job". It is announced as an alert.
 */
export function ActionBanner({ title, children, actions, className, role = 'alert', ...rest }: ActionBannerProps) {
  return (
    <div role={role} className={[styles.banner, className].filter(Boolean).join(' ')} {...rest}>
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        {children && <p className={styles.body}>{children}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
