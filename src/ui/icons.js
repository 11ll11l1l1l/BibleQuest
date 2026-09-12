const ICONS = Object.freeze({
  bible: `
    <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5v16H6a3 3 0 0 0-3 3V5.5Z"/>
    <path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-5v16h5a3 3 0 0 1 3 3V5.5Z"/>
    <path d="M16.5 7v5M14 9.5h5"/>
  `,
  home: `
    <path d="m3 10.5 9-7.5 9 7.5"/>
    <path d="M5.5 9.5V21h13V9.5"/>
    <path d="M9.5 21v-6h5v6"/>
  `,
  learn: `
    <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5v-16Z"/>
    <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/>
  `,
  play: `
    <circle cx="12" cy="12" r="9"/>
    <path d="m10 8 6 4-6 4V8Z"/>
  `,
  grow: `
    <path d="M12 21v-9"/>
    <path d="M12 13c-4.2 0-7-2.8-7-7 4.2 0 7 2.8 7 7Z"/>
    <path d="M12 15c4.2 0 7-2.8 7-7-4.2 0-7 2.8-7 7Z"/>
  `,
  more: `
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>
  `,
  guide: `
    <circle cx="12" cy="12" r="9"/>
    <path d="M9.5 9.3a2.5 2.5 0 0 1 4.8 1c0 1.6-2.3 1.8-2.3 3.4"/>
    <circle cx="12" cy="16.6" r="0.15" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
  `,
  video: `
    <rect x="3" y="6" width="13" height="12" rx="2.5"/>
    <path d="m16.5 10.2 4-2.4v8.4l-4-2.4"/>
  `,
  library: `
    <rect x="3.5" y="4" width="7.5" height="16" rx="1.6"/>
    <rect x="13" y="4" width="7.5" height="16" rx="1.6"/>
    <path d="M7.25 8h0M16.75 8h0"/>
  `,
  calendar: `
    <rect x="3.5" y="5" width="17" height="15" rx="2"/>
    <path d="M3.5 9.5h17M8 3v4M16 3v4"/>
    <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/>
  `
});

export function iconSvg(name, { size = 22 } = {}) {
  const numericSize = Number(size);
  const safeSize = Number.isFinite(numericSize) ? Math.max(12, Math.min(32, numericSize)) : 22;
  const body = ICONS[name] || ICONS.bible;
  return `<svg class="bq-icon" width="${safeSize}" height="${safeSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
