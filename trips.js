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
      if (trip.status !== "active" && trip.status !== "refueling_stop" && trip.status !== "sleeping_stop") return;

      const truck = s.trucks.find(t => t.id === trip.truckId);
      const trailer = trip.trailerId ? s.trailers.find(t => t.id === trip.trailerId) : null;
      const driver = s.drivers.find(d => d.id === trip.driverId);
      const coDriver = trip.coDriverId ? s.drivers.find(d => d.id === trip.coDriverId) : null;
      
      if (!truck || !driver) return;

      // 1. Остановка на дозаправку на АЗС
      if (trip.status === "refueling_stop") {
        trip.refuelStopRemainingMinutes = Math.max(0, (trip.refuelStopRemainingMinutes || 0) - 1);
        if (trip.refuelStopRemainingMinutes <= 0) {
          trip.status = "active";
          AppUI.showToast(`⛽ Тягач ${truck.model} закончил дозаправку на АЗС и продолжил путь в ${trip.destinationCity}!`, "info");
        }
        this.updateLiveTripDOM(trip, truck, driver, coDriver, trailer);
        return;
      }

      // 2. Остановка на обязательный 9-часовой сон (Тахограф)
      if (trip.status === "sleeping_stop") {
        trip.sleepRemainingMinutes = Math.max(0, (trip.sleepRemainingMinutes || 0) - 1);
        
        driver.stamina = Math.min(100, driver.stamina + 0.185);
        if (coDriver) coDriver.stamina = Math.min(100, coDriver.stamina + 0.185);

        if (trip.sleepRemainingMinutes <= 0) {
          trip.status = "active";
          AppUI.showToast(`☕ Экипаж тягача ${truck.model} отдохнул 9 часов и продолжил рейс!`, "success", 4000);
        }
        this.updateLiveTripDOM(trip, truck, driver, coDriver, trailer);
        return;
      }

      // 3. Движение автопоезда
      let speedKmh = trip.truckSpeedKmh || 75;
      if (s.garage && s.garage.hasTelematicsCenter) speedKmh *= 1.15;

      const kmPerMinute = speedKmh / 60;
      const actualKm = Math.min(trip.remainingDistanceKm, kmPerMinute);

      trip.remainingDistanceKm = Math.max(0, trip.remainingDistanceKm - actualKm);
      trip.progressPercent = Math.min(100, Math.round(((trip.totalDistanceKm - trip.remainingDistanceKm) / trip.totalDistanceKm) * 100));

      const remainingMinutes = (trip.remainingDistanceKm / speedKmh) * 60;
      trip.estimatedMinutesRemaining = Math.round(remainingMinutes);

      // Расход топлива (Учитываем ХОУ рефрижератора)
      const ecoBonus = driver.ecoDrivingSkill ? (driver.ecoDrivingSkill / 100) : 0.05;
      let reeferPenalty = 1.0;
      if (trailer && trailer.type === "refrigerated") reeferPenalty = 1.15;

      const effectiveConsumption = truck.avgConsumptionL100 * (1 - ecoBonus) * reeferPenalty;
      const fuelBurned = (actualKm / 100) * effectiveConsumption;
      truck.fuelCurrentL = Math.max(0, truck.fuelCurrentL - fuelBurned);

      // Износ узлов
      const wearDiscount = (s.garage && s.garage.hasClimateHangar) ? 0.85 : 1.0;
      if (typeof AppTrucks !== "undefined") {
        AppTrucks.applyWear(truck.id, actualKm * wearDiscount);
        if (trailer) AppTrucks.applyTrailerWear(trailer.id, actualKm * wearDiscount);
      }

      // УСТАЛОСТЬ И ТАХОГРАФ
      driver.stamina = Math.max(0, driver.stamina - 0.185);
      if (coDriver) coDriver.stamina = Math.min(100, coDriver.stamina + 0.12);

      if (driver.stamina <= 3) {
        if (coDriver && coDriver.stamina >= 25) {
          const tempId = trip.driverId;
          trip.driverId = trip.coDriverId;
          trip.coDriverId = tempId;
          AppUI.showToast(`🔄 Смена экипажа на ходу: ${coDriver.name} сел за руль тягача ${truck.model}.`, "info", 5000);
        } else {
          trip.status = "sleeping_stop";
          trip.sleepRemainingMinutes = 540;
          AppUI.showToast(`👮‍♂️ Тахограф: Экипаж тягача ${truck.model} истощен. Обязательная пауза на сон (9 часов).`, "warning", 6000);
        }
      }

      // 4. ДОРОЖНЫЕ НЕПРЕДВИДЕННЫЕ СИТУАЦИИ И ПОЛИЦИЯ BAG
      const isSpecialTrip = !!trip.contractId || (trip.cargoName && trip.cargoName.includes("FTL"));
      if (!isSpecialTrip && !trip.eventTriggered && trip.progressPercent >= 25 && trip.progressPercent <= 75) {
        const rand = Math.random();
        if (rand < 0.015) {
          this.triggerRandomRoadEvent(trip, truck, driver);
        } else if (rand > 0.996) {
          this.triggerBAGInspection(trip, truck, trailer, driver);
        }
      }

      // Проверка экстренной нехватки дизеля
      if (truck.fuelCurrentL <= 15 && trip.remainingDistanceKm > 10) {
        this.triggerHighwayRefuelStop(trip, truck);
      }

      this.updateLiveTripDOM(trip, truck, driver, coDriver, trailer);

      // Финиш маршрута
      if (trip.remainingDistanceKm <= 0 && trip.status === "active") {
        trip.status = "completed";
        anyFinished = true;
        this.finishTrip(trip, truck, trailer, driver, coDriver);
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

  triggerBAGInspection(trip, truck, trailer, driver) {
    trip.eventTriggered = true;
    let penalty = 0;
    let delay = 30;
    let issues = [];

    if (truck.components.tires < 25) { penalty += 2500; issues.push("«лысую» резину тягача"); delay += 60; }
    if (truck.components.brakes < 25) { penalty += 3500; issues.push("неисправные тормоза тягача"); delay += 120; }
    
    if (trailer) {
      if (trailer.components.tires < 25) { penalty += 1800; issues.push("изношенные шины прицепа"); delay += 45; }
      if (trailer.components.brakes < 25) { penalty += 2200; issues.push("тормоза прицепа"); delay += 45; }
    }

    if (driver.stamina < 15) { penalty += 1500; issues.push("нарушение режима отдыха"); }

    const s = AppState.get();

    if (issues.length > 0) {
      s.finances.balance -= penalty;
      s.finances.todayExpenses += penalty;
      s.company.reputation = Math.max(0, s.company.reputation - 5);
      trip.estimatedMinutesRemaining += delay;
      AppStorage.save(s);

      trip.activeEvent = {
        title: "Облава Транспортной полиции", icon: "🚨", type: "penalty",
        desc: `BAG остановила фуру для проверки. Найдены нарушения: ${issues.join(', ')}. Выписан штраф.`,
        payoutModPercent: 0, timeDeltaMinutes: delay
      };
      
      AppUI.showToast(`🚨 Полиция BAG остановила ${truck.model}! Штраф €${penalty.toLocaleString()} за ${issues.join(', ')}. Задержка рейса!`, "error", 7000);
    } else {
      trip.estimatedMinutesRemaining += delay;
      trip.activeEvent = {
        title: "Проверка BAG пройдена", icon: "👮‍♂️", type: "info",
        desc: `Плановый весовой и технический контроль пройден успешно. Нарушений нет.`,
        payoutModPercent: 0, timeDeltaMinutes: delay
      };
      AppUI.showToast(`👮‍♂️ Проверка BAG: Документы и техника ${truck.model} в полном порядке. Оформление заняло 30 минут.`, "success", 4000);
    }
  },

  triggerRandomRoadEvent(trip, truck, driver) {
    if (typeof TRIP_RANDOM_EVENTS === "undefined" || TRIP_RANDOM_EVENTS.length === 0) return;
    trip.eventTriggered = true;
    const evt = TRIP_RANDOM_EVENTS[Math.floor(Math.random() * TRIP_RANDOM_EVENTS.length)];
    
    trip.activeEvent = {
      title: evt.title, icon: evt.icon, type: evt.type, desc: evt.desc,
      timeDeltaMinutes: evt.timeDeltaMinutes || 0, payoutModPercent: evt.payoutModPercent || 0
    };
    trip.lastEventTitle = evt.title;

    if (evt.payoutModPercent) {
      const deltaPayout = Math.round(trip.payout * evt.payoutModPercent);
      trip.payout = Math.max(500, trip.payout + deltaPayout);
    }
    if (evt.timeDeltaMinutes) {
      trip.estimatedMinutesRemaining = Math.max(5, trip.estimatedMinutesRemaining + evt.timeDeltaMinutes);
    }
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

    // Сразу перерисовываем карточку на экране, чтобы обновилась цена и бейдж события
    if (AppUI.currentTab === "trips") {
      this.renderTripsView();
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

  updateLiveTripDOM(trip, truck, driver, coDriver, trailer) {
    const isRefuelStop = trip.status === "refueling_stop";
    const isSleepStop = trip.status === "sleeping_stop";
    
    let etaFormatted = `⏱ ${this.formatMinutesToHM(trip.estimatedMinutesRemaining)}`;
    if (isRefuelStop) etaFormatted = `⛽ АЗС (${trip.refuelStopRemainingMinutes}м)`;
    if (isSleepStop) etaFormatted = `🛏️ Отдых (${trip.sleepRemainingMinutes}м)`;

    if (AppUI.currentTab === "trips") {
      const fillEl = document.getElementById(`trip-fill-${trip.id}`);
      const etaEl = document.getElementById(`trip-eta-${trip.id}`);
      const kmEl = document.getElementById(`trip-km-${trip.id}`);
      const percentEl = document.getElementById(`trip-percent-${trip.id}`);
      const payoutEl = document.getElementById(`trip-payout-${trip.id}`);
      const eventTagEl = document.getElementById(`trip-event-tag-${trip.id}`);

      if (fillEl) fillEl.style.width = `${trip.progressPercent}%`;
      if (etaEl) {
        etaEl.innerText = etaFormatted;
        etaEl.className = `terminal-badge ${(isRefuelStop || isSleepStop) ? 'locked' : 'active'}`;
      }
      if (kmEl) kmEl.innerText = `${Math.round(trip.remainingDistanceKm)} км`;
      if (percentEl) percentEl.innerText = `${trip.progressPercent}%`;
      if (payoutEl) payoutEl.innerText = `€${trip.payout.toLocaleString()}`;

      if (eventTagEl && trip.activeEvent) {
        eventTagEl.style.display = "block";
        eventTagEl.innerText = `${trip.activeEvent.icon} ${trip.activeEvent.title}`;
      }
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
      if (modalEta) modalEta.innerText = etaFormatted;
      if (modalPercent) modalPercent.innerText = `${trip.progressPercent}%`;
      if (modalKm) modalKm.innerText = `${Math.round(trip.remainingDistanceKm)} км`;
      if (modalFuel) {
        const isElectric = truck.engineType === "electric";
        modalFuel.innerText = `${Math.round(truck.fuelCurrentL)} / ${truck.fuelTankL} ${isElectric ? 'кВт⋅ч' : 'л'}`;
      }
      if (modalStamina) {
        let stText = `${Math.round(driver.stamina)}%`;
        if (coDriver) stText += ` / Сменщик: ${Math.round(coDriver.stamina)}%`;
        modalStamina.innerText = stText;
      }
      if (modalPayout) {
        modalPayout.innerText = `€${trip.payout.toLocaleString()}`;
      }
      if (modalStatusBanner) {
        modalStatusBanner.style.display = (isRefuelStop || isSleepStop) ? "block" : "none";
        if (isRefuelStop) modalStatusBanner.innerText = `⛽ Внеплановый пит-стоп на АЗС (дозаправка полного бака).`;
        if (isSleepStop) modalStatusBanner.innerHTML = `🛏️ <strong>Требование Тахографа:</strong> Экипаж истощен. Обязательный сон на паркинге 9 часов.`;
      }
      if (modalEventBanner && trip.activeEvent) {
        modalEventBanner.style.display = "block";
        const evt = trip.activeEvent;
        modalEventBanner.innerHTML = `
          <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">${evt.icon} Событие: ${evt.title}</div>
          <div style="font-size: 0.72rem; line-height: 1.35;">${evt.desc}</div>
        `;
      }
    }
  },

  finishTrip(trip, truck, trailer, driver, coDriver) {
    const s = AppState.get();

    truck.status = "idle";
    if (trailer) trailer.status = "idle";
    driver.status = "rest";
    if (coDriver) coDriver.status = "rest";

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

    s.company.xp += earnedXP;
    if (typeof AppOfficeHub !== "undefined") AppTrips.checkOfficeLevelUp(s);

    if (!truck.tco) truck.tco = { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 };
    truck.tco.totalRevenueGenerated += trip.payout;
    truck.tco.totalKmDriven += Math.round(trip.totalDistanceKm);

    s.company.reputation = Math.min(100, s.company.reputation + 1);

    s.statistics.completedTripsCount += 1;
    s.statistics.totalDistanceDrivenKm += Math.round(trip.totalDistanceKm);
    s.statistics.totalCargoHauledTons += Math.round(trip.weightTons);

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

          const earlyMsg = isEarly ? ` Бонус за скорость: +€${speedBonus.toLocaleString()}!` : "";
          AppUI.showToast(`🎉 Контракт с «${cnt.clientName}» закрыт! Премия: +€${totalBonus.toLocaleString()} (+${repEarned} к реп.).${earlyMsg}`, "success", 7000);

          s.activeContracts.splice(cntIndex, 1);
        } else {
          AppUI.showToast(`Контракт для «${cnt.clientName}» доставлен (+${trip.weightTons} т). Остаток: ${Math.round(cnt.totalVolumeTons - cnt.deliveredVolumeTons)} т.`, "info");
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
      AppUI.showToast(`🎉 Офис повышен до Ур. ${nextLevelSpec.level} («${nextLevelSpec.title}»)! Премия: +€${levelBonusCash.toLocaleString()}`, "success", 6000);
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
    const isSleepStop = trip.status === "sleeping_stop";
    let etaFormatted = `⏱ ${this.formatMinutesToHM(trip.estimatedMinutesRemaining || 0)}`;
    if (isRefuelStop) etaFormatted = `⛽ АЗС (${trip.refuelStopRemainingMinutes}м)`;
    if (isSleepStop) etaFormatted = `🛏️ Сон (${trip.sleepRemainingMinutes}м)`;

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
            <span class="terminal-badge ${(isRefuelStop || isSleepStop) ? 'locked' : 'active'}" id="trip-eta-${trip.id}">
              ${etaFormatted}
            </span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); margin: 4px 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${trip.contractId ? '📜 Контракт: ' : ''}${trip.cargoIcon || '📦'} ${trip.cargoName} (${trip.weightTons} т)
          </div>

          <!-- Бейдж дорожной ситуации -->
          <div id="trip-event-tag-${trip.id}" style="font-size: 0.68rem; color: ${eventTagColor}; font-weight: 600; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: ${evt ? 'block' : 'none'};">
            ${evt ? `${evt.icon}${evt.title}` : ''}
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
              <strong style="color: var(--accent-green);" id="trip-payout-${trip.id}">€${trip.payout.toLocaleString()}</strong>
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
    const trailer = trip.trailerId ? (s.trailers || []).find(t => t.id === trip.trailerId) : null;
    const drv = s.drivers.find(d => d.id === trip.driverId);
    const coDrv = trip.coDriverId ? s.drivers.find(d => d.id === trip.coDriverId) : null;
    
    const isElectric = trk && trk.engineType === "electric";
    const isRefuelStop = trip.status === "refueling_stop";
    const isSleepStop = trip.status === "sleeping_stop";

    let etaFormatted = `⏱ ${this.formatMinutesToHM(trip.estimatedMinutesRemaining || 0)}`;
    if (isRefuelStop) etaFormatted = `На АЗС (ост. ${trip.refuelStopRemainingMinutes}м)`;
    if (isSleepStop) etaFormatted = `Сон на паркинге (ост. ${trip.sleepRemainingMinutes}м)`;

    const evt = trip.activeEvent;
    let eventBg = "rgba(255, 159, 10, 0.12)";
    let eventBorder = "rgba(255, 159, 10, 0.4)";
    let eventTextColor = "var(--accent-orange)";
    if (evt && evt.type === "positive") {
      eventBg = "rgba(48, 209, 88, 0.12)"; eventBorder = "rgba(48, 209, 88, 0.4)"; eventTextColor = "var(--accent-green)";
    } else if (evt && evt.type === "penalty") {
      eventBg = "rgba(255, 69, 58, 0.12)"; eventBorder = "rgba(255, 69, 58, 0.4)"; eventTextColor = "var(--accent-red)";
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

        <!-- Баннер события -->
        <div id="trip-modal-event-banner" style="display: ${evt ? 'block' : 'none'}; background: ${eventBg}; border: 1px solid ${eventBorder}; border-radius: var(--radius-sm); padding: 9px 12px;">
          <div style="font-weight: 700; font-size: 0.82rem; color: ${eventTextColor}; margin-bottom: 2px;" id="trip-modal-event-title">
            ${evt ? `${evt.icon} Событие: ${evt.title}` : ''}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-primary); line-height: 1.35;" id="trip-modal-event-desc">
            ${evt ? evt.desc : ''}
          </div>
        </div>

        <!-- Системный баннер статуса -->
        <div id="trip-modal-status-banner" style="display: ${(isRefuelStop || isSleepStop) ? 'block' : 'none'}; background: rgba(255, 159, 10, 0.15); border: 1px solid rgba(255, 159, 10, 0.4); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.76rem; color: var(--accent-orange);">
          ${isRefuelStop ? '⛽ Внеплановый пит-стоп на АЗС (дозаправка полного бака).' : ''}
          ${isSleepStop ? '🛏️ <strong>Требование Тахографа:</strong> Экипаж истощен. Обязательный сон на паркинге 9 часов.' : ''}
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
            <td style="color: var(--text-muted);">Тягач:</td>
            <td><strong>${trk ? trk.model : '—'}</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Полуприцеп:</td>
            <td><strong>${trailer ? `${trailer.icon}${trailer.model}` : '—'}</strong></td>
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
            <td style="color: var(--text-muted);">Состав экипажа:</td>
            <td>${drv ? `👨‍✈️ ${drv.name.split(' ')[0]}` : '—'}${coDrv ? ` и 👨‍✈️ ${coDrv.name.split(' ')[0]}` : ''}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Бодрость (Основной / Сменщик):</td>
            <td id="trip-modal-stamina" style="color: ${drv && drv.stamina > 40 ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 700;">
              ${drv ? Math.round(drv.stamina) : 0}%${coDrv ? ` / ${Math.round(coDrv.stamina)}%` : ''}
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