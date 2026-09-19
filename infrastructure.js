const AppInfrastructure = {
  init() {
    this.ensureState();
    this.renderInfrastructureView();
  },

  ensureState() {
    const s = AppState.get();
    if (!Array.isArray(s.highwayInfrastructure)) {
      s.highwayInfrastructure = [];
    }
  },

  renderInfrastructureView() {
    const container = document.getElementById("view-infrastructure") || document.getElementById("view-company");
    if (!container) return;

    this.ensureState();
    const s = AppState.get();
    const owned = s.highwayInfrastructure;
    const catalog = typeof HIGHWAY_INFRASTRUCTURE_CATALOG !== "undefined" ? HIGHWAY_INFRASTRUCTURE_CATALOG : [];

    const totalRevenue = owned.reduce((acc, item) => acc + item.dailyRevenue, 0);
    const totalUpkeep = owned.reduce((acc, item) => acc + item.dailyUpkeep, 0);
    const netProfit = totalRevenue - totalUpkeep;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <div class="market-header-bar" style="margin-bottom: var(--space-3);">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 800;">Придорожная инфраструктура</h2>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                Инвестиции в объекты на автобанах • Чистый пассивный доход: <strong style="color: var(--accent-green);">+€${netProfit.toLocaleString()}/день</strong>
              </span>
            </div>
            <span class="badge" style="color: var(--accent-blue);">Объектов в собственности: ${owned.length}/${catalog.length}</span>
          </div>

          <div class="stats-overview-grid" style="margin-bottom: var(--space-4);">
            <div class="glass-card stat-card">
              <div class="card-label">Валовый доход / день</div>
              <div class="card-val" style="color: var(--accent-green);">+€${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="glass-card stat-card">
              <div class="card-label">Расходы на содержание</div>
              <div class="card-val" style="color: var(--accent-orange);">-€${totalUpkeep.toLocaleString()}</div>
            </div>
            <div class="glass-card stat-card primary">
              <div class="card-label">Чистый пассив</div>
              <div class="card-val">€${netProfit.toLocaleString()}</div>
            </div>
          </div>

          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: var(--space-3);">Доступные объекты для приобретения</h3>

          <div class="terminals-grid">
            ${catalog.map(item => {
              const isOwned = owned.some(o => o.id === item.id);
              const canAfford = s.finances.balance >= item.cost;
              const netItemProfit = item.dailyRevenue - item.dailyUpkeep;

              return `
                <div class="terminal-card ${isOwned ? 'unlocked' : 'locked'}" style="cursor: default;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.9rem;">
                      ${item.icon}${item.name}
                    </div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${isOwned ? 'active' : 'locked'}">
                        ${isOwned ? '✓ В собственности' : item.highway}
                      </span>
                    </div>
                    <p style="font-size: 0.72rem; color: var(--text-secondary); margin: 6px 0;">
                      ${item.desc}
                    </p>
                  </div>

                  <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                    <div class="terminal-meta" style="font-size: 0.68rem;">
                      <span>Чистый доход: <strong style="color: var(--accent-green);">+€${netItemProfit}/д</strong></span>
                      <span style="color: var(--text-muted);">Репутация: +${item.reputationBonus}★</span>
                    </div>

                    ${isOwned ? `
                      <div style="text-align: center; color: var(--accent-green); font-size: 0.75rem; font-weight: 700; padding: 6px; margin-top: 6px;">
                        ✓ Объект приносит прибыль
                      </div>
                    ` : `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                        <strong style="color: var(--accent-green); font-size: 0.88rem;">€${item.cost.toLocaleString()}</strong>
                        <button class="btn-glass primary small" ${!canAfford ? 'disabled' : ''} onclick="AppInfrastructure.buyFacility('${item.id}')">
                          ${canAfford ? 'Купить объект' : 'Не хватает €'}
                        </button>
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  buyFacility(facilityId) {
    const s = AppState.get();
    const catalog = typeof HIGHWAY_INFRASTRUCTURE_CATALOG !== "undefined" ? HIGHWAY_INFRASTRUCTURE_CATALOG : [];
    const item = catalog.find(i => i.id === facilityId);
    if (!item) return;

    if (!Array.isArray(s.highwayInfrastructure)) s.highwayInfrastructure = [];
    if (s.highwayInfrastructure.some(o => o.id === facilityId)) return;

    if (s.finances.balance < item.cost) {
      AppUI.showToast("Недостаточно средств для инвестиции!", "error");
      return;
    }

    s.finances.balance -= item.cost;
    s.finances.todayExpenses += item.cost;

    s.highwayInfrastructure.push({
      id: item.id,
      name: item.name,
      dailyRevenue: item.dailyRevenue,
      dailyUpkeep: item.dailyUpkeep
    });

    s.company.reputation = Math.min(100, s.company.reputation + item.reputationBonus);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderInfrastructureView();

    AppUI.showToast(`Приобретен объект инфраструктуры: «${item.name}»!`, "success");
  },

  processDailyInfrastructureIncome() {
    const s = AppState.get();
    if (!Array.isArray(s.highwayInfrastructure) || s.highwayInfrastructure.length === 0) return;

    let totalRev = 0;
    let totalUpkeep = 0;

    s.highwayInfrastructure.forEach(item => {
      totalRev += item.dailyRevenue;
      totalUpkeep += item.dailyUpkeep;
    });

    const net = totalRev - totalUpkeep;
    s.finances.balance += net;
    s.finances.todayRevenue += net;
    s.finances.totalEarned += net;

    if (net > 0 && typeof AppUI !== "undefined") {
      AppUI.showToast(`🛣️ Поступила прибыль от придорожной инфраструктуры: +€${net.toLocaleString()} (доход: €${totalRev}, расходы: €${totalUpkeep})`, "info", 6000);
    }
  }
};