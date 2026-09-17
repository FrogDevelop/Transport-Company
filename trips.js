const AppTrips = {
  currentModalTripId: null,

  init() { this.renderTripsView(); },

  formatMinutesToHM(minutes) {
    const totalM = Math.max(0, Math.round(minutes));
    const h = Math.floor(totalM / 60);
    const m = totalM % 60;
    if (h === 0 && m === 0) return "Прибывает";
    return `${h > 0 ? h + 'ч ' : ''}${m}м`;
  },

  tick() {
    const s = AppState.get();
    if (!s.trips || s.trips.length === 0) return;

    let anyFinished = false;

    s.trips.forEach(trip => {
      if (trip.status !== "active" && trip.status !== "refueling_stop") return;

      const truck = s.trucks.find(t => t.id === trip.truckId);
      const driver = s.drivers.find(d => d.id === trip.driverId);
      if (!truck || !driver) return;

      // 1. Остановка на дозаправку на АЗС
      if (trip.status === "refueling_stop") {
        trip.refuelStopRemainingMinutes = Math.max(0, (trip.refuelStopRemainingMinutes || 0) - 1);

        if (trip.refuelStopRemainingMinutes <= 0) {
          trip.status = "active";
          AppUI.showToast(`⛽ Тягач ${truck.model} закончил дозаправку на АЗС и продолжил путь в ${trip.destinationCity}!`, "info");
        }

        this.updateLiveTripDOM(trip, truck, driver);
        return;
      }

      // 2. Движение автопоезда
      let speedKmh = trip.truckSpeedKmh || 75;
      if (s.garage && s.garage.hasTelematicsCenter) {
        speedKmh *= 1.15;
      }

      const kmPerMinute = speedKmh / 60;
      const actualKm = Math.min(trip.remainingDistanceKm, kmPerMinute);

      trip.remainingDistanceKm = Math.max(0, trip.remainingDistanceKm - actualKm);
      trip.progressPercent = Math.min(100, Math.round(((trip.totalDistanceKm - trip.remainingDistanceKm) / trip.totalDistanceKm) * 100));

      const remainingMinutes = (trip.remainingDistanceKm / speedKmh) * 60;
      trip.estimatedMinutesRemaining = Math.round(remainingMinutes);

      // Расход топлива
      const ecoBonus = driver.ecoDrivingSkill ? (driver.ecoDrivingSkill / 100) : 0.05;
      const effectiveConsumption = truck.avgConsumptionL100 * (1 - ecoBonus);
      const fuelBurned = (actualKm / 100) * effectiveConsumption;
      truck.fuelCurrentL = Math.max(0, truck.fuelCurrentL - fuelBurned);

      driver.stamina = Math.max(0, driver.stamina - (actualKm * 0.035));

      // Адекватный базовый износ узлов за пройденные км
      const wearDiscount = (s.garage && s.garage.hasClimateHangar) ? 0.85 : 1.0;
      this.applySmoothTripWear(truck, actualKm * wearDiscount);

      // 3. ДОРОЖНЫЕ НЕПРЕДВИДЕННЫЕ СИТУАЦИИ (Только для спотовых обычных рейсов)
      const isSpecialTrip = !!trip.contractId || (trip.cargoName && trip.cargoName.includes("FTL"));
      if (!isSpecialTrip && !trip.eventTriggered && trip.progressPercent >= 35 && trip.progressPercent <= 70) {
        if (Math.random() < 0.015) {
          this.triggerRandomRoadEvent(trip, truck, driver);
        }
      }

      // 4. Проверка экстренной нехватки дизеля
      if (truck.fuelCurrentL <= 15 && trip.remainingDistanceKm > 10) {
        this.triggerHighwayRefuelStop(trip, truck);
      }

      this.updateLiveTripDOM(trip, truck, driver);

      // Финиш маршрута
      if (trip.remainingDistanceKm <= 0 && trip.status === "active") {
        trip.status = "completed";
        anyFinished = true;
        this.finishTrip(trip, truck, driver);
      }
    });

    if (anyFinished) {
      s.trips = s.trips.filter(t => t.status !== "completed");
      AppStorage.save(s);
      AppUI.renderAll();
      if (AppUI.currentTab === "trips") {
        this.renderTripsView();
      }
    }
  },

  applySmoothTripWear(truck, kmDriven) {
    if (!truck.components) return;
    const factor = kmDriven / 1000;

    truck.components.tires = Math.max(0, Math.round((truck.components.tires - (factor * 0.75)) * 10) / 10);
    truck.components.brakes = Math.max(0, Math.round((truck.components.brakes - (factor * 0.65)) * 10) / 10);
    truck.components.suspension = Math.max(0, Math.round((truck.components.suspension - (factor * 0.45)) * 10) / 10);
    truck.components.engine = Math.max(0, Math.round((truck.components.engine - (factor * 0.25)) * 10) / 10);
    truck.components.transmission = Math.max(0, Math.round((truck.components.transmission - (factor * 0.22)) * 10) / 10);
    truck.components.cooling = Math.max(0, Math.round((truck.components.cooling - (factor * 0.20)) * 10) / 10);
    truck.components.electronics = Math.max(0, Math.round((truck.components.electronics - (factor * 0.18)) * 10) / 10);

    truck.mileageKm = (truck.mileageKm || 0) + Math.round(kmDriven);
  },

  triggerRandomRoadEvent(trip, truck, driver) {
    if (typeof TRIP_RANDOM_EVENTS === "undefined" || TRIP_RANDOM_EVENTS.length === 0) return;

    trip.eventTriggered = true;
    const evt = TRIP_RANDOM_EVENTS[Math.floor(Math.random() * TRIP_RANDOM_EVENTS.length)];
    
    // Сохраняем объект события в рейсе для отображения в UI
    trip.activeEvent = {
      title: evt.title,
      icon: evt.icon,
      type: evt.type,
      desc: evt.desc,
      timeDeltaMinutes: evt.timeDeltaMinutes || 0,
      payoutModPercent: evt.payoutModPercent || 0
    };
    trip.lastEventTitle = evt.title;

    // Влияние на выплату
    if (evt.payoutModPercent) {
      const deltaPayout = Math.round(trip.payout * evt.payoutModPercent);
      trip.payout = Math.max(500, trip.payout + deltaPayout);
    }

    // Влияние на время рейса
    if (evt.timeDeltaMinutes) {
      trip.estimatedMinutesRemaining = Math.max(5, trip.estimatedMinutesRemaining + evt.timeDeltaMinutes);
    }

    // Влияние на износ узлов тягача
    if (evt.damage && truck.components) {
      Object.keys(evt.damage).forEach(compKey => {
        if (typeof truck.components[compKey] === "number") {
          truck.components[compKey] = Math.max(0, Math.round((truck.components[compKey] - evt.damage[compKey]) * 10) / 10);
        }
      });
    }

    let toastType = "info";
    if (evt.type === "positive") toastType = "success";
    else if (evt.type === "breakdown" || evt.type === "penalty") toastType = "warning";

    AppUI.showToast(`${evt.icon} Рейс ${trip.destinationCity}: «${evt.title}». ${evt.desc}`, toastType, 4500);

    // Мгновенно обновляем бейдж на карточке, если открыт экран рейсов
    const badgeContainer = document.getElementById(`trip-event-tag-${trip.id}`);
    if (badgeContainer) {
      badgeContainer.style.display = "block";
      badgeContainer.innerHTML = `${evt.icon} ${evt.title}`;
    }
  },

  triggerHighwayRefuelStop(trip, truck) {
    const s = AppState.get();
    const neededLiters = Math.max(0, truck.fuelTankL - truck.fuelCurrentL);
    const dieselPrice = (s.market && s.market.currentDieselPrice) ? s.market.currentDieselPrice : 1.68;
    const refuelCost = Math.round(neededLiters * dieselPrice);

    s.finances.balance -= refuelCost;
    s.finances.todayExpenses += refuelCost;
    s.finances.totalSpent += refuelCost;

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalFuelCost += refuelCost;

    truck.fuelCurrentL = truck.fuelTankL;

    trip.status = "refueling_stop";
    trip.refuelStopRemainingMinutes = 20;

    AppStorage.save(s);
    AppUI.renderTimeAndBalance();

    AppUI.showToast(`⛽ Автопоезд ${truck.model} заехал на АЗС по маршруту! Залито ${neededLiters} л (-€${refuelCost.toLocaleString()}). Пит-стоп ~20 мин.`, "warning", 5000);
  },

  updateLiveTripDOM(trip, truck, driver) {
    const isRefuelStop = trip.status === "refueling_stop";
    const etaFormatted = isRefuelStop 
      ? `⛽ АЗС (${trip.refuelStopRemainingMinutes}м)` 
      : `⏱ ${this.formatMinutesToHM(trip.estimatedMinutesRemaining)}`;

    if (AppUI.currentTab === "trips") {
      const fillEl = document.getElementById(`trip-fill-${trip.id}`);
      const etaEl = document.getElementById(`trip-eta-${trip.id}`);
      const kmEl = document.getElementById(`trip-km-${trip.id}`);
      const percentEl = document.getElementById(`trip-percent-${trip.id}`);

      if (fillEl) fillEl.style.width = `${trip.progressPercent}%`;
      if (etaEl) {
        etaEl.innerText = etaFormatted;
        etaEl.className = `terminal-badge ${isRefuelStop ? 'locked' : 'active'}`;
      }
      if (kmEl) kmEl.innerText = `${Math.round(trip.remainingDistanceKm)} км`;
      if (percentEl) percentEl.innerText = `${trip.progressPercent}%`;
    }

    if (this.currentModalTripId === trip.id) {
      const modalFill = document.getElementById("trip-modal-progress-fill");
      const modalEta = document.getElementById("trip-modal-eta");
      const modalPercent = document.getElementById("trip-modal-percent");
      const modalKm = document.getElementById("trip-modal-km");
      const modalFuel = document.getElementById("trip-modal-fuel");
      const modalStamina = document.getElementById("trip-modal-stamina");
      const modalPayout = document.getElementById("trip-modal-payout");
      const modalStatusBanner = document.getElementById("trip-modal-status-banner");
      const modalEventBanner = document.getElementById("trip-modal-event-banner");

      if (modalFill) modalFill.style.width = `${trip.progressPercent}%`;
      if (modalEta) modalEta.innerText = isRefuelStop ? `На АЗС (ост. ${trip.refuelStopRemainingMinutes}м)` : this.formatMinutesToHM(trip.estimatedMinutesRemaining);
      if (modalPercent) modalPercent.innerText = `${trip.progressPercent}%`;
      if (modalKm) modalKm.innerText = `${Math.round(trip.remainingDistanceKm)} км`;
      if (modalFuel) {
        const isElectric = truck.engineType === "electric";
        modalFuel.innerText = `${Math.round(truck.fuelCurrentL)} / ${truck.fuelTankL} ${isElectric ? 'кВт⋅ч' : 'л'}`;
      }
      if (modalStamina) {
        modalStamina.innerText = `${Math.round(driver.stamina)}%`;
      }
      if (modalPayout) {
        modalPayout.innerText = `€${trip.payout.toLocaleString()}`;
      }
      if (modalStatusBanner) {
        modalStatusBanner.style.display = isRefuelStop ? "block" : "none";
      }
      if (modalEventBanner && trip.activeEvent) {
        modalEventBanner.style.display = "block";
      }
    }
  },

  finishTrip(trip, truck, driver) {
    const s = AppState.get();

    truck.status = "idle";
    driver.status = "rest";

    if (this.currentModalTripId === trip.id) {
      this.currentModalTripId = null;
      AppUI.closeSheet();
    }

    s.finances.balance += trip.payout;
    s.finances.todayRevenue += trip.payout;
    s.finances.totalEarned += trip.payout;

    const distBonus = (trip.totalDistanceKm / 100) * 1.5;
    const weightBonus = (trip.weightTons || 20) * 0.4;
    const earnedXP = Math.round(20 + distBonus + weightBonus);

    if (typeof s.company.xp !== "number") s.company.xp = 0;
    if (typeof s.company.level !== "number") s.company.level = 1;

    s.company.xp += earnedXP;
    this.checkOfficeLevelUp(s);

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalRevenueGenerated += trip.payout;
    truck.tco.totalKmDriven += Math.round(trip.totalDistanceKm);

    s.company.reputation = Math.min(100, s.company.reputation + 1);

    s.statistics.completedTripsCount += 1;
    s.statistics.totalDistanceDrivenKm += Math.round(trip.totalDistanceKm);
    s.statistics.totalCargoHauledTons += Math.round(trip.weightTons);

    if (!s.unlockedAchievements.includes("first-trip")) {
      s.unlockedAchievements.push("first-trip");
      s.finances.balance += 5000;
      AppUI.showToast("🏆 Достижение: «Первый километр» (+€5 000)!", "success");
    }

    // Прогресс B2B контрактов
    if (trip.contractId) {
      const cntIndex = (s.activeContracts || []).findIndex(c => c.id === trip.contractId);
      if (cntIndex !== -1) {
        const cnt = s.activeContracts[cntIndex];
        cnt.deliveredVolumeTons = Math.min(cnt.totalVolumeTons, cnt.deliveredVolumeTons + trip.weightTons);

        if (cnt.deliveredVolumeTons >= cnt.totalVolumeTons) {
          const isEarly = cnt.daysRemaining >= Math.ceil(cnt.totalDays / 2);
          const speedBonus = isEarly ? Math.round(cnt.completionBonus * 0.25) : 0;
          const totalBonus = cnt.completionBonus + speedBonus;
          const repEarned = isEarly ? 6 : 4;

          s.finances.balance += totalBonus;
          s.finances.todayRevenue += totalBonus;
          s.finances.totalEarned += totalBonus;
          s.company.reputation = Math.min(100, s.company.reputation + repEarned);

          const earlyMsg = isEarly ? ` Включая бонус за оперативность: +€${speedBonus.toLocaleString()}!` : "";
          AppUI.showToast(`🎉 Контракт с «${cnt.clientName}» закрыт! Премия: +€${totalBonus.toLocaleString()} (+${repEarned} к репутации).${earlyMsg}`, "success", 7000);

          s.activeContracts.splice(cntIndex, 1);
        } else {
          AppUI.showToast(`Контрактная поставка для «${cnt.clientName}» завершена (+${trip.weightTons} т). До выполнения: ${Math.round(cnt.totalVolumeTons - cnt.deliveredVolumeTons)} т.`, "info");
        }
      }
    } else {
      const eventNotice = trip.lastEventTitle ? ` (событие: «${trip.lastEventTitle}»)` : "";
      AppUI.showToast(`Рейс ${trip.originCity} ➔ ${trip.destinationCity} завершен! Выручка: +€${trip.payout.toLocaleString()}${eventNotice} | +${earnedXP} XP`, "success");
    }
  },

  checkOfficeLevelUp(s) {
    if (typeof AppOfficeHub === "undefined") return;

    const levels = AppOfficeHub.OFFICE_LEVELS;
    const currentLevel = s.company.level || 1;
    const nextLevelSpec = levels.find(l => l.level === currentLevel + 1);

    if (nextLevelSpec && s.company.xp >= nextLevelSpec.xpRequired) {
      s.company.level = nextLevelSpec.level;
      s.company.rank = nextLevelSpec.rankTitle;

      const levelBonusCash = nextLevelSpec.level * 15000;
      s.finances.balance += levelBonusCash;

      AppUI.showToast(`🎉 Главный офис повышен до Уровня ${nextLevelSpec.level} («${nextLevelSpec.title}»)! Премия: +€${levelBonusCash.toLocaleString()}`, "success", 6000);
    }
  },

  renderTripsView() {
    const s = AppState.get();
    const container = document.getElementById("view-trips");
    if (!container) return;

    const activeTrips = s.trips || [];

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <div class="market-header-bar" style="margin-bottom: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.3px;">Мониторинг автопарка (GPS Live)</h2>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                Автопоезда на автобанах Европы • Нажмите на карточку для деталей
              </span>
            </div>
            <span class="badge" style="color: var(--accent-blue);">В пути: ${activeTrips.length}</span>
          </div>

          ${activeTrips.length === 0 ? `
            <div class="empty-state-card" style="padding: var(--space-6);">
              <div style="font-size: 2.2rem; margin-bottom: 6px;">🛣️</div>
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">На европейских трассах нет ваших машин</div>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
                Все свободные тягачи находятся на базе. Подберите коммерческий рейс на бирже заказов.
              </p>
              <button class="btn-glass primary small" onclick="AppUI.switchTab('orders')">Открыть биржу заказов</button>
            </div>
          ` : `
            <div class="terminals-grid">
              ${activeTrips.map(trip => this.generateCompactTripCardHTML(trip)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  generateCompactTripCardHTML(trip) {
    const s = AppState.get();
    const drv = s.drivers.find(d => d.id === trip.driverId);
    const isRefuelStop = trip.status === "refueling_stop";
    const etaFormatted = isRefuelStop ? `⛽ АЗС (${trip.refuelStopRemainingMinutes}м)` : `⏱ ${this.formatMinutesToHM(trip.estimatedMinutesRemaining || 0)}`;

    const evt = trip.activeEvent;
    let eventTagColor = "var(--accent-orange)";
    if (evt && evt.type === "positive") eventTagColor = "var(--accent-green)";
    else if (evt && evt.type === "penalty") eventTagColor = "var(--accent-red)";

    return `
      <div class="terminal-card unlocked" onclick="AppTrips.openTripDetailModal('${trip.id}')">
        <div class="terminal-top-block">
          <div class="terminal-title" style="font-size: 0.86rem;">
            ${trip.originCity} ➔ ${trip.destinationCity}
          </div>
          <div class="terminal-badge-row">
            <span class="terminal-badge ${isRefuelStop ? 'locked' : 'active'}" id="trip-eta-${trip.id}">
              ${etaFormatted}
            </span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); margin: 4px 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${trip.contractId ? '📜 Контракт: ' : ''}${trip.cargoIcon || '📦'} ${trip.cargoName} (${trip.weightTons} т)
          </div>

          <!-- Бейдж дорожной ситуации на карточке рейса -->
          <div id="trip-event-tag-${trip.id}" style="font-size: 0.68rem; color: ${eventTagColor}; font-weight: 600; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: ${evt ? 'block' : 'none'};">
            ${evt ? `${evt.icon} ${evt.title}` : ''}
          </div>
        </div>

        <div>
          <div style="margin: 6px 0 4px 0;">
            <div class="component-meter" style="height: 5px;">
              <div class="component-meter-fill good" id="trip-fill-${trip.id}" style="width: ${trip.progressPercent}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 3px;">
              <span id="trip-km-${trip.id}">${Math.round(trip.remainingDistanceKm)} км</span>
              <span id="trip-percent-${trip.id}">${trip.progressPercent}%</span>
            </div>
          </div>

          <div class="terminal-bottom-block" style="padding-top: 4px; margin-top: 2px;">
            <div class="terminal-meta" style="font-size: 0.68rem;">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55%;">
                👨‍✈️ ${drv ? drv.name.split(' ')[0] : 'Шофер'}
              </span>
              <strong style="color: var(--accent-green);">€${trip.payout.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openTripDetailModal(tripId) {
    const s = AppState.get();
    const trip = s.trips.find(t => t.id === tripId);
    if (!trip) return;

    this.currentModalTripId = tripId;

    const trk = s.trucks.find(t => t.id === trip.truckId);
    const drv = s.drivers.find(d => d.id === trip.driverId);
    const isElectric = trk && trk.engineType === "electric";
    const isRefuelStop = trip.status === "refueling_stop";
    const etaFormatted = isRefuelStop ? `На АЗС (ост. ${trip.refuelStopRemainingMinutes}м)` : this.formatMinutesToHM(trip.estimatedMinutesRemaining || 0);

    const evt = trip.activeEvent;
    let eventBg = "rgba(255, 159, 10, 0.12)";
    let eventBorder = "rgba(255, 159, 10, 0.4)";
    let eventTextColor = "var(--accent-orange)";
    if (evt && evt.type === "positive") {
      eventBg = "rgba(48, 209, 88, 0.12)";
      eventBorder = "rgba(48, 209, 88, 0.4)";
      eventTextColor = "var(--accent-green)";
    } else if (evt && evt.type === "penalty") {
      eventBg = "rgba(255, 69, 58, 0.12)";
      eventBorder = "rgba(255, 69, 58, 0.4)";
      eventTextColor = "var(--accent-red)";
    }

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800;">${trip.originCity} ➔ ${trip.destinationCity}</h3>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                ${trip.contractId ? '📜 Долгосрочный контракт • ' : ''}Груз: <strong>${trip.cargoIcon || '📦'} ${trip.cargoName} (${trip.weightTons} т)</strong>
              </span>
            </div>
            <span class="badge" style="color: var(--accent-green); font-size: 0.95rem; font-weight: 800;" id="trip-modal-payout">
              €${trip.payout.toLocaleString()}
            </span>
          </div>
        </div>

        <!-- Баннер непредвиденной дорожной ситуации -->
        <div id="trip-modal-event-banner" style="display: ${evt ? 'block' : 'none'}; background: ${eventBg}; border: 1px solid ${eventBorder}; border-radius: var(--radius-sm); padding: 9px 12px;">
          <div style="font-weight: 700; font-size: 0.82rem; color: ${eventTextColor}; margin-bottom: 2px;">
            ${evt ? `${evt.icon} Дорожное событие: ${evt.title}` : ''}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-primary); line-height: 1.35;">
            ${evt ? evt.desc : ''}
          </div>
          ${evt && (evt.payoutModPercent !== 0 || evt.timeDeltaMinutes !== 0) ? `
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; border-top: 1px dashed ${eventBorder}; padding-top: 3px;">
              ${evt.payoutModPercent > 0 ? `Бонус к выплате: +${Math.round(evt.payoutModPercent * 100)}% • ` : (evt.payoutModPercent < 0 ? `Удержание: ${Math.round(evt.payoutModPercent * 100)}% • ` : '')}
              ${evt.timeDeltaMinutes > 0 ? `Задержка: +${evt.timeDeltaMinutes}м` : (evt.timeDeltaMinutes < 0 ? `Экономия времени: ${evt.timeDeltaMinutes}м` : 'Без задержки графика')}
            </div>
          ` : ''}
        </div>

        <!-- Баннер остановки на дозаправку -->
        <div id="trip-modal-status-banner" style="display: ${isRefuelStop ? 'block' : 'none'}; background: rgba(255, 159, 10, 0.15); border: 1px solid rgba(255, 159, 10, 0.4); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.76rem; color: var(--accent-orange);">
          ⛽ Тягач выполняет внеплановый пит-стоп на придорожной АЗС (дозаправка полного бака).
        </div>

        <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 5px;">
            <span>Время до финиша: <strong id="trip-modal-eta" style="color: var(--accent-blue);">${etaFormatted}</strong></span>
            <span>Прогресс: <strong id="trip-modal-percent">${trip.progressPercent}%</strong></span>
          </div>
          <div class="component-meter" style="height: 6px;">
            <div class="component-meter-fill good" id="trip-modal-progress-fill" style="width: ${trip.progressPercent}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            <span>Осталось проехать: <strong id="trip-modal-km">${Math.round(trip.remainingDistanceKm)} км</strong></span>
            <span>Всего по маршруту: ${trip.totalDistanceKm} км</span>
          </div>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Тягач автопарка:</td>
            <td><strong>${trk ? trk.model : '—'}</strong> (${trk ? (trk.enginePowerHp || 480) : 480} л.с.)</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Крейсерская скорость:</td>
            <td><strong>${trip.truckSpeedKmh || 75} км/ч</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Остаток ${isElectric ? 'энергии' : 'топлива'}:</td>
            <td id="trip-modal-fuel">${trk ? Math.round(trk.fuelCurrentL) : 0} / ${trk ? trk.fuelTankL : 0} ${isElectric ? 'кВт⋅ч' : 'л'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Назначенный водитель:</td>
            <td>${drv ? `👨‍✈️ ${drv.name} (★ ${drv.rating})` : '—'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Текущая бодрость экипажа:</td>
            <td id="trip-modal-stamina" style="color: ${drv && drv.stamina > 40 ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 700;">
              ${drv ? Math.round(drv.stamina) : 0}%
            </td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Дорожные сборы (Toll):</td>
            <td style="color: var(--accent-orange);">-€${trip.tollCost || 0}</td>
          </tr>
        </table>
      </div>
    `;

    AppUI.openSheet("Маршрутный лист автопоезда", html);
  }
};