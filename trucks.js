const AppTrucks = {
  currentFilter: "all",
  displayMode: "trucks", // 'trucks' | 'trailers'

  BASE_WEAR_PER_1000KM: { engine: 0.9, transmission: 0.8, brakes: 2.2, suspension: 1.4, tires: 3.1, electronics: 0.7, cooling: 0.8 },
  TRAILER_WEAR_PER_1000KM: { chassis: 1.0, brakes: 2.5, tires: 3.5 },

  COMPONENT_COST_FACTORS: { engine: 0.28, transmission: 0.18, brakes: 0.05, suspension: 0.09, tires: 0.04, electronics: 0.07, cooling: 0.06 },
  TRAILER_COST_FACTORS: { chassis: 0.4, brakes: 0.3, tires: 0.3 },

  COMPONENT_NAMES_RU: { engine: "Двигатель", transmission: "Коробка передач", brakes: "Тормоза", suspension: "Подвеска", tires: "Шины", electronics: "Электроника", cooling: "Охлаждение" },
  TRAILER_COMPONENT_NAMES: { chassis: "Рама и Кузов", brakes: "Тормозная система", tires: "Комплект шин" },

  COMPONENT_ICONS: { engine: "⚙️", transmission: "🕹️", brakes: "🛑", suspension: "🔩", tires: "🛞", electronics: "💡", cooling: "❄️", chassis: "🏗️" },

  init() { this.renderFleetView(); },

  ensureTruckSpecs(truck) {
    if (!truck) return null;
    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    if (!truck.tuningLevels) truck.tuningLevels = { ecu: 0, aero: 0, tanks: 0, retarder: 0 };
    if (!truck.components) truck.components = { engine: 100, transmission: 100, brakes: 100, suspension: 100, tires: 100, electronics: 100, cooling: 100 };
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    
    if (typeof truck.enginePowerHp !== "number") truck.enginePowerHp = spec ? spec.enginePowerHp : 480;
    if (typeof truck.maxPayloadTons !== "number") truck.maxPayloadTons = spec ? (spec.maxPayloadTons || 24.5) : 24.5;
    
    // Пересчет реального объема бака с учетом тюнинга tanks
    let baseTank = spec ? spec.fuelTankCapacityL : (truck.fuelTankL || 800);
    if (truck.tuningLevels.tanks > 0 && typeof TRUCK_TUNING_BRANCHES !== "undefined") {
      const tanksBranch = TRUCK_TUNING_BRANCHES.find(b => b.id === "tanks");
      if (tanksBranch && tanksBranch.stages[truck.tuningLevels.tanks - 1]) {
        baseTank += tanksBranch.stages[truck.tuningLevels.tanks - 1].tankBonus || 0;
      }
    }
    truck.fuelTankL = baseTank;

    if (typeof truck.fuelCurrentL !== "number") truck.fuelCurrentL = truck.fuelTankL;
    if (typeof truck.mileageKm !== "number") truck.mileageKm = 0;
    if (truck.assignedDriverId === undefined) truck.assignedDriverId = null;
    if (truck.coDriverId === undefined) truck.coDriverId = null;
    if (truck.attachedTrailerId === undefined) truck.attachedTrailerId = null;
    if (!truck.status) truck.status = "idle";
    return truck;
  },

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.setFilter('all');
  },

  setFilter(filter) {
    this.currentFilter = filter;
    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
    } else {
      this.renderFleetView();
    }
  },

  renderFleetView() {
    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
      return;
    }
    const container = document.getElementById("view-fleet");
    if (!container) return;

    const s = AppState.get();
    if (!s.trailers) s.trailers = [];

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="finance-nav-tabs" style="margin-bottom: var(--space-3);">
          <button class="fin-tab-btn ${this.displayMode === 'trucks' ? 'active' : ''}" onclick="AppTrucks.setDisplayMode('trucks')">🚛 Тягачи (${s.trucks.length})</button>
          <button class="fin-tab-btn ${this.displayMode === 'trailers' ? 'active' : ''}" onclick="AppTrucks.setDisplayMode('trailers')">📦 Прицепы (${s.trailers.length})</button>
        </div>

        <div class="fleet-controls-bar" style="margin-bottom: var(--space-3);">
          <div class="fleet-filter-group">
            <button class="fleet-filter-chip ${this.currentFilter === 'all' ? 'active' : ''}" onclick="AppTrucks.setFilter('all')">Все</button>
            <button class="fleet-filter-chip ${this.currentFilter === 'idle' ? 'active' : ''}" onclick="AppTrucks.setFilter('idle')">На базе</button>
            <button class="fleet-filter-chip ${this.currentFilter === 'trip' ? 'active' : ''}" onclick="AppTrucks.setFilter('trip')">В работе</button>
          </div>
          <button class="btn-glass primary small" onclick="AppUI.switchTab('market_hub')">+ Рынок</button>
        </div>

        <div class="market-trucks-compact-grid">
          ${this.displayMode === 'trucks' 
            ? s.trucks.filter(t => this.currentFilter === "all" || t.status === this.currentFilter).map(truck => this.generateCompactFleetCardHTML(truck)).join('')
            : s.trailers.filter(t => this.currentFilter === "all" || t.status === this.currentFilter).map(trailer => this.generateCompactTrailerCardHTML(trailer)).join('')
          }
        </div>
      </div>
    `;
  },

  generateCompactFleetCardHTML(rawTruck) {
    const truck = this.ensureTruckSpecs(rawTruck);
    const s = AppState.get();
    const avgHealth = this.calculateAverageHealth(truck);
    const isElectric = truck.engineType === "electric";
    
    const assignedDriver = s.drivers ? s.drivers.find(d => d.id === truck.assignedDriverId) : null;
    const coDriver = s.drivers ? s.drivers.find(d => d.id === truck.coDriverId) : null;
    const attachedTrailer = truck.attachedTrailerId ? (s.trailers || []).find(tr => tr.id === truck.attachedTrailerId) : null;

    let badgeText = "В гараже"; let badgeCls = "diesel";
    if (truck.status === "trip") { badgeText = "В рейсе"; badgeCls = "electric"; }
    else if (truck.status === "sublease") { badgeText = "🤝 Субаренда"; badgeCls = "diesel"; }
    else if (truck.status === "maintenance") { badgeText = `🔧 Ремонт (${truck.busyMinutesRemaining || 0}м)`; badgeCls = "used"; }
    else if (truck.status === "tuning") { badgeText = `⚙️ Тюнинг (${truck.busyMinutesRemaining || 0}м)`; badgeCls = "used"; }
    else if (truck.status === "refueling") { badgeText = `⛽ Заправка (${truck.busyMinutesRemaining || 0}м)`; badgeCls = "used"; }

    let driverHtml = '<span style="color: var(--accent-orange); font-weight: 500;">⚠️ Без экипажа</span>';
    if (truck.status === "sublease") {
      driverHtml = `<span style="color: var(--accent-green); font-weight: 600;">🤝 Арендатор (+€${truck.subleaseDailyIncome}/д)</span>`;
    } else if (assignedDriver && coDriver) {
      driverHtml = `<span style="color: var(--accent-blue); font-weight: 600;">👨‍✈️ ${assignedDriver.name.split(' ')[0]} & ${coDriver.name.split(' ')[0]}</span>`;
    } else if (assignedDriver) {
      driverHtml = `<span style="color: var(--accent-blue); font-weight: 600;">👨‍✈️ ${assignedDriver.name.split(' ')[0]}</span>`;
    }

    let trailerHtml = attachedTrailer 
      ? `<span style="color: var(--text-primary); font-weight: 600;" title="${attachedTrailer.model}">${attachedTrailer.icon} ${attachedTrailer.model}</span>` 
      : '<span style="color: var(--text-muted);">📦 Прицеп не выбран</span>';

    return `
      <div class="truck-mini-card" id="fleet-card-${truck.id}" onclick="AppTrucks.openTruckDetailModal('${truck.id}')">
        <div class="mini-card-top">
          <span class="mini-card-model">${truck.model}</span>
          <span class="mini-card-badge ${badgeCls}" id="truck-status-badge-${truck.id}">${badgeText}</span>
        </div>
        <div class="mini-card-meta">
          <span style="color: var(--text-primary); font-weight: 600;">⚡ ${this.getTruckCurrentPowerHp(truck)} л.с.</span>
          <span style="color: var(--accent-green); font-weight: 600;">${Math.round(truck.fuelCurrentL || 0)}/${truck.fuelTankL} ${isElectric ? 'кВт' : 'л'}</span>
        </div>
        <div class="truck-card-driver-tag" style="font-size: 0.72rem; padding: 2px 0;">${driverHtml}</div>
        <div class="truck-card-driver-tag" style="font-size: 0.70rem; padding: 3px 0; border-top: 1px dashed var(--glass-border); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${trailerHtml}
        </div>
        <div class="mini-card-price-row">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 0.68rem; color: var(--text-muted);">Состояние тягача:</span>
            <span class="mini-card-price" style="font-size: 0.88rem; color: var(--accent-${avgHealth > 75 ? 'green' : (avgHealth > 40 ? 'orange' : 'red')})">${avgHealth}%</span>
          </div>
        </div>
      </div>
    `;
  },

  generateCompactTrailerCardHTML(trailer) {
    const s = AppState.get();
    const sum = trailer.components.chassis + trailer.components.brakes + trailer.components.tires;
    const avgHealth = Math.round(sum / 3);
    const attachedTruck = trailer.attachedTruckId ? s.trucks.find(t => t.id === trailer.attachedTruckId) : null;

    let badgeText = "Свободен"; let badgeCls = "diesel";
    if (trailer.status === "trip") { badgeText = "В рейсе"; badgeCls = "electric"; }
    else if (trailer.status === "maintenance") { badgeText = `🔧 На ТО`; badgeCls = "used"; }

    return `
      <div class="truck-mini-card" onclick="AppTrucks.openTrailerDetailModal('${trailer.id}')">
        <div class="mini-card-top">
          <span class="mini-card-model">${trailer.icon} ${trailer.model}</span>
          <span class="mini-card-badge ${badgeCls}">${badgeText}</span>
        </div>
        <div class="mini-card-meta">
          <span>${trailer.brand}</span>
          <span style="color: var(--accent-blue); font-weight: 600;">${Math.round((trailer.mileageKm || 0) / 1000)}k км</span>
        </div>
        <div style="font-size: 0.72rem; padding: 4px 0; border-top: 1px dashed var(--glass-border); margin-top: 4px;">
          ${attachedTruck ? `<span style="color: var(--text-primary);">Сцепка: ${attachedTruck.model}</span>` : '<span style="color: var(--text-muted);">Отцеплен (Стоит на базе)</span>'}
        </div>
        <div class="mini-card-price-row">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 0.68rem; color: var(--text-muted);">Тех. состояние:</span>
            <span class="mini-card-price" style="font-size: 0.88rem; color: var(--accent-${avgHealth > 75 ? 'green' : (avgHealth > 40 ? 'orange' : 'red')})">${avgHealth}%</span>
          </div>
        </div>
      </div>
    `;
  },

  getTruckCurrentPowerHp(rawTruck) {
    const truck = this.ensureTruckSpecs(rawTruck);
    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    const baseHp = spec ? spec.enginePowerHp : (truck.enginePowerHp || 480);
    let bonusHp = 0;
    if (truck.tuningLevels && typeof TRUCK_TUNING_BRANCHES !== "undefined") {
      const ecuBranch = TRUCK_TUNING_BRANCHES.find(b => b.id === "ecu");
      const ecuLvl = truck.tuningLevels.ecu || 0;
      if (ecuBranch && ecuLvl > 0 && ecuBranch.stages[ecuLvl - 1]) bonusHp = ecuBranch.stages[ecuLvl - 1].powerBonusHp || 0;
    }
    return baseHp + bonusHp;
  },

  getTruckCurrentPayloadTons(rawTruck) {
    const truck = this.ensureTruckSpecs(rawTruck);
    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    const basePayload = spec ? (spec.maxPayloadTons || 24.5) : (truck.maxPayloadTons || 24.5);
    let bonusTons = 0;
    if (truck.tuningLevels && typeof TRUCK_TUNING_BRANCHES !== "undefined") {
      const chassisBranch = TRUCK_TUNING_BRANCHES.find(b => b.id === "tanks" || b.id === "aero");
      const chassisLvl = (truck.tuningLevels.tanks || truck.tuningLevels.aero) || 0;
      if (chassisBranch && chassisLvl > 0 && chassisBranch.stages[chassisLvl - 1]) bonusTons = chassisBranch.stages[chassisLvl - 1].payloadBonusTons || 0;
    }
    return Math.round((basePayload + bonusTons) * 10) / 10;
  },

  calculateAverageHealth(truck) {
    this.ensureTruckSpecs(truck);
    const sum = truck.components.engine + truck.components.transmission + truck.components.brakes + truck.components.suspension + truck.components.tires + truck.components.electronics + truck.components.cooling;
    return Math.round(sum / 7);
  },

  calculateMarketResaleValue(truck) {
    const base = truck.purchasePrice || 95000;
    const avgHealth = this.calculateAverageHealth(truck);
    const mileage = truck.mileageKm || 0;
    const driveOffLotHit = base * 0.82; 
    const mileageDiscount = Math.min(0.65, (mileage / 10000) * 0.025); 
    const healthFactor = avgHealth / 100;
    return Math.max(12000, Math.round(driveOffLotHit * (1 - mileageDiscount) * (0.3 + 0.7 * healthFactor)));
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

  applyWear(truckId, distanceKm) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    this.ensureTruckSpecs(truck);
    const catalogSpec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    const durabilityMultiplier = catalogSpec ? (catalogSpec.durabilityRating || 1.0) : 1.0;
    const factor = (distanceKm / 1000) * durabilityMultiplier;

    let brakesMultiplier = 1.0;
    if (truck.tuningLevels && truck.tuningLevels.retarder > 0) {
      if (typeof TRUCK_TUNING_BRANCHES !== "undefined") {
        const retarderBranch = TRUCK_TUNING_BRANCHES.find(b => b.id === "retarder");
        if (retarderBranch && retarderBranch.stages[truck.tuningLevels.retarder - 1]) brakesMultiplier += retarderBranch.stages[truck.tuningLevels.retarder - 1].brakesWearModifier || 0;
      }
    }
    brakesMultiplier = Math.max(0.15, brakesMultiplier);

    for (const [comp, baseWear] of Object.entries(this.BASE_WEAR_PER_1000KM)) {
      let wearAmount = baseWear * factor;
      if (comp === "brakes") wearAmount *= brakesMultiplier;
      truck.components[comp] = Math.max(0, Math.round((truck.components[comp] - wearAmount) * 10) / 10);
    }
    truck.mileageKm += Math.round(distanceKm);
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalKmDriven += Math.round(distanceKm);
    AppStorage.save(s);
  },

  applyTrailerWear(trailerId, distanceKm) {
    const s = AppState.get();
    const trailer = s.trailers.find(t => t.id === trailerId);
    if (!trailer) return;

    const durability = trailer.durabilityRating || 1.0;
    const factor = (distanceKm / 1000) * durability;

    for (const [comp, baseWear] of Object.entries(this.TRAILER_WEAR_PER_1000KM)) {
      trailer.components[comp] = Math.max(0, Math.round((trailer.components[comp] - (baseWear * factor)) * 10) / 10);
    }
    trailer.mileageKm = (trailer.mileageKm || 0) + Math.round(distanceKm);
    AppStorage.save(s);
  },

  openTruckDetailModal(truckId) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    const truck = this.ensureTruckSpecs(rawTruck);
    const avgHealth = this.calculateAverageHealth(truck);
    const currentHp = this.getTruckCurrentPowerHp(truck);
    const currentPayload = this.getTruckCurrentPayloadTons(truck);
    
    const driver1 = s.drivers ? s.drivers.find(d => d.id === truck.assignedDriverId) : null;
    const driver2 = s.drivers ? s.drivers.find(d => d.id === truck.coDriverId) : null;
    const attachedTrailer = truck.attachedTrailerId ? s.trailers.find(tr => tr.id === truck.attachedTrailerId) : null;

    const isElectric = truck.engineType === "electric";
    const isBusy = truck.status !== "idle" && truck.status !== "sublease";
    const isSubleased = truck.status === "sublease";
    const resaleValue = this.calculateMarketResaleValue(truck);

    let statusText = "Готов к рейсу (В гараже)"; let statusColor = "var(--accent-green)";
    if (truck.status === "trip") { statusText = "В рейсе на автобане"; statusColor = "var(--accent-blue)"; }
    else if (truck.status === "sublease") { statusText = `В субаренде (+€${truck.subleaseDailyIncome}/д)`; statusColor = "var(--accent-blue)"; }
    else if (truck.status === "maintenance") { statusText = `На ТО (Осталось: ${truck.busyMinutesRemaining || 0}м)`; statusColor = "var(--accent-orange)"; }
    else if (truck.status === "tuning") { statusText = `Тюнинг (Осталось: ${truck.busyMinutesRemaining || 0}м)`; statusColor = "var(--accent-orange)"; }
    else if (truck.status === "refueling") { statusText = `Заправка (Осталось: ${truck.busyMinutesRemaining || 0}м)`; statusColor = "var(--accent-orange)"; }

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 700;">${truck.model}</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${truck.brand || 'Грузовик'} • ${truck.year || 2026} г.в.</span>
          </div>
          <span class="badge" style="color: var(--accent-blue);">★ ${avgHealth}%</span>
        </div>

        ${!isSubleased ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="glass-subgroup" style="padding: 8px; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">За рулем</div>
              <div style="font-size: 0.8rem; font-weight: 700; margin: 4px 0; white-space: nowrap; overflow: hidden;">
                ${driver1 ? `👨‍✈️ ${driver1.name.split(' ')[0]} <br><span style="font-size: 0.7rem; font-weight: normal; color: var(--text-muted);">Бодрость: ${Math.round(driver1.stamina)}%</span>` : '<span style="color: var(--accent-orange);">Свободно</span>'}
              </div>
              ${driver1 
                ? `<button class="btn-glass small" style="width: 100%; color: var(--accent-red); padding: 4px;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.unassignDriver('${truck.id}', 1)">Снять</button>` 
                : `<button class="btn-glass primary small" style="width: 100%; padding: 4px;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openAssignDriverModal('${truck.id}', 1)">Нанять</button>`}
            </div>

            <div class="glass-subgroup" style="padding: 8px; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Напарник</div>
              <div style="font-size: 0.8rem; font-weight: 700; margin: 4px 0; white-space: nowrap; overflow: hidden;">
                ${driver2 ? `👨‍✈️ ${driver2.name.split(' ')[0]} <br><span style="font-size: 0.7rem; font-weight: normal; color: var(--text-muted);">Бодрость: ${Math.round(driver2.stamina)}%</span>` : '<span style="color: var(--accent-orange);">Свободно</span>'}
              </div>
              ${driver2 
                ? `<button class="btn-glass small" style="width: 100%; color: var(--accent-red); padding: 4px;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.unassignDriver('${truck.id}', 2)">Снять</button>` 
                : `<button class="btn-glass primary small" style="width: 100%; padding: 4px;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openAssignDriverModal('${truck.id}', 2)">Нанять</button>`}
            </div>
          </div>
        ` : `
          <div class="glass-subgroup" style="padding: 10px; border-radius: var(--radius-md); text-align: center; background: rgba(10, 132, 255, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-blue);">🤝 Тягач передан в субаренду</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">Независимый оператор использует машину на региональных маршрутах.</div>
          </div>
        `}

        <div class="glass-subgroup" style="padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; border-color: ${attachedTrailer ? 'rgba(10, 132, 255, 0.4)' : 'var(--glass-border)'};">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Сцепка (Полуприцеп)</div>
            <div style="font-size: 0.92rem; font-weight: 700; margin-top: 2px;">
              ${attachedTrailer ? `${attachedTrailer.icon}${attachedTrailer.model}` : '<span style="color: var(--text-muted);">Тягач без прицепа</span>'}
            </div>
          </div>
          <div>
            ${attachedTrailer 
              ? `<button class="btn-glass small" style="color: var(--accent-orange);" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.detachTrailer('${truck.id}')">Отцепить</button>` 
              : `<button class="btn-glass primary small" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openAssignTrailerModal('${truck.id}')">Прицепить</button>`}
          </div>
        </div>

        <table class="spec-detail-table" style="margin-top: 4px;">
          <tr><td style="color: var(--text-muted);">Текущий статус:</td><td style="color: ${statusColor}; font-weight: 700;" id="modal-live-status-text-${truck.id}">${statusText}</td></tr>
          <tr><td style="color: var(--text-muted);">Мощность:</td><td><strong>${currentHp} л.с.</strong></td></tr>
          <tr><td style="color: var(--text-muted);">Доступный тоннаж:</td><td><strong>до ${currentPayload} тонн</strong></td></tr>
          <tr><td style="color: var(--text-muted);">Запас ${isElectric ? 'энергии' : 'топлива'}:</td><td>${Math.round(truck.fuelCurrentL || 0)} / ${truck.fuelTankL} ${isElectric ? 'кВт⋅ч' : 'л'}</td></tr>
        </table>

        ${!isSubleased ? `
          <button class="btn-glass primary" style="width: 100%;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openSubleaseModal('${truck.id}')">
            🤝 Сдать тягач в субаренду
          </button>
        ` : `
          <button class="btn-glass" style="width: 100%; color: var(--accent-orange);" onclick="AppTrucks.recallFromSublease('${truck.id}')">
            📥 Отозвать из субаренды на базу
          </button>
        `}

        <div style="display: flex; gap: var(--space-2); margin-top: 4px;">
          <button class="btn-glass small primary" style="flex: 1;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openTuningModal('${truck.id}')">⚙️ Тюнинг</button>
          <button class="btn-glass small" style="flex: 1;" onclick="AppTrucks.openTCOModal('${truck.id}')">TCO</button>
          <button class="btn-glass small primary" style="flex: 1;" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.openServiceModal('${truck.id}')">🔧 ТО</button>
        </div>

        <button class="btn-glass small" style="color: var(--accent-red); border-color: rgba(255, 69, 58, 0.4); width: 100%; margin-top: 4px;"
          ${(isBusy || s.trucks.length <= 1) ? 'disabled' : ''}
          onclick="AppTrucks.confirmSellTruck('${truck.id}', ${resaleValue})">
          ${s.trucks.length <= 1 ? 'Нельзя продать единственный тягач' : `Продать тягач (+€${resaleValue.toLocaleString()})`}
        </button>
      </div>
    `;

    AppUI.openSheet("Сведения о тягаче", html);
  },

  openSubleaseModal(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    if (truck.status !== "idle") {
      AppUI.showToast("Сдать в субаренду можно только тягач, стоящий на базе!", "error");
      return;
    }

    if (truck.assignedDriverId) {
      AppUI.showToast("Сначала снимите назначенного водителя с этого тягача!", "warning");
      return;
    }

    const avgHealth = this.calculateAverageHealth(truck);
    if (avgHealth < 40) {
      AppUI.showToast("Техника слишком изношена (менее 40%), независимые операторы отказываются её брать!", "error");
      return;
    }

    const baseDailyYield = Math.round((truck.enginePowerHp || 480) * 18 * (avgHealth / 100));

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700;">Субаренда (Owner-Operators)</h3>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Передача тягача <strong>${truck.model}</strong> независимому дальнобойщику по контракту.
          </span>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Техническое состояние:</td>
            <td><strong style="color: var(--accent-green);">${avgHealth}%</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Прогнозируемый доход:</td>
            <td style="color: var(--accent-green);"><strong>+€${baseDailyYield} / день</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Условия:</td>
            <td style="font-size: 0.74rem; color: var(--text-secondary);">Оператор оплачивает аренду ежедневно в полночь, но техника изнашивается в фоновом режиме. При падении здоровья ниже 25% договор расторгается.</td>
          </tr>
        </table>

        <button class="btn-glass primary" style="width: 100%;" onclick="AppTrucks.startSublease('${truck.id}', ${baseDailyYield})">
          Сдать в субаренду (+€${baseDailyYield}/д)
        </button>
      </div>
    `;

    AppUI.openSheet("Субаренда техники", html);
  },

  startSublease(truckId, dailyYield) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    truck.status = "sublease";
    truck.subleaseDailyIncome = dailyYield;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast(`Тягач ${truck.model} передан в субарендатору! Пассивный доход активирован.`, "success");
  },

  recallFromSublease(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck || truck.status !== "sublease") return;

    truck.status = "idle";
    delete truck.subleaseDailyIncome;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast(`Тягач ${truck.model} возвращен на базу компании.`, "info");
  },

  openTrailerDetailModal(trailerId) {
    const s = AppState.get();
    const trailer = s.trailers.find(t => t.id === trailerId);
    if (!trailer) return;

    const sum = trailer.components.chassis + trailer.components.brakes + trailer.components.tires;
    const avgHealth = Math.round(sum / 3);
    const attachedTruck = trailer.attachedTruckId ? s.trucks.find(t => t.id === trailer.attachedTruckId) : null;
    const isBusy = trailer.status !== "idle" || (attachedTruck && attachedTruck.status !== "idle");

    let fullRepairCost = 0;
    const repairs = Object.keys(trailer.components).map(compKey => {
      const wearMissing = 100 - trailer.components[compKey];
      const factor = this.TRAILER_COST_FACTORS[compKey] || 0.1;
      const cost = Math.round((trailer.purchasePrice || 25000) * factor * (wearMissing / 100));
      fullRepairCost += cost;
      return { key: compKey, nameRu: this.TRAILER_COMPONENT_NAMES[compKey], health: Math.round(trailer.components[compKey]), cost };
    });

    const canAfford = s.finances.balance >= fullRepairCost;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 700;">${trailer.icon} ${trailer.model}</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${trailer.brand}</span>
          </div>
          <span class="badge" style="color: var(--accent-blue);">★ ${avgHealth}%</span>
        </div>

        <div class="glass-subgroup" style="padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Статус сцепки</div>
            <div style="font-size: 0.92rem; font-weight: 700; margin-top: 2px;">
              ${attachedTruck ? `Тягач: ${attachedTruck.model}` : '<span style="color: var(--accent-orange);">Отцеплен (На базе)</span>'}
            </div>
          </div>
          ${attachedTruck ? `<button class="btn-glass small" style="color: var(--accent-orange);" ${isBusy ? 'disabled' : ''} onclick="AppTrucks.detachTrailer('${attachedTruck.id}')">Отцепить</button>` : ''}
        </div>

        <div class="market-trucks-compact-grid">
          ${repairs.map(item => `
            <div class="truck-mini-card" style="cursor: default;">
              <div class="mini-card-top">
                <span class="mini-card-model" style="-webkit-line-clamp: 1;">${item.nameRu}</span>
                <span class="mini-card-badge" style="color: ${item.health > 75 ? 'var(--accent-green)' : 'var(--accent-red)'};">${item.health}%</span>
              </div>
              <div style="margin: 4px 0;">
                <div class="component-meter" style="height: 5px;">
                  <div class="component-meter-fill ${item.health > 75 ? 'good' : 'critical'}" style="width: ${item.health}%"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn-glass primary" style="width: 100%; margin-top: 4px;" 
          ${(!canAfford || fullRepairCost <= 0 || isBusy) ? 'disabled' : ''} 
          onclick="AppTrucks.repairTrailer('${trailer.id}', ${fullRepairCost})">
          ${fullRepairCost <= 0 ? 'Все узлы в норме' : `Обслужить прицеп (€${fullRepairCost.toLocaleString()})`}
        </button>
      </div>
    `;

    AppUI.openSheet("Сведения о полуприцепе", html);
  },

  repairTrailer(trailerId, cost) {
    const s = AppState.get();
    const trailer = s.trailers.find(t => t.id === trailerId);
    if (!trailer || s.finances.balance < cost) return;

    s.finances.balance -= cost;
    s.finances.todayExpenses += cost;
    Object.keys(trailer.components).forEach(k => trailer.components[k] = 100);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast("Полуприцеп полностью обслужен!", "success");
  },

  openAssignTrailerModal(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    const freeTrailers = (s.trailers || []).filter(tr => !tr.attachedTruckId && tr.status === "idle");

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Выберите прицеп для сцепки с <strong>${truck.model}</strong>:</p>
        ${freeTrailers.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">📦</div>
            <div style="font-weight: 600; font-size: 0.9rem;">Нет свободных прицепов</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">Купите новый прицеп в дилерском центре.</p>
          </div>
        ` : `
          <div class="market-trucks-compact-grid">
            ${freeTrailers.map(tr => `
              <div class="truck-mini-card" onclick="AppTrucks.attachTrailerToTruck('${truck.id}', '${tr.id}')">
                <div class="mini-card-top">
                  <span class="mini-card-model">${tr.icon} ${tr.model}</span>
                </div>
                <div class="mini-card-meta"><span>${tr.type}</span></div>
                <button class="btn-glass primary small" style="width: 100%; margin-top: 6px; padding: 4px 6px; font-size: 0.75rem;" 
                  onclick="event.stopPropagation(); AppTrucks.attachTrailerToTruck('${truck.id}', '${tr.id}')">
                  Прицепить
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    AppUI.openSheet("Сцепка полуприцепа", html);
  },

  attachTrailerToTruck(truckId, trailerId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    const trailer = s.trailers.find(tr => tr.id === trailerId);
    if (!truck || !trailer) return;

    if (truck.attachedTrailerId) {
      const oldTr = s.trailers.find(t => t.id === truck.attachedTrailerId);
      if (oldTr) oldTr.attachedTruckId = null;
    }
    
    truck.attachedTrailerId = trailer.id;
    trailer.attachedTruckId = truck.id;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast(`Прицеп ${trailer.model} успешно присоединен к тягачу!`, "success");
  },

  detachTrailer(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck || !truck.attachedTrailerId) return;

    const trailer = s.trailers.find(tr => tr.id === truck.attachedTrailerId);
    if (trailer) trailer.attachedTruckId = null;
    truck.attachedTrailerId = null;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast("Прицеп отсоединен от тягача и оставлен на базе.", "info");
  },

  openAssignDriverModal(truckId, slotIndex = 1) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    const freeDrivers = s.drivers.filter(d => !d.assignedTruckId && d.status === "rest");

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Свободные водители на <strong>Слот ${slotIndex}</strong>:</p>
        ${freeDrivers.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">👨‍✈️</div>
            <div style="font-weight: 600; font-size: 0.9rem;">Нет свободных водителей</div>
          </div>
        ` : `
          <div class="market-trucks-compact-grid">
            ${freeDrivers.map(d => `
              <div class="truck-mini-card" onclick="AppTrucks.assignDriverToTruck('${truck.id}', '${d.id}', ${slotIndex})">
                <div class="mini-card-top">
                  <span class="mini-card-model">${d.name}</span>
                  <span class="mini-card-badge diesel">★ ${d.rating}</span>
                </div>
                <div class="mini-card-meta"><span>Стаж ${d.experienceYears} л.</span></div>
                <div class="mini-card-price-row">
                  <button class="btn-glass primary small" style="width: 100%; margin-top: 6px; padding: 4px 6px; font-size: 0.75rem;" 
                    onclick="event.stopPropagation(); AppTrucks.assignDriverToTruck('${truck.id}', '${d.id}', ${slotIndex})">Назначить</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    AppUI.openSheet(`Назначение на Слот ${slotIndex}`, html);
  },

  assignDriverToTruck(truckId, driverId, slotIndex = 1) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    const driver = s.drivers.find(d => d.id === driverId);
    if (!truck || !driver) return;

    if (slotIndex === 1) {
      if (truck.coDriverId === driver.id) truck.coDriverId = null;
      truck.assignedDriverId = driver.id;
    } else {
      if (truck.assignedDriverId === driver.id) truck.assignedDriverId = null;
      truck.coDriverId = driver.id;
    }
    driver.assignedTruckId = truck.id;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast(`Водитель ${driver.name} добавлен в экипаж!`, "success");
  },

  unassignDriver(truckId, slotIndex = 1) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck) return;

    if (slotIndex === 1 && truck.assignedDriverId) {
      const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
      if (driver) driver.assignedTruckId = null;
      truck.assignedDriverId = null;
    } else if (slotIndex === 2 && truck.coDriverId) {
      const driver = s.drivers.find(d => d.id === truck.coDriverId);
      if (driver) driver.assignedTruckId = null;
      truck.coDriverId = null;
    }

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
  },

  confirmSellTruck(truckId, resaleValue) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    if (!truck || (truck.status !== "idle" && truck.status !== "sublease")) return;
    if (s.trucks.length <= 1) return AppUI.showToast("Нельзя продать единственный тягач!", "error");

    const confirmed = window.confirm(`Продать тягач ${truck.model} за €${resaleValue.toLocaleString()}?`);
    if (!confirmed) return;

    if (truck.assignedDriverId) s.drivers.find(d => d.id === truck.assignedDriverId).assignedTruckId = null;
    if (truck.coDriverId) s.drivers.find(d => d.id === truck.coDriverId).assignedTruckId = null;
    if (truck.attachedTrailerId) s.trailers.find(tr => tr.id === truck.attachedTrailerId).attachedTruckId = null;

    s.finances.balance += resaleValue;
    s.finances.todayRevenue += resaleValue;
    s.trucks = s.trucks.filter(t => t.id !== truckId);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppUI.showToast(`Тягач продан! +€${resaleValue.toLocaleString()}`, "success");
  },

  openTuningModal(truckId) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    const truck = this.ensureTruckSpecs(rawTruck);
    const garageSpec = (typeof AppGarage !== "undefined") ? AppGarage.getCurrentLevelSpec() : { maxStage: 1, tuningTimeMinutes: 45 };

    if (garageSpec.maxStage === 0) {
      AppUI.openSheet("Тюнинг-ателье заблокировано", `
        <div style="text-align: center; padding: var(--space-4);">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">🔒</div>
          <h3 style="font-size: 1.1rem; margin-bottom: 6px;">Гараж Уровня 1</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">
            На стартовой стоянке нет инженеров для форсирования машин. Улучшите гараж до <strong>Уровня 2</strong>, чтобы разблокировать тюнинг Stage 1.
          </p>
          <button class="btn-glass primary small" onclick="AppUI.closeSheet(); AppUI.switchTab('garage_hub');">
            К улучшению гаража
          </button>
        </div>
      `);
      return;
    }

    const branches = (typeof TRUCK_TUNING_BRANCHES !== "undefined" && Array.isArray(TRUCK_TUNING_BRANCHES))
      ? TRUCK_TUNING_BRANCHES
      : [
          { id: "ecu", name: "Чип-тюнинг ЭБУ", icon: "⚡", stages: [{ stage: 1, title: "Stage 1", cost: 12000, desc: "+35 л.с." }, { stage: 2, title: "Stage 2", cost: 24000, desc: "+70 л.с." }, { stage: 3, title: "Stage 3", cost: 45000, desc: "+105 л.с." }] },
          { id: "aero", name: "Аэродинамический обвес", icon: "💨", stages: [{ stage: 1, title: "Stage 1", cost: 9000, desc: "-5% расход" }, { stage: 2, title: "Stage 2", cost: 18000, desc: "-10% расход" }, { stage: 3, title: "Stage 3", cost: 32000, desc: "-15% расход" }] },
          { id: "tanks", name: "Усиленные мосты & Баки", icon: "⛽", stages: [{ stage: 1, title: "Stage 1", cost: 11000, desc: "+1.5т шасси, +200л" }, { stage: 2, title: "Stage 2", cost: 22000, desc: "+3.0т шасси, +400л" }, { stage: 3, title: "Stage 3", cost: 38000, desc: "+4.5т шасси, +600л" }] },
          { id: "retarder", name: "Ретардер тормозной", icon: "🛑", stages: [{ stage: 1, title: "Stage 1", cost: 10000, desc: "-30% износ тормозов" }, { stage: 2, title: "Stage 2", cost: 20000, desc: "-60% износ тормозов" }, { stage: 3, title: "Stage 3", cost: 35000, desc: "-80% износ тормозов" }] }
        ];

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Тюнинг <strong>${truck.model}</strong></span>
          <span style="font-size: 0.74rem; color: var(--accent-blue); font-weight: 600;">
            Лимит базы: Stage ${garageSpec.maxStage} | Монтаж: ~${garageSpec.tuningTimeMinutes || 45}м
          </span>
        </div>

        <div class="market-trucks-compact-grid">
          ${branches.map(branch => {
            const currentLevel = truck.tuningLevels[branch.id] || 0;
            const maxLevel = branch.stages.length;
            const isMax = currentLevel >= maxLevel;
            const nextStage = !isMax ? branch.stages[currentLevel] : null;
            const currentStage = currentLevel > 0 ? branch.stages[currentLevel - 1] : null;

            const isLockedByGarage = nextStage ? (nextStage.stage > garageSpec.maxStage) : false;
            const canAfford = nextStage ? (s.finances.balance >= nextStage.cost) : false;

            return `
              <div class="truck-mini-card" style="cursor: default;">
                <div class="mini-card-top">
                  <span class="mini-card-model" style="-webkit-line-clamp: 1;">${branch.icon}${branch.name}</span>
                  <span class="mini-card-badge ${currentLevel > 0 ? 'diesel' : 'used'}">
                    ${currentLevel === 0 ? 'Сток' : `Stage ${currentLevel}`}
                  </span>
                </div>

                <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 4px 0;">
                  ${isMax 
                    ? `✓ Установлен максимум (${currentStage ? currentStage.title : 'MAX'})`
                    : (isLockedByGarage
                        ? `<span style="color: var(--accent-orange);">🔒 Требуется Гараж Ур. ${nextStage.stage + 1}</span>`
                        : `След.: <strong>Stage ${currentLevel + 1}</strong> (${nextStage.desc})`
                      )
                  }
                </div>

                <div class="mini-card-price-row">
                  ${isMax ? `
                    <div style="text-align: center; padding: 5px; font-weight: 700; color: var(--accent-green); font-size: 0.82rem;">
                      ★ Полный Stage 3 (MAX)
                    </div>
                  ` : (isLockedByGarage ? `
                    <div style="text-align: center; padding: 4px; font-size: 0.72rem; color: var(--text-muted);">
                      Недоступно на базе
                    </div>
                  ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-size: 0.68rem; color: var(--text-muted);">Цена:</span>
                      <strong style="font-size: 0.84rem; color: var(--accent-green);">€${nextStage.cost.toLocaleString()}</strong>
                    </div>
                    <button class="btn-glass primary small" style="width: 100%; padding: 5px;" 
                      ${!canAfford ? 'disabled' : ''} 
                      onclick="AppTrucks.startTuningWork('${truck.id}', '${branch.id}')">
                      ${canAfford ? `Установить (~${garageSpec.tuningTimeMinutes || 45}м)` : 'Не хватает €'}
                    </button>
                  `)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    AppUI.openSheet("Инженерное тюнинг-ателье", html);
  },

  startTuningWork(truckId, branchId) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    const truck = this.ensureTruckSpecs(rawTruck);
    const garageSpec = (typeof AppGarage !== "undefined") ? AppGarage.getCurrentLevelSpec() : { tuningTimeMinutes: 45 };
    
    let nextCost = 15000;
    if (typeof TRUCK_TUNING_BRANCHES !== "undefined") {
      const branch = TRUCK_TUNING_BRANCHES.find(b => b.id === branchId);
      const currentLevel = truck.tuningLevels[branchId] || 0;
      if (branch && branch.stages[currentLevel]) {
        nextCost = branch.stages[currentLevel].cost;
      }
    }

    if (s.finances.balance < nextCost) {
      AppUI.showToast("Недостаточно средств для улучшения!", "error");
      return;
    }

    s.finances.balance -= nextCost;
    s.finances.todayExpenses += nextCost;
    s.finances.totalSpent += nextCost;

    truck.status = "tuning";
    truck.busyMinutesRemaining = garageSpec.tuningTimeMinutes || 30;
    truck.pendingTuningBranch = branchId;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();

    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
    }

    AppUI.showToast(`Монтаж тюнинга запущен! Работа займет ${truck.busyMinutesRemaining} мин.`, "info");
  },

  completeTuningWork(truck) {
    const branchId = truck.pendingTuningBranch;
    if (branchId && typeof truck.tuningLevels[branchId] === "number") {
      truck.tuningLevels[branchId] = Math.min(3, truck.tuningLevels[branchId] + 1);
    }

    // Пересчет мощности и тоннажа
    truck.enginePowerHp = this.getTruckCurrentPowerHp(truck);
    truck.maxPayloadTons = this.getTruckCurrentPayloadTons(truck);

    // ФИКС ТЮНИНГА БАКОВ (реальное увеличение вместимости литров)
    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    const baseTank = spec ? spec.fuelTankCapacityL : (truck.fuelTankL || 800);
    
    if (truck.tuningLevels.tanks > 0 && typeof TRUCK_TUNING_BRANCHES !== "undefined") {
      const tanksBranch = TRUCK_TUNING_BRANCHES.find(b => b.id === "tanks");
      const currentLevel = truck.tuningLevels.tanks;
      if (tanksBranch && tanksBranch.stages[currentLevel - 1]) {
        const bonus = tanksBranch.stages[currentLevel - 1].tankBonus || 0;
        truck.fuelTankL = baseTank + bonus;
        truck.fuelCurrentL = Math.min(truck.fuelTankL, (truck.fuelCurrentL || 0) + bonus); // Доливаем объем пропорционально
      }
    } else {
      truck.fuelTankL = baseTank;
    }

    truck.status = "idle";
    delete truck.busyMinutesRemaining;
    delete truck.pendingTuningBranch;

    AppUI.showToast(`⚙️ Тюнинг для ${truck.model} успешно смонтирован!`, "success");
  },

  openServiceModal(truckId) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    const truck = this.ensureTruckSpecs(rawTruck);
    const garageSpec = (typeof AppGarage !== "undefined") ? AppGarage.getCurrentLevelSpec() : { repairTimeMinutes: 45 };
    const discountMultiplier = s.garage.hasServiceBay ? 0.7 : 1.0;
    let fullOverhaulCost = 0;

    const componentRepairs = Object.keys(truck.components).map(compKey => {
      const wearMissing = 100 - truck.components[compKey];
      const factor = this.COMPONENT_COST_FACTORS[compKey] || 0.05;
      const cost = Math.round((truck.purchasePrice || 90000) * factor * (wearMissing / 100) * discountMultiplier);
      fullOverhaulCost += cost;
      return { 
        key: compKey, 
        nameRu: this.COMPONENT_NAMES_RU[compKey] || compKey,
        icon: this.COMPONENT_ICONS[compKey] || "🔧",
        health: Math.round(truck.components[compKey]),
        missing: Math.round(wearMissing), 
        cost: cost 
      };
    });

    const canAffordFull = s.finances.balance >= fullOverhaulCost;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Время работ базы: ~${garageSpec.repairTimeMinutes}м ${s.garage.hasServiceBay ? '(-30% цена СТО)' : ''}
          </span>
          <span style="font-size: 0.75rem; color: var(--accent-green); font-weight: 600;">
            Полное ТО: €${fullOverhaulCost.toLocaleString()}
          </span>
        </div>

        <div class="market-trucks-compact-grid">
          ${componentRepairs.map(item => {
            let statusColor = "var(--accent-green)";
            if (item.health < 40) statusColor = "var(--accent-red)";
            else if (item.health < 75) statusColor = "var(--accent-orange)";

            const canAffordSingle = s.finances.balance >= item.cost;

            return `
              <div class="truck-mini-card" style="cursor: default;">
                <div class="mini-card-top">
                  <span class="mini-card-model" style="-webkit-line-clamp: 1;">${item.icon}${item.nameRu}</span>
                  <span class="mini-card-badge" style="color: ${statusColor}; border: 1px solid${statusColor};">
                    ${item.health}%
                  </span>
                </div>

                <div style="margin: 4px 0;">
                  <div class="component-meter" style="height: 5px;">
                    <div class="component-meter-fill ${item.health > 75 ? 'good' : (item.health > 40 ? 'warning' : 'critical')}" style="width: ${item.health}%"></div>
                  </div>
                  <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 3px;">
                    ${item.missing > 0 ? `Износ: -${item.missing}%` : 'Идеальное состояние'}
                  </div>
                </div>

                <div class="mini-card-price-row">
                  ${item.cost <= 0 ? `
                    <div style="text-align: center; color: var(--accent-green); font-size: 0.75rem; font-weight: 700; padding: 4px;">
                      ✓ Исправен
                    </div>
                  ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-size: 0.68rem; color: var(--text-muted);">Цена:</span>
                      <strong style="font-size: 0.78rem; color: var(--accent-orange);">€${item.cost.toLocaleString()}</strong>
                    </div>
                    <button class="btn-glass small" style="width: 100%; padding: 4px 6px; font-size: 0.72rem;" 
                      ${!canAffordSingle ? 'disabled' : ''} 
                      onclick="AppTrucks.startSingleRepairWork('${truck.id}', '${item.key}', ${item.cost})">
                      В ремонт (~${Math.round(garageSpec.repairTimeMinutes * 0.5)}м)
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn-glass primary" style="width: 100%; margin-top: 4px;" 
          ${(!canAffordFull || fullOverhaulCost <= 0) ? 'disabled' : ''} 
          onclick="AppTrucks.startFullOverhaulWork('${truck.id}', ${fullOverhaulCost})">
          ${fullOverhaulCost <= 0 ? 'Все узлы в норме (100%)' : `Начать полное ТО (€${fullOverhaulCost.toLocaleString()} \vert{} ~${garageSpec.repairTimeMinutes}м)`}
        </button>
      </div>
    `;

    AppUI.openSheet("Техническое обслуживание тягача", html);
  },

  startSingleRepairWork(truckId, componentKey, cost) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    if (s.finances.balance < cost) {
      AppUI.showToast("Недостаточно средств для ремонта узла!", "error");
      return;
    }

    const truck = this.ensureTruckSpecs(rawTruck);
    const garageSpec = (typeof AppGarage !== "undefined") ? AppGarage.getCurrentLevelSpec() : { repairTimeMinutes: 45 };

    s.finances.balance -= cost;
    s.finances.todayExpenses += cost;
    s.finances.totalSpent += cost;

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalMaintenanceCost += cost;

    truck.status = "maintenance";
    truck.busyMinutesRemaining = Math.max(10, Math.round(garageSpec.repairTimeMinutes * 0.5));
    truck.pendingRepairComponent = componentKey;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();

    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
    }

    AppUI.showToast(`Ремонт узла «${this.COMPONENT_NAMES_RU[componentKey] || componentKey}» начат (${truck.busyMinutesRemaining}м).`, "info");
  },

  startFullOverhaulWork(truckId, totalCost) {
    const s = AppState.get();
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!rawTruck) return;

    if (s.finances.balance < totalCost) {
      AppUI.showToast("Недостаточно средств для полного ТО!", "error");
      return;
    }

    const truck = this.ensureTruckSpecs(rawTruck);
    const garageSpec = (typeof AppGarage !== "undefined") ? AppGarage.getCurrentLevelSpec() : { repairTimeMinutes: 45 };

    s.finances.balance -= totalCost;
    s.finances.todayExpenses += totalCost;
    s.finances.totalSpent += totalCost;

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalMaintenanceCost += totalCost;

    truck.status = "maintenance";
    truck.busyMinutesRemaining = garageSpec.repairTimeMinutes || 30;
    truck.pendingRepairComponent = "all";

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();

    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
    }

    AppUI.showToast(`Тягач ${truck.model} отправлен на полное ТО (${truck.busyMinutesRemaining}м).`, "info");
  },

  completeRepairWork(truck) {
    if (truck.pendingRepairComponent === "all") {
      Object.keys(truck.components).forEach(k => truck.components[k] = 100);
      AppUI.showToast(`Полное ТО тягача ${truck.model} завершено! Все узлы 100%.`, "success");
    } else if (truck.pendingRepairComponent) {
      truck.components[truck.pendingRepairComponent] = 100;
      const name = this.COMPONENT_NAMES_RU[truck.pendingRepairComponent] || truck.pendingRepairComponent;
      AppUI.showToast(`Ремонт узла «${name}» для ${truck.model} завершен!`, "success");
    } else {
      Object.keys(truck.components).forEach(k => truck.components[k] = 100);
    }

    truck.status = "idle";
    delete truck.busyMinutesRemaining;
    delete truck.pendingRepairComponent;
  },

  openTCOModal(truckId) {
    const truck = AppState.get().trucks.find(t => t.id === truckId);
    if (!truck) return;
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: truck.mileageKm || 0, totalRevenueGenerated: 0 };

    const tco = truck.tco;
    const totalOperatingCost = tco.totalMaintenanceCost + tco.totalFuelCost;
    const costPerKm = tco.totalKmDriven > 0 ? (totalOperatingCost / tco.totalKmDriven).toFixed(2) : "0.00";

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <h4 style="font-size: 1.1rem;">${truck.model}</h4>
        <table class="spec-detail-table">
          <tr><td>Пробег под управлением:</td><td>${tco.totalKmDriven.toLocaleString()} км</td></tr>
          <tr><td>Расходы на ТО и ремонт:</td><td style="color: var(--accent-orange);">€${Math.round(tco.totalMaintenanceCost).toLocaleString()}</td></tr>
          <tr><td>Расходы на энергию/топливо:</td><td style="color: var(--accent-orange);">€${Math.round(tco.totalFuelCost).toLocaleString()}</td></tr>
          <tr><td>Себестоимость 1 км (TCO):</td><td style="color: var(--accent-blue);">€${costPerKm} / км</td></tr>
          <tr><td>Выручка машины:</td><td style="color: var(--accent-green);">€${tco.totalRevenueGenerated.toLocaleString()}</td></tr>
        </table>
      </div>
    `;
    AppUI.openSheet("TCO Аналитика", html);
  }
};