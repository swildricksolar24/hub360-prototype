import type { HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Tile.module.css';

export type TileProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> & {
  /**
   * The small heading beside the icon, e.g. "Inventory Value". Figma `Label` (Tiny/Semi Bold, Gray Text/Weak).
   */
  label: ReactNode;
  /**
   * The key figure, e.g. "$1,842,310". Figma `Value` (Heading 2/Bold, Gray Text/Strong). On a tile narrower than
   * about 216px it steps down to Heading 4 so long figures still fit.
   */
  value: ReactNode;
  /**
   * The line under the value, e.g. "+3.2% vs last 30 days". Figma `Note` (Tiny/Regular, Gray Text/Weak). Leave it
   * out to drop the line.
   */
  note?: ReactNode;
  /**
   * The 20px icon before the label, by name from the Icon library (Foundations/Icon). Figma `Icon` (instance swap,
   * default `dashboard`). Leave it out for no icon.
   */
  icon?: string;
  /**
   * Runs when the tile is clicked. Use it to open what the figure counts: the Inventory Dashboard's tiles open the
   * Items or Orders list.
   */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Makes the tile a link (`<a>`) to this address. Without it the tile is a button. */
  href?: string;
  /** Link tiles only: where the link opens, e.g. `_blank` for a new tab. */
  target?: string;
  /** Link tiles only: the link relationship, e.g. `noopener noreferrer` with `target="_blank"`. */
  rel?: string;
  /** Button tiles only: turns the tile off (not clickable, no hover; Figma "Disabled"). */
  disabled?: boolean;
};

/**
 * Figma "Tile / KPI" (`- Tiles` page): one key figure on a card, with an icon and label above it and a note below.
 * `Property 1=Hover` is real CSS `:hover`. The tile is a button (pass `onClick`) or a link (pass `href`), so it always
 * opens what its figure counts; keyboard focus adds the stronger gray ring.
 */
export function Tile({ label, value, note, icon, onClick, href, target, rel, disabled = false, className, ...rest }: TileProps) {
  const cls = [styles.tile, className].filter(Boolean).join(' ');
  const content = (
    <>
      <span className={styles.label}>
        {icon && <Icon name={icon} size={20} color="currentColor" />}
        <span className={styles.labelText}>{label}</span>
      </span>
      <span className={styles.value}>{value}</span>
      {note != null && note !== false && <span className={styles.note}>{note}</span>}
    </>
  );

  return href !== undefined ? (
    <a className={cls} href={href} target={target} rel={rel} onClick={onClick} {...rest}>
      {content}
    </a>
  ) : (
    <button type="button" className={cls} disabled={disabled} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}
