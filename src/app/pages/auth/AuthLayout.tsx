import { useEffect, type ReactNode } from 'react';
import { Logo } from '../../../components/Logo/Logo';
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
  /** Sign Up uses a wider card (Figma: 640px, 48px padding). */
  wide?: boolean;
};

/** Figma "Sign In (Desktop Only)": Surfaces/Base page, Logo Full, a 520px Surfaces/Overlay card, links below. */
export function AuthLayout({ pageTitle, title, subtitle, alert, children, below, wide = false }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `${pageTitle} · HUB 360`;
  }, [pageTitle]);

  return (
    <main className={styles.page}>
      {/* Figma Logo Full instance: 318×118 */}
      <Logo name="logo-full" height={118} />
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
