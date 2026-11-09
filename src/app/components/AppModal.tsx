import type { ReactNode } from 'react';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import styles from './AppModal.module.css';

export type AppModalAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /**
   * Destructive action (delete, deactivate…): the solid red Button (`brand-red`, Figma Solid / Red / Base) instead of
   * brand teal, or the red outline (`red-outline`, Figma Clear / Red) as the start action (e.g. "Remove from Warehouse").
   */
  danger?: boolean;
  /**
   * Start action only: a leading icon, drawn as Figma's gray "Button Small / Primary / Icon" (e.g. "View Open Orders"),
   * for a link-like step away from the dialog.
   */
  icon?: string;
};

export type AppModalProps = {
  open: boolean;
  /** Close button, Escape, clicking the scrim, and the default secondary action. */
  onClose: () => void;
  title: ReactNode;
  /** The line right under the title, in the header (Figma "Modal - Dynamic" `Description`). */
  description?: ReactNode;
  /** The body (forms, lists, messages), between the header's line and the footer's. */
  children?: ReactNode;
  /** Controls in the header's top row, before the close button (Figma: a Toggle Button, a Drop Down, a button), e.g. Active. */
  headerActions?: ReactNode;
  /** The main action, right-most. Uses the brand (teal) button so the action stands out (Figma draws a gray Primary). */
  primaryAction?: AppModalAction;
  /** The action before it (Figma "Button / Small / Outline"). Defaults to "Cancel", which closes; `false` hides it. */
  secondaryAction?: AppModalAction | false;
  /** An action at the start of the footer, away from the others (e.g. a red outline "Remove from Warehouse"). */
  startAction?: AppModalAction;
  /** Panel width; the app's modals are 800px (narrower screens shrink it to fit). */
  width?: number | string;
  /** Long content scrolls inside the body, so the header and footer stay put. */
  scrollable?: boolean;
  /** Extra class on the panel, for a dialog that needs its own size or placement (e.g. the tab overview). */
  className?: string;
};

function ActionButton({ action, variant }: { action: AppModalAction; variant: 'outline' | 'brand' | 'primary' | 'red-outline' }) {
  // A destructive main action is the solid red button (Figma Solid / Red / Base); one at the start of the footer,
  // away from the main action, is the red outline (Figma Clear / Red, e.g. "Remove from Warehouse")
  const shown = action.danger && variant !== 'red-outline' ? 'brand-red' : variant;
  return (
    <Button
      size="small"
      variant={shown}
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

/**
 * The app's standard modal: the design-system "Modal - Dynamic" (Base file, - Modal page, 2684:8355; Volt Modal
 * `variant="sectioned"`), 800px. Built on the design-system Modal, so it gets the scrim, focus handling, Escape to close
 * and the close button's hover / press / focus states, in light and dark.
 *
 * Use it for every dialog in the app; pass content, not layout. Every dialog has the same three parts, "are you sure?"
 * confirmations and errors included:
 * - header: optional controls and the close button, the title with its description right under it, then a line;
 * - body: the children;
 * - footer: a line, then the start action on the left (a destructive one is the red outline) and Cancel and the teal
 *   action on the right.
 */
export function AppModal({ onClose, primaryAction, secondaryAction, startAction, width, scrollable, children, ...rest }: AppModalProps) {
  const secondary = secondaryAction === false ? null : (secondaryAction ?? { label: 'Cancel', onClick: onClose });
  const start = startAction && <ActionButton action={startAction} variant={startAction.danger ? 'red-outline' : startAction.icon ? 'primary' : 'outline'} />;
  const actions =
    secondary || primaryAction ? (
      <>
        {secondary && <ActionButton action={secondary} variant="outline" />}
        {primaryAction && <ActionButton action={primaryAction} variant="brand" />}
      </>
    ) : undefined;

  return (
    <Modal {...rest} variant="sectioned" width={width ?? 800} onClose={onClose} footerStart={start} actions={actions}>
      {children && scrollable ? <div className={styles.scrollBody}>{children}</div> : children}
    </Modal>
  );
}
