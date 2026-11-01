/** Small inline icons. Line weights match the surrounding text, and every
 *  colour comes from a theme token so they follow light and dark. */

export function CheckMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--ok)" />
      <path
        d="M5.8 10.2l2.7 2.7 5.5-5.6"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--bad)" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OpenMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="var(--mark-dim)" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.75" fill="var(--mark-dim)" />
    </svg>
  );
}

export function HelpIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.6 9.3a2.5 2.5 0 114.4 1.8c-.9.9-2 1.3-2 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.7" r="1" fill="currentColor" />
    </svg>
  );
}

export function StatsIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 19V11M12 19V5M19 19v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 5.5L8 12l6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2L5.4 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.3A8.4 8.4 0 019.7 4a8.4 8.4 0 1010.3 10.3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
