import { useEffect, type ReactNode } from 'react';
import { Logo } from '../../../components/Logo/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import styles from './auth.module.css';

type AuthLayoutProps = {
  /** Document title for the screen. */
  pageTitle: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Message banners (Account Locked, Session Expired, …) shown above the title, as in Figma. */
  alert?: ReactNode;
  children: ReactNode;
  /** Links under the card ("Don’t have an account? Sign Up", "Forgot Password"). */
  below?: ReactNode;
  /** Sign Up: more room between the form's sections (every auth card is the same 640px width). */
  wide?: boolean;
  /** Extra prototype controls shown under the theme toggle (e.g. "Use demo account"). */
  tools?: ReactNode;
};

/**
 * Figma "Sign In (Desktop Only)": Surfaces/Base page, the HUB360 ring icon (Figma shows Logo Full, Solar Suite 360), a
 * Surfaces/Overlay card, links below. Every auth
 * screen top-aligns (so the logo never moves) and uses the same 640px card.
 */
export function AuthLayout({ pageTitle, title, subtitle, alert, children, below, wide = false, tools }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `HUB360 · ${pageTitle}`;
  }, [pageTitle]);

  return (
    <main className={styles.page}>
      {/* Prototype controls (not in Figma): light / dark preview, plus any page tools */}
      <div className={styles.tools}>
        <ThemeToggle contained />
        {tools}
      </div>
      {/* The HUB360 ring icon alone (Logo Icon: its segments stay teal in light and dark), at the old Logo Full's 118px
          height so the card below keeps its place */}
      <Logo name="logo-icon" label="HUB360" height={118} />
      <section className={styles.card} data-wide={wide || undefined} aria-labelledby="auth-title">
        {alert}
        <header className={styles.heading}>
          <h1 id="auth-title" className={styles.title}>
            {title}
          </h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
        {children}
      </section>
      {below && <div className={styles.below}>{below}</div>}
    </main>
  );
}
