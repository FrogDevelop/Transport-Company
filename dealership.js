const AppDealership = {
  currentCategory: "all",

  init() { this.renderDealershipView(); },

  setCategory(cat) {
    this.currentCategory = cat;
    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
    } else {
      this.renderDealershipView();
    }
  },

  renderDealershipView() {
    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
      return;
    }
    const container = document.getElementById("view-dealership");
    if (!container) return;

    const s = AppState.get();
    
    let isTrailerMode = this.currentCategory === "trailers";
    let catalog = [];
    
    if (isTrailerMode) {
      catalog = TRAILER_MODELS;
    } else {
      catalog = TRUCK_MODELS;
      if (this.currentCategory !== "all") {
        catalog = TRUCK_MODELS.filter(m => m.engineType === this.currentCategory);
      }
    }

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="fleet-controls-bar" style="flex-wrap: wrap; gap: 8px; margin-bottom: var(--space-3);">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Официальный дилерский центр</h2>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Свободно слотов: <strong>${s.garage.slots - s.trucks.length}</strong> (Прицепы не занимают слоты)
            </span>
          </div>

          <div class="fleet-filter-group" style="flex-wrap: wrap;">
            <button class="fleet-filter-chip ${this.currentCategory === 'all' ? 'active' : ''}" onclick="AppDealership.setCategory('all')">Все тягачи</button>
            <button class="fleet-filter-chip ${this.currentCategory === 'diesel' ? 'active' : ''}" onclick="AppDealership.setCategory('diesel')">Дизель</button>
            <button class="fleet-filter-chip ${this.currentCategory === 'electric' ? 'active' : ''}" onclick="AppDealership.setCategory('electric')">⚡ Электро</button>
            <button class="fleet-filter-chip ${this.currentCategory === 'trailers' ? 'active' : ''}" style="border-color: var(--accent-blue);" onclick="AppDealership.setCategory('trailers')">📦 Прицепы</button>
          </div>
        </div>

        <div class="market-trucks-compact-grid">
          ${catalog.map(m => isTrailerMode ? this.generateCompactTrailerCardHTML(m) : this.generateCompactModelCardHTML(m)).join('')}
        </div>
      </div>
    `;
  },

  generateCompactModelCardHTML(m) {
    const isElectric = m.engineType === "electric";
    return `
      <div class="truck-mini-card" onclick="AppDealership.openModelDetailModal('${m.modelId}')">
        <div class="mini-card-top">
          <span class="mini-card-model">${m.modelName}</span>
          <span class="mini-card-badge ${isElectric ? 'electric' : 'diesel'}">
            ${isElectric ? '⚡ EV' : 'Euro 6'}
          </span>
        </div>
        <div class="mini-card-meta">
          <span>${m.brand}</span>
          <span>${m.enginePowerHp} л.с.</span>
        </div>
        <div class="mini-card-price-row">
          <span style="font-size: 0.65rem; color: var(--text-muted);">Цена с завода</span>
          <div class="mini-card-price">€${m.basePrice.toLocaleString()}</div>
        </div>
      </div>
    `;
  },

  generateCompactTrailerCardHTML(m) {
    return `
      <div class="truck-mini-card" onclick="AppDealership.openTrailerDetailModal('${m.modelId}')">
        <div class="mini-card-top">
          <span class="mini-card-model">${m.icon} ${m.modelName}</span>
          <span class="mini-card-badge diesel">Новый</span>
        </div>
        <div class="mini-card-meta" style="margin-top: 4px;">
          <span>${m.brand}</span>
        </div>
        <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
          ${m.desc}
        </div>
        <div class="mini-card-price-row">
          <span style="font-size: 0.65rem; color: var(--text-muted);">Цена с завода</span>
          <div class="mini-card-price" style="color: var(--accent-blue);">€${m.basePrice.toLocaleString()}</div>
        </div>
      </div>
    `;
  },

  openModelDetailModal(modelId) {
    const m = TRUCK_MODELS.find(x => x.modelId === modelId);
    if (!m) return;

    const s = AppState.get();
    const isElectric = m.engineType === "electric";
    const availableSlots = s.garage.slots - s.trucks.length;
    const canAfford = s.finances.balance >= m.basePrice;
    const canBuy = canAfford && availableSlots > 0;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 2px;">${m.modelName}</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${m.brand} • ${isElectric ? '100% Electric BEV' : 'Дизельный тягач Euro 6'}</span>
          </div>
          <span class="badge" style="color: ${isElectric ? 'var(--accent-blue)' : 'var(--accent-green)'}">
            ${isElectric ? '⚡ Zero Emission' : 'Euro 6'}
          </span>
        </div>

        <table class="spec-detail-table">
          <tr><td style="color: var(--text-muted);">Мощность силового агрегата:</td><td>${m.enginePowerHp} л.с.</td></tr>
          <tr><td style="color: var(--text-muted);">${isElectric ? 'Емкость тяговой батареи:' : 'Объем топливного бака:'}</td><td>${m.fuelTankCapacityL} ${isElectric ? 'кВт⋅ч' : 'л'}</td></tr>
          <tr><td style="color: var(--text-muted);">Паспортный расход:</td><td>${m.baseFuelConsumptionL100} ${isElectric ? 'кВт⋅ч / 100 км' : 'л / 100 км'}</td></tr>
          <tr><td style="color: var(--text-muted);">Индекс надежности узлов:</td><td>${Math.round(m.durabilityRating * 100)}%</td></tr>
          <tr><td style="color: var(--text-muted);">Свободно слотов в гараже:</td><td style="color: ${availableSlots > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${availableSlots} из ${s.garage.slots}</td></tr>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 12px; margin-top: 4px;">
          <div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Итоговая стоимость:</span>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-green);">€${m.basePrice.toLocaleString()}</div>
          </div>
          <button class="btn-glass primary" ${!canBuy ? 'disabled' : ''} onclick="AppDealership.buyModel('${m.modelId}')">
            ${availableSlots <= 0 ? 'Нет мест в гараже' : (!canAfford ? 'Недостаточно средств' : 'Купить тягач')}
          </button>
        </div>
      </div>
    `;
    AppUI.openSheet("Спецификация нового тягача", html);
  },

  openTrailerDetailModal(modelId) {
    const m = TRAILER_MODELS.find(x => x.modelId === modelId);
    if (!m) return;

    const s = AppState.get();
    const canAfford = s.finances.balance >= m.basePrice;

    const typeNames = {
      curtainsider: "Тентованный",
      refrigerated: "Рефрижератор (с ХОУ)",
      flatbed: "Открытая платформа"
    };

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 2px;">${m.icon} ${m.modelName}</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${m.brand} • Полуприцеп</span>
          </div>
          <span class="badge" style="color: var(--accent-blue);">
            ${typeNames[m.type]}
          </span>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${m.desc}</p>

        <table class="spec-detail-table">
          <tr><td style="color: var(--text-muted);">Тип кузова:</td><td>${typeNames[m.type]}</td></tr>
          <tr><td style="color: var(--text-muted);">Множитель износа:</td><td>${m.durabilityRating}x</td></tr>
          <tr><td style="color: var(--text-muted);">Требование к гаражу:</td><td style="color: var(--accent-green);">Не занимает слоты</td></tr>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 12px; margin-top: 4px;">
          <div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Итоговая стоимость:</span>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-green);">€${m.basePrice.toLocaleString()}</div>
          </div>
          <button class="btn-glass primary" ${!canAfford ? 'disabled' : ''} onclick="AppDealership.buyTrailer('${m.modelId}')">
            ${!canAfford ? 'Недостаточно средств' : 'Купить прицеп'}
          </button>
        </div>
      </div>
    `;
    AppUI.openSheet("Спецификация полуприцепа", html);
  },

  buyModel(modelId) {
    const spec = TRUCK_MODELS.find(m => m.modelId === modelId);
    if (!spec) return;

    const s = AppState.get();
    if (s.trucks.length >= s.garage.slots) {
      alert("В гараже нет мест! Расширьте базу во вкладке «Гараж & База».");
      return;
    }

    if (s.finances.balance < spec.basePrice) {
      alert("Недостаточно средств на счете компании!");
      return;
    }

    s.finances.balance -= spec.basePrice;
    s.finances.todayExpenses += spec.basePrice;

    s.trucks.push({
      id: "trk-" + Date.now().toString(36),
      model: spec.modelName,
      brand: spec.brand,
      engineType: spec.engineType,
      year: 2026,
      mileageKm: 0,
      fuelTankL: spec.fuelTankCapacityL,
      fuelCurrentL: spec.fuelTankCapacityL,
      avgConsumptionL100: spec.baseFuelConsumptionL100,
      assignedDriverId: null,
      coDriverId: null,
      attachedTrailerId: null,
      status: "idle",
      tuningLevels: { ecu: 0, aero: 0, tanks: 0, retarder: 0 },
      components: { engine: 100, transmission: 100, brakes: 100, suspension: 100, tires: 100, electronics: 100, cooling: 100 },
      purchasePrice: spec.basePrice,
      marketValue: spec.basePrice,
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    });

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    
    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
    } else {
      this.renderDealershipView();
    }
    AppUI.showToast(`Тягач ${spec.modelName} поставлен в автопарк!`, "success");
  },

  buyTrailer(modelId) {
    const spec = TRAILER_MODELS.find(m => m.modelId === modelId);
    if (!spec) return;

    const s = AppState.get();
    if (s.finances.balance < spec.basePrice) {
      alert("Недостаточно средств на счете компании!");
      return;
    }

    s.finances.balance -= spec.basePrice;
    s.finances.todayExpenses += spec.basePrice;

    if (!s.trailers) s.trailers = [];

    s.trailers.push({
      id: "trl-" + Date.now().toString(36),
      model: spec.modelName, 
      brand: spec.brand, 
      type: spec.type, 
      icon: spec.icon,
      mileageKm: 0, 
      status: "idle", 
      attachedTruckId: null,
      components: { chassis: 100, brakes: 100, tires: 100 },
      purchasePrice: spec.basePrice,
      durabilityRating: spec.durabilityRating
    });

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    
    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
    } else {
      this.renderDealershipView();
    }
    AppUI.showToast(`Полуприцеп ${spec.modelName} куплен и доставлен на базу!`, "success");
  }
};