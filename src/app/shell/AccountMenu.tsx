import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar/Avatar';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { useAuth } from '../auth/AuthContext';
import { AppModal } from '../components/AppModal';
import { useTheme, type ThemePreference } from '../theme';
import styles from './AccountMenu.module.css';

const NEXT_THEME: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_LABEL: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' };

/** The header avatar (Figma: "Account Settings") with Account Settings, theme and Sign Out (confirmed in an AppModal). */
export function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div className={styles.root} ref={root}>
      <button
        ref={button}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user?.name ?? ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {/* Photo when the account has one, otherwise initials */}
        <Avatar size="medium" src={user?.photo || undefined} initials={user?.initials ?? '?'} label="" />
      </button>
      {open && (
        <ContextMenu
          className={styles.menu}
          aria-label="Account"
          autoFocus
          onClose={close}
          items={[
            { label: 'Account Settings', icon: 'account', onSelect: () => navigate('/app/account') },
            { label: `Theme: ${THEME_LABEL[theme]}`, icon: 'preferences', onSelect: () => setTheme(NEXT_THEME[theme]) },
            { label: 'Sign Out', icon: 'sign-out', onSelect: () => setConfirmSignOut(true) },
          ]}
        />
      )}
      <AppModal
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Sign out of HUB 360?"
        description="You'll need to sign in again to get back to your open tabs."
        primaryAction={{ label: 'Sign Out', onClick: () => signOut() }}
      />
    </div>
  );
}
