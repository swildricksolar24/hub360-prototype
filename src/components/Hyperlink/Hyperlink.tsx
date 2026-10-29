import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import styles from './Hyperlink.module.css';

export type HyperlinkSize = 'large' | 'medium' | 'small';

export type HyperlinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Figma `Label` text property. */
  children: ReactNode;
  /** Figma set: large = Heading 4 (20/28), medium = Large (16/24), small = Medium (14/20). */
  size?: HyperlinkSize;
  /**
   * Figma `State=Disabled`. Anchors have no native `disabled`, so the link drops its `href`,
   * sets `aria-disabled` and ignores clicks.
   */
  disabled?: boolean;
};

/** Hyperlink (Figma Hyperlink: Large*, Medium, Small). */
export function Hyperlink({ children, size = 'medium', disabled = false, href, onClick, className, ...rest }: HyperlinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <a
      className={[styles.link, className].filter(Boolean).join(' ')}
      data-size={size}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      role={disabled ? 'link' : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
