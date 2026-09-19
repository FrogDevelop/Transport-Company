const AppStorage = {
  STORAGE_KEY: "TC_GAME_SAVE_V1",
  lastHiddenTimestamp: null,

  init() {
    // Отслеживаем сворачивание и развертывание вкладки браузера
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Игрок свернул вкладку или ушел с нее — фиксируем таймстамп
        this.lastHiddenTimestamp = Date.now();
        const s = AppState.get();
        this.save(s);
      } else {
        // Игрок вернулся на вкладку
        if (this.lastHiddenTimestamp) {
          const now = Date.now();
          const deltaMs = now - this.lastHiddenTimestamp;
          
          // Если прошло больше 10 секунд вне игры, пересчитываем прогресс
          if (deltaMs > 10000) {
            let s = AppState.get();
            s = this.processOfflineProgress(s, this.lastHiddenTimestamp);
            AppState.set(s);
            
            if (typeof AppUI !== "undefined") {
              AppUI.renderAll();
              
              // Показываем красивую сводку, если накопился значительный прогресс
              if (s.pendingOfflineSummary && s.pendingOfflineSummary.realMinutesAway >= 1) {
                const sum = s.pendingOfflineSummary;
                AppUI.showToast(`📊 Без вас прошло ${sum.realMinutesAway} мин. Завершено рейсов: ${sum.tripsFinished}, чистый итог: €${sum.netEarned.toLocaleString()}`, "info", 7000);
                s.pendingOfflineSummary = null;
              }
            }
          }
          this.lastHiddenTimestamp = null;
        }
      }
    });
  },

  save(state) {
    try {
      state.lastSavedTimestamp = Date.now();
      const payload = {
        version: AppState.version,
        timestamp: state.lastSavedTimestamp,
        state: state
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error("[Storage] Save error:", e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.version === AppState.version) {
        return {
          state: parsed.state,
          savedAt: parsed.timestamp || Date.now()
        };
      }
      return null;
    } catch (e) {
      console.warn("[Storage] Load error:", e);
      return null;
    }
  },

  processOfflineProgress(savedState, savedTimestamp) {
    const now = Date.now();
    const deltaMs = now - savedTimestamp;
    if (deltaMs < 10000) return savedState; // порог снижен до 10 секунд для удобства тестов

    const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
    const effectiveDeltaMs = Math.min(deltaMs, MAX_OFFLINE_MS);
    const simulatedMinutes = Math.floor(effectiveDeltaMs / 1000);

    let tripsFinishedCount = 0;
    let offlineEarnings = 0;
    let offlineExpenses = 0;
    const kmPerMinute = 80 / 60;

    // 1. Просчет активных рейсов
    if (savedState.trips && savedState.trips.length > 0) {
      for (let i = savedState.trips.length - 1; i >= 0; i--) {
        const trip = savedState.trips[i];
        const advanceKm = simulatedMinutes * kmPerMinute;

        if (advanceKm >= trip.remainingDistanceKm) {
          tripsFinishedCount += 1;
          offlineEarnings += trip.payout;
          offlineExpenses += trip.tollCost;
          savedState.finances.balance += (trip.payout - trip.tollCost);
          savedState.finances.totalEarned += trip.payout;

          const truck = savedState.trucks.find(t => t.id === trip.truckId);
          const driver = savedState.drivers.find(d => d.id === trip.driverId);
          if (truck) {
            truck.status = "idle";
            truck.mileageKm += Math.round(trip.totalDistanceKm);
          }
          if (driver) {
            driver.status = "rest";
            driver.stamina = 100;
          }

          if (trip.contractId && savedState.activeContracts) {
            const cnt = savedState.activeContracts.find(c => c.id === trip.contractId);
            if (cnt) cnt.deliveredVolumeTons = Math.min(cnt.totalVolumeTons, cnt.deliveredVolumeTons + trip.weightTons);
          }

          if (!savedState.statistics) savedState.statistics = {};
          savedState.statistics.completedTripsCount = (savedState.statistics.completedTripsCount || 0) + 1;
          savedState.statistics.totalDistanceDrivenKm = (savedState.statistics.totalDistanceDrivenKm || 0) + Math.round(trip.totalDistanceKm);

          savedState.trips.splice(i, 1);
        } else {
          trip.remainingDistanceKm -= advanceKm;
          trip.progressPercent = Math.min(99, Math.round(((trip.totalDistanceKm - trip.remainingDistanceKm) / trip.totalDistanceKm) * 100));
        }
      }
    }

    // 2. Просчет накопления на складах
    if (savedState.warehouses && savedState.warehouses.length > 0) {
      savedState.warehouses.forEach(wh => {
        const ratePerMinute = (wh.accumulationRatePerHour || 4.0) / 60;
        wh.currentTons = Math.min(wh.capacityTons, wh.currentTons + (ratePerMinute * simulatedMinutes));
      });
    }

    // 3. Просчет суточных смен (дни, инфраструктура, субаренда, расходы)
    savedState.time.currentMinute += simulatedMinutes;
    const daysToAdd = Math.floor(savedState.time.currentMinute / 1440);
    savedState.time.currentMinute %= 1440;

    if (daysToAdd > 0) {
      savedState.time.currentDay += daysToAdd;

      let totalOfflinePassiveIncome = 0;

      // Субаренда складов
      if (Array.isArray(savedState.warehouses) && savedState.warehouses.length > 0) {
        let dailySublease = 0;
        savedState.warehouses.forEach(wh => {
          const freeTons = Math.max(0, wh.capacityTons - wh.currentTons);
          dailySublease += Math.round(freeTons * (wh.rentalYieldPerTon || 3.2));
        });
        totalOfflinePassiveIncome += (dailySublease * daysToAdd);
      }

      // Придорожная инфраструктура
      if (Array.isArray(savedState.highwayInfrastructure) && savedState.highwayInfrastructure.length > 0) {
        let dailyInfraNet = 0;
        savedState.highwayInfrastructure.forEach(item => {
          dailyInfraNet += (item.dailyRevenue - item.dailyUpkeep);
        });
        totalOfflinePassiveIncome += (dailyInfraNet * daysToAdd);
      }

      // Содержание базы
      let networkUpkeep = 0;
      if (savedState.branches) savedState.branches.forEach(b => networkUpkeep += b.dailyUpkeep);
      if (savedState.warehouses) savedState.warehouses.forEach(w => networkUpkeep += w.dailyUpkeep);
      const totalDailyUpkeep = (savedState.garage.maintenanceCostDaily + networkUpkeep) * daysToAdd;

      savedState.finances.balance += (totalOfflinePassiveIncome - totalDailyUpkeep);
      offlineEarnings += totalOfflinePassiveIncome;
      offlineExpenses += totalDailyUpkeep;
    }

    savedState.pendingOfflineSummary = {
      realMinutesAway: Math.round(deltaMs / 60000),
      tripsFinished: tripsFinishedCount,
      netEarned: offlineEarnings - offlineExpenses,
      offlineEarnings: offlineEarnings,
      offlineExpenses: offlineExpenses
    };

    return savedState;
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.reload();
  }
};