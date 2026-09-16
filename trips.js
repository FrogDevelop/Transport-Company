const AppTrips = {
  AVERAGE_SPEED_KM_PER_HOUR: 80,
  EVENT_CHANCE_PER_TICK: 0.008,

  init() { this.renderTripsView(); },

  tick() {
    const s = AppState.get();
    if (!s.trips || s.trips.length === 0) return;

    const kmPerMinute = this.AVERAGE_SPEED_KM_PER_HOUR / 60;
    let anyCompleted = false;

    for (let i = s.trips.length - 1; i >= 0; i--) {
      const trip = s.trips[i];
      if (trip.status !== "active") continue;

      const truck = s.trucks.find(t => t.id === trip.truckId);
      const driver = s.drivers.find(d => d.id === trip.driverId);
      if (!truck || !driver) continue;

      // Продвижение по маршруту
      trip.remainingDistanceKm = Math.max(0, trip.remainingDistanceKm - kmPerMinute);
      const coveredKm = trip.totalDistanceKm - trip.remainingDistanceKm;
      trip.progressPercent = Math.min(100, Math.round((coveredKm / trip.totalDistanceKm) * 100));

      // Расход топлива / энергии
      const ecoDiscount = (driver.ecoDrivingSkill || 0) / 100;
      const effectiveConsumption = truck.avgConsumptionL100 * (1 - ecoDiscount);
      const fuelUsed = (kmPerMinute / 100) * effectiveConsumption;
      truck.fuelCurrentL = Math.max(0, Math.round((truck.fuelCurrentL - fuelUsed) * 10) / 10);

      const fuelPrice = truck.engineType === "electric" ? 0.38 : ((s.market && s.market.currentDieselPrice) || 1.68);
      if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
      truck.tco.totalFuelCost += fuelUsed * fuelPrice;

      // Автодозаправка при остатке меньше 25 единиц
      if (truck.fuelCurrentL <= 25) {
        const refuel = truck.fuelTankL - truck.fuelCurrentL;
        const refuelCost = Math.round(refuel * fuelPrice);
        truck.fuelCurrentL = truck.fuelTankL;
        s.finances.balance -= refuelCost;
        s.finances.todayExpenses += refuelCost;
        truck.tco.totalFuelCost += refuelCost;
        trip.lastEventMessage = `⛽ Дозаправка на трассе: +${Math.round(refuel)} ед. (-€${refuelCost})`;
      }

      // Усталость водителя и износ машины
      driver.stamina = Math.max(0, driver.stamina - (100 / 540));
      AppTrucks.applyWear(truck.id, kmPerMinute);

      // Дорожные происшествия
      if (Math.random() < this.EVENT_CHANCE_PER_TICK && !trip.currentEvent) {
        this.triggerRoadEvent(trip, truck, driver);
      }

      // Проверка прибытия в пункт назначения
      if (trip.remainingDistanceKm <= 0) {
        anyCompleted = true;
        this.completeTrip(trip, truck, driver, i);
      }
    }

    // Синхронизация интерфейсов
    if (anyCompleted) {
      if (AppUI.currentTab === "trips") this.renderTripsView();
      if (AppUI.currentTab === "dashboard") AppUI.renderDashboard();
    } else {
      if (AppUI.currentTab === "trips") this.updateTripWidgetsDOM();
      if (AppUI.currentTab === "dashboard") AppUI.renderDashboard();
    }
  },

  updateTripWidgetsDOM() {
    const s = AppState.get();

    // Если все рейсы завершились, перерисовываем экран в пустое состояние
    if (!s.trips || s.trips.length === 0) {
      this.renderTripsView();
      return;
    }

    s.trips.forEach(trip => {
      const truck = s.trucks.find(t => t.id === trip.truckId);
      const driver = s.drivers.find(d => d.id === trip.driverId);
      const remKm = Math.round(trip.remainingDistanceKm);
      const estMinutesRemaining = Math.round((remKm / this.AVERAGE_SPEED_KM_PER_HOUR) * 60);
      const estHours = Math.floor(estMinutesRemaining / 60);
      const estMins = estMinutesRemaining % 60;

      // Плавное обновление полосы прогресса без сброса скролла
      const bar = document.getElementById(`trip-bar-${trip.id}`);
      if (bar) bar.style.width = `${trip.progressPercent}%`;

      const label = document.getElementById(`trip-label-${trip.id}`);
      if (label) {
        label.innerText = `Прогресс: ${trip.progressPercent}% | Осталось: ${remKm} км (~${estHours}ч ${estMins}м)`;
      }

      // Обновление полоски телеметрии
      const fuelEl = document.getElementById(`trip-fuel-${trip.id}`);
      if (fuelEl && truck) {
        fuelEl.innerText = `${Math.round(truck.fuelCurrentL)} ${truck.engineType === 'electric' ? 'кВт' : 'л'}`;
      }

      const staminaEl = document.getElementById(`trip-stamina-${trip.id}`);
      if (staminaEl && driver) {
        staminaEl.innerText = `${Math.round(driver.stamina)}%`;
      }

      const eventBanner = document.getElementById(`trip-event-${trip.id}`);
      if (eventBanner && trip.lastEventMessage) {
        eventBanner.style.display = "flex";
        eventBanner.innerText = trip.lastEventMessage;
      }
    });
  },

  renderTripsView() {
    const s = AppState.get();
    const container = document.getElementById("view-trips");
    if (!container) return;

    const activeTrips = s.trips || [];

    container.innerHTML = `
      <div class="view-scroll-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Мониторинг рейсов (GPS)</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Активно на европейских трассах: ${activeTrips.length} ед.</span>
          </div>
        </div>

        ${activeTrips.length === 0 ? `
          <div class="glass-card empty-state-card">
            <div class="empty-icon">🗺️</div>
            <div class="empty-title">Все тягачи на стоянке</div>
            <p class="empty-desc">В настоящий момент нет рейсов в пути. Заключите контракт на бирже заказов.</p>
            <button class="btn-glass primary small" onclick="AppUI.switchTab('orders')">Открыть биржу</button>
          </div>
        ` : `
          <div class="trips-grid">
            ${activeTrips.map(trip => this.generateTripCardHTML(trip)).join('')}
          </div>
        `}
      </div>
    `;
  },

  generateTripCardHTML(trip) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === trip.truckId);
    const driver = s.drivers.find(d => d.id === trip.driverId);

    const remainingKm = Math.round(trip.remainingDistanceKm);
    const estMinutesRemaining = Math.round((remainingKm / this.AVERAGE_SPEED_KM_PER_HOUR) * 60);
    const estHours = Math.floor(estMinutesRemaining / 60);
    const estMins = estMinutesRemaining % 60;
    const isElectric = truck && truck.engineType === "electric";

    return `
      <div class="glass-card trip-live-card" id="trip-card-${trip.id}">
        <div class="trip-card-top">
          <div class="trip-title-group">
            <div class="trip-route-cities">
              <span>${trip.originCity}</span>
              <span style="color: var(--accent-blue);">➔</span>
              <span>${trip.destinationCity}</span>
            </div>
            <span class="trip-details-sub">
              ${trip.cargoName} (${trip.weightTons} т) | ${truck ? truck.model : 'Тягач'}
            </span>
          </div>
          <div class="trip-telemetry-badge">
            <div class="pulse-dot"></div>
            <span>В пути</span>
          </div>
        </div>

        <div class="trip-progress-box">
          <div class="trip-progress-labels">
            <span id="trip-label-${trip.id}">Прогресс: ${trip.progressPercent}% | Осталось: ${remainingKm} км (~${estHours}ч ${estMins}м)</span>
          </div>
          <div class="trip-progress-track">
            <div class="trip-progress-fill" id="trip-bar-${trip.id}" style="width: ${trip.progressPercent}%"></div>
          </div>
        </div>

        <div class="trip-stats-strip">
          <div class="trip-stat-cell">
            <span class="trip-stat-label">Водитель</span>
            <span class="trip-stat-val">${driver ? driver.name.split(' ')[0] : 'Шофер'}</span>
          </div>
          <div class="trip-stat-cell">
            <span class="trip-stat-label">${isElectric ? 'Батарея' : 'Бак'}</span>
            <span class="trip-stat-val" id="trip-fuel-${trip.id}">${truck ? Math.round(truck.fuelCurrentL) : 0} ${isElectric ? 'кВт' : 'л'}</span>
          </div>
          <div class="trip-stat-cell">
            <span class="trip-stat-label">Бодрость</span>
            <span class="trip-stat-val" id="trip-stamina-${trip.id}">${driver ? Math.round(driver.stamina) : 100}%</span>
          </div>
          <div class="trip-stat-cell">
            <span class="trip-stat-label">Гонорар</span>
            <span class="trip-stat-val" style="color: var(--accent-green);">€${trip.payout.toLocaleString()}</span>
          </div>
        </div>

        <div class="trip-event-banner" id="trip-event-${trip.id}" style="display: ${trip.lastEventMessage ? 'flex' : 'none'};">
          <span>${trip.lastEventMessage || ''}</span>
        </div>
      </div>
    `;
  },

  triggerRoadEvent(trip, truck, driver) {
    const s = AppState.get();
    const event = ROAD_EVENTS[Math.floor(Math.random() * ROAD_EVENTS.length)];
    trip.currentEvent = event;
    trip.lastEventMessage = `${event.icon} ${event.title}: ${event.description}`;

    if (event.costPenalty > 0) {
      s.finances.balance -= event.costPenalty;
      s.finances.todayExpenses += event.costPenalty;
    }
    if (event.bonusCash > 0) {
      s.finances.balance += event.bonusCash;
      s.finances.todayRevenue += event.bonusCash;
    }
    if (event.reputationGain) {
      s.company.reputation = Math.min(100, s.company.reputation + event.reputationGain);
    }
    if (event.targetComponent && truck.components[event.targetComponent] !== undefined) {
      truck.components[event.targetComponent] = Math.max(0, truck.components[event.targetComponent] - event.wearDamage);
    }
    if (event.delayKmEquivalent) {
      trip.remainingDistanceKm += event.delayKmEquivalent;
    }
    AppStorage.save(s);
  },

  completeTrip(trip, truck, driver, tripIndex) {
    const s = AppState.get();
    const revenue = trip.payout;
    const tollFees = trip.tollCost;
    
    // Финансовые начисления
    s.finances.balance += (revenue - tollFees);
    s.finances.todayRevenue += revenue;
    s.finances.totalEarned += revenue;
    s.finances.todayExpenses += tollFees;
    s.finances.dailyNet = s.finances.todayRevenue - s.finances.todayExpenses;

    // Статистика
    if (!s.statistics) s.statistics = { totalDistanceDrivenKm: 0, totalCargoHauledTons: 0, completedTripsCount: 0 };
    s.statistics.completedTripsCount += 1;
    s.statistics.totalDistanceDrivenKm += Math.round(trip.totalDistanceKm);
    s.statistics.totalCargoHauledTons += (trip.weightTons || 18);

    // TCO тягача и репутация компании
    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalRevenueGenerated += revenue;
    s.company.reputation = Math.min(100, s.company.reputation + 1);

    // Проверка контрактов и ачивок
    if (trip.contractId && typeof AppContracts !== "undefined") {
      AppContracts.onContractTripCompleted(trip.contractId);
    }
    if (typeof AppAnalytics !== "undefined") {
      AppAnalytics.checkAchievements();
    }

    // Возврат машины и водителя в гараж
    truck.status = "idle";
    driver.status = "rest";
    driver.stamina = 100;

    // Удаление завершенного рейса
    s.trips.splice(tripIndex, 1);
    AppStorage.save(s);

    // Всплывающее модальное окно отчета о завершении рейса
    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4); text-align: center;">
        <div style="font-size: 2.8rem;">🎉</div>
        <h3 style="font-size: 1.25rem; font-weight: 700;">Рейс успешно завершен!</h3>
        <p style="font-size: 0.82rem; color: var(--text-secondary);">
          Груз <strong>«${trip.cargoName}»</strong> благополучно доставлен по маршруту <strong>${trip.originCity} ➔ ${trip.destinationCity}</strong>.
        </p>
        <div class="glass-subgroup" style="padding: 14px; border-radius: var(--radius-md); text-align: left; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Выручка от заказчика:</span>
            <strong style="color: var(--accent-green);">+€${revenue.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Дорожные сборы (Toll):</span>
            <strong style="color: var(--accent-orange);">-€${tollFees}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Чистый доход рейса:</span>
            <strong style="color: var(--accent-green);">+€${(revenue - tollFees).toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--glass-border); padding-top: 6px;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Прирост репутации:</span>
            <strong style="color: var(--accent-blue);">★ +1 балл</strong>
          </div>
        </div>
        <button class="btn-glass primary" onclick="AppUI.closeSheet(); AppUI.switchTab('dashboard');">Принять отчет</button>
      </div>
    `;
    AppUI.openSheet("Доставка груза завершена", modalHtml);

    // Принудительное обновление всех данных
    AppUI.renderAll();
  }
};