import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './Tag.module.css';

export type TagVariant = 'base' | 'outline';
/** Figma Tag sets: … / Large (76px) · … / Medium (36px) · … / Small (24px). */
export type TagSize = 'large' | 'medium' | 'small';

const resolveSize = (size: TagProps['size']): TagSize =>
  size === 'tiny' ? 'small' : (size ?? 'large');

export type TagProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. */
  children: ReactNode;
  /**
   * Figma set — base = "Base / …" (Brand Teal Fill/Weaker, Fill/Weak when selected; Gray Text/Strong label,
   * Foundation/Solid/White when selected) · outline = "Outline / …" (a 2px Gray Stroke/Disabled border, Gray Stroke/Weak when
   * selected; Gray Text/Disabled label, Gray Text/Strong when selected).
   */
  variant?: TagVariant;
  /**
   * large = 76px (Heading 4 Regular) · medium = 36px (Medium Regular) · small = 24px (Tiny Semi Bold). Deprecated:
   * `tiny` = small.
   */
  size?: TagSize | 'tiny';
  /** Figma `State=Selected`. On a clickable tag it is announced as a toggle (`aria-pressed`). */
  selected?: boolean;
};

/**
 * Figma "Tag": a static, read-only label that shows a category. Pass `onClick` to make it a toggle button
 * (e.g. a filter); without it the tag is plain text in a pill. For a pill with an icon, use Chip.
 */
export function Tag({ children, variant = 'base', size = 'large', selected, type = 'button', className, onClick, ...rest }: TagProps) {
  const cls = [styles.tag, className].filter(Boolean).join(' ');
  const data = { 'data-variant': variant, 'data-size': resolveSize(size), 'data-selected': selected || undefined };

  if (onClick) {
    return (
      <button type={type} className={cls} {...data} aria-pressed={selected} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  // Static: only generic attributes apply (id, title, aria-*, data-*, style…); button-only ones are dropped.
  const { disabled: _disabled, form: _form, formAction: _fa, name: _name, value: _value, tabIndex: _tabIndex, ...spanProps } = rest;
  return (
    <span className={cls} {...data} {...(spanProps as HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
}
