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

      if (typeof AppTrips !== "undefined") {
        AppTrips.tick();
      }

      if (s.time.currentMinute >= 1440) {
        s.time.currentMinute = 0;
        s.time.currentDay += 1;
        this.onDayChanged();
      }

      AppUI.renderTimeAndBalance();
      
      // Если игрок на дашборде, обновляем данные и активные рейсы в реальном времени
      if (AppUI.currentTab === "dashboard") {
        AppUI.renderDashboard();
      }
    },

  onDayChanged() {
    const s = AppState.get();

    if (typeof AppCompetitors !== "undefined") AppCompetitors.processDailyCompetitorsTick();
    if (typeof AppMarket !== "undefined") AppMarket.processDailyMarketTick();
    if (typeof AppContracts !== "undefined") AppContracts.processDailyContracts();
    if (typeof AppFinance !== "undefined") AppFinance.processDailyMidnightAccounting();

    let networkUpkeep = 0;
    if (s.branches) s.branches.forEach(b => networkUpkeep += b.dailyUpkeep);
    if (s.warehouses) s.warehouses.forEach(w => networkUpkeep += w.dailyUpkeep);

    const cost = s.garage.maintenanceCostDaily + networkUpkeep;
    s.finances.balance -= s.garage.maintenanceCostDaily;
    s.finances.todayExpenses = cost;
    s.finances.todayRevenue = 0;
    s.finances.dailyNet = -cost;

    AppStorage.save(s);
    AppUI.renderDashboard();
  },

  getFormattedTime() {
    const s = AppState.get();
    const hours = Math.floor(s.time.currentMinute / 60).toString().padStart(2, '0');
    const mins = (s.time.currentMinute % 60).toString().padStart(2, '0');
    return `${hours}:${mins} (День ${s.time.currentDay})`;
  }
};
