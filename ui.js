const AppUI = {
  currentTab: "office_hub",

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
      if (text.includes("⚠️") || text.includes("Недостаточно") || text.includes("Нельзя") || text.includes("Ошибка") || text.includes("СРЫВ") || text.includes("🚫")) {
        type = "error";
      } else if (text.includes("успешно") || text.includes("зачислен") || text.includes("поставлен") || text.includes("Начислено") || text.includes("✓")) {
        type = "success";
      }
      this.showToast(text, type);
    };
  },

  showToast(message, type = "info", durationMs = 2600) {
    this.ensureToastViewport();
    const container = document.getElementById("app-toast-container");
    if (!container) return;

    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "🚫"
    };

    // Создаем мини-тост, накладывающийся в сетку поверх предыдущего
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
      }, 160);
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
    if (tabId === "dashboard") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("dashboard");
      return;
    }
    if (tabId === "licenses") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("licenses");
      return;
    }
    if (tabId === "finances") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("finance_products");
      return;
    }
    if (tabId === "analytics") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("achievements");
      return;
    }

    if (tabId === "fleet" || tabId === "garage") {
      this.currentTab = "garage_hub";
      this.applyTabSwitchDOM("garage_hub");
      if (typeof AppGarage !== "undefined") AppGarage.renderGarageView();
      return;
    }

    if (tabId === "dealership") {
      this.currentTab = "market_hub";
      this.applyTabSwitchDOM("market_hub");
      if (typeof AppMarketHub !== "undefined") AppMarketHub.setSubTab("dealership");
      return;
    }
    if (tabId === "drivers_market") {
      this.currentTab = "market_hub";
      this.applyTabSwitchDOM("market_hub");
      if (typeof AppMarketHub !== "undefined") AppMarketHub.setSubTab("hr");
      return;
    }
    if (tabId === "market") {
      this.currentTab = "market_hub";
      this.applyTabSwitchDOM("market_hub");
      if (typeof AppMarketHub !== "undefined") AppMarketHub.setSubTab("used_fuel");
      return;
    }

    if (tabId === "drivers") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("drivers");
      return;
    }
    if (tabId === "contracts") {
      this.currentTab = "office_hub";
      this.applyTabSwitchDOM("office_hub");
      if (typeof AppOfficeHub !== "undefined") AppOfficeHub.setSubTab("contracts");
      return;
    }

    this.currentTab = tabId;
    this.applyTabSwitchDOM(tabId);

    if (tabId === "office_hub" && typeof AppOfficeHub !== "undefined") AppOfficeHub.renderView();
    if (tabId === "orders" && typeof AppOrders !== "undefined") AppOrders.renderOrdersView();
    if (tabId === "trips" && typeof AppTrips !== "undefined") AppTrips.renderTripsView();
    if (tabId === "garage_hub" && typeof AppGarage !== "undefined") AppGarage.renderGarageView();
    if (tabId === "market_hub" && typeof AppMarketHub !== "undefined") AppMarketHub.renderView();
    if (tabId === "company" && typeof AppCompany !== "undefined") AppCompany.renderCompanyView();
  },

  applyTabSwitchDOM(tabId) {
    document.querySelectorAll(".tab-view").forEach(view => {
      view.classList.toggle("active", view.id === `view-${tabId}`);
    });

    document.querySelectorAll(".nav-item, .tabbar-item").forEach(item => {
      const isActive = item.getAttribute("data-tab") === tabId;
      item.classList.toggle("active", isActive);

      if (isActive && item.classList.contains("tabbar-item")) {
        item.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
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
    if (typeof AppTrips !== "undefined") {
      AppTrips.currentModalTripId = null;
    }
  },

  openMoreMenuSheet() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-glass" onclick="AppUI.switchTab('office_hub'); AppUI.closeSheet();">🏢 Главный офис</button>
        <button class="btn-glass" onclick="AppUI.switchTab('garage_hub'); AppUI.closeSheet();">🏭 Гараж & Флот</button>
        <button class="btn-glass" onclick="AppUI.switchTab('market_hub'); AppUI.closeSheet();">🛍️ Рынок & Закупки</button>
        <button class="btn-glass" onclick="AppUI.switchTab('company'); AppUI.closeSheet();">🏛️ Филиалы & Сеть</button>
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
    if (this.currentTab === "office_hub" && typeof AppOfficeHub !== "undefined" && AppOfficeHub.currentSubTab === "dashboard") {
      AppOfficeHub.renderView();
    }
  },

  renderAll() {
    this.renderTimeAndBalance();
    if (this.currentTab === "office_hub" && typeof AppOfficeHub !== "undefined") AppOfficeHub.renderView();
    if (this.currentTab === "orders" && typeof AppOrders !== "undefined") AppOrders.renderOrdersView();
    if (this.currentTab === "trips" && typeof AppTrips !== "undefined") AppTrips.renderTripsView();
    if (this.currentTab === "garage_hub" && typeof AppGarage !== "undefined") AppGarage.renderGarageView();
    if (this.currentTab === "market_hub" && typeof AppMarketHub !== "undefined") AppMarketHub.renderView();
    if (this.currentTab === "company" && typeof AppCompany !== "undefined") AppCompany.renderCompanyView();
  }
};