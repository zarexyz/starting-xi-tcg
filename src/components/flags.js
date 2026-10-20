// =============================================================================
// Starting XI TCG — Authentic SVG Vector Country Flags
// High-contrast, sharp vector flags that render properly across all OSes (no Windows emoji fallback text)
// =============================================================================

export function getNationFlagSVG(code = 'GER', width = 20, height = 14) {
  const c = (code || 'GER').toUpperCase();

  let flagContent = '';

  switch (c) {
    case 'GER': // Deutschland: Schwarz-Rot-Gold
      flagContent = `
        <rect width="60" height="14" fill="#111111"/>
        <rect y="14" width="60" height="14" fill="#dd0000"/>
        <rect y="28" width="60" height="14" fill="#ffce00"/>
      `;
      break;

    case 'FRA': // Frankreich: Blau-Weiß-Rot
      flagContent = `
        <rect width="20" height="42" fill="#002395"/>
        <rect x="20" width="20" height="42" fill="#ffffff"/>
        <rect x="40" width="20" height="42" fill="#ed2939"/>
      `;
      break;

    case 'ENG': // England: Sankt-Georgs-Kreuz
      flagContent = `
        <rect width="60" height="42" fill="#ffffff"/>
        <rect x="25" width="10" height="42" fill="#cf081f"/>
        <rect y="16" width="60" height="10" fill="#cf081f"/>
      `;
      break;

    case 'ESP': // Spanien: Rot-Gelb-Rot
      flagContent = `
        <rect width="60" height="10.5" fill="#aa151b"/>
        <rect y="10.5" width="60" height="21" fill="#f1bf00"/>
        <rect y="31.5" width="60" height="10.5" fill="#aa151b"/>
        <circle cx="18" cy="21" r="4.5" fill="#aa151b" opacity="0.8"/>
      `;
      break;

    case 'ITA': // Italien: Grün-Weiß-Rot
      flagContent = `
        <rect width="20" height="42" fill="#009246"/>
        <rect x="20" width="20" height="42" fill="#ffffff"/>
        <rect x="40" width="20" height="42" fill="#ce2b37"/>
      `;
      break;

    case 'POR': // Portugal: Grün-Rot
      flagContent = `
        <rect width="24" height="42" fill="#046a38"/>
        <rect x="24" width="36" height="42" fill="#da291c"/>
        <circle cx="24" cy="21" r="7" fill="#ffc72c"/>
        <circle cx="24" cy="21" r="5" fill="#002b49"/>
      `;
      break;

    case 'NED': // Niederlande: Rot-Weiß-Blau
      flagContent = `
        <rect width="60" height="14" fill="#ae1c28"/>
        <rect y="14" width="60" height="14" fill="#ffffff"/>
        <rect y="28" width="60" height="14" fill="#21468b"/>
      `;
      break;

    case 'NOR': // Norwegen: Rot mit blau-weißem Kreuz
      flagContent = `
        <rect width="60" height="42" fill="#ba0c2f"/>
        <rect x="18" width="10" height="42" fill="#ffffff"/>
        <rect y="16" width="60" height="10" fill="#ffffff"/>
        <rect x="20" width="6" height="42" fill="#00205b"/>
        <rect y="18" width="60" height="6" fill="#00205b"/>
      `;
      break;

    case 'SEN': // Senegal: Grün-Gelb-Rot mit Stern
      flagContent = `
        <rect width="20" height="42" fill="#00853f"/>
        <rect x="20" width="20" height="42" fill="#fdef42"/>
        <rect x="40" width="20" height="42" fill="#e31b23"/>
        <polygon points="30,15 32,21 38,21 33,25 35,31 30,27 25,31 27,25 22,21 28,21" fill="#00853f"/>
      `;
      break;

    case 'CIV': // Elfenbeinküste: Orange-Weiß-Grün
      flagContent = `
        <rect width="20" height="42" fill="#f77f00"/>
        <rect x="20" width="20" height="42" fill="#ffffff"/>
        <rect x="40" width="20" height="42" fill="#009e60"/>
      `;
      break;

    case 'CRO': // Kroatien: Rot-Weiß-Blau mit Wappen
      flagContent = `
        <rect width="60" height="14" fill="#ff0000"/>
        <rect y="14" width="60" height="14" fill="#ffffff"/>
        <rect y="28" width="60" height="14" fill="#0000ff"/>
        <!-- Mini Schachbrett Wappen -->
        <rect x="25" y="14" width="10" height="14" fill="#ff0000" rx="1"/>
        <rect x="27" y="14" width="3" height="4" fill="#ffffff"/>
        <rect x="25" y="18" width="3" height="4" fill="#ffffff"/>
        <rect x="31" y="18" width="3" height="4" fill="#ffffff"/>
        <rect x="27" y="22" width="3" height="4" fill="#ffffff"/>
      `;
      break;

    default: // Universal Clean Sports Flag
      flagContent = `
        <rect width="60" height="42" fill="#1e293b"/>
        <circle cx="30" cy="21" r="12" fill="#00f59b" opacity="0.8"/>
        <text x="30" y="25" font-family="monospace" font-size="11" font-weight="bold" fill="#0a0d14" text-anchor="middle">${c.substring(0, 3)}</text>
      `;
  }

  return `
    <svg viewBox="0 0 60 42" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" class="rounded-sm shadow-sm inline-block select-none overflow-hidden border border-black/30">
      ${flagContent}
    </svg>
  `;
}
