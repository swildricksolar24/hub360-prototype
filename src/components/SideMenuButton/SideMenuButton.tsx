import type { ButtonHTMLAttributes } from 'react';
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
};

const ICON_SIZE: Record<string, number> = { '1-default': 24, '1-compact': 16, '2-default': 24, '2-compact': 24 };

export function SideMenuButton({
  label,
  icon = 'arrow-up',
  tier = 1,
  variant = 'default',
  selected,
  type = 'button',
  className,
  ...rest
}: SideMenuButtonProps) {
  const v = tier === 1 && variant === 'label' ? 'default' : variant;
  const showIcon = v !== 'label';
  const showLabel = v !== 'compact';
  return (
    <button
      type={type}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-tier={tier}
      data-variant={v}
      aria-current={selected ? 'page' : undefined}
      aria-label={showLabel ? undefined : label}
      title={showLabel ? undefined : label}
      {...rest}
    >
      {showIcon && (
        <span className={styles.box}>
          <Icon name={icon} size={ICON_SIZE[`${tier}-${v}`]} color="currentColor" />
        </span>
      )}
      {showLabel && <span className={styles.label}>{label}</span>}
    </button>
  );
}
