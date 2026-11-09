import { Icon } from '../../components/Icon/Icon';
import { Toggle } from '../../components/Toggle/Toggle';
import { useMediaQuery } from '../shell/useMediaQuery';
import { useTheme } from '../theme';
import styles from './ThemeToggle.module.css';

type ThemeToggleProps = { contained?: boolean; className?: string };

/** Light / dark switch for previewing both themes. On = dark; until it is used, it reflects the system theme. */
export function ThemeToggle({ contained = false, className }: ThemeToggleProps) {
  const [theme, setTheme] = useTheme();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  return (
    <Toggle
      className={className}
      // An on / off switch labeled "Dark mode": its icon matches the label (Volt Mode Dark), and the switch shows whether it's on
      label={
        <span className={styles.label}>
          <Icon name="mode-dark" size={20} />
          Dark mode
        </span>
      }
      contained={contained}
      checked={dark}
      onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
    />
  );
}
