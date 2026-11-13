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
      // An on / off switch labeled "Dark mode". Its icon shows the theme: Volt's Mode Light (sun) when off, Mode Dark
      // (moon) when on; toggling turns one into the other (ThemeToggle.module.css)
      label={
        <span className={styles.label}>
          <span className={styles.icons} data-dark={dark || undefined} aria-hidden>
            <Icon name="mode-light" size={20} className={styles.sun} />
            <Icon name="mode-dark" size={20} className={styles.moon} />
          </span>
          Dark mode
        </span>
      }
      contained={contained}
      checked={dark}
      onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
    />
  );
}
