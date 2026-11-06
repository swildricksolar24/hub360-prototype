import type { ReactNode } from 'react';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import styles from './AppModal.module.css';

export type AppModalAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Destructive action (delete, deactivate…): the red Button (`brand-red`, Figma Brand / Small / Red) instead of brand teal. */
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
  /** Body text under the title. */
  description?: ReactNode;
  /** Extra body content (forms, lists) below the description. */
  children?: ReactNode;
  /** The main action, right-most. Uses the brand (teal) button so the action stands out (Figma draws a gray Primary). */
  primaryAction?: AppModalAction;
  /** The action before it (Figma "Button / Small / Outline"). Defaults to "Cancel", which closes; `false` hides it. */
  secondaryAction?: AppModalAction | false;
  /** An action at the start of the footer, away from the others (e.g. a red "Delete View"). */
  startAction?: AppModalAction;
  /** Panel width; the app's modals are 800px (narrower screens shrink it to fit). */
  width?: number | string;
  /** Long content scrolls inside the body (Figma `Style=Scrollbar`). */
  scrollable?: boolean;
  /** The line above the buttons (inside the padding). On by default for every app modal; pass false to hide it. */
  footerDivider?: boolean;
  /** Extra class on the panel, for a dialog that needs its own size or placement (e.g. the tab overview). */
  className?: string;
};

function ActionButton({ action, variant }: { action: AppModalAction; variant: 'outline' | 'brand' | 'primary' }) {
  // A destructive action is the red button wherever it sits (Figma Brand / Small / Red)
  const shown = action.danger ? 'brand-red' : variant;
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
 * The app's standard modal: the design-system "Dialog / Modal" (Base file, - Modal page, 429:687), 800px, shown over
 * the shell inside "Modal Screen*" (805:922) as the "_Sign In / Shell" file's Modal page uses it (782:12791), in light
 * and dark. Built on the design-system Modal, so it gets the scrim, focus handling, Escape to close and the close
 * button's hover / press / focus states.
 *
 * Use it for every dialog in the app; pass content, not layout. Every dialog has the same look, "are you sure?"
 * confirmations and errors included: title and close button, description, a line, then Cancel and the teal action.
 */
export function AppModal({
  onClose,
  primaryAction,
  secondaryAction,
  startAction,
  width,
  footerDivider = true,
  ...rest
}: AppModalProps) {
  const secondary = secondaryAction === false ? null : (secondaryAction ?? { label: 'Cancel', onClick: onClose });
  const actions =
    secondary || primaryAction || startAction ? (
      <>
        {startAction && (
          <span className={styles.start}>
            <ActionButton action={startAction} variant={startAction.danger ? 'brand' : startAction.icon ? 'primary' : 'outline'} />
          </span>
        )}
        {secondary && <ActionButton action={secondary} variant="outline" />}
        {primaryAction && <ActionButton action={primaryAction} variant="brand" />}
      </>
    ) : undefined;

  return <Modal {...rest} variant="default" footerDivider={footerDivider} width={width ?? 800} onClose={onClose} actions={actions} />;
}
