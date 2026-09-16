const AppDebug = {
  openConsoleModal() {
    const html = `
      <div class="debug-panel">
        <div class="debug-section">
          <span class="debug-section-title">Казначейство и баланс</span>
          <div class="debug-actions-grid">
            <button class="btn-debug" onclick="AppDebug.addCash(50000)">+ €50 000</button>
            <button class="btn-debug" onclick="AppDebug.addCash(250000)">+ €250 000</button>
            <button class="btn-debug" onclick="AppDebug.addReputation(15)">+15 Репутации</button>
            <button class="btn-debug" onclick="AppDebug.fillTanks()">Заправить флот</button>
          </div>
        </div>

        <div class="debug-section">
          <span class="debug-section-title">Управление временем & Рейсы</span>
          <div class="debug-actions-grid">
            <button class="btn-debug" onclick="AppDebug.fastForward(360)">+6 часов (360м)</button>
            <button class="btn-debug" onclick="AppDebug.fastForward(1440)">+1 сутки (1440м)</button>
            <button class="btn-debug" onclick="AppDebug.forceCompleteTrips()">Завершить рейсы</button>
            <button class="btn-debug" onclick="AppDebug.triggerRandomIncident()">Вызвать поломку</button>
          </div>
        </div>

        <div class="debug-section">
          <span class="debug-section-title">Техническое состояние флота</span>
          <div class="debug-actions-grid">
            <button class="btn-debug" onclick="AppDebug.repairAllTrucks()">100% здоровье узлов</button>
            <button class="btn-debug" onclick="AppDebug.restDrivers()">Восстановить шоферов</button>
          </div>
        </div>

        <div class="debug-section">
          <span class="debug-section-title">Сброс и реинициализация</span>
          <div class="debug-actions-grid">
            <button class="btn-debug" onclick="AppDebug.restartTutorial()">Перезапуск обучения</button>
            <button class="btn-debug danger" onclick="AppStorage.reset()">Hard Reset (Очистить)</button>
          </div>
        </div>
      </div>
    `;
    AppUI.openSheet("🛠️ Инженерная консоль Debug", html);
  },

  addCash(amount) {
    const s = AppState.get();
    s.finances.balance += amount;
    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast(`Начислено +€${amount.toLocaleString()}`, "success");
  },

  addReputation(amount) {
    const s = AppState.get();
    s.company.reputation = Math.min(100, s.company.reputation + amount);
    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast(`Репутация повышена до ${s.company.reputation}`, "info");
  },

  fillTanks() {
    const s = AppState.get();
    s.trucks.forEach(t => t.fuelCurrentL = t.fuelTankL);
    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast("Все топливные баки и батареи заполнены на 100%!", "success");
  },

  fastForward(minutes) {
    const s = AppState.get();
    const daysToAdd = Math.floor(minutes / 1440);
    const remMinutes = minutes % 1440;

    s.time.currentMinute += remMinutes;
    if (s.time.currentMinute >= 1440) {
      s.time.currentMinute -= 1440;
      s.time.currentDay += 1;
      AppTime.onDayChanged();
    }
    s.time.currentDay += daysToAdd;

    if (s.trips) {
      s.trips.forEach(trip => {
        trip.remainingDistanceKm = Math.max(0, trip.remainingDistanceKm - (minutes * (80 / 60)));
      });
    }

    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast(`Время перемотано на ${minutes} минут вперед.`, "info");
  },

  forceCompleteTrips() {
    const s = AppState.get();
    if (!s.trips || s.trips.length === 0) {
      AppUI.showToast("Нет активных рейсов для принудительного завершения!", "warning");
      return;
    }

    for (let i = s.trips.length - 1; i >= 0; i--) {
      const trip = s.trips[i];
      const truck = s.trucks.find(t => t.id === trip.truckId);
      const driver = s.drivers.find(d => d.id === trip.driverId);
      if (truck && driver) {
        AppTrips.completeTrip(trip, truck, driver, i);
      }
    }
    AppUI.closeSheet();
  },

  triggerRandomIncident() {
    const s = AppState.get();
    if (!s.trips || s.trips.length === 0) {
      AppUI.showToast("Для вызова происшествия на трассе должен быть запущен хотя бы 1 рейс!", "warning");
      return;
    }
    const trip = s.trips[0];
    const truck = s.trucks.find(t => t.id === trip.truckId);
    const driver = s.drivers.find(d => d.id === trip.driverId);
    AppTrips.triggerRoadEvent(trip, truck, driver);
    AppUI.renderAll();
    AppUI.showToast(`Инцидент вызван для рейса ${trip.originCity} ➔ ${trip.destinationCity}!`, "warning");
  },

  repairAllTrucks() {
    const s = AppState.get();
    s.trucks.forEach(t => {
      Object.keys(t.components).forEach(k => t.components[k] = 100);
    });
    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast("Все узлы тягачей восстановлены до 100%!", "success");
  },

  restDrivers() {
    const s = AppState.get();
    s.drivers.forEach(d => d.stamina = 100);
    AppStorage.save(s);
    AppUI.renderAll();
    AppUI.showToast("Выносливость всего персонала восстановлена до 100%!", "success");
  },

  restartTutorial() {
    const s = AppState.get();
    s.tutorial = { completed: false, currentStepIndex: 0 };
    AppStorage.save(s);
    AppUI.closeSheet();
    AppOnboarding.init();
  }
};