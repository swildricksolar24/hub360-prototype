import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './SideMenuButton.module.css';

export type SideMenuButtonTier = 1 | 2;
export type SideMenuButtonVariant = 'default' | 'compact' | 'label';

export type SideMenuButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. Always the accessible name; hidden visually in `compact`. */
  label: string;
  /** Icon name from the Icon component. Not shown in the `label` variant. */
  icon?: string;
  /** Figma "Side Menu / Tier 1 / …" or "Side Menu / Tier 2 / …". */
  tier?: SideMenuButtonTier;
  /**
   * Figma set — default: "Tier 1 / Default" (icon over label) or "Tier 2 / Default" (icon beside label) ·
   * compact: "Tier 1 /Compact" (32px) or "Tier 2 / Compact" (38px), icon only ·
   * label: "Tier 2 / Label", text only (Tier 2 only).
   */
  variant?: SideMenuButtonVariant;
  /** Figma `State=Selected`: the current page. Rendered as `aria-current="page"`. */
  selected?: boolean;
  /**
   * Overrides the Figma icon size, in px (use the design system's icon sizes: 20, 24 or 32). The icon box keeps its
   * Figma size, so the button doesn't grow.
   */
  iconSize?: number;
};

const ICON_SIZE: Record<string, number> = { '1-default': 24, '1-compact': 16, '2-default': 24, '2-compact': 24 };

export function SideMenuButton({
  label,
  icon = 'arrow-up',
  tier = 1,
  variant = 'default',
  selected,
  iconSize,
  type = 'button',
  className,
  style,
  ...rest
}: SideMenuButtonProps) {
  const v = tier === 1 && variant === 'label' ? 'default' : variant;
  const showIcon = v !== 'label';
  const showLabel = v !== 'compact';
  const size = iconSize ?? ICON_SIZE[`${tier}-${v}`];
  return (
    <button
      type={type}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-tier={tier}
      data-variant={v}
      aria-current={selected ? 'page' : undefined}
      aria-label={showLabel ? undefined : label}
      title={showLabel ? undefined : label}
      style={{ '--icon-size': `${size}px`, ...style } as CSSProperties}
      {...rest}
    >
      {showIcon && (
        <span className={styles.box}>
          <Icon name={icon} size={size} color="currentColor" />
        </span>
      )}
      {showLabel && <span className={styles.label}>{label}</span>}
    </button>
  );
}
