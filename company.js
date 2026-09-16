const AppCompany = {
  currentTab: "branches",

  BRANCH_OPEN_COST: 65000,
  BRANCH_DAILY_UPKEEP: 180,
  WAREHOUSE_BUILD_COST: 85000,
  WAREHOUSE_DAILY_UPKEEP: 240,

  init() { this.renderCompanyView(); },

  setTab(tab) {
    this.currentTab = tab;
    this.renderCompanyView();
  },

  renderCompanyView() {
    const container = document.getElementById("view-company");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="network-header-bar">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Инфраструктура & Рыночная позиция</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Региональные филиалы, склады и конкурентная среда Европы</span>
          </div>
        </div>

        <div class="network-tabs-row">
          <button class="fin-tab-btn ${this.currentTab === 'branches' ? 'active' : ''}" onclick="AppCompany.setTab('branches')">
            Филиалы (${AppState.get().branches.length})
          </button>
          <button class="fin-tab-btn ${this.currentTab === 'warehouses' ? 'active' : ''}" onclick="AppCompany.setTab('warehouses')">
            Склады (${AppState.get().warehouses.length})
          </button>
          <button class="fin-tab-btn ${this.currentTab === 'market_share' ? 'active' : ''}" onclick="AppCompany.setTab('market_share')">
            Доли рынка & AI
          </button>
        </div>

        <div class="network-grid">
          ${this.renderSubTabContent()}
        </div>
      </div>
    `;
  },

  renderSubTabContent() {
    switch (this.currentTab) {
      case "branches": return this.renderBranchesHTML();
      case "warehouses": return this.renderWarehousesHTML();
      case "market_share": return this.renderMarketShareHTML();
      default: return "";
    }
  },

  renderBranchesHTML() {
    const s = AppState.get();
    const availableCities = CITIES_CATALOG.filter(city => !s.branches.some(b => b.cityName === city.name));

    return `
      ${s.branches.map(br => `
        <div class="glass-card branch-card">
          <div class="branch-header-row">
            <div class="branch-avatar">🏛️</div>
            <div class="branch-meta">
              <span class="branch-title">Филиал: ${br.cityName} (${br.country})</span>
              <span class="branch-sub">Уровень ${br.level} | Основан в день ${br.establishedDay}</span>
            </div>
            <span class="badge" style="color: var(--accent-green);">Активен</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); font-size: 0.8rem;">
            <div>
              <span style="color: var(--text-muted);">Парковочные слоты:</span>
              <div style="font-weight: 700;">+${br.slotsProvided} мест</div>
            </div>
            <div>
              <span style="color: var(--text-muted);">Содержание филиала:</span>
              <div style="font-weight: 700; color: var(--accent-orange);">€${br.dailyUpkeep} / день</div>
            </div>
          </div>
        </div>
      `).join('')}

      <div class="glass-card branch-card" style="border-style: dashed;">
        <div class="branch-header-row">
          <div class="branch-avatar" style="background: transparent;">➕</div>
          <div class="branch-meta">
            <span class="branch-title">Открыть новый филиал</span>
            <span class="branch-sub">Расширение географии и +3 парковочных места флота</span>
          </div>
        </div>

        <p style="font-size: 0.78rem; color: var(--text-secondary);">
          Новый филиал открывает прямые региональные заказы из выбранного города и устраняет порожний пробег.
        </p>

        <div style="display: flex; gap: var(--space-3); margin-top: auto;">
          <select id="select-branch-city" class="btn-glass small" style="flex: 1; text-align: left;">
            ${availableCities.map(c => `<option value="${c.id}">${c.name} (${c.country})</option>`).join('')}
          </select>
          <button class="btn-glass primary small" onclick="AppCompany.openNewBranch()">
            Открыть (€${this.BRANCH_OPEN_COST.toLocaleString()})
          </button>
        </div>
      </div>
    `;
  },

  openNewBranch() {
    const s = AppState.get();
    const select = document.getElementById("select-branch-city");
    if (!select) return;

    const cityId = select.value;
    const city = CITIES_CATALOG.find(c => c.id === cityId);
    if (!city) return;

    if (s.finances.balance < this.BRANCH_OPEN_COST) {
      AppUI.showToast("Недостаточно средств для открытия филиала!", "error");
      return;
    }

    s.finances.balance -= this.BRANCH_OPEN_COST;
    s.finances.todayExpenses += this.BRANCH_OPEN_COST;

    s.branches.push({
      id: "br-" + city.id,
      cityName: city.name,
      country: city.country,
      level: 1,
      slotsProvided: 3,
      dailyUpkeep: this.BRANCH_DAILY_UPKEEP,
      establishedDay: s.time.currentDay
    });

    s.garage.slots += 3;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderCompanyView();
    AppUI.showToast(`Филиал в городе ${city.name} успешно открыт! Автопарк расширен на 3 слота.`, "success");
  },

  renderWarehousesHTML() {
    const s = AppState.get();
    const availableCities = CITIES_CATALOG.filter(city => !s.warehouses.some(w => w.cityName === city.name));

    return `
      ${s.warehouses.length === 0 ? `
        <div class="glass-card empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🏭</div>
          <div class="empty-title">Нет распределительных складов</div>
          <p class="empty-desc">Склады консолидируют сборные грузы, принося пассивную маржу +20% к заказам из региона хаба.</p>
        </div>
      ` : ''}

      ${s.warehouses.map(wh => `
        <div class="glass-card warehouse-card">
          <div class="branch-header-row">
            <div class="branch-avatar">📦</div>
            <div class="branch-meta">
              <span class="branch-title">Логистический хаб: ${wh.cityName}</span>
              <span class="branch-sub">Вместимость: ${wh.capacityTons} т | Оборот: ${wh.currentStockTons} т</span>
            </div>
            <span class="badge" style="color: var(--accent-blue);">Hub</span>
          </div>

          <div class="warehouse-capacity-bar">
            <div class="capacity-labels">
              <span>Загрузка складских мощностей</span>
              <span>${Math.round((wh.currentStockTons / wh.capacityTons) * 100)}%</span>
            </div>
            <div class="capacity-track">
              <div class="capacity-fill" style="width: ${(wh.currentStockTons / wh.capacityTons) * 100}%"></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
            <span style="color: var(--text-muted);">Бонус консолидации:</span>
            <strong style="color: var(--accent-green);">+${wh.consolidationBonusPercent}% к ставке</strong>
          </div>
        </div>
      `).join('')}

      <div class="glass-card warehouse-card" style="border-style: dashed;">
        <div class="branch-header-row">
          <div class="branch-avatar" style="background: transparent;">🏗️</div>
          <div class="branch-meta">
            <span class="branch-title">Построить кросс-докинг хаб</span>
            <span class="branch-sub">Вместимость 500 тонн с консолидацией партий</span>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); margin-top: auto;">
          <select id="select-warehouse-city" class="btn-glass small" style="flex: 1; text-align: left;">
            ${availableCities.map(c => `<option value="${c.id}">${c.name} (${c.country})</option>`).join('')}
          </select>
          <button class="btn-glass primary small" onclick="AppCompany.buildWarehouse()">
            Построить (€${this.WAREHOUSE_BUILD_COST.toLocaleString()})
          </button>
        </div>
      </div>
    `;
  },

  buildWarehouse() {
    const s = AppState.get();
    const select = document.getElementById("select-warehouse-city");
    if (!select) return;

    const city = CITIES_CATALOG.find(c => c.id === select.value);
    if (!city) return;

    if (s.finances.balance < this.WAREHOUSE_BUILD_COST) {
      AppUI.showToast("Недостаточно средств для постройки распределительного склада!", "error");
      return;
    }

    s.finances.balance -= this.WAREHOUSE_BUILD_COST;
    s.finances.todayExpenses += this.WAREHOUSE_BUILD_COST;

    s.warehouses.push({
      id: "wh-" + city.id,
      cityName: city.name,
      capacityTons: 500,
      currentStockTons: Math.floor(Math.random() * 200) + 100,
      consolidationBonusPercent: 20,
      dailyUpkeep: this.WAREHOUSE_DAILY_UPKEEP
    });

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderCompanyView();
    AppUI.showToast(`Логистический хаб в ${city.name} сдан в эксплуатацию!`, "success");
  },

  renderMarketShareHTML() {
    const s = AppState.get();

    return `
      <div class="glass-card" style="grid-column: 1 / -1;">
        <h3 style="font-size: 1.05rem; margin-bottom: var(--space-3);">Распределение долей грузооборота в Европе</h3>
        <div class="market-share-box">
          <div class="share-track">
            <div class="share-segment player" style="width: ${s.company.marketShare}%;" title="Ваша компания"></div>
            ${s.competitors.map(c => `
              <div class="share-segment ${c.id.replace('comp-', '')}" style="width: ${c.marketShare}%;"></div>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
            <span>Ваша доля: <strong>${s.company.marketShare}%</strong></span>
            <span>Конкуренты: <strong>${100 - s.company.marketShare}%</strong></span>
          </div>
        </div>
      </div>

      ${COMPETITORS_CATALOG.map(comp => {
        const stateComp = s.competitors.find(c => c.id === comp.id) || { marketShare: comp.marketShare, fleetSize: comp.fleetSize };

        return `
          <div class="glass-card competitor-card">
            <div class="branch-header-row">
              <div class="branch-avatar">${comp.logoIcon}</div>
              <div class="branch-meta">
                <span class="branch-title">${comp.name}</span>
                <span class="branch-sub">${comp.strategy}</span>
              </div>
              <span class="badge" style="color: ${comp.color}; border-color: ${comp.color};">
                ${stateComp.marketShare}% рынка
              </span>
            </div>

            <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
              ${comp.description}
            </p>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); font-size: 0.8rem;">
              <div>
                <span style="color: var(--text-muted);">Размер флота:</span>
                <div style="font-weight: 700;">${stateComp.fleetSize} тягачей</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Репутация:</span>
                <div style="font-weight: 700; color: var(--accent-blue);">★ ${comp.reputation}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }
};