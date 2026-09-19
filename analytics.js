const AppAnalytics = {
  currentTab: "achievements",

  init() {},

  renderFinancialAnalyticsHTML() {
    const s = AppState.get();
    
    // Берем глобальные накопительные показатели за всю историю игры
    const totalEarned = s.finances.totalEarned || 0;
    const totalSpent = s.finances.totalSpent || 0;
    const netCapital = totalEarned - totalSpent;
    
    // Динамический масштаб для столбиков графика
    const maxVal = Math.max(totalEarned, totalSpent, 10000);
    const earnedHeight = Math.max(20, Math.round((totalEarned / maxVal) * 120));
    const spentHeight = Math.max(20, Math.round((totalSpent / maxVal) * 120));
    const netHeight = Math.max(20, Math.round((Math.abs(netCapital) / maxVal) * 120));

    const totalMileage = (s.trucks || []).reduce((acc, t) => acc + (t.mileageKm || 0), 0);
    const totalRevenue = (s.trucks || []).reduce((acc, t) => acc + (t.tco ? t.tco.totalRevenueGenerated : 0), 0);
    const totalMaintenance = (s.trucks || []).reduce((acc, t) => acc + (t.tco ? t.tco.totalMaintenanceCost : 0), 0);

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="glass-card" style="padding: 16px; overflow: hidden;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Макроэкономический график корпорации</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Накопленный итог всех поступлений и расходов за всё время игры.
          </span>

          <div style="margin: 16px 0 8px 0; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-around; align-items: flex-end; height: 160px; border: 1px solid var(--glass-border);">
            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 0;">
              <span style="font-size: 0.65rem; font-weight: 700; color: var(--accent-green); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">+€${Math.round(totalEarned).toLocaleString()}</span>
              <div style="width: 32px; height: ${earnedHeight}px; background: linear-gradient(180deg, var(--accent-green) 0%, rgba(48,209,88,0.2) 100%); border-radius: 6px 6px 0 0;"></div>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Все доходы</span>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 0;">
              <span style="font-size: 0.65rem; font-weight: 700; color: var(--accent-orange); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">-€${Math.round(totalSpent).toLocaleString()}</span>
              <div style="width: 32px; height: ${spentHeight}px; background: linear-gradient(180deg, var(--accent-orange) 0%, rgba(255,159,10,0.2) 100%); border-radius: 6px 6px 0 0;"></div>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Все расходы</span>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 0;">
              <span style="font-size: 0.65rem; font-weight: 700; color: ${netCapital >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">€${Math.round(netCapital).toLocaleString()}</span>
              <div style="width: 32px; height: ${netHeight}px; background: linear-gradient(180deg, var(--accent-blue) 0%, rgba(10,132,255,0.2) 100%); border-radius: 6px 6px 0 0;"></div>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Чистый итог</span>
            </div>

          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 10px; margin-top: 10px;">
            <span style="font-size: 0.82rem; font-weight: 700;">Сальдо баланса (Доходы - Расходы):</span>
            <span style="font-size: 1.05rem; font-weight: 800; color: ${netCapital >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
              €${netCapital.toLocaleString()}
            </span>
          </div>
        </div>

        <div class="glass-card" style="padding: 16px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Эффективность парка техники (TCO-агрегат)</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Суммарный пробег всего автопарка составляет <strong>${totalMileage.toLocaleString()} км</strong>.
          </span>
          <table class="spec-detail-table" style="margin-top: 12px;">
            <tr>
              <td style="color: var(--text-muted);">Суммарная выручка всех тягачей:</td>
              <td style="color: var(--accent-green);"><strong>€${totalRevenue.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Суммарные затраты на ремонт узлов:</td>
              <td style="color: var(--accent-orange);"><strong>€${totalMaintenance.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Количество единиц техники:</td>
              <td><strong>${(s.trucks || []).length} тягачей</strong></td>
            </tr>
          </table>
        </div>
      </div>
    `;
  },

  renderAchievementsSubviewHTML() {
    const s = AppState.get();
    const unlocked = s.unlockedAchievements || [];
    const catalog = (typeof ACHIEVEMENTS_CATALOG !== "undefined" && ACHIEVEMENTS_CATALOG.length > 0) ? ACHIEVEMENTS_CATALOG : [];

    return `
      <div class="terminals-grid">
        ${catalog.map(ach => {
          const isDone = unlocked.includes(ach.id);
          return `
            <div class="terminal-card unlocked" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between; border-color: ${isDone ? 'rgba(48, 209, 88, 0.4)' : 'var(--glass-border)'};">
              <div class="terminal-top-block">
                <div class="terminal-title" style="font-size: 0.88rem;">${ach.icon}${ach.title}</div>
                <div class="terminal-badge-row">
                  <span class="terminal-badge ${isDone ? 'active' : 'locked'}">${isDone ? '✓ Получено' : 'В процессе'}</span>
                </div>
                <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">${ach.desc}</p>
              </div>
              <div class="terminal-bottom-block" style="margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--glass-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="font-size: 0.68rem; color: var(--text-muted);">Награда:</span>
                  <strong style="font-size: 0.78rem; color: ${isDone ? 'var(--accent-green)' : 'var(--accent-orange)'};">${ach.reward || '€10 000'}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};