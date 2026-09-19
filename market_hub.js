const AppMarketHub = {
  currentSubTab: "dealership", // 'dealership' | 'used_fuel' | 'hr'

  init() {
    this.renderView();
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderView();
  },

  renderView() {
    const container = document.getElementById("view-market_hub");
    if (!container) return;

    const s = AppState.get();
    const season = typeof AppMarket !== "undefined" ? AppMarket.getCurrentSeason() : null;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="market-header-bar" style="margin-bottom: var(--space-3);">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Рынок & Закупки</h2>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Свободно слотов: <strong>${s.garage.slots - s.trucks.length}</strong> | 
              Штат: <strong>${s.drivers.length}</strong> чел. | 
              Дизель: <strong style="color: var(--accent-green);">€${s.market.currentDieselPrice.toFixed(2)}/л</strong>
            </span>
          </div>

          ${season ? `
            <div class="season-indicator-card" style="padding: 6px 12px;">
              <span style="font-size: 1.2rem;">${season.icon}</span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 0.8rem; font-weight: 700;">${season.name.split(' ')[0]}</span>
                <span style="font-size: 0.68rem; color: var(--accent-blue);">${season.description.split(';')[0]}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="finance-nav-tabs" style="margin-bottom: var(--space-4);">
          <button class="fin-tab-btn ${this.currentSubTab === 'dealership' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('dealership')">
            🚛 Автосалон
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'used_fuel' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('used_fuel')">
            ⛽ Дизель & Б/У парк (${s.market.usedTrucksMarket ? s.market.usedTrucksMarket.length : 0})
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'hr' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('hr')">
            👨‍✈️ Биржа водителей (${s.marketDrivers ? s.marketDrivers.length : 0})
          </button>
        </div>

        <div id="market-hub-subcontent">
          ${this.renderSubContentHTML()}
        </div>
      </div>
    `;
  },

  renderSubContentHTML() {
    switch (this.currentSubTab) {
      case "dealership":
        return this.renderDealershipSection();
      case "used_fuel":
        return this.renderUsedAndFuelSection();
      case "hr":
        return this.renderHRSection();
      default:
        return "";
    }
  },

  // 1. Вкладка "Новые тягачи и Прицепы" (сетка 2 в ряд)
  renderDealershipSection() {
    let isTrailerMode = typeof AppDealership !== "undefined" && AppDealership.currentCategory === "trailers";
    let catalog = [];

    if (isTrailerMode) {
      catalog = typeof TRAILER_MODELS !== "undefined" ? TRAILER_MODELS : [];
    } else {
      catalog = typeof TRUCK_MODELS !== "undefined" ? TRUCK_MODELS : [];
      if (typeof AppDealership !== "undefined" && AppDealership.currentCategory !== "all") {
        catalog = catalog.filter(m => m.engineType === AppDealership.currentCategory);
      }
    }

    const currentCat = typeof AppDealership !== "undefined" ? AppDealership.currentCategory : "all";

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
        <div class="fleet-filter-group" style="flex-wrap: wrap;">
          <button class="fleet-filter-chip ${currentCat === 'all' ? 'active' : ''}" onclick="AppDealership.currentCategory='all'; AppMarketHub.renderView();">Все</button>
          <button class="fleet-filter-chip ${currentCat === 'diesel' ? 'active' : ''}" onclick="AppDealership.currentCategory='diesel'; AppMarketHub.renderView();">Дизель</button>
          <button class="fleet-filter-chip ${currentCat === 'electric' ? 'active' : ''}" onclick="AppDealership.currentCategory='electric'; AppMarketHub.renderView();">⚡ Электро</button>
          <button class="fleet-filter-chip ${currentCat === 'trailers' ? 'active' : ''}" onclick="AppDealership.currentCategory='trailers'; AppMarketHub.renderView();">📦 Прицепы</button>
        </div>
      </div>

      <div class="market-trucks-compact-grid">
        ${catalog.map(m => isTrailerMode 
          ? AppDealership.generateCompactTrailerCardHTML(m) 
          : AppDealership.generateCompactModelCardHTML(m)
        ).join('')}
      </div>
    `;
  },

  // 2. Вкладка "Дизель & Б/У тягачи" (сетка 2 в ряд)
  renderUsedAndFuelSection() {
    const s = AppState.get();
    const isPriceUp = s.market.currentDieselPrice >= s.market.previousDieselPrice;

    return `
      <div class="fuel-ticker-panel" style="margin-bottom: var(--space-4); padding: 10px 14px;">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">ДИЗЕЛЬНОЕ ТОПЛИВО (EN 590)</div>
          <div class="fuel-price-badge">
            <span class="fuel-price-val" style="font-size: 1.35rem;">€${s.market.currentDieselPrice.toFixed(2)}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">/ литр</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <div class="fuel-trend-tag ${isPriceUp ? 'up' : 'down'}">
            ${isPriceUp ? '▲ Рост' : '▼ Снижение'}
          </div>
          ${s.garage.hasFuelStation ? `
            <div class="badge" style="color: var(--accent-green); background: rgba(48, 209, 88, 0.12);">
              База: €${(s.market.currentDieselPrice * 0.82).toFixed(2)}/л
            </div>
          ` : ''}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
        <h3 style="font-size: 0.95rem; font-weight: 700;">Предложения вторичного рынка</h3>
        <button class="btn-glass small" onclick="AppMarket.refreshUsedMarket(); AppMarketHub.renderView();">Обновить сток</button>
      </div>

      <div class="market-trucks-compact-grid">
        ${s.market.usedTrucksMarket.map(truck => AppMarket.generateCompactUsedCardHTML(truck)).join('')}
      </div>
    `;
  },

  // 3. Вкладка "Биржа кадров"
renderHRSection() {
    const s = AppState.get();
    const currentSpec = typeof AppOfficeHub !== "undefined" ? AppOfficeHub.getCurrentLevelSpec() : { maxDrivers: 3 };
    if (!s.company) s.company = {};
    const totalMaxDrivers = currentSpec.maxDrivers + (s.company.extraDriverSlots || 0);
    const isFull = s.drivers.length >= totalMaxDrivers;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
        <span style="font-size: 0.78rem; color: var(--text-muted);">
          Штат: <strong>${s.drivers.length} / ${totalMaxDrivers}</strong> мест занято
        </span>
        <button class="btn-glass small" onclick="AppDrivers.generateCandidatesPool(6); AppMarketHub.renderView();">Обновить анкеты</button>
      </div>

      ${isFull ? `
        <div class="glass-subgroup" style="padding: 12px; margin-bottom: 12px; text-align: center; border-color: rgba(255, 159, 10, 0.4);">
          <span style="font-size: 0.82rem; color: var(--accent-orange); font-weight: 700;">⚠️ Штат сотрудников полностью заполнен! Улучшите офис или купите дополнительный слот во вкладке «Водители».</span>
        </div>
      ` : ''}

      <div class="drivers-grid">
        ${s.marketDrivers.map(cand => `
          <div class="glass-card driver-card">
            <div class="driver-card-header">
              <div class="driver-avatar-box">📑</div>
              <div class="driver-identity">
                <span class="driver-name">${cand.name}</span>
                <span class="driver-rank-sub">${cand.age} лет | Стаж: ${cand.experienceYears} лет \vert{} ★ ${cand.rating}</span>
              </div>
            </div>

            <div class="driver-skills-matrix">
              <div class="driver-skill-row">
                <span class="driver-skill-label">Экономия топлива:</span>
                <span class="driver-skill-val">-${cand.ecoDrivingSkill}%</span>
              </div>
              <div class="driver-skill-row">
                <span class="driver-skill-label">Ставка в день:</span>
                <span class="driver-skill-val">€${cand.dailyWage}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 10px;">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Бонус найма:</span>
                <div style="font-weight: 700; color: var(--accent-orange);">€${cand.hiringBonus.toLocaleString()}</div>
              </div>
              <button class="btn-glass primary small" ${isFull ? 'disabled' : ''} onclick="AppDrivers.hireCandidate('${cand.id}'); AppMarketHub.renderView();">
                ${isFull ? 'Нет мест' : 'Подписать'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
};