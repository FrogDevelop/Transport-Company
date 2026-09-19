const AppMarket = {
  SEASONS: [
    { id: "spring", name: "Весна (Строительный цикл)", icon: "🌱", bonusCargoType: "curtainsider", bonusMultiplier: 1.25, fuelPriceBase: 1.62, description: "+25% доходность стройматериалов" },
    { id: "summer", name: "Лето (Агро & Рефрижерация)", icon: "☀️", bonusCargoType: "refrigerated", bonusMultiplier: 1.40, fuelPriceBase: 1.74, description: "+40% ставка на скоропортящиеся продукты" },
    { id: "autumn", name: "Осень (Промышленный бум)", icon: "🍂", bonusCargoType: "flatbed", bonusMultiplier: 1.30, fuelPriceBase: 1.68, description: "+30% премия на промышленное машиностроение" },
    { id: "winter", name: "Зима (Потребительский ритейл)", icon: "❄️", bonusCargoType: "curtainsider", bonusMultiplier: 1.20, fuelPriceBase: 1.88, description: "+20% спрос на товары ритейла; дорогой дизель" }
  ],

  init() {
    const s = AppState.get();
    if (!s.market.usedTrucksMarket || s.market.usedTrucksMarket.length === 0) {
      this.refreshUsedMarket();
    }
    this.renderMarketView();
  },

  getCurrentSeason() {
    const s = AppState.get();
    return this.SEASONS[s.market.currentSeasonIndex || 0];
  },

  processDailyMarketTick() {
    const s = AppState.get();
    s.market.seasonDayCounter += 1;
    if (s.market.seasonDayCounter > 14) {
      s.market.seasonDayCounter = 1;
      s.market.currentSeasonIndex = (s.market.currentSeasonIndex + 1) % this.SEASONS.length;
    }

    const activeSeason = this.getCurrentSeason();
    s.market.previousDieselPrice = s.market.currentDieselPrice;
    const volatility = (Math.random() * 0.12) - 0.06;
    const newPrice = activeSeason.fuelPriceBase * (1 + volatility);
    s.market.currentDieselPrice = Math.round(newPrice * 100) / 100;

    if (s.time.currentDay % 3 === 0) {
      this.refreshUsedMarket();
    }
    AppStorage.save(s);
  },

  refreshUsedMarket(count = 8) {
    const s = AppState.get();
    const generated = [];

    for (let i = 0; i < count; i++) {
      const template = TRUCK_MODELS[Math.floor(Math.random() * TRUCK_MODELS.length)];
      const mileage = Math.floor(Math.random() * 450000) + 120000;
      const ageYears = Math.floor(Math.random() * 6) + 2;
      const accidents = Math.random() > 0.65 ? Math.floor(Math.random() * 2) + 1 : 0;

      const wearBase = Math.max(30, 95 - Math.round((mileage / 10000) * 1.5));
      const components = {
        engine: Math.max(25, wearBase - Math.floor(Math.random() * 20)),
        transmission: Math.max(30, wearBase - Math.floor(Math.random() * 15)),
        brakes: Math.max(20, Math.floor(Math.random() * 60) + 25),
        suspension: Math.max(25, wearBase - Math.floor(Math.random() * 25)),
        tires: Math.max(20, Math.floor(Math.random() * 70) + 20),
        electronics: Math.max(35, wearBase - Math.floor(Math.random() * 18)),
        cooling: Math.max(30, wearBase - Math.floor(Math.random() * 15))
      };

      const avgHealth = Math.round(Object.values(components).reduce((a, b) => a + b, 0) / 7);
      const discountRatio = (avgHealth / 100) * (1 - (mileage / 1200000));
      const dealPrice = Math.max(template.basePrice * 0.22, Math.round(template.basePrice * discountRatio));

      generated.push({
        id: "used-" + Date.now().toString(36) + "-" + i,
        model: template.modelName,
        modelId: template.modelId,
        brand: template.brand,
        engineType: template.engineType,
        enginePowerHp: template.enginePowerHp,
        year: 2026 - ageYears,
        mileageKm: mileage,
        fuelTankL: template.fuelTankCapacityL,
        fuelCurrentL: Math.round(template.fuelTankCapacityL * 0.4),
        avgConsumptionL100: Math.round((template.baseFuelConsumptionL100 + (mileage > 300000 ? 1.8 : 0.6)) * 10) / 10,
        assignedDriverId: null,
        status: "idle",
        components: components,
        accidentsCount: accidents,
        hasServiceHistory: Math.random() > 0.4,
        purchasePrice: dealPrice,
        originalPrice: template.basePrice,
        marketValue: dealPrice
      });
    }

    s.market.usedTrucksMarket = generated;
    AppStorage.save(s);
  },

  renderMarketView() {
    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
      return;
    }
    const container = document.getElementById("view-market");
    if (!container) return;

    const s = AppState.get();
    const season = this.getCurrentSeason();
    const isPriceUp = s.market.currentDieselPrice >= s.market.previousDieselPrice;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="market-header-bar">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Динамический товарный рынок</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Котировки сырья и вторичный парк техники</span>
          </div>

          <div class="season-indicator-card">
            <div class="season-icon-box">${season.icon}</div>
            <div class="season-info-text">
              <span class="season-name-title">${season.name}</span>
              <span class="season-impact-sub">${season.description}</span>
            </div>
          </div>
        </div>

        <div class="fuel-ticker-panel">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ДИЗЕЛЬНОЕ ТОПЛИВО (EN 590)</div>
            <div class="fuel-price-badge">
              <span class="fuel-price-val">€${s.market.currentDieselPrice.toFixed(2)}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted);">/ литр</span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div class="fuel-trend-tag ${isPriceUp ? 'up' : 'down'}">
              ${isPriceUp ? '▲ Рост котировки' : '▼ Снижение цены'}
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Вторичный рынок тягачей (Used Fleet)</h3>
          <button class="btn-glass small" onclick="AppMarket.refreshUsedMarket(8); AppMarket.renderMarketView();">Обновить предложения</button>
        </div>

        <div class="market-trucks-compact-grid">
          ${s.market.usedTrucksMarket.map(truck => this.generateCompactUsedCardHTML(truck)).join('')}
        </div>
      </div>
    `;
  },

  generateCompactUsedCardHTML(truck) {
    const avgHealth = Math.round(Object.values(truck.components).reduce((a, b) => a + b, 0) / 7);

    return `
      <div class="truck-mini-card" onclick="AppMarket.openUsedTruckDetailModal('${truck.id}')">
        <div class="mini-card-top">
          <span class="mini-card-model">${truck.model}</span>
          <span class="mini-card-badge used">
            ${avgHealth}% сост.
          </span>
        </div>

        <div class="mini-card-meta">
          <span>${truck.year} г.</span>
          <span>${Math.round(truck.mileageKm / 1000)}k км</span>
        </div>

        <div class="mini-card-price-row">
          <span class="mini-card-old-price">€${truck.originalPrice.toLocaleString()}</span>
          <div class="mini-card-price">€${truck.purchasePrice.toLocaleString()}</div>
        </div>
      </div>
    `;
  },

  openUsedTruckDetailModal(truckId) {
    const s = AppState.get();
    const truck = s.market.usedTrucksMarket.find(t => t.id === truckId);
    if (!truck) return;

    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelName === truck.model || m.modelId === truck.modelId) : null;
    const power = spec ? spec.enginePowerHp : (truck.enginePowerHp || 450);
    const tank = spec ? spec.fuelTankCapacityL : (truck.fuelTankL || 800);
    const consumption = spec ? spec.baseFuelConsumptionL100 : (truck.avgConsumptionL100 || 32);
    const engineType = spec ? spec.engineType : (truck.engineType || "diesel");

    const avgHealth = Math.round(Object.values(truck.components).reduce((a, b) => a + b, 0) / 7);
    const availableSlots = s.garage.slots - s.trucks.length;
    const canAfford = s.finances.balance >= truck.purchasePrice;
    const canBuy = canAfford && availableSlots > 0;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 2px;">${truck.model} (${truck.year} г.в.)</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${truck.brand} • Пробег: ${truck.mileageKm.toLocaleString()} км</span>
          </div>
          <span class="badge" style="color: var(--accent-orange);">Б/У Сток</span>
        </div>

        <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <span class="badge" style="color: ${truck.accidentsCount === 0 ? 'var(--accent-green)' : 'var(--accent-orange)'};">
            ${truck.accidentsCount === 0 ? '✓ Без ДТП' : `⚠️ ДТП: ${truck.accidentsCount}`}
          </span>
          <span class="badge">
            ${truck.hasServiceHistory ? '✓ Сервисная книжка' : 'Без истории ТО'}
          </span>
          <span class="badge" style="color: var(--accent-blue);">
            Здоровье: ${avgHealth}%
          </span>
          <span class="badge" style="color: var(--accent-green);">
            ${power} л.с.
          </span>
        </div>

        <!-- Блок технических характеристик как в автосалоне -->
        <div style="background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: var(--radius-sm); font-size: 0.74rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border: 1px solid var(--glass-border);">
          <div>Тип мотора: <strong style="color: var(--text-primary);">${engineType === 'electric' ? '⚡ Электро (BEV)' : '⛽ Дизель (EN 590)'}</strong></div>
          <div>Объем бака: <strong style="color: var(--text-primary);">${tank} л</strong></div>
          <div>Ср. расход: <strong style="color: var(--text-primary);">${consumption} л / 100км</strong></div>
          <div>Мощность: <strong style="color: var(--text-primary);">${power} л.с.</strong></div>
        </div>

        <div class="components-wear-grid" style="margin: 4px 0;">
          ${AppTrucks.renderComponentMeter("Двигатель", truck.components.engine)}
          ${AppTrucks.renderComponentMeter("Коробка", truck.components.transmission)}
          ${AppTrucks.renderComponentMeter("Тормоза", truck.components.brakes)}
          ${AppTrucks.renderComponentMeter("Подвеска", truck.components.suspension)}
          ${AppTrucks.renderComponentMeter("Шины", truck.components.tires)}
          ${AppTrucks.renderComponentMeter("Электроника", truck.components.electronics)}
          ${AppTrucks.renderComponentMeter("Охлаждение", truck.components.cooling)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 12px;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-decoration: line-through;">Новый: €${truck.originalPrice.toLocaleString()}</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-green);">€${truck.purchasePrice.toLocaleString()}</div>
          </div>
          <button class="btn-glass primary" 
            ${!canBuy ? 'disabled' : ''} 
            onclick="AppMarket.buyUsedTruck('${truck.id}')">
            ${availableSlots <= 0 ? 'Нет мест в гараже' : (!canAfford ? 'Недостаточно средств' : 'Выкупить тягач')}
          </button>
        </div>
      </div>
    `;

    AppUI.openSheet("Диагностическая карта Б/У", html);
  },

  buyUsedTruck(usedTruckId) {
    const s = AppState.get();
    if (s.trucks.length >= s.garage.slots) {
      alert("В гараже нет свободных мест! Расширьте базу для покупки техники.");
      return;
    }

    const idx = s.market.usedTrucksMarket.findIndex(t => t.id === usedTruckId);
    if (idx === -1) return;

    const truck = s.market.usedTrucksMarket[idx];
    if (s.finances.balance < truck.purchasePrice) {
      alert("Недостаточно средств для выкупа тягача на вторичном рынке!");
      return;
    }

    s.finances.balance -= truck.purchasePrice;
    s.finances.todayExpenses += truck.purchasePrice;

    const importedTruck = {
      ...truck,
      id: "trk-u-" + Date.now().toString(36),
      status: "idle",
      tuning: [],
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    };

    s.trucks.push(importedTruck);
    s.market.usedTrucksMarket.splice(idx, 1);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();

    if (typeof AppMarketHub !== "undefined" && AppUI.currentTab === "market_hub") {
      AppMarketHub.renderView();
    } else {
      this.renderMarketView();
    }
    alert(`Тягач ${importedTruck.model} успешно доставлен на базу компании!`);
  }
};