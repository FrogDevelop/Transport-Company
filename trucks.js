const AppTrucks = {
  currentFilter: "all",

  BASE_WEAR_PER_1000KM: {
    engine: 0.9,
    transmission: 0.8,
    brakes: 2.2,
    suspension: 1.4,
    tires: 3.1,
    electronics: 0.7,
    cooling: 0.8
  },

  COMPONENT_COST_FACTORS: {
    engine: 0.28,
    transmission: 0.18,
    brakes: 0.05,
    suspension: 0.09,
    tires: 0.04,
    electronics: 0.07,
    cooling: 0.06
  },

  init() { this.renderFleetView(); },

  setFilter(filter) {
    this.currentFilter = filter;
    this.renderFleetView();
  },

  renderFleetView() {
    const s = AppState.get();
    const container = document.getElementById("view-fleet");
    if (!container) return;

    let filtered = s.trucks;
    if (this.currentFilter !== "all") {
      filtered = s.trucks.filter(t => t.status === this.currentFilter);
    }

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="fleet-controls-bar">
          <div class="fleet-filter-group">
            <button class="fleet-filter-chip ${this.currentFilter === 'all' ? 'active' : ''}" onclick="AppTrucks.setFilter('all')">Все (${s.trucks.length})</button>
            <button class="fleet-filter-chip ${this.currentFilter === 'idle' ? 'active' : ''}" onclick="AppTrucks.setFilter('idle')">В гараже</button>
            <button class="fleet-filter-chip ${this.currentFilter === 'trip' ? 'active' : ''}" onclick="AppTrucks.setFilter('trip')">В пути</button>
          </div>
          <button class="btn-glass primary small" onclick="AppUI.switchTab('dealership')">+ Автосалон</button>
        </div>

        <div class="trucks-grid">
          ${filtered.map(truck => this.generateTruckCardHTML(truck)).join('')}
        </div>
      </div>
    `;
  },

  generateTruckCardHTML(truck) {
    const avgHealth = this.calculateAverageHealth(truck);
    const healthClass = avgHealth > 75 ? 'good' : (avgHealth > 40 ? 'warning' : 'critical');
    
    const statusMap = {
      idle: { text: "В гараже", class: "idle" },
      trip: { text: "В пути", class: "trip" },
      repair: { text: "На ремонте", class: "repair" }
    };
    const curStatus = statusMap[truck.status] || { text: truck.status, class: "idle" };

    return `
      <div class="glass-card truck-card">
        <div class="truck-card-header">
          <div class="truck-identity">
            <span class="truck-model-title">${truck.model}</span>
            <span class="truck-sub-info">${truck.year} г.в. | ${truck.mileageKm.toLocaleString()} км | ${truck.engineType === 'electric' ? '⚡ Электро' : 'Дизель'}</span>
          </div>
          <span class="truck-status-badge ${curStatus.class}">${curStatus.text}</span>
        </div>

        <div class="truck-telemetry-strip">
          <div class="telemetry-cell">
            <span class="telemetry-label">Расход</span>
            <span class="telemetry-val">${truck.avgConsumptionL100} ${truck.engineType === 'electric' ? 'кВт' : 'л'}</span>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Запас</span>
            <span class="telemetry-val">${Math.round(truck.fuelCurrentL)}/${truck.fuelTankL}</span>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Здоровье</span>
            <span class="telemetry-val" style="color: var(--accent-${healthClass === 'good' ? 'green' : (healthClass === 'warning' ? 'orange' : 'red')})">${avgHealth}%</span>
          </div>
        </div>

        <div class="components-wear-grid">
          ${this.renderComponentMeter("Двигатель", truck.components.engine)}
          ${this.renderComponentMeter("Коробка", truck.components.transmission)}
          ${this.renderComponentMeter("Тормоза", truck.components.brakes)}
          ${this.renderComponentMeter("Подвеска", truck.components.suspension)}
          ${this.renderComponentMeter("Шины", truck.components.tires)}
        </div>

        <div class="truck-card-actions">
          <button class="btn-glass small" onclick="AppTrucks.openTuningModal('${truck.id}')">⚙️ Тюнинг</button>
          <button class="btn-glass small" onclick="AppTrucks.openTCOModal('${truck.id}')">TCO</button>
          <button class="btn-glass small primary" onclick="AppTrucks.openServiceModal('${truck.id}')">Сервис</button>
        </div>
      </div>
    `;
  },

  renderComponentMeter(name, value) {
    const val = Math.max(0, Math.min(100, Math.round(value)));
    let status = "good";
    if (val < 45) status = "critical";
    else if (val < 75) status = "warning";

    return `
      <div class="component-bar-row">
        <span class="component-title">${name}</span>
        <div class="component-meter">
          <div class="component-meter-fill ${status}" style="width: ${val}%"></div>
        </div>
        <span class="component-percent">${val}%</span>
      </div>
    `;
  },

  calculateAverageHealth(truck) {
    const c = truck.components;
    const sum = c.engine + c.transmission + c.brakes + c.suspension + c.tires + c.electronics + c.cooling;
    return Math.round(sum / 7);
  },

  applyWear(truckId, distanceKm) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    const catalogSpec = TRUCK_MODELS.find(m => m.modelName === truck.model);
    const durabilityMultiplier = catalogSpec ? catalogSpec.durabilityRating : 1.0;
    const factor = (distanceKm / 1000) * durabilityMultiplier;

    const hasRetarder = truck.tuning && truck.tuning.includes("tune-retarder");

    for (const [component, baseWear] of Object.entries(this.BASE_WEAR_PER_1000KM)) {
      let wearAmount = baseWear * factor;
      if (component === "brakes" && hasRetarder) wearAmount *= 0.6;
      truck.components[component] = Math.max(0, Math.round((truck.components[component] - wearAmount) * 10) / 10);
    }

    truck.mileageKm += Math.round(distanceKm);
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalKmDriven += Math.round(distanceKm);
    AppStorage.save(s);
  },

  openTuningModal(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;
    if (!truck.tuning) truck.tuning = [];

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Инженерные апгрейды для <strong>${truck.model}</strong>:</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${TRUCK_TUNING_CATALOG.map(t => {
            const installed = truck.tuning.includes(t.id);
            return `
              <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem;">${t.name}</div>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${t.desc}</div>
                </div>
                ${installed 
                  ? `<span class="badge" style="color: var(--accent-green);">Установлен</span>`
                  : `<button class="btn-glass primary small" onclick="AppTrucks.installTuning('${truck.id}', '${t.id}', ${t.cost})">€${t.cost.toLocaleString()}</button>`
                }
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    AppUI.openSheet("Тюнинг-ателье тягача", html);
  },

  installTuning(truckId, tuneId, cost) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    const spec = TRUCK_TUNING_CATALOG.find(t => t.id === tuneId);
    if (!truck || !spec) return;

    if (s.finances.balance < cost) {
      alert("Недостаточно средств для модернизации!");
      return;
    }

    s.finances.balance -= cost;
    s.finances.todayExpenses += cost;
    truck.tuning.push(tuneId);

    if (spec.consumptionModifier) {
      truck.avgConsumptionL100 = Math.round(truck.avgConsumptionL100 * (1 + spec.consumptionModifier) * 10) / 10;
    }
    if (spec.tankBonus) {
      truck.fuelTankL += spec.tankBonus;
      truck.fuelCurrentL += spec.tankBonus;
    }

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFleetView();
    this.openTuningModal(truckId);
  },

  openTCOModal(truckId) {
    const truck = AppState.get().trucks.find(t => t.id === truckId);
    if (!truck) return;
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: truck.mileageKm, totalRevenueGenerated: 0 };

    const tco = truck.tco;
    const totalOperatingCost = tco.totalMaintenanceCost + tco.totalFuelCost;
    const costPerKm = tco.totalKmDriven > 0 ? (totalOperatingCost / tco.totalKmDriven).toFixed(2) : "0.00";

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <h4 style="font-size: 1.1rem;">${truck.model}</h4>
        <table class="tco-metric-table">
          <tr><td>Пробег под управлением:</td><td>${tco.totalKmDriven.toLocaleString()} км</td></tr>
          <tr><td>Расходы на ТО и ремонт:</td><td style="color: var(--accent-orange);">€${Math.round(tco.totalMaintenanceCost).toLocaleString()}</td></tr>
          <tr><td>Расходы на энергию/топливо:</td><td style="color: var(--accent-orange);">€${Math.round(tco.totalFuelCost).toLocaleString()}</td></tr>
          <tr><td>Себестоимость 1 км (TCO):</td><td style="color: var(--accent-blue);">€${costPerKm} / км</td></tr>
          <tr><td>Выручка машины:</td><td style="color: var(--accent-green);">€${tco.totalRevenueGenerated.toLocaleString()}</td></tr>
        </table>
      </div>
    `;
    AppUI.openSheet("TCO Аналитика", html);
  },

  openServiceModal(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    const discountMultiplier = s.garage.hasServiceBay ? 0.7 : 1.0;
    let fullOverhaulCost = 0;

    const componentRepairs = Object.keys(truck.components).map(compKey => {
      const wearMissing = 100 - truck.components[compKey];
      const factor = this.COMPONENT_COST_FACTORS[compKey] || 0.05;
      const cost = Math.round(truck.purchasePrice * factor * (wearMissing / 100) * discountMultiplier);
      fullOverhaulCost += cost;
      return { key: compKey, missing: wearMissing, cost: cost };
    });

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          ${s.garage.hasServiceBay ? "⭐ Скидка 30% сервисного бокса базы" : "Тарифы сторонних СТО"}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${componentRepairs.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: var(--glass-surface-hover); border-radius: var(--radius-sm);">
              <span>${item.key} (износ: ${Math.round(item.missing)}%)</span>
              <button class="btn-glass small" ${item.cost <= 0 ? 'disabled' : ''} onclick="AppTrucks.repairComponent('${truck.id}', '${item.key}', ${item.cost})">
                €${item.cost.toLocaleString()}
              </button>
            </div>
          `).join('')}
        </div>
        <button class="btn-glass primary" style="width: 100%; margin-top: 6px;" onclick="AppTrucks.overhaulFull('${truck.id}', ${fullOverhaulCost})">
          Полное ТО (€${fullOverhaulCost.toLocaleString()})
        </button>
      </div>
    `;
    AppUI.openSheet("Сервисный бокс", html);
  },

  repairComponent(truckId, componentKey, cost) {
    const s = AppState.get();
    if (s.finances.balance < cost) {
      alert("Недостаточно средств!");
      return;
    }
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    s.finances.balance -= cost;
    s.finances.todayExpenses += cost;
    truck.components[componentKey] = 100;
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalMaintenanceCost += cost;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFleetView();
    this.openServiceModal(truckId);
  },

  overhaulFull(truckId, totalCost) {
    const s = AppState.get();
    if (s.finances.balance < totalCost) {
      alert("Недостаточно средств!");
      return;
    }
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    s.finances.balance -= totalCost;
    s.finances.todayExpenses += totalCost;
    Object.keys(truck.components).forEach(k => truck.components[k] = 100);

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalMaintenanceCost += totalCost;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFleetView();
    AppUI.closeSheet();
  }
};