import type { ReactNode } from 'react';
import styles from './Footer.module.css';

export type FooterLink = { label: string; href: string };

export type FooterProps = {
  /** Left text, e.g. "© 2026 HUB360, All Rights Reserved". */
  copyright?: ReactNode;
  /** Center text, e.g. "Version: 0.246". */
  version?: ReactNode;
  /** Right-hand links, separated by "|" (Privacy Policy, Terms of Service, …). */
  links?: FooterLink[];
  /** Accessible name of the links' `<nav>`. */
  linksLabel?: string;
  className?: string;
};

/** Figma Interior Nav "Footer" (1544:2832). */
export function Footer({ copyright, version, links = [], linksLabel = 'Legal', className }: FooterProps) {
  return (
    <footer className={[styles.footer, className].filter(Boolean).join(' ')}>
      <p className={styles.copyright}>{copyright}</p>
      {version && <p className={styles.version}>{version}</p>}
      {links.length > 0 && (
        <nav aria-label={linksLabel}>
          <ul className={styles.links}>
            {links.map(link => (
              <li key={link.href + link.label}>
                <a href={link.href} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  );
}
