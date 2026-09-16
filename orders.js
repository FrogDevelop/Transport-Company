const AppOrders = {
  DIESEL_PRICE_PER_LITER: 1.68,

  init() {
    const s = AppState.get();
    if (!s.availableOrders || s.availableOrders.length === 0) {
      this.generateOrdersBatch(4);
    }
    this.renderOrdersView();
  },

  getRouteData(originId, destinationId) {
    const key1 = `${originId}-${destinationId}`;
    const key2 = `${destinationId}-${originId}`;
    if (ROUTE_DISTANCES[key1]) return ROUTE_DISTANCES[key1];
    if (ROUTE_DISTANCES[key2]) return ROUTE_DISTANCES[key2];
    return { distanceKm: 450, tollCost: 65 };
  },

  generateOrdersBatch(count = 4) {
    const s = AppState.get();
    const newOrders = [];
    const activeSeason = typeof AppMarket !== "undefined" ? AppMarket.getCurrentSeason() : null;

    for (let i = 0; i < count; i++) {
      const origin = CITIES_CATALOG[Math.floor(Math.random() * CITIES_CATALOG.length)];
      let destination = CITIES_CATALOG[Math.floor(Math.random() * CITIES_CATALOG.length)];
      while (destination.id === origin.id) {
        destination = CITIES_CATALOG[Math.floor(Math.random() * CITIES_CATALOG.length)];
      }

      const eligibleCargo = CARGO_CATALOG.filter(c => s.company.reputation >= c.minReputation);
      const cargo = eligibleCargo[Math.floor(Math.random() * eligibleCargo.length)] || CARGO_CATALOG[0];
      const route = this.getRouteData(origin.id, destination.id);
      const weightTons = Math.floor(Math.random() * 12) + 10;

      let kmRate = cargo.basePricePerKmTon;
      if (activeSeason && cargo.requiredTrailerType === activeSeason.bonusCargoType) {
        kmRate *= activeSeason.bonusMultiplier;
      }

      const hasWarehouse = s.warehouses && s.warehouses.some(w => w.cityName === origin.name);
      if (hasWarehouse) {
        kmRate *= 1.20;
      }

      const basePay = route.distanceKm * weightTons * kmRate;
      const reputationBonus = 1 + (s.company.reputation / 200);
      const totalPayout = Math.round(basePay * reputationBonus);

      newOrders.push({
        id: "ord-" + Date.now().toString(36) + "-" + i,
        originCity: origin.name,
        destinationCity: destination.name,
        cargoId: cargo.id,
        cargoName: cargo.name,
        cargoIcon: cargo.icon,
        requiredTrailerType: cargo.requiredTrailerType,
        weightTons: weightTons,
        distanceKm: route.distanceKm,
        tollCost: route.tollCost,
        payout: totalPayout,
        expiresInMinutes: 480
      });
    }

    s.availableOrders = newOrders;
    AppStorage.save(s);
  },

  generateContractExpressOrder(contractId) {
    const s = AppState.get();
    const contract = s.activeContracts.find(c => c.id === contractId);
    if (!contract) return;

    const origin = CITIES_CATALOG[0];
    const dest = CITIES_CATALOG[3];
    const route = this.getRouteData(origin.id, dest.id);

    const contractOrder = {
      id: "ord-cnt-" + Date.now().toString(36),
      contractId: contract.id,
      originCity: origin.name,
      destinationCity: dest.name,
      cargoId: "cargo-contract",
      cargoName: `Спецгруз [${contract.clientName}]`,
      cargoIcon: contract.logoIcon,
      requiredTrailerType: contract.requiredTrailerType,
      weightTons: 18,
      distanceKm: route.distanceKm,
      tollCost: route.tollCost,
      payout: contract.ratePerTrip,
      expiresInMinutes: 720
    };

    s.availableOrders.unshift(contractOrder);
    AppStorage.save(s);
    AppUI.switchTab("orders");
    this.renderOrdersView();
  },

  renderOrdersView() {
    const s = AppState.get();
    const container = document.getElementById("view-orders");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-filter-bar">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Биржа логистических заказов</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Актуальные спотовые предложения Европы</span>
          </div>
          <button class="btn-glass small" onclick="AppOrders.refreshMarket()">Обновить биржу</button>
        </div>

        <div class="orders-grid">
          ${s.availableOrders.map(order => this.generateOrderCardHTML(order)).join('')}
        </div>
      </div>
    `;
  },

  generateOrderCardHTML(order) {
    const s = AppState.get();
    const fuelPrice = (s.market && s.market.currentDieselPrice) ? s.market.currentDieselPrice : 1.68;
    const avgConsumption = 29;
    const fuelEstimatedL = (order.distanceKm / 100) * avgConsumption;
    const fuelCost = Math.round(fuelEstimatedL * fuelPrice);
    const wageCost = Math.round((order.distanceKm / 75) * 22);
    const wearCost = Math.round(order.distanceKm * 0.12);
    const estimatedExpenses = fuelCost + order.tollCost + wageCost + wearCost;
    const netProfit = order.payout - estimatedExpenses;
    const marginPercent = Math.round((netProfit / order.payout) * 100);

    const trailerTypeRu = {
      curtainsider: "Тентованный",
      refrigerated: "Рефрижератор",
      flatbed: "Платформа"
    };

    return `
      <div class="glass-card order-card">
        <div class="order-route-banner">
          <div class="route-points">
            <span>${order.originCity}</span>
            <span class="route-arrow">➔</span>
            <span>${order.destinationCity}</span>
          </div>
          <div class="order-reward-tag">€${order.payout.toLocaleString()}</div>
        </div>

        <div class="cargo-specs-grid">
          <div class="spec-cell">
            <span class="spec-title">Груз:</span>
            <span class="spec-value">${order.cargoIcon} ${order.cargoName}</span>
          </div>
          <div class="spec-cell">
            <span class="spec-title">Вес & Дистанция:</span>
            <span class="spec-value">${order.weightTons} т / ${order.distanceKm} км</span>
          </div>
          <div class="spec-cell" style="grid-column: span 2;">
            <span class="spec-title">Требование к полуприцепу:</span>
            <div class="trailer-requirement-tag">📦 ${trailerTypeRu[order.requiredTrailerType] || order.requiredTrailerType}</div>
          </div>
        </div>

        <div class="order-margin-projection">
          <div class="margin-row">
            <span>Топливо (дизель):</span>
            <span>-€${fuelCost}</span>
          </div>
          <div class="margin-row">
            <span>Платные трассы & Износ:</span>
            <span>-€${order.tollCost + wearCost}</span>
          </div>
          <div class="margin-row">
            <span>Оплата водителя:</span>
            <span>-€${wageCost}</span>
          </div>
          <div class="margin-row highlight">
            <span>Прогнозируемая чистая прибыль:</span>
            <span>€${netProfit.toLocaleString()} (${marginPercent}%)</span>
          </div>
        </div>

        <button class="btn-glass primary" style="width: 100%;" onclick="AppOrders.openAssignFleetModal('${order.id}')">
          Принять и назначить состав
        </button>
      </div>
    `;
  },

  refreshMarket() {
    this.generateOrdersBatch(4);
    this.renderOrdersView();
  },

  openAssignFleetModal(orderId) {
    const s = AppState.get();
    const order = s.availableOrders.find(o => o.id === orderId);
    if (!order) return;

    const availableTrucks = s.trucks.filter(t => t.status === 'idle');

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          Рейс: <strong>${order.originCity} ➔ ${order.destinationCity}</strong> (${order.distanceKm} км)
        </div>

        <div style="font-weight: 600; font-size: 0.9rem;">Выберите тягач для отправки:</div>
        
        ${availableTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <p style="color: var(--accent-orange);">Нет свободных тягачей в гараже!</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            ${availableTrucks.map(truck => {
              const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
              const hasDriver = !!driver;
              const isRested = hasDriver && driver.stamina >= 25;

              return `
                <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: var(--radius-md);">
                  <div>
                    <div style="font-weight: 700;">${truck.model}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                      Водитель: ${driver ? driver.name : '<span style="color: var(--accent-red);">Не назначен</span>'}
                      ${hasDriver ? `(Выносливость: ${Math.round(driver.stamina)}%)` : ''}
                    </div>
                  </div>
                  <button class="btn-glass small primary" 
                    ${(!hasDriver || !isRested) ? 'disabled' : ''} 
                    onclick="AppOrders.dispatchTrip('${order.id}', '${truck.id}')">
                    Отправить
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
    AppUI.openSheet("Диспетчерская отправка", html);
  },

  dispatchTrip(orderId, truckId) {
    const s = AppState.get();
    const orderIndex = s.availableOrders.findIndex(o => o.id === orderId);
    const truck = s.trucks.find(t => t.id === truckId);
    if (orderIndex === -1 || !truck) return;

    const order = s.availableOrders[orderIndex];
    const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
    if (!driver) return;

    const newTrip = {
      id: "trp-" + Date.now().toString(36),
      orderId: order.id,
      contractId: order.contractId || null,
      originCity: order.originCity,
      destinationCity: order.destinationCity,
      cargoName: order.cargoName,
      weightTons: order.weightTons,
      totalDistanceKm: order.distanceKm,
      remainingDistanceKm: order.distanceKm,
      tollCost: order.tollCost,
      payout: order.payout,
      truckId: truck.id,
      driverId: driver.id,
      status: "active",
      progressPercent: 0
    };

    truck.status = "trip";
    driver.status = "driving";

    s.trips.push(newTrip);
    s.availableOrders.splice(orderIndex, 1);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppTrucks.renderFleetView();
    AppDrivers.renderDriversView();
    this.renderOrdersView();
  }
};
