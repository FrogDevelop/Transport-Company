const AppAnalytics = {
  currentTab: "kpi",

  init() {
    this.checkAchievements();
    this.renderAnalyticsView();
  },

  setTab(tab) {
    this.currentTab = tab;
    this.renderAnalyticsView();
  },

  checkAchievements() {
    const s = AppState.get();
    if (!s.unlockedAchievements) s.unlockedAchievements = [];

    ACHIEVEMENTS_CATALOG.forEach(ach => {
      if (!s.unlockedAchievements.includes(ach.id) && ach.check(s)) {
        s.unlockedAchievements.push(ach.id);
        s.finances.balance += ach.rewardCash;
        s.company.reputation = Math.min(100, s.company.reputation + ach.reputationGain);
      }
    });

    AppStorage.save(s);
  },

  renderAnalyticsView() {
    const container = document.getElementById("view-analytics");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="analytics-header-bar">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Аналитика & Достижения</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Сквозные операционные метрики и этапы развития компании</span>
          </div>
        </div>

        <div class="network-tabs-row">
          <button class="fin-tab-btn ${this.currentTab === 'kpi' ? 'active' : ''}" onclick="AppAnalytics.setTab('kpi')">
            Ключевые KPI
          </button>
          <button class="fin-tab-btn ${this.currentTab === 'achievements' ? 'active' : ''}" onclick="AppAnalytics.setTab('achievements')">
            Достижения (${AppState.get().unlockedAchievements.length} / ${ACHIEVEMENTS_CATALOG.length})
          </button>
        </div>

        ${this.currentTab === 'kpi' ? this.renderKPISubviewHTML() : this.renderAchievementsSubviewHTML()}
      </div>
    `;
  },

  renderKPISubviewHTML() {
    const s = AppState.get();
    const stats = s.statistics || { totalDistanceDrivenKm: 0, totalCargoHauledTons: 0, completedTripsCount: 0, totalFuelConsumedLiters: 0 };
    const activeTripsCount = s.trips ? s.trips.length : 0;
    const fleetUtilization = s.trucks.length > 0 ? Math.round((activeTripsCount / s.trucks.length) * 100) : 0;
    const totalFleetValue = s.trucks.reduce((acc, t) => acc + (t.marketValue || t.purchasePrice), 0);
    const avgProfitPerTrip = stats.completedTripsCount > 0 ? Math.round(s.finances.totalEarned / stats.completedTripsCount) : 0;

    return `
      <div class="kpi-metrics-grid">
        <div class="kpi-card">
          <span class="kpi-card-title">ОБЩИЙ ПРОБЕГ ФЛОТА</span>
          <div class="kpi-card-val highlight">${stats.totalDistanceDrivenKm.toLocaleString()} км</div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">По европейским трассам</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-card-title">ЗАВЕРШЕНО ДОСТАВОК</span>
          <div class="kpi-card-val green">${stats.completedTripsCount} рейсов</div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Без единого срыва срока</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-card-title">ЗАГРУЗКА ПАРКА</span>
          <div class="kpi-card-val ${fleetUtilization > 60 ? 'green' : ''}">${fleetUtilization}%</div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${activeTripsCount} из ${s.trucks.length} машин в пути</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-card-title">ОЦЕНКА АКТИВОВ ФЛОТА</span>
          <div class="kpi-card-val">€${totalFleetValue.toLocaleString()}</div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Ликвидность подвижного состава</span>
        </div>
      </div>

      <div class="glass-card">
        <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: var(--space-4);">Сводные показатели эффективности</h3>
        
        <table class="tco-metric-table">
          <tr>
            <td>Средняя выручка за 1 выполненный рейс:</td>
            <td style="color: var(--accent-green);">€${avgProfitPerTrip.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Доля на логистическом рынке Европы:</td>
            <td style="color: var(--accent-blue);">${s.company.marketShare || 14}%</td>
          </tr>
          <tr>
            <td>Текущая репутация надежности:</td>
            <td>Класс ${s.company.reputation >= 80 ? 'A' : (s.company.reputation >= 60 ? 'B' : 'C')} (${s.company.reputation}/100)</td>
          </tr>
          <tr>
            <td>Действующих региональных филиалов:</td>
            <td>${s.branches ? s.branches.length : 1} подразделения</td>
          </tr>
          <tr>
            <td>Кросс-докинг хабы и склады:</td>
            <td>${s.warehouses ? s.warehouses.length : 0} объектов</td>
          </tr>
        </table>
      </div>
    `;
  },

  renderAchievementsSubviewHTML() {
    const s = AppState.get();
    const unlocked = s.unlockedAchievements || [];

    return `
      <div class="achievements-grid">
        ${ACHIEVEMENTS_CATALOG.map(ach => {
          const isDone = unlocked.includes(ach.id);

          return `
            <div class="achievement-card ${isDone ? 'completed' : ''}">
              <div class="achievement-icon-box">${ach.icon}</div>
              <div class="achievement-info">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="achievement-name">${ach.title}</span>
                  ${isDone ? `<span class="badge" style="color: var(--accent-green); background: rgba(48, 209, 88, 0.12);">Выполнено</span>` : ''}
                </div>
                <p class="achievement-desc">${ach.description}</p>
                <div class="achievement-reward-tag">
                  Награда: +€${ach.rewardCash.toLocaleString()} | ★ +${ach.reputationGain} репутации
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
