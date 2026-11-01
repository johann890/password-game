import { useTheme } from '../game/theme';
import { MoonIcon, SunIcon } from './Icons';

/**
 * Sits in the top right of every screen. The icon shows the theme you would
 * get by pressing it, which is the convention people already read.
 */
export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className="navbtn"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
