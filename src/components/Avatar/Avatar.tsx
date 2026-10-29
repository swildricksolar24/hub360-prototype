import { Icon } from '../Icon/Icon';
import styles from './Avatar.module.css';

export type AvatarSize = 'large' | 'medium' | 'small';
export type AvatarType = 'default' | 'initial' | 'photo' | 'icon';

export type AvatarProps = {
  /** large = Figma "Large" (124px) · medium = "Medium" (62px) · small = "Small" (32px); also the `Size` axis of "Icon*". */
  size?: AvatarSize;
  /**
   * Figma `Type`: default (empty circle) · initial · photo. `icon` = the Figma "Icon*" set.
   * Defaults to `photo` when `src` is set, `initial` when `initials` is set, otherwise `default`.
   */
  type?: AvatarType;
  /** Text for `type="initial"`, e.g. "JR". Only the first two characters are shown. */
  initials?: string;
  /** Image URL for `type="photo"`. Without it a placeholder silhouette is drawn. */
  src?: string;
  /** Icon name for `type="icon"`. Figma uses `notification`. */
  icon?: string;
  /** Accessible name (the person's name). Without it the avatar is decorative. */
  label?: string;
  className?: string;
};

// Figma Icon* icon sizes per avatar size
const ICON_SIZE: Record<AvatarSize, number> = { large: 76, medium: 36, small: 20 };

export function Avatar({ size = 'medium', type, initials, src, icon = 'notification', label, className }: AvatarProps) {
  const kind: AvatarType = type ?? (src ? 'photo' : initials ? 'initial' : 'default');
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <span className={[styles.avatar, className].filter(Boolean).join(' ')} data-size={size} data-type={kind} {...a11y}>
      {kind === 'initial' && <span className={styles.initials}>{(initials ?? '').slice(0, 2)}</span>}
      {kind === 'photo' &&
        (src ? (
          <img className={styles.photo} src={src} alt="" />
        ) : (
          // Placeholder silhouette; Figma uses stock photos, which are not shipped with the code
          <svg className={styles.photo} viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="15" r="7" />
            <path d="M6 38c1.5-8 7-12 14-12s12.5 4 14 12z" />
          </svg>
        ))}
      {kind === 'icon' && <Icon name={icon} size={ICON_SIZE[size]} />}
    </span>
  );
}
