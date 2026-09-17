const AppAnalytics = {
  currentTab: "achievements",

  init() {},

  renderAchievementsSubviewHTML() {
    const s = AppState.get();
    const unlocked = s.unlockedAchievements || [];

    const catalog = (typeof ACHIEVEMENTS_CATALOG !== "undefined" && ACHIEVEMENTS_CATALOG.length > 0)
      ? ACHIEVEMENTS_CATALOG
      : [];

    return `
      <div class="market-trucks-compact-grid">
        ${catalog.map(ach => {
          const isDone = unlocked.includes(ach.id);

          return `
            <div class="truck-mini-card" style="cursor: default; justify-content: space-between; border-color: ${isDone ? 'rgba(48, 209, 88, 0.4)' : 'var(--glass-border)'};">
              <div>
                <div class="mini-card-top">
                  <span class="mini-card-model" style="-webkit-line-clamp: 1;">${ach.icon} ${ach.title}</span>
                  <span class="mini-card-badge ${isDone ? 'diesel' : 'used'}">
                    ${isDone ? '✓ Получено' : 'В процессе'}
                  </span>
                </div>

                <p style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">
                  ${ach.desc}
                </p>
              </div>

              <div class="mini-card-price-row" style="margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="font-size: 0.68rem; color: var(--text-muted);">Бонус:</span>
                  <strong style="font-size: 0.78rem; color: ${isDone ? 'var(--accent-green)' : 'var(--accent-orange)'};">
                    ${ach.reward || '€10 000'}
                  </strong>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};