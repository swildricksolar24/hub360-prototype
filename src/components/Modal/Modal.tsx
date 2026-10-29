import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { Overlay } from '../Overlay/Overlay';
import { Scrollbar } from '../Scrollbar/Scrollbar';
import styles from './Modal.module.css';

export type ModalVariant = 'default' | 'sectioned' | 'confirm';

export type ModalPanelProps = {
  /**
   * default = Figma "Dialog / Modal" (464px, radius 24) ·
   * sectioned = "Modal - Dynamic" (650px; header, body and footer split by dividers) ·
   * confirm = "Modal - Dialog*" (560px; teal top bar and a status icon).
   */
  variant?: ModalVariant;
  /** Figma `Title`. */
  title: ReactNode;
  /** Figma `Body` (default) or `Description` (sectioned, confirm). Plain text under the title. */
  description?: ReactNode;
  /** Extra body content: form fields in "sectioned", or anything below the description. */
  children?: ReactNode;
  /** Buttons at the end of the footer (right-aligned). */
  actions?: ReactNode;
  /** Sectioned only: content at the start of the footer, e.g. a destructive action. */
  footerStart?: ReactNode;
  /** Sectioned only: controls in the header toolbar, before the close button. */
  headerActions?: ReactNode;
  /** Confirm only: icon in the round badge next to the title. Figma uses `check`. */
  icon?: string;
  /** Default only: Figma `Style=Scrollbar`. The description scrolls in a sunken box with the Scrollbar. */
  scrollable?: boolean;
  /** Height of the scrolling box when `scrollable` (Figma 137px). */
  scrollHeight?: number | string;
  /** Shows the close button (default and sectioned). */
  onClose?: () => void;
  closeLabel?: string;
  /** Panel width (number = px, or any CSS length). Defaults to the Figma width of the variant. */
  width?: number | string;
  /** Ids used by Modal for `aria-labelledby` / `aria-describedby`. */
  titleId?: string;
  descriptionId?: string;
  className?: string;
};

/** The modal card on its own, without the dialog or scrim. Use it for static layouts; use `Modal` for real dialogs. */
export function ModalPanel({
  variant = 'default',
  title,
  description,
  children,
  actions,
  footerStart,
  headerActions,
  icon = 'check',
  scrollable = false,
  scrollHeight = 137,
  onClose,
  closeLabel = 'Close',
  width,
  titleId,
  descriptionId,
  className,
}: ModalPanelProps) {
  const style: CSSProperties = { width };
  const cls = [styles.panel, className].filter(Boolean).join(' ');
  const close = onClose && <IconButton label={closeLabel} icon="close" size="compact" className={styles.close} onClick={onClose} />;
  const titleEl = (
    <h2 id={titleId} className={styles.title}>
      {title}
    </h2>
  );

  if (variant === 'sectioned') {
    return (
      <div className={cls} data-variant="sectioned" style={style}>
        <header className={styles.header}>
          {(headerActions || close) && (
            <div className={styles.toolbar}>
              {headerActions}
              {close}
            </div>
          )}
          <div className={styles.heading}>
            {titleEl}
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
        </header>
        {children && <div className={styles.body}>{children}</div>}
        {(footerStart || actions) && (
          <footer className={styles.footer}>
            <div className={styles.actions}>{footerStart}</div>
            <div className={styles.actions}>{actions}</div>
          </footer>
        )}
      </div>
    );
  }

  if (variant === 'confirm') {
    return (
      <div className={cls} data-variant="confirm" style={style}>
        <div className={styles.content}>
          <div className={styles.confirmHeading}>
            <span className={styles.badge} aria-hidden>
              <Icon name={icon} size={64} color="currentColor" />
            </span>
            {titleEl}
          </div>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
          {children}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={cls} data-variant="default" data-close={close ? true : undefined} style={style}>
      {scrollable ? (
        <div className={styles.scrollHead}>
          <div className={styles.titleBox}>{titleEl}</div>
          <Scrollbar height={scrollHeight} label="Details" className={styles.scrollBox} contentClassName={styles.scrollContent}>
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
            {children}
          </Scrollbar>
        </div>
      ) : (
        <>
          <div className={styles.titleBox}>{titleEl}</div>
          {(description || children) && (
            <div className={styles.bodyText}>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
              {children}
            </div>
          )}
        </>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
      {close}
    </div>
  );
}

export type ModalProps = Omit<ModalPanelProps, 'titleId' | 'descriptionId'> & {
  /** Opens the dialog with `showModal()`: focus moves inside, the page behind is inert, Escape calls `onClose`. */
  open: boolean;
  /** Clicking the Overlay calls `onClose`. */
  closeOnOverlayClick?: boolean;
};

/**
 * A native modal <dialog> with the Overlay scrim (Figma "Modal Screen*") and a ModalPanel.
 * Focus returns to the element that was focused before opening.
 */
export function Modal({ open, onClose, closeOnOverlayClick = true, ...panelProps }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      root.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={panelProps.description ? descriptionId : undefined}
      onCancel={e => {
        e.preventDefault();
        onClose?.();
      }}
    >
      {open && (
        <>
          <Overlay onClick={closeOnOverlayClick ? onClose : undefined} />
          <ModalPanel {...panelProps} onClose={onClose} titleId={titleId} descriptionId={descriptionId} />
        </>
      )}
    </dialog>
  );
}
