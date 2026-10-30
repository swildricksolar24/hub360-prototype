import type { ReactNode } from 'react';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import styles from './AppModal.module.css';

export type AppModalAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Destructive action (delete, deactivate account…): drawn red instead of brand teal. */
  danger?: boolean;
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
  /**
   * default = the app's 800px "Dialog / Modal" · confirm = the design system's "Modal - Dialog*" (560px, teal bar
   * across the top and a round icon badge next to the title), for "are you sure?" questions.
   */
  variant?: 'default' | 'confirm';
  /** Confirm only: the badge icon. Default `check`. */
  icon?: string;
  /** Panel width; the app's modals are 800px (narrower screens shrink it to fit). Confirm modals keep 560px. */
  width?: number | string;
  /** Long content scrolls inside the body (Figma `Style=Scrollbar`). */
  scrollable?: boolean;
};

function ActionButton({ action, variant }: { action: AppModalAction; variant: 'outline' | 'brand' }) {
  return (
    <Button
      size="small"
      variant={variant}
      className={action.danger ? styles.danger : undefined}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

/**
 * The app's standard modal: Figma "_Sign In / Shell" › Modal page (782:12791), a "Modal Screen" with the
 * 800px "Dialog / Modal" over the shell, in light and dark. Built on the design-system Modal, so it gets the
 * scrim, focus handling, Escape to close and the close button's hover / press / focus states.
 *
 * Use it for every dialog in the app; pass content, not layout.
 */
export function AppModal({
  onClose,
  primaryAction,
  secondaryAction,
  startAction,
  variant = 'default',
  icon,
  width,
  ...rest
}: AppModalProps) {
  const secondary = secondaryAction === false ? null : (secondaryAction ?? { label: 'Cancel', onClick: onClose });
  const actions =
    secondary || primaryAction || startAction ? (
      <>
        {startAction && (
          <span className={styles.start}>
            <ActionButton action={startAction} variant={startAction.danger ? 'brand' : 'outline'} />
          </span>
        )}
        {secondary && <ActionButton action={secondary} variant="outline" />}
        {primaryAction && <ActionButton action={primaryAction} variant="brand" />}
      </>
    ) : undefined;

  if (variant === 'confirm') {
    return <Modal {...rest} variant="confirm" icon={icon} width={width} onClose={onClose} actions={actions} />;
  }
  return <Modal {...rest} variant="default" width={width ?? 800} onClose={onClose} actions={actions} />;
}
