const AppDealership = {
  currentCategory: "all",

  init() { this.renderDealershipView(); },

  setCategory(cat) {
    this.currentCategory = cat;
    this.renderDealershipView();
  },

  renderDealershipView() {
    const container = document.getElementById("view-dealership");
    if (!container) return;

    const s = AppState.get();
    let catalog = TRUCK_MODELS;
    if (this.currentCategory !== "all") {
      catalog = TRUCK_MODELS.filter(m => m.engineType === this.currentCategory);
    }

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="fleet-controls-bar" style="flex-wrap: wrap; gap: 8px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Официальный дилерский центр</h2>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Европейские тягачи с заводской гарантией</span>
          </div>

          <div class="fleet-filter-group">
            <button class="fleet-filter-chip ${this.currentCategory === 'all' ? 'active' : ''}" onclick="AppDealership.setCategory('all')">Все (${TRUCK_MODELS.length})</button>
            <button class="fleet-filter-chip ${this.currentCategory === 'diesel' ? 'active' : ''}" onclick="AppDealership.setCategory('diesel')">Дизель</button>
            <button class="fleet-filter-chip ${this.currentCategory === 'electric' ? 'active' : ''}" onclick="AppDealership.setCategory('electric')">⚡ Электро</button>
          </div>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: var(--space-4);">
          Свободно слотов в автопарке: <strong>${s.garage.slots - s.trucks.length}</strong> из ${s.garage.slots}
        </div>

        <div class="trucks-grid">
          ${catalog.map(m => this.generateModelCardHTML(m)).join('')}
        </div>
      </div>
    `;
  },

  generateModelCardHTML(m) {
    const isElectric = m.engineType === "electric";

    return `
      <div class="glass-card truck-card">
        <div class="truck-card-header">
          <div class="truck-identity">
            <span class="truck-model-title">${m.modelName}</span>
            <span class="truck-sub-info">${m.brand} • ${isElectric ? '100% Electric BEV' : 'Euro 6 Diesel'}</span>
          </div>
          <span class="badge" style="color: ${isElectric ? 'var(--accent-blue)' : 'var(--accent-green)'}">
            ${isElectric ? '⚡ Zero Emission' : 'Euro 6'}
          </span>
        </div>

        <div class="truck-telemetry-strip">
          <div class="telemetry-cell">
            <span class="telemetry-label">Мощность</span>
            <span class="telemetry-val">${m.enginePowerHp} л.с.</span>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">${isElectric ? 'Батарея' : 'Бак'}</span>
            <span class="telemetry-val">${m.fuelTankCapacityL} ${isElectric ? 'кВт⋅ч' : 'л'}</span>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Расход</span>
            <span class="telemetry-val">${m.baseFuelConsumptionL100} ${isElectric ? 'кВт/100' : 'л/100'}</span>
          </div>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
          Индекс долговечности: <strong>${m.durabilityRating * 100}%</strong> | Стоимость сервиса: <strong>${m.serviceCostMultiplier * 100}%</strong>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 12px;">
          <div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Стоимость:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-green);">€${m.basePrice.toLocaleString()}</div>
          </div>
          <button class="btn-glass primary small" onclick="AppDealership.buyModel('${m.modelId}')">
            Купить тягач
          </button>
        </div>
      </div>
    `;
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
      status: "idle",
      tuning: [],
      components: { engine: 100, transmission: 100, brakes: 100, suspension: 100, tires: 100, electronics: 100, cooling: 100 },
      purchasePrice: spec.basePrice,
      marketValue: spec.basePrice,
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    });

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderDealershipView();
    alert(`Тягач ${spec.modelName} поставлен в автопарк!`);
  }
};