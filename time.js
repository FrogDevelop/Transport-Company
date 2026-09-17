const AppTime = {
  tickInterval: null,
  TICK_MS: 1000,

  init() { this.startLoop(); },

  setSpeed(speedMultiplier) {
    const s = AppState.get();
    if (speedMultiplier === 0) {
      s.time.isPaused = true;
    } else {
      s.time.isPaused = false;
      s.time.timeScale = speedMultiplier;
    }
    this.restartLoop();
    AppUI.updateTimeControlsUI(speedMultiplier);
  },

  startLoop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    const s = AppState.get();
    if (s.time.isPaused) return;

    const computedMs = this.TICK_MS / s.time.timeScale;
    this.tickInterval = setInterval(() => { this.tick(); }, computedMs);
  },

  restartLoop() { this.startLoop(); },

  tick() {
    const s = AppState.get();
    s.time.currentMinute += 1;

    // 1. Движение рейсов по автобанам
    if (typeof AppTrips !== "undefined") {
      AppTrips.tick();
    }

    // 2. Таймеры лотов на бирже заказов
    if (typeof AppOrders !== "undefined") {
      AppOrders.tickOrderLifespans();
    }

    // 3. Ротация B2B-тендеров на бирже контрактов
    if (typeof AppContracts !== "undefined") {
      AppContracts.tickTendersLifespan();
    }

    // 4. Продвижение доставки бензовоза базы (3 фазы)
    if (s.garage && s.garage.fuelStation && s.garage.fuelStation.delivery) {
      const d = s.garage.fuelStation.delivery;
      d.minutesRemainingInPhase -= 1;
      d.totalMinutesRemaining = Math.max(0, d.totalMinutesRemaining - 1);

      if (d.minutesRemainingInPhase <= 0) {
        if (d.currentPhase === "loading") {
          d.currentPhase = "transit";
          d.phaseDuration = 90;
          d.minutesRemainingInPhase = 90;
        } else if (d.currentPhase === "transit") {
          d.currentPhase = "unloading";
          d.phaseDuration = 30;
          d.minutesRemainingInPhase = 30;
        } else if (d.currentPhase === "unloading") {
          const fs = s.garage.fuelStation;
          fs.currentLiters = Math.min(fs.capacityLiters, fs.currentLiters + d.liters);
          fs.delivery = null;

          AppStorage.save(s);
          AppUI.showToast(`⛽ Бензовоз завершил слив! В резервуар поступило +${d.liters.toLocaleString()} л дизеля.`, "success", 5000);

          if (AppUI.currentTab === "garage_hub" && typeof AppGarage !== "undefined" && AppGarage.currentSubTab === "fuel_terminal") {
            AppGarage.renderGarageView();
          }
        }
      }

      if (AppUI.currentTab === "garage_hub" && typeof AppGarage !== "undefined" && AppGarage.currentSubTab === "fuel_terminal") {
        AppGarage.renderGarageView();
      }
    }

    // 5. Восстановление отдыхающих водителей
    if (s.drivers && s.drivers.length > 0) {
      const recoveryRate = (s.garage && s.garage.hasDriverLounge) ? 2.0 : 1.0;
      s.drivers.forEach(driver => {
        if (driver.status === "rest" && driver.stamina < 100) {
          driver.stamina = Math.min(100, driver.stamina + recoveryRate);
        }
      });
    }

    // 6. Таймеры ремонта, тюнинга и заправки тягачей в гараже
    if (s.trucks && s.trucks.length > 0) {
      let anyWorkFinished = false;

      s.trucks.forEach(truck => {
        if ((truck.status === "maintenance" || truck.status === "tuning" || truck.status === "refueling") && truck.busyMinutesRemaining > 0) {
          truck.busyMinutesRemaining -= 1;

          // Точечное обновление бейджа на карточке тягача в гараже
          const badgeEl = document.getElementById(`truck-status-badge-${truck.id}`);
          if (badgeEl) {
            let label = "";
            if (truck.status === "maintenance") label = `🔧 Ремонт (${truck.busyMinutesRemaining}м)`;
            else if (truck.status === "tuning") label = `⚙️ Тюнинг (${truck.busyMinutesRemaining}м)`;
            else if (truck.status === "refueling") label = `⛽ Заправка (${truck.busyMinutesRemaining}м)`;
            badgeEl.innerText = label;
          }

          // Обновление в открытой модалке тягача
          const modalStatusText = document.getElementById(`modal-live-status-text-${truck.id}`);
          if (modalStatusText) {
            let desc = "";
            if (truck.status === "maintenance") desc = `● На техобслуживании (осталось ${truck.busyMinutesRemaining}м)`;
            else if (truck.status === "tuning") desc = `● В боксе модернизации (осталось ${truck.busyMinutesRemaining}м)`;
            else if (truck.status === "refueling") desc = `● Заправка на АЗС (осталось ${truck.busyMinutesRemaining}м)`;
            modalStatusText.innerText = desc;
          }

          if (truck.busyMinutesRemaining <= 0) {
            anyWorkFinished = true;
            if (truck.status === "maintenance") {
              AppTrucks.completeRepairWork(truck);
            } else if (truck.status === "tuning") {
              AppTrucks.completeTuningWork(truck);
            } else if (truck.status === "refueling") {
              AppGarage.completeTruckRefueling(truck);
              AppUI.showToast(`Тягач ${truck.model} полностью заправлен и готов к рейсу!`, "success");
            }
          }
        }
      });

      if (anyWorkFinished) {
        AppStorage.save(s);
        if (AppUI.currentTab === "garage_hub" && typeof AppGarage !== "undefined") {
          AppGarage.renderGarageView();
        }
      }
    }

    // 7. Смена игровых суток (00:00)
    if (s.time.currentMinute >= 1440) {
      s.time.currentMinute = 0;
      s.time.currentDay += 1;
      this.onDayChanged();
    }

    // 8. Накопление сборных грузов в распределительных центрах
    if (typeof AppCompany !== "undefined") {
      AppCompany.tickWarehouses();
    }

    AppUI.renderTimeAndBalance();
  },

  onDayChanged() {
    const s = AppState.get();

    if (typeof AppCompetitors !== "undefined") AppCompetitors.processDailyCompetitorsTick();
    if (typeof AppMarket !== "undefined") AppMarket.processDailyMarketTick();
    if (typeof AppContracts !== "undefined") AppContracts.processDailyContracts();
    if (typeof AppFinance !== "undefined") AppFinance.processDailyMidnightAccounting();
    if (typeof AppCompany !== "undefined") {AppCompany.processDailyWarehouseSublease();}

    let networkUpkeep = 0;
    if (s.branches) s.branches.forEach(b => networkUpkeep += b.dailyUpkeep);
    if (s.warehouses) s.warehouses.forEach(w => networkUpkeep += w.dailyUpkeep);

    const cost = s.garage.maintenanceCostDaily + networkUpkeep;
    s.finances.balance -= s.garage.maintenanceCostDaily;
    s.finances.todayExpenses = cost;
    s.finances.todayRevenue = 0;
    s.finances.dailyNet = -cost;

    AppStorage.save(s);
  },

  getFormattedTime() {
    const s = AppState.get();
    const hours = Math.floor(s.time.currentMinute / 60).toString().padStart(2, '0');
    const mins = (s.time.currentMinute % 60).toString().padStart(2, '0');
    return `${hours}:${mins} (День ${s.time.currentDay})`;
  }
};