import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './Message.module.css';

export type MessageType = 'neutral' | 'info' | 'success' | 'caution' | 'error';

export type MessageProps = {
  title: ReactNode;
  body?: ReactNode;
  /** neutral = the first Figma "Message" set · info / success / caution / error = the `Type` set. */
  type?: MessageType;
  /** Shows the close button when provided. */
  onClose?: () => void;
  className?: string;
};

// Icons as used in Figma; Caution uses the calendar icon there.
const ICON: Record<MessageType, string> = {
  neutral: 'information',
  info: 'information',
  success: 'success',
  caution: 'calendar',
  error: 'error',
};

export function Message({ title, body, type = 'neutral', onClose, className }: MessageProps) {
  return (
    <div className={[styles.message, className].filter(Boolean).join(' ')} data-type={type} role={type === 'error' ? 'alert' : 'status'}>
      <div className={styles.content}>
        <Icon name={ICON[type]} size={24} color="currentColor" className={styles.icon} />
        <div className={styles.text}>
          <p className={styles.title}>{title}</p>
          {body && <p className={styles.body}>{body}</p>}
        </div>
      </div>
      {onClose && <IconButton label="Close" icon="close-small" size="compact" className={styles.close} onClick={onClose} />}
    </div>
  );
}
