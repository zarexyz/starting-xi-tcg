// =============================================================================
// Icon-Set: einheitliche Linien-Icons (24er Raster, 2 px Strich)
// =============================================================================

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  squad: '<rect x="3" y="4" width="7" height="10" rx="1.5"/><rect x="14" y="4" width="7" height="10" rx="1.5"/><path d="M6.5 18v2M17.5 18v2M3 20h18"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3"/><path d="M12 13v4M8 21h8M9 17h6v4H9z"/>',
  store: '<path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>',
  club: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="M12 8v8M8.5 12h7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/>',
  forward: '<path d="m13 5 7 7-7 7M4 5l7 7-7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  chevronUp: '<path d="m5 15 7-7 7 7"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  auto: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7"/><path d="M20 4v4.7h-4.7"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.3"/><path d="M4 20v-4.7h4.7"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M22 10.5v3"/><path d="M6 10.5v3M9.5 10.5v3"/>',
  medical: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.4 2.4-5.2 3.5-7.9.4 1.6 1.4 2.8 2.6 3.4C11.5 6.6 13.4 4 15.5 3c-.3 2.4.6 4.5 2 6.2 1.1 1.4 1.5 3 1.5 4.7C19 18.1 15.9 21 12 21Z"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/><path d="M8 15l1 5h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h4"/>',
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="m17 12 4 4-4 4"/><path d="M21 16H8"/>',
  strategy: '<circle cx="6" cy="6" r="2.5"/><path d="M15 4l5 5M20 4l-5 5"/><path d="M6 9.5v2a4 4 0 0 0 4 4h4"/><path d="m12 13 3 2.5-3 2.5"/><circle cx="18.5" cy="18" r="2.5"/>',
  midfield: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z"/>',
  attack: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4M12 17v.5"/>',
  sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6 6 2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bench: '<path d="M4 11h16M5 11V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M6 11v6M18 11v6M4 15h16"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  pitch: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 12h18"/><circle cx="12" cy="12" r="2.5"/><path d="M8 3v3.5h8V3M8 21v-3.5h8V21"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
  spa: '<path d="M12 21c-4.5 0-8-3.5-8-8 3 0 6 1.5 8 4 2-2.5 5-4 8-4 0 4.5-3.5 8-8 8Z"/><path d="M12 17c-1.5-2-2-4.5-1-8l1-3 1 3c1 3.5.5 6-1 8Z"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10l4-3Z"/><path d="M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5 7 18.5M8 10 3.5 8.5"/>',
  whistle: '<circle cx="9" cy="14" r="5"/><path d="M12.5 10.5 21 6v4l-6 2.5"/><circle cx="9" cy="14" r="1.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  trash: '<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/>',
  save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4.5h4.5M12 7.5V12l3 2"/>',
  coins: null
};

export function icon(name, cls = '') {
  if (name === 'coins') return coinIcon(cls);
  const body = P[name] || P.info;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** Münze: einzige farbige Ikone, damit Belohnungen sofort ins Auge fallen */
export function coinIcon(cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#e7b43b"/>
    <circle cx="12" cy="12" r="7.2" fill="#ffc83d" stroke="#b8860b" stroke-width="1"/>
    <path d="M12 7.6 13.3 10.3l3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4Z" fill="#9a6a0c"/>
  </svg>`;
}
