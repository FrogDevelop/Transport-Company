const AppOrders = {
  selectedLicenseCategory: null,
  DIESEL_PRICE_PER_LITER: 1.68,
  TRUCK_CRUISE_SPEED_KMH: 75,

  init() {
    const s = AppState.get();
    if (!s.availableOrders || s.availableOrders.length === 0) {
      this.generateAllCategoriesOrders();
    }
    this.renderOrdersView();
  },

  getRouteData(originId, destinationId) {
    const key1 = `${originId}-${destinationId}`;
    const key2 = `${destinationId}-${originId}`;
    if (typeof ROUTE_DISTANCES !== "undefined") {
      if (ROUTE_DISTANCES[key1]) return ROUTE_DISTANCES[key1];
      if (ROUTE_DISTANCES[key2]) return ROUTE_DISTANCES[key2];
    }

    const cityA = (typeof CITIES_CATALOG !== "undefined") ? CITIES_CATALOG.find(c => c.id === originId) : null;
    const cityB = (typeof CITIES_CATALOG !== "undefined") ? CITIES_CATALOG.find(c => c.id === destinationId) : null;

    if (!cityA || !cityB) {
      return { distanceKm: 480, tollCost: 75 };
    }

    const R = 6371;
    const dLat = (cityB.lat - cityA.lat) * (Math.PI / 180);
    const dLon = (cityB.lon - cityA.lon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(cityA.lat * (Math.PI / 180)) * Math.cos(cityB.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;

    const distanceKm = Math.max(140, Math.round(straightKm * 1.28));
    const avgTollRate = ((cityA.tollRatePerKm || 0.2) + (cityB.tollRatePerKm || 0.2)) / 2;
    const tollCost = Math.round(distanceKm * avgTollRate * 0.7);

    return { distanceKm, tollCost };
  },

  estimateTripDurationMinutes(distanceKm, truckSpeedKmh = 75) {
    const hours = distanceKm / truckSpeedKmh;
    return Math.round(hours * 60);
  },

  formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'ч ' : ''}${m}м`;
  },

  generateAllCategoriesOrders() {
    const s = AppState.get();
    const licenses = (typeof CARGO_LICENSES !== "undefined") ? CARGO_LICENSES : [];
    const generated = [];

    licenses.forEach(lic => {
      const batch = this.generateOrdersForCategory(lic.id, 4);
      generated.push(...batch);
    });

    s.availableOrders = generated;
    AppStorage.save(s);
  },

  generateOrdersForCategory(licenseId, count = 4) {
    const s = AppState.get();
    const newBatch = [];
    const activeSeason = typeof AppMarket !== "undefined" ? AppMarket.getCurrentSeason() : null;
    const cities = (typeof CITIES_CATALOG !== "undefined") ? CITIES_CATALOG : [];
    const allCargo = (typeof CARGO_CATALOG !== "undefined") ? CARGO_CATALOG : [];
    const matchingCargo = allCargo.filter(c => c.requiredLicense === licenseId);
    if (matchingCargo.length === 0 || cities.length < 2) return [];

    for (let i = 0; i < count; i++) {
      const origin = cities[Math.floor(Math.random() * cities.length)];
      let destination = cities[Math.floor(Math.random() * cities.length)];
      while (destination.id === origin.id) {
        destination = cities[Math.floor(Math.random() * cities.length)];
      }

      const cargo = matchingCargo[Math.floor(Math.random() * matchingCargo.length)];
      const route = this.getRouteData(origin.id, destination.id);

      const minWeight = cargo.weightRange ? cargo.weightRange[0] : 14;
      const maxWeight = cargo.weightRange ? cargo.weightRange[1] : 24;
      const weightTons = Math.round((minWeight + Math.random() * (maxWeight - minWeight)) * 10) / 10;

      let minPowerHp = cargo.minPowerHp || 460;
      if (weightTons > 26) minPowerHp = Math.max(minPowerHp, 540);

      let kmRate = cargo.basePricePerKmTon || 0.2;
      kmRate *= 0.65; // ФАЗА 1: Глобальный срез тарифов (-35% маржинальности)

      if (activeSeason && cargo.requiredTrailerType === activeSeason.bonusCargoType) {
        kmRate *= (activeSeason.bonusMultiplier || 1.2);
      }

      const isHomeCity = s.garage && origin.name === s.garage.city;
      if (isHomeCity && s.garage.hasCrossDockTerminal) {
        kmRate *= 1.08;
      }

      if (s.warehouses && s.warehouses.some(w => w.cityName === origin.name)) {
        kmRate *= 1.20;
      }

      const basePay = route.distanceKm * weightTons * kmRate;
      const rep = (s.company && typeof s.company.reputation === "number") ? s.company.reputation : 0;
      const reputationBonus = 1 + (rep / 200);
      const totalPayout = Math.round(basePay * reputationBonus);

      const estimatedDurationMinutes = this.estimateTripDurationMinutes(route.distanceKm, this.TRUCK_CRUISE_SPEED_KMH);
      const lifespan = Math.floor(Math.random() * 180) + 180;

      newBatch.push({
        id: "ord-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 4),
        originCity: origin.name,
        originId: origin.id,
        destinationCity: destination.name,
        destinationId: destination.id,
        cargoId: cargo.id,
        cargoName: cargo.name,
        cargoIcon: cargo.icon || "📦",
        requiredTrailerType: cargo.requiredTrailerType,
        requiredLicense: cargo.requiredLicense,
        weightTons: weightTons,
        minPowerHp: minPowerHp,
        distanceKm: route.distanceKm,
        tollCost: route.tollCost,
        estimatedDurationMinutes: estimatedDurationMinutes,
        payout: totalPayout,
        expiresInMinutes: lifespan,
        initialLifespan: lifespan
      });
    }

    return newBatch;
  },

  tickOrderLifespans() {
    const s = AppState.get();
    if (!s.availableOrders || s.availableOrders.length === 0) return;

    let expiredAny = false;
    const licenses = (typeof CARGO_LICENSES !== "undefined") ? CARGO_LICENSES : [];

    s.availableOrders.forEach(o => {
      if (typeof o.expiresInMinutes === "number") {
        o.expiresInMinutes -= 1;
        if (o.expiresInMinutes <= 0) expiredAny = true;
      }
    });

    if (AppUI.currentTab === "orders") {
      if (!this.selectedLicenseCategory) {
        licenses.forEach(lic => {
          const catOrders = s.availableOrders.filter(o => o.requiredLicense === lic.id && o.expiresInMinutes > 0);
          const minRemaining = catOrders.length > 0 
            ? Math.min(...catOrders.map(o => o.expiresInMinutes))
            : 0;
          const hours = Math.floor(minRemaining / 60);
          const mins = minRemaining % 60;
          const timerEl = document.getElementById(`terminal-timer-${lic.id}`);
          if (timerEl) {
            timerEl.innerText = `⏱ ${hours > 0 ? hours + 'ч ' : ''}${mins}м`;
          }
        });
      } else {
        s.availableOrders.forEach(o => {
          if (o.requiredLicense === this.selectedLicenseCategory) {
            const timerEl = document.getElementById(`order-timer-${o.id}`);
            if (timerEl) {
              const rem = Math.max(0, o.expiresInMinutes);
              const hours = Math.floor(rem / 60);
              const mins = rem % 60;
              timerEl.innerText = `⏱ ${hours > 0 ? hours + 'ч ' : ''}${mins}м`;
            }
          }
        });
      }
    }

    if (expiredAny) {
      s.availableOrders = s.availableOrders.filter(o => o.expiresInMinutes > 0);

      licenses.forEach(lic => {
        const countInCat = s.availableOrders.filter(o => o.requiredLicense === lic.id).length;
        if (countInCat < 4) {
          const needed = 4 - countInCat;
          const fresh = this.generateOrdersForCategory(lic.id, needed);
          s.availableOrders.push(...fresh);
        }
      });

      AppStorage.save(s);
      if (AppUI.currentTab === "orders") {
        this.renderOrdersView(true);
      }
    }
  },

  openCategoryTerminal(licenseId) {
    this.selectedLicenseCategory = licenseId;
    this.renderOrdersView();
  },

  closeCategoryTerminal() {
    this.selectedLicenseCategory = null;
    this.renderOrdersView();
  },

  renderOrdersView(preserveScroll = false) {
    const s = AppState.get();
    const container = document.getElementById("view-orders");
    if (!container) return;

    let savedScroll = 0;
    const scrollParent = container.querySelector(".view-scroll-content") || container;
    if (preserveScroll && scrollParent) {
      savedScroll = scrollParent.scrollTop;
    }

    if (!s.availableOrders || s.availableOrders.length === 0) {
      this.generateAllCategoriesOrders();
    }

    if (this.selectedLicenseCategory) {
      this.renderCategoryOrdersViewHTML(container);
    } else {
      this.renderTerminalsOverviewHTML(container);
    }

    if (preserveScroll && scrollParent) {
      const newScrollParent = container.querySelector(".view-scroll-content") || container;
      if (newScrollParent) newScrollParent.scrollTop = savedScroll;
    }
  },

  renderTerminalsOverviewHTML(container) {
    const s = AppState.get();
    const licenses = (typeof CARGO_LICENSES !== "undefined") ? CARGO_LICENSES : [];
    const ownedLicenses = (s.company && Array.isArray(s.company.licenses)) ? s.company.licenses : ["lic_standard"];

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <div class="orders-filter-bar" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.3px;">Логистические терминалы Европы</h2>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                30 городов сети • Реальный километраж автобанов • Авторотация заказов
              </span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn-glass small" onclick="AppOrders.manualRefreshWithToast()">Запрос диспетчеру</button>
              <button class="btn-glass small primary" onclick="AppUI.switchTab('office_hub'); AppOfficeHub.setSubTab('licenses');">Реестр лицензий</button>
            </div>
          </div>

          <div class="terminals-grid">
            ${licenses.map(lic => {
              const isOwned = ownedLicenses.includes(lic.id);
              const categoryOrders = s.availableOrders.filter(o => o.requiredLicense === lic.id && o.expiresInMinutes > 0);
              
              const minRemaining = categoryOrders.length > 0 
                ? Math.min(...categoryOrders.map(o => o.expiresInMinutes))
                : 120;
              const hours = Math.floor(minRemaining / 60);
              const mins = minRemaining % 60;
              const timerStr = `${hours > 0 ? hours + 'ч ' : ''}${mins}м`;

              return `
                <div class="terminal-card ${isOwned ? 'unlocked' : 'locked'}"
                  ${isOwned ? `onclick="AppOrders.openCategoryTerminal('${lic.id}')"` : ''}>
                  
                  <div class="terminal-top-block">
                    <div class="terminal-title">
                      ${lic.icon}${lic.name}
                    </div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${isOwned ? 'active' : 'locked'}">
                        ${isOwned ? `🟢 ${categoryOrders.length} лота` : '🔒 Закрыто'}
                      </span>
                    </div>
                    <div class="terminal-desc">
                      ${lic.desc}
                    </div>
                  </div>

                  <div class="terminal-bottom-block">
                    <div class="terminal-meta">
                      <span>Тариф: <strong style="color: var(--accent-green);">~€${lic.avgRatePerKmTon.toFixed(2)}</strong></span>${isOwned 
                        ? `<span id="terminal-timer-${lic.id}" style="color: var(--accent-blue); font-weight: 600;">⏱ ${timerStr}</span>` 
                        : `<span style="color: var(--accent-orange);">Нужна лицензия</span>`
                      }
                    </div>

                    ${isOwned ? `
                      <button class="btn-glass primary terminal-action-btn">
                        Открыть контракты (${categoryOrders.length}) ➔
                      </button>
                    ` : `
                      <button class="btn-glass terminal-action-btn" style="color: var(--accent-orange);" 
                        onclick="event.stopPropagation(); AppUI.switchTab('office_hub'); AppOfficeHub.setSubTab('licenses');">
                        Оформить допуск
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderCategoryOrdersViewHTML(container) {
    const s = AppState.get();
    const lic = (typeof CARGO_LICENSES !== "undefined")
      ? (CARGO_LICENSES.find(l => l.id === this.selectedLicenseCategory) || CARGO_LICENSES[0])
      : { id: "lic_standard", name: "Стандарт", icon: "📦", desc: "" };

    const categoryOrders = s.availableOrders.filter(o => o.requiredLicense === lic.id && o.expiresInMinutes > 0);

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <div class="orders-filter-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-glass small" onclick="AppOrders.closeCategoryTerminal()">← Все терминалы</button>
                <h2 style="font-size: 1.15rem; font-weight: 800;">${lic.icon} ${lic.name}</h2>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px; display: block;">
                Свободных рейсов: <strong>${categoryOrders.length}</strong> • Нажмите на карточку для деталей
              </span>
            </div>

            <button class="btn-glass small" onclick="AppOrders.refreshSelectedCategory()">Обновить слоты</button>
          </div>

          ${categoryOrders.length === 0 ? `
            <div class="empty-state-card" style="padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: 4px;">⏳</div>
              <div style="font-weight: 700;">Все рейсы категории распределены</div>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
                Диспетчер подбирает новые грузы по Европе. Они появятся здесь автоматически.
              </p>
              <button class="btn-glass primary small" onclick="AppOrders.refreshSelectedCategory()">Запросить лоты вне очереди</button>
            </div>
          ` : `
            <div class="terminals-grid">
              ${categoryOrders.map(order => this.generateCompactOrderCardHTML(order)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  generateCompactOrderCardHTML(order) {
    const tripDuration = this.formatDuration(order.estimatedDurationMinutes || this.estimateTripDurationMinutes(order.distanceKm));
    const remainingMins = Math.max(0, order.expiresInMinutes || 180);
    const hours = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    const timerLabel = `⏱ ${hours > 0 ? hours + 'ч ' : ''}${mins}м`;

    return `
      <div class="terminal-card unlocked" onclick="AppOrders.openOrderDetailModal('${order.id}')">
        <div class="terminal-top-block">
          <div class="terminal-title" style="font-size: 0.86rem;">
            ${order.originCity} ➔ ${order.destinationCity}
          </div>
          <div class="terminal-badge-row">
            <span class="terminal-badge active">
              ${order.cargoIcon} ${order.cargoName}
            </span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
            Вес: <strong>${order.weightTons} т</strong> • <strong>${order.distanceKm} км</strong>
          </div>
        </div>

        <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
          <div class="terminal-meta" style="font-size: 0.68rem;">
            <span style="color: var(--accent-blue); font-weight: 600;">~${tripDuration} пути</span>
            <span id="order-timer-${order.id}" style="color: var(--text-muted);">${timerLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
            <span style="font-size: 0.68rem; color: var(--text-muted);">Выплата:</span>
            <strong style="color: var(--accent-green); font-size: 0.88rem;">€${order.payout.toLocaleString()}</strong>
          </div>
          <button class="btn-glass primary terminal-action-btn" style="margin-top: 4px;">
            Подробнее ➔
          </button>
        </div>
      </div>
    `;
  },

  openOrderDetailModal(orderId) {
    const s = AppState.get();
    const order = s.availableOrders.find(o => o.id === orderId);
    if (!order) return;

    const fuelPrice = (s.market && s.market.currentDieselPrice) ? s.market.currentDieselPrice : 1.68;
    const avgConsumption = 28.5;
    const fuelEstimatedL = (order.distanceKm / 100) * avgConsumption;
    const fuelCost = Math.round(fuelEstimatedL * fuelPrice);
    const wageCost = Math.round((order.distanceKm / 75) * 22);
    const wearCost = Math.round(order.distanceKm * 0.12);
    const estimatedExpenses = fuelCost + order.tollCost + wageCost + wearCost;
    const netProfit = order.payout - estimatedExpenses;
    const marginPercent = Math.round((netProfit / order.payout) * 100);

    const trailerTypeRu = {
      curtainsider: "Тент",
      refrigerated: "Рефрижератор",
      flatbed: "Платформа"
    };

    const tripDuration = this.formatDuration(order.estimatedDurationMinutes || this.estimateTripDurationMinutes(order.distanceKm));

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">${order.originCity} ➔ ${order.destinationCity}</h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Груз: <strong>${order.cargoIcon} ${order.cargoName} (${order.weightTons} т)</strong>
            </span>
          </div>
          <span class="badge" style="color: var(--accent-green); font-size: 0.95rem; font-weight: 800;">
            €${order.payout.toLocaleString()}
          </span>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Расстояние по автобанам:</td>
            <td><strong>${order.distanceKm} км</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Расчетное время рейса (ETA):</td>
            <td style="color: var(--accent-blue);"><strong>~${tripDuration}</strong> (при 75 км/ч)</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Минимальная тяга мотора:</td>
            <td style="color: var(--accent-orange);"><strong>от ${order.minPowerHp} л.с.</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Требуемый полуприцеп:</td>
            <td style="color: var(--accent-blue); font-weight: 800;">📦 ${trailerTypeRu[order.requiredTrailerType]}</td>
          </tr>
        </table>

        <div class="order-margin-projection">
          <div class="margin-row">
            <span>Топливо (расчет):</span>
            <span>-€${fuelCost}</span>
          </div>
          <div class="margin-row">
            <span>Трассы & Амортизация:</span>
            <span>-€${order.tollCost + wearCost}</span>
          </div>
          <div class="margin-row">
            <span>Зарплата водителя:</span>
            <span>-€${wageCost}</span>
          </div>
          <div class="margin-row highlight">
            <span>Прогнозируемый чистый профит:</span>
            <span>€${netProfit.toLocaleString()} (${marginPercent}%)</span>
          </div>
        </div>

        <button class="btn-glass primary" style="width: 100%;" onclick="AppUI.closeSheet(); setTimeout(() => AppOrders.openAssignFleetModal('${order.id}'), 150);">
          Назначить автопоезд на рейс
        </button>
      </div>
    `;

    AppUI.openSheet("Спецификация логистического заказа", html);
  },

  manualRefreshWithToast() {
    this.generateAllCategoriesOrders();
    this.renderOrdersView(true);
    AppUI.showToast("Диспетчерская служба обновила все направления перевозок!", "success");
  },

  refreshSelectedCategory() {
    if (!this.selectedLicenseCategory) return;
    const s = AppState.get();
    s.availableOrders = s.availableOrders.filter(o => o.requiredLicense !== this.selectedLicenseCategory);
    const fresh = this.generateOrdersForCategory(this.selectedLicenseCategory, 4);
    s.availableOrders.push(...fresh);
    AppStorage.save(s);
    this.renderOrdersView(true);
    AppUI.showToast("Слоты направления обновлены!", "info");
  },

  openAssignFleetModal(orderId) {
    const s = AppState.get();
    const order = s.availableOrders.find(o => o.id === orderId);
    if (!order) return;

    const availableIdleTrucks = (s.trucks || []).filter(t => t.status === "idle");
    const busyTrucksCount = (s.trucks || []).length - availableIdleTrucks.length;

    const tripDurationFormatted = this.formatDuration(order.estimatedDurationMinutes || this.estimateTripDurationMinutes(order.distanceKm));

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3); max-height: 78vh;">
        <div>
          <div style="font-size: 0.95rem; font-weight: 700;">${order.originCity} ➔ ${order.destinationCity}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
            Груз: <strong>${order.cargoName} (${order.weightTons} т)</strong> • Плечо: <strong>${order.distanceKm} км</strong> (~${tripDurationFormatted})
          </div>
        </div>

        ${availableIdleTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-5);">
            <div style="font-size: 2.2rem; margin-bottom: 4px;">🚛</div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;">Нет свободных тягачей в гараже</div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
              ${(s.trucks || []).length === 0 
                ? 'В компании пока нет собственной техники. Приобретите тягач в автосалоне.' 
                : `Все ваши машины (${busyTrucksCount}) сейчас заняты: выполняют рейсы, проходят ТО или заправляются.`
              }
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn-glass small" onclick="AppUI.closeSheet(); AppUI.switchTab('trips');">В рейсы</button>
              <button class="btn-glass primary small" onclick="AppUI.closeSheet(); AppUI.switchTab('market_hub');">В салон</button>
            </div>
          </div>
        ` : `
          <div class="terminals-grid" style="padding-bottom: 10px; overflow-y: auto;">
            ${availableIdleTrucks.map(rawTruck => {
              const truck = (typeof AppTrucks !== "undefined") ? AppTrucks.ensureTruckSpecs(rawTruck) : rawTruck;
              const driver = s.drivers ? s.drivers.find(d => d.id === truck.assignedDriverId) : null;
              const coDriver = truck.coDriverId ? s.drivers.find(d => d.id === truck.coDriverId) : null;
              const trailer = truck.attachedTrailerId ? (s.trailers || []).find(t => t.id === truck.attachedTrailerId) : null;
              
              const currentHp = (typeof AppTrucks !== "undefined") ? AppTrucks.getTruckCurrentPowerHp(truck) : (truck.enginePowerHp || 480);
              const currentPayload = (typeof AppTrucks !== "undefined") ? AppTrucks.getTruckCurrentPayloadTons(truck) : (truck.maxPayloadTons || 24.5);

              const minStaminaThreshold = (s.garage && s.garage.hasDriverLounge) ? 15 : 25;
              const ecoBonus = driver && driver.ecoDrivingSkill ? (driver.ecoDrivingSkill / 100) : 0.05;
              
              let reeferPenalty = 1.0;
              if (trailer && trailer.type === "refrigerated") reeferPenalty = 1.15;

              const effConsumption = truck.avgConsumptionL100 * (1 - ecoBonus) * reeferPenalty;
              const fuelNeeded = Math.round((order.distanceKm / 100) * effConsumption);
              const fuelCurrent = Math.round(truck.fuelCurrentL || 0);
              const isFuelCompletelyEmpty = fuelCurrent < 15;
              const isFuelShort = fuelCurrent < fuelNeeded;

              const hasDriver = !!driver;
              const isRested = hasDriver && (driver.stamina >= minStaminaThreshold || (coDriver && coDriver.stamina >= minStaminaThreshold));
              const hasPower = currentHp >= order.minPowerHp;
              const hasCapacity = currentPayload >= order.weightTons;
              const hasTrailer = !!trailer;
              const isTrailerMatch = hasTrailer && trailer.type === order.requiredTrailerType;

              const canDispatch = hasDriver && isRested && hasPower && hasCapacity && !isFuelCompletelyEmpty && hasTrailer && isTrailerMatch;

              let reason = "";
              if (!hasDriver) reason = "Без водителя";
              else if (!isRested) reason = `Экипаж истощен (<${minStaminaThreshold}%)`;
              else if (isFuelCompletelyEmpty) reason = "Пустой бак (<15 л)";
              else if (!hasCapacity) reason = `Шасси мало (${currentPayload}т < ${order.weightTons}т)`;
              else if (!hasPower) reason = `Слабый мотор (${currentHp} < ${order.minPowerHp} л.с.)`;
              else if (!hasTrailer) reason = "Нет прицепа (Только голова)";
              else if (!isTrailerMatch) reason = `Не тот прицеп (Нужен ${order.requiredTrailerType})`;

              // ОПРЕДЕЛЕНИЕ СТИЛЯ ДЛЯ НАЗВАНИЯ ПРИЦЕПА (как в карточке флота)
              const trailerHtml = trailer 
                ? `<span style="color: var(--text-primary); font-weight: 600;">${trailer.icon} ${trailer.model}</span>` 
                : '<span style="color: var(--accent-orange);">⚠️ Прицеп не выбран (Стоит на базе)</span>';

              return `
                <div class="terminal-card unlocked" style="cursor: default; padding: 10px 11px;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.86rem; display: flex; justify-content: space-between;">
                      <span>${truck.model}</span>
                      ${coDriver ? '<span style="color: var(--accent-blue);" title="Парный экипаж">👥</span>' : ''}
                    </div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${canDispatch ? 'active' : 'locked'}">
                        ${canDispatch ? 'Готов к выезду' : reason}
                      </span>
                    </div>

                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin: 4px 0 2px 0;">
                      ⚡ <strong>${currentHp} л.с.</strong> • ⛽ Бак: <strong style="color: ${isFuelCompletelyEmpty ? 'var(--accent-red)' : (isFuelShort ? 'var(--accent-orange)' : 'var(--accent-green)')};">${fuelCurrent} л</strong>
                    </div>

                    <!-- Красивый блок информации о прицепе (как в информации о рейсе и флоте) -->
                    <div style="font-size: 0.7rem; color: var(--text-primary); margin: 4px 0; border-top: 1px dashed var(--glass-border); border-bottom: 1px dashed var(--glass-border); padding: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      Сцепка: ${trailerHtml}
                    </div>

                    <div style="font-size: 0.7rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${driver 
                        ? `<span style="color: var(--accent-blue); font-weight: 600;">👨‍✈️ ${driver.name.split(' ')[0]} (${Math.round(driver.stamina)}%)</span>` 
                        : '<span style="color: var(--accent-orange);">Водитель не назначен</span>'
                      }
                    </div>
                  </div>

                  <div class="terminal-bottom-block" style="padding-top: 5px; margin-top: 6px;">
                    <button class="btn-glass primary terminal-action-btn" 
                      ${!canDispatch ? 'disabled' : ''} 
                      onclick="AppOrders.dispatchTrip('${order.id}', '${truck.id}')">
                      ${canDispatch ? 'Оформить путевой лист ➔' : 'Ограничение'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    AppUI.openSheet("Выбор автопоезда на рейс", html);
  },

  dispatchTrip(orderId, truckId) {
    const s = AppState.get();
    const orderIndex = s.availableOrders.findIndex(o => o.id === orderId);
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (orderIndex === -1 || !rawTruck) return;

    const truck = (typeof AppTrucks !== "undefined") ? AppTrucks.ensureTruckSpecs(rawTruck) : rawTruck;
    const order = s.availableOrders[orderIndex];
    const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
    const trailer = (s.trailers || []).find(tr => tr.id === truck.attachedTrailerId);

    if (!driver || !trailer) return;
    if (trailer.type !== order.requiredTrailerType) return;
    if (truck.fuelCurrentL < 15) return;

    const currentHp = (typeof AppTrucks !== "undefined") ? AppTrucks.getTruckCurrentPowerHp(truck) : (truck.enginePowerHp || 480);
    const currentPayload = (typeof AppTrucks !== "undefined") ? AppTrucks.getTrustCurrentPayloadTons ? AppTrucks.getTruckCurrentPayloadTons(truck) : (truck.maxPayloadTons || 24.5) : (truck.maxPayloadTons || 24.5);

    if (currentPayload < order.weightTons || currentHp < order.minPowerHp) return;

    const hpToWeightRatio = currentHp / (order.weightTons + 14);
    let truckSpeedKmh = 75;
    if (hpToWeightRatio > 16) truckSpeedKmh = 80;
    else if (hpToWeightRatio < 12) truckSpeedKmh = 70;

    const totalDistance = order.distanceKm;
    const initialEstimatedMinutes = Math.round((totalDistance / truckSpeedKmh) * 60);

    const newTrip = {
      id: "trp-" + Date.now().toString(36),
      orderId: order.id,
      contractId: order.contractId || null,
      originCity: order.originCity,
      destinationCity: order.destinationCity,
      cargoName: order.cargoName,
      cargoIcon: order.cargoIcon || "📦",
      weightTons: order.weightTons,
      totalDistanceKm: totalDistance,
      remainingDistanceKm: totalDistance,
      tollCost: order.tollCost,
      payout: order.payout,
      truckId: truck.id,
      trailerId: trailer.id,
      driverId: truck.assignedDriverId,
      coDriverId: truck.coDriverId || null,
      truckSpeedKmh: truckSpeedKmh,
      estimatedMinutesRemaining: initialEstimatedMinutes,
      status: "active",
      refuelStopRemainingMinutes: 0,
      progressPercent: 0
    };

    truck.status = "trip";
    trailer.status = "trip";
    driver.status = "driving";
    if (truck.coDriverId) {
      const coDrv = s.drivers.find(d => d.id === truck.coDriverId);
      if (coDrv) coDrv.status = "driving";
    }

    s.trips.push(newTrip);
    s.availableOrders.splice(orderIndex, 1);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    
    if (typeof AppGarage !== "undefined" && AppUI.currentTab === "garage_hub") {
      AppGarage.renderGarageView();
    }
    this.renderOrdersView(true);

    AppUI.showToast(`Автопоезд ${truck.model} выехал в ${order.destinationCity} (ETA: ~${this.formatDuration(initialEstimatedMinutes)})!`, "success");
  }
};