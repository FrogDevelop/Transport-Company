const AppMarketHub = {
  currentSubTab: "dealership", // 'dealership' | 'used_fuel' | 'hr'
  dealershipFilter: "all", // 'all' | 'diesel' | 'electric'

  init() {
    this.renderView();
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderView();
  },

  setDealershipFilter(filter) {
    this.dealershipFilter = filter;
    this.renderView();
  },

  renderView() {
    const container = document.getElementById("view-market_hub");
    if (!container) return;

    const s = AppState.get();
    const usedCount = (s.market && s.market.usedTrucksMarket) ? s.market.usedTrucksMarket.length : 0;
    const currentPrice = (s.market && s.market.currentDieselPrice) ? s.market.currentDieselPrice : 1.68;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <!-- Шапка торгового хаба -->
          <div class="market-header-bar" style="margin-bottom: var(--space-3);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.25rem; font-weight: 800;">Торговый дом & Биржа</h2>
                <span class="badge" style="color: var(--accent-green);">Дизель: €${currentPrice.toFixed(2)}/л</span>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                Официальные дилеры Европы • Вторичный рынок техники • Биржа найма водителей
              </span>
            </div>
          </div>

          <!-- Навигационные вкладки -->
          <div class="finance-nav-tabs" style="margin-bottom: var(--space-3); overflow-x: auto;">
            <button class="fin-tab-btn ${this.currentSubTab === 'dealership' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('dealership')">
              🚛 Автосалон (Новые)
            </button>
            <button class="fin-tab-btn ${this.currentSubTab === 'used_fuel' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('used_fuel')">
              🏷️ Б/У Рынок & Топливо (${usedCount})
            </button>
            <button class="fin-tab-btn ${this.currentSubTab === 'hr' ? 'active' : ''}" onclick="AppMarketHub.setSubTab('hr')">
              👨‍✈️ Кадровое агентство (HR)
            </button>
          </div>

          <!-- Контейнер активного подраздела -->
          <div id="market-hub-subcontent">
            ${this.renderSubContentHTML()}
          </div>
        </div>
      </div>
    `;
  },

  renderSubContentHTML() {
    if (this.currentSubTab === "used_fuel") {
      return (typeof AppMarket !== "undefined" && typeof AppMarket.renderUsedAndFuelSubViewHTML === "function")
        ? AppMarket.renderUsedAndFuelSubViewHTML()
        : '<div class="empty-state-card">Загрузка вторичного рынка...</div>';
    }
    if (this.currentSubTab === "hr") {
      return (typeof AppDrivers !== "undefined" && typeof AppDrivers.renderHRMarketSubViewHTML === "function")
        ? AppDrivers.renderHRMarketSubViewHTML()
        : '<div class="empty-state-card">Загрузка биржи водителей...</div>';
    }
    return this.renderDealershipSubViewHTML();
  },

  // ВСТРОЕННАЯ ЛОГИКА АВТОСАЛОНА (заменяет удаленный dealership.js)
  renderDealershipSubViewHTML() {
    const s = AppState.get();
    const models = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS : [];
    
    let filtered = models;
    if (this.dealershipFilter === "diesel") {
      filtered = models.filter(m => m.engineType !== "electric");
    } else if (this.dealershipFilter === "electric") {
      filtered = models.filter(m => m.engineType === "electric");
    }

    const availableSlots = (s.garage ? s.garage.slots : 2) - (s.trucks ? s.trucks.length : 0);

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="fleet-filter-group">
            <button class="fleet-filter-chip ${this.dealershipFilter === 'all' ? 'active' : ''}" onclick="AppMarketHub.setDealershipFilter('all')">Все модели (${models.length})</button>
            <button class="fleet-filter-chip ${this.dealershipFilter === 'diesel' ? 'active' : ''}" onclick="AppMarketHub.setDealershipFilter('diesel')">Дизельные Euro 6</button>
            <button class="fleet-filter-chip ${this.dealershipFilter === 'electric' ? 'active' : ''}" onclick="AppMarketHub.setDealershipFilter('electric')">Электро (BEV)</button>
          </div>

          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Свободных мест в гараже: <strong style="color: ${availableSlots > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${availableSlots}</strong>
          </span>
        </div>

        <div class="terminals-grid">
          ${filtered.map(model => {
            const isElectric = model.engineType === "electric";
            const canAfford = s.finances.balance >= model.basePrice;
            const hasSlot = availableSlots > 0;
            const canBuy = canAfford && hasSlot;

            return `
              <div class="terminal-card unlocked" style="cursor: default;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.88rem;">
                    ${model.modelName}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge ${isElectric ? 'active' : 'diesel'}">
                      ${isElectric ? '⚡ Electric' : '⛽ Euro 6'}
                    </span>
                  </div>

                  <div style="font-size: 0.7rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
                    ${model.brand} • <strong>${model.enginePowerHp} л.с.</strong> • До <strong>${model.maxPayloadTons || 24.5} т</strong>
                  </div>

                  <div style="font-size: 0.68rem; color: var(--text-muted);">
                    Расход: <strong>${model.avgConsumptionL100} ${isElectric ? 'кВт⋅ч' : 'л'}/100км</strong> • Бак: ${model.fuelTankL} ${isElectric ? 'кВт' : 'л'}
                  </div>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                  <div class="terminal-meta" style="font-size: 0.7rem;">
                    <span>Гарантия: <strong style="color: var(--accent-blue);">100%</strong></span>
                    <strong style="color: var(--accent-green); font-size: 0.86rem;">€${model.basePrice.toLocaleString()}</strong>
                  </div>

                  <button class="btn-glass primary terminal-action-btn" style="margin-top: 4px;"
                    ${!canBuy ? 'disabled' : ''}
                    onclick="AppMarketHub.buyNewTruck('${model.modelId}')">
                    ${!hasSlot ? 'Нет мест в гараже' : (!canAfford ? 'Не хватает средств' : 'Купить тягач')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  buyNewTruck(modelId) {
    const s = AppState.get();
    const models = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS : [];
    const model = models.find(m => m.modelId === modelId);
    if (!model) return;

    const availableSlots = (s.garage ? s.garage.slots : 2) - (s.trucks ? s.trucks.length : 0);
    if (availableSlots <= 0) {
      AppUI.showToast("В гараже нет свободных мест! Расширьте гараж перед покупкой.", "error");
      return;
    }

    if (s.finances.balance < model.basePrice) {
      AppUI.showToast("Недостаточно средств для покупки тягача!", "error");
      return;
    }

    s.finances.balance -= model.basePrice;
    s.finances.todayExpenses += model.basePrice;
    s.finances.totalSpent += model.basePrice;

    const newTruck = {
      id: "trk-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 4),
      modelId: model.modelId,
      model: model.modelName,
      brand: model.brand,
      engineType: model.engineType,
      enginePowerHp: model.enginePowerHp,
      maxPayloadTons: model.maxPayloadTons || 24.5,
      fuelTankL: model.fuelTankL,
      fuelCurrentL: model.fuelTankL,
      avgConsumptionL100: model.avgConsumptionL100,
      purchasePrice: model.basePrice,
      mileageKm: 0,
      year: 2026,
      status: "idle",
      assignedDriverId: null,
      homeBranchCity: (s.garage && s.garage.city) || "Берлин",
      tuningLevels: { ecu: 0, aero: 0, tanks: 0, retarder: 0 },
      components: {
        engine: 100,
        transmission: 100,
        brakes: 100,
        suspension: 100,
        tires: 100,
        electronics: 100,
        cooling: 100
      },
      tco: {
        totalMaintenanceCost: 0,
        totalFuelCost: 0,
        totalKmDriven: 0,
        totalRevenueGenerated: 0
      }
    };

    if (!Array.isArray(s.trucks)) s.trucks = [];
    s.trucks.push(newTruck);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderView();

    AppUI.showToast(`🎉 Тягач ${model.modelName} доставлен в ваш гараж!`, "success");
  }
};