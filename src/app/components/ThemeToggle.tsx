import { Toggle } from '../../components/Toggle/Toggle';
import { useMediaQuery } from '../shell/useMediaQuery';
import { useTheme } from '../theme';

type ThemeToggleProps = { contained?: boolean; className?: string };

/** Light / dark switch for previewing both themes. On = dark; until it is used, it reflects the system theme. */
export function ThemeToggle({ contained = false, className }: ThemeToggleProps) {
  const [theme, setTheme] = useTheme();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  return (
    <Toggle
      className={className}
      label="Dark mode"
      contained={contained}
      checked={dark}
      onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
    />
  );
}
