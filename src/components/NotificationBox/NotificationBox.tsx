import type { ReactNode } from 'react';
import { Avatar } from '../Avatar/Avatar';
import { IconButton } from '../IconButton/IconButton';
import styles from './NotificationBox.module.css';

export type NotificationType = 'alert' | 'chat' | 'email' | 'read';

export type NotificationBoxProps = {
  /** Figma `Type`. alert = large action button · chat = arrow · email = green email icon · read = check icon. */
  type?: NotificationType;
  /** Sender name (Figma "Selina Kyle"). */
  name: ReactNode;
  /** Message preview (Figma "How much energy does a 400w panel produce?"). */
  message: ReactNode;
  /** Relative time or date (Figma "54min ago" / "Sat, Jun 14"). */
  time?: ReactNode;
  /** Sender photo URL for the small Avatar. Without it a placeholder is shown. */
  avatarSrc?: string;
  /** Initials shown instead of a photo. */
  initials?: string;
  /** Called by the action button. Without it the button is not rendered. */
  onAction?: () => void;
  /** Accessible name of the action button. */
  actionLabel?: string;
  className?: string;
};

const ACTION_ICON: Record<NotificationType, string> = { alert: 'arrow-up', chat: 'arrow-up', email: 'email', read: 'check' };

export function NotificationBox({ type = 'chat', name, message, time, avatarSrc, initials, onAction, actionLabel = 'Open', className }: NotificationBoxProps) {
  return (
    <article className={[styles.box, className].filter(Boolean).join(' ')} data-type={type}>
      <Avatar size="small" type={avatarSrc || !initials ? 'photo' : 'initial'} src={avatarSrc} initials={initials} />
      <div className={styles.text}>
        <p className={styles.name}>{name}</p>
        <p className={styles.message}>{message}</p>
        {time && <p className={`text-super-tiny-regular ${styles.time}`}>{time}</p>}
      </div>
      {onAction && <IconButton label={actionLabel} icon={ACTION_ICON[type]} size={type === 'alert' ? 'base' : 'compact'} className={styles.action} onClick={onAction} />}
    </article>
  );
}
