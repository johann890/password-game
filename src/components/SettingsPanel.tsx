import { setSetting, useSettings, type TextSize } from '../game/settings';
import { CloseIcon } from './Icons';
import { useEscape } from './useEscape';

interface Props {
  onClose: () => void;
}

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'regular', label: 'Regular' },
  { value: 'large', label: 'Large' },
];

/**
 * Both settings are native form controls under the paint — a checkbox and a
 * radio group — so they arrive with keyboard support, labelling and state
 * announcements already right. The visible switch and segments are drawn from
 * their checked state and never hold any of their own.
 */
export function SettingsPanel({ onClose }: Props) {
  useEscape(onClose);
  const settings = useSettings();

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Settings" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Settings</h2>
          <button className="navbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="settings">
          <div className="setting">
            <div className="setting-text">
              <label className="setting-name" htmlFor="set-contrast">
                High Contrast Mode
              </label>
              <span className="setting-desc" id="set-contrast-desc">
                Contrast and colourblindness improvements.
              </span>
            </div>
            <input
              id="set-contrast"
              className="switch-input sr-only"
              type="checkbox"
              role="switch"
              aria-describedby="set-contrast-desc"
              checked={settings.contrast === 'high'}
              onChange={(e) => setSetting('contrast', e.target.checked ? 'high' : 'normal')}
            />
            <label className="switch" htmlFor="set-contrast">
              <span className="switch-knob" />
            </label>
          </div>

          <fieldset className="setting stacked" aria-describedby="set-text-desc">
            <legend className="sr-only">Text size</legend>
            <div className="setting-text">
              <span className="setting-name" aria-hidden="true">Text Size</span>
              <span className="setting-desc" id="set-text-desc">
                Sets the size of the type across the whole game.
              </span>
            </div>
            <div className="segmented">
              {SIZES.map(({ value, label }) => (
                <span className="segmented-option" key={value}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="text-size"
                    id={`set-text-${value}`}
                    value={value}
                    checked={settings.text === value}
                    onChange={() => setSetting('text', value)}
                  />
                  <label htmlFor={`set-text-${value}`}>{label}</label>
                </span>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="sheet-actions">
          <button className="btn outline wide" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
