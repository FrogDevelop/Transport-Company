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

  refreshUsedMarket() {
    const s = AppState.get();
    const generated = [];

    for (let i = 0; i < 4; i++) {
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
        brand: template.brand,
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
    const s = AppState.get();
    const container = document.getElementById("view-market");
    if (!container) return;

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
            ${s.garage.hasFuelStation ? `
              <div class="badge" style="color: var(--accent-green); background: rgba(48, 209, 88, 0.12);">
                Оптовая цена базы: €${(s.market.currentDieselPrice * 0.82).toFixed(2)}/л
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Вторичный рынок тягачей (Used Fleet)</h3>
          <button class="btn-glass small" onclick="AppMarket.refreshUsedMarket(); AppMarket.renderMarketView();">Обновить предложения</button>
        </div>

        <div class="used-trucks-grid">
          ${s.market.usedTrucksMarket.map(truck => this.generateUsedCardHTML(truck)).join('')}
        </div>
      </div>
    `;
  },

  generateUsedCardHTML(truck) {
    return `
      <div class="glass-card used-truck-card">
        <div class="truck-card-header">
          <div class="truck-identity">
            <span class="truck-model-title">${truck.model}</span>
            <span class="truck-sub-info">${truck.year} г.в. | ${truck.mileageKm.toLocaleString()} км</span>
          </div>
          <span class="badge" style="color: var(--accent-blue);">Б/У Сток</span>
        </div>

        <div class="used-history-tag">
          <span class="history-pill ${truck.accidentsCount > 0 ? 'warn' : ''}">
            ${truck.accidentsCount === 0 ? '✓ Без ДТП' : `⚠️ ДТП в истории: ${truck.accidentsCount}`}
          </span>
          <span class="history-pill">
            ${truck.hasServiceHistory ? '✓ Сервисная книжка' : 'История ТО отсутствует'}
          </span>
        </div>

        <div class="components-wear-grid">
          ${AppTrucks.renderComponentMeter("Двигатель", truck.components.engine)}
          ${AppTrucks.renderComponentMeter("Коробка", truck.components.transmission)}
          ${AppTrucks.renderComponentMeter("Тормоза", truck.components.brakes)}
          ${AppTrucks.renderComponentMeter("Подвеска", truck.components.suspension)}
        </div>

        <div class="used-pricing-row">
          <div>
            <div class="used-original-price">Новый: €${truck.originalPrice.toLocaleString()}</div>
            <div class="used-deal-price">€${truck.purchasePrice.toLocaleString()}</div>
          </div>
          <button class="btn-glass primary small" onclick="AppMarket.buyUsedTruck('${truck.id}')">
            Выкупить тягач
          </button>
        </div>
      </div>
    `;
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
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    };

    s.trucks.push(importedTruck);
    s.market.usedTrucksMarket.splice(idx, 1);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderMarketView();
    alert(`Тягач ${importedTruck.model} успешно доставлен на базу компании!`);
  }
};
