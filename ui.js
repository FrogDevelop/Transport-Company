const AppUI = {
  currentTab: "dashboard",

  init() {
    this.ensureToastViewport();
    this.overrideNativeAlert();
    this.bindNavigation();
    this.bindThemeToggle();
    this.bindBottomSheet();
    this.applyTheme(AppState.get().settings.theme || "dark");
    this.renderAll();
  },

  ensureToastViewport() {
    if (!document.getElementById("app-toast-container")) {
      const container = document.createElement("div");
      container.id = "app-toast-container";
      container.className = "toast-viewport";
      document.body.appendChild(container);
    }
  },

  overrideNativeAlert() {
    window.alert = (msg) => {
      let type = "info";
      const text = String(msg);
      if (text.includes("⚠️") || text.includes("Недостаточно") || text.includes("Нельзя") || text.includes("Ошибка") || text.includes("СРЫВ")) {
        type = "error";
      } else if (text.includes("успешно") || text.includes("зачислен") || text.includes("поставлен") || text.includes("Начислено")) {
        type = "success";
      }
      this.showToast(text, type);
    };
  },

  showToast(message, type = "info", durationMs = 3800) {
    this.ensureToastViewport();
    const container = document.getElementById("app-toast-container");
    if (!container) return;

    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "🚫"
    };

    const bubble = document.createElement("div");
    bubble.className = `toast-bubble ${type}`;
    bubble.innerHTML = `
      <div class="toast-icon-box">${icons[type] || "🔔"}</div>
      <div class="toast-message-body">${message}</div>
    `;

    container.appendChild(bubble);

    setTimeout(() => {
      bubble.classList.add("toast-out");
      setTimeout(() => {
        if (bubble.parentNode) bubble.remove();
      }, 260);
    }, durationMs);
  },

  bindNavigation() {
    document.querySelectorAll("[data-tab]").forEach(el => {
      el.addEventListener("click", () => {
        const tab = el.getAttribute("data-tab");
        if (tab === "more") {
          this.openMoreMenuSheet();
          return;
        }
        this.switchTab(tab);
      });
    });

    document.querySelectorAll(".time-speed-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const speed = parseInt(btn.getAttribute("data-speed"), 10);
        AppTime.setSpeed(speed);
      });
    });
  },

  switchTab(tabId) {
      this.currentTab = tabId;

      document.querySelectorAll(".tab-view").forEach(view => {
        view.classList.toggle("active", view.id === `view-${tabId}`);
      });

      document.querySelectorAll(".nav-item, .tabbar-item").forEach(item => {
        const isActive = item.getAttribute("data-tab") === tabId;
        item.classList.toggle("active", isActive);

        // Автоматически центрируем выбранную вкладку в мобильном таббаре
        if (isActive && item.classList.contains("tabbar-item")) {
          item.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      });

      if (tabId === "dashboard") this.renderDashboard();
      if (tabId === "orders" && typeof AppOrders !== "undefined") AppOrders.renderOrdersView();
      if (tabId === "trips" && typeof AppTrips !== "undefined") AppTrips.renderTripsView();
      if (tabId === "fleet" && typeof AppTrucks !== "undefined") AppTrucks.renderFleetView();
      if (tabId === "dealership" && typeof AppDealership !== "undefined") AppDealership.renderDealershipView();
      if (tabId === "drivers" && typeof AppDrivers !== "undefined") AppDrivers.renderDriversView();
      if (tabId === "drivers_market" && typeof AppDrivers !== "undefined") AppDrivers.renderMarketTab();
      if (tabId === "garage" && typeof AppGarage !== "undefined") AppGarage.renderGarageView();
      if (tabId === "finances" && typeof AppFinance !== "undefined") AppFinance.renderFinanceView();
      if (tabId === "contracts" && typeof AppContracts !== "undefined") AppContracts.renderContractsView();
      if (tabId === "market" && typeof AppMarket !== "undefined") AppMarket.renderMarketView();
      if (tabId === "company" && typeof AppCompany !== "undefined") AppCompany.renderCompanyView();
      if (tabId === "analytics" && typeof AppAnalytics !== "undefined") AppAnalytics.renderAnalyticsView();
    },

  updateTimeControlsUI(activeSpeed) {
    document.querySelectorAll(".time-speed-btn").forEach(btn => {
      const spd = parseInt(btn.getAttribute("data-speed"), 10);
      btn.classList.toggle("active", spd === activeSpeed);
    });
  },

  bindThemeToggle() {
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const s = AppState.get();
        const nextTheme = s.settings.theme === "dark" ? "light" : "dark";
        s.settings.theme = nextTheme;
        this.applyTheme(nextTheme);
        AppStorage.save(s);
      });
    }
  },

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },

  bindBottomSheet() {
    const backdrop = document.getElementById("app-sheet-backdrop");
    const closeBtn = document.getElementById("sheet-close-btn");
    
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeSheet();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeSheet());
    }
  },

  openSheet(title, htmlContent) {
    const titleEl = document.getElementById("sheet-title");
    const contentEl = document.getElementById("sheet-content");
    const backdrop = document.getElementById("app-sheet-backdrop");

    if (titleEl) titleEl.innerText = title;
    if (contentEl) contentEl.innerHTML = htmlContent;
    if (backdrop) backdrop.classList.add("active");
  },

  closeSheet() {
    const backdrop = document.getElementById("app-sheet-backdrop");
    if (backdrop) backdrop.classList.remove("active");
  },

  openMoreMenuSheet() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-glass" onclick="AppUI.switchTab('dealership'); AppUI.closeSheet();">🚛 Автосалон техники</button>
        <button class="btn-glass" onclick="AppUI.switchTab('drivers_market'); AppUI.closeSheet();">👨‍✈️ Биржа найма водителей</button>
        <button class="btn-glass" onclick="AppUI.switchTab('contracts'); AppUI.closeSheet();">📜 B2B Контракты & Тендеры</button>
        <button class="btn-glass" onclick="AppUI.switchTab('garage'); AppUI.closeSheet();">🏭 База и Гараж</button>
        <button class="btn-glass" onclick="AppUI.switchTab('market'); AppUI.closeSheet();">⛽ Рынок дизеля & Б/У сток</button>
        <button class="btn-glass" onclick="AppUI.switchTab('company'); AppUI.closeSheet();">🏛️ Филиалы & Доля рынка</button>
        <button class="btn-glass" onclick="AppUI.switchTab('analytics'); AppUI.closeSheet();">📊 Аналитика & KPI</button>
        <button class="btn-glass" onclick="AppDebug.openConsoleModal(); AppUI.closeSheet();" style="color: var(--accent-orange);">🛠️ Консоль отладки</button>
        <button class="btn-glass" onclick="AppStorage.reset();" style="color: var(--accent-red);">Сброс игры</button>
      </div>
    `;
    this.openSheet("Навигация", html);
  },

  renderTimeAndBalance() {
    const s = AppState.get();
    const timeEl = document.getElementById("time-display");
    const balEl = document.getElementById("topbar-balance");

    if (timeEl && typeof AppTime !== "undefined") {
      timeEl.innerText = AppTime.getFormattedTime();
    }
    if (balEl && s.finances) {
      balEl.innerText = Math.round(s.finances.balance).toLocaleString();
    }
  },

  renderDashboard() {
    const s = AppState.get();

    const balanceEl = document.getElementById("stat-balance");
    if (balanceEl) balanceEl.innerText = `€${Math.round(s.finances.balance).toLocaleString()}`;

    const netEl = document.getElementById("stat-daily-net");
    if (netEl) {
      netEl.innerText = `${s.finances.dailyNet >= 0 ? '+' : ''}€${Math.round(s.finances.dailyNet).toLocaleString()} / день`;
    }

    const revEl = document.getElementById("stat-revenue");
    if (revEl) revEl.innerText = `€${Math.round(s.finances.todayRevenue).toLocaleString()}`;

    const expEl = document.getElementById("stat-expenses");
    if (expEl) expEl.innerText = `€${Math.round(s.finances.todayExpenses).toLocaleString()}`;

    const fleetSlotsEl = document.getElementById("stat-fleet-slots");
    if (fleetSlotsEl) fleetSlotsEl.innerText = `${s.trucks.length} / ${s.garage.slots}`;

    const repEl = document.getElementById("stat-reputation");
    if (repEl) repEl.innerText = `${s.company.reputation} / 100`;

    const activeTripsCount = s.trips ? s.trips.length : 0;
    const utilization = s.trucks.length > 0 ? Math.round((activeTripsCount / s.trucks.length) * 100) : 0;
    const utilEl = document.getElementById("stat-utilization");
    if (utilEl) utilEl.innerText = `Загрузка: ${utilization}%`;

    const badgeTrips = document.getElementById("badge-active-trips");
    if (badgeTrips) badgeTrips.innerText = activeTripsCount;

    const activeTripsList = document.getElementById("dashboard-active-trips-list");
    if (activeTripsList) {
      if (activeTripsCount === 0) {
        activeTripsList.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-icon">🚛</div>
            <div class="empty-title">Нет техники в рейсах</div>
            <p class="empty-desc">Все доступные тягачи стоят на базе. Заключите контракт на бирже заказов.</p>
            <button class="btn-glass primary small" onclick="AppUI.switchTab('orders')">Перейти к заказам</button>
          </div>
        `;
      } else {
        activeTripsList.innerHTML = s.trips.map(trip => `
          <div class="alert-fleet-item" style="cursor: pointer;" onclick="AppUI.switchTab('trips')">
            <div class="alert-fleet-info">
              <span class="alert-fleet-title">${trip.originCity} ➔ ${trip.destinationCity}</span>
              <span class="alert-fleet-desc">${trip.cargoName} | Прогресс: ${trip.progressPercent}% (${Math.round(trip.remainingDistanceKm)} км)</span>
            </div>
            <span class="badge" style="color: var(--accent-blue);">В пути</span>
          </div>
        `).join('');
      }
    }

    const fleetStatusList = document.getElementById("dashboard-fleet-status-list");
    if (fleetStatusList) {
      fleetStatusList.innerHTML = s.trucks.map(truck => {
        const avgHealth = AppTrucks.calculateAverageHealth(truck);
        return `
          <div class="alert-fleet-item">
            <div class="alert-fleet-info">
              <span class="alert-fleet-title">${truck.model}</span>
              <span class="alert-fleet-desc">${truck.engineType === 'electric' ? 'Батарея' : 'Бак'}: ${Math.round(truck.fuelCurrentL)} / ${truck.fuelTankL} | Состояние: ${avgHealth}%</span>
            </div>
            <button class="btn-glass small" onclick="AppUI.showTruckDetails('${truck.id}')">Инфо</button>
          </div>
        `;
      }).join('');
    }
  },

  showTruckDetails(truckId) {
    const truck = AppState.get().trucks.find(t => t.id === truckId);
    if (!truck) return;

    const html = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="font-weight: 700; font-size: 1.1rem;">${truck.model} (${truck.year})</div>
        <div><strong>Тип привода:</strong> ${truck.engineType === 'electric' ? '⚡ Электрический' : '⛽ Дизельный'}</div>
        <div><strong>Пробег:</strong> ${truck.mileageKm.toLocaleString()} км</div>
        <div><strong>Расход:</strong> ${truck.avgConsumptionL100} ${truck.engineType === 'electric' ? 'кВт/100' : 'л/100'}</div>
        <div><strong>Запас:</strong> ${Math.round(truck.fuelCurrentL)} / ${truck.fuelTankL}</div>
        <hr style="border: 0; border-top: 1px solid var(--glass-border);">
        <div style="font-weight: 600;">Состояние узлов:</div>
        <div>Двигатель: ${Math.round(truck.components.engine)}%</div>
        <div>Трансмиссия: ${Math.round(truck.components.transmission)}%</div>
        <div>Тормоза: ${Math.round(truck.components.brakes)}%</div>
        <div>Шины: ${Math.round(truck.components.tires)}%</div>
      </div>
    `;
    this.openSheet("Карточка техники", html);
  },

  renderAll() {
    this.renderTimeAndBalance();
    this.renderDashboard();
  }
};