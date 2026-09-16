const AppStorage = {
  STORAGE_KEY: "TC_GAME_SAVE_V1",

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
    if (deltaMs < 60000) return savedState;

    const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
    const effectiveDeltaMs = Math.min(deltaMs, MAX_OFFLINE_MS);
    const simulatedMinutes = Math.floor(effectiveDeltaMs / 1000);

    let tripsFinishedCount = 0;
    let offlineEarnings = 0;
    let offlineExpenses = 0;
    const kmPerMinute = 80 / 60;

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
            if (cnt) cnt.completedThisCycle += 1;
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

    savedState.time.currentMinute += simulatedMinutes;
    while (savedState.time.currentMinute >= 1440) {
      savedState.time.currentMinute -= 1440;
      savedState.time.currentDay += 1;
      const baseCost = savedState.garage.maintenanceCostDaily;
      savedState.finances.balance -= baseCost;
      offlineExpenses += baseCost;
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
