import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Accordion.module.css';

export type AccordionProps = {
  /** Figma `Label` of the Category header. */
  label: ReactNode;
  /** Figma `Show Icon` + the header's icon instance. Leave out to hide it. */
  icon?: string;
  /** Controlled open state (Figma `State=Open`). */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Panel content, usually `AccordionItem`s. */
  children?: ReactNode;
  className?: string;
};

/**
 * Figma "Drop Down - Accordion": a Category header button (`aria-expanded`) that shows or hides
 * a panel of items.
 */
export function Accordion({ label, icon, open: openProp, defaultOpen = false, onOpenChange, children, className }: AccordionProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const id = useId();
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  const toggle = () => {
    if (openProp === undefined) setOpenState(!open);
    onOpenChange?.(!open);
  };

  return (
    <div className={[styles.accordion, className].filter(Boolean).join(' ')} data-open={open || undefined}>
      <button type="button" id={headerId} className={styles.header} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <span className={styles.content}>
          {icon && <Icon name={icon} size={24} color="currentColor" className={styles.icon} />}
          <span>{label}</span>
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={24} color="currentColor" className={styles.icon} />
      </button>
      <div id={panelId} role="region" aria-labelledby={headerId} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

export type AccordionItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label`. */
  children: ReactNode;
  /** Figma `Show Icon` + the item's icon instance (`check` in the Figma accordion). */
  icon?: string;
};

/** A row inside an Accordion panel (Figma "Categories", `Type=Item`). */
export function AccordionItem({ children, icon, type = 'button', className, ...rest }: AccordionItemProps) {
  return (
    <button type={type} className={[styles.item, className].filter(Boolean).join(' ')} {...rest}>
      {icon && <Icon name={icon} size={24} color="currentColor" className={styles.icon} />}
      <span>{children}</span>
    </button>
  );
}
