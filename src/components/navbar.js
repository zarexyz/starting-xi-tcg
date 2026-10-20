// =============================================================================
// Starting XI TCG — Mobile Bottom Navigation Bar (5 Primary Tabs)
// =============================================================================

export function renderNavbar(activeTab) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'kader', label: 'Kader', icon: '📋' },
    { id: 'wettbewerb', label: 'Wettbewerb', icon: '🏆' },
    { id: 'markt', label: 'Markt', icon: '⚖️' },
    { id: 'verein', label: 'Verein', icon: '💼' }
  ];

  return `
    <nav class="sticky bottom-0 z-40 bg-pitch-dark/95 backdrop-blur-xl border-t border-pitch-border px-2 py-1.5 flex items-center justify-around shadow-2xl">
      ${tabs.map(t => {
        const isActive = activeTab === t.id;
        return `
          <button data-tab="${t.id}" class="nav-tab-btn flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${isActive ? 'text-pitch-emerald' : 'text-slate-400 hover:text-slate-200'}">
            <span class="text-lg leading-none ${isActive ? 'drop-shadow-[0_0_8px_#00f59b]' : ''}">${t.icon}</span>
            <span class="font-display font-bold text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-pitch-emerald font-extrabold' : 'text-slate-400'}">
              ${t.label}
            </span>
            ${isActive ? '<span class="w-1 h-1 rounded-full bg-pitch-emerald mt-0.5 shadow-[0_0_4px_#00f59b]"></span>' : ''}
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
