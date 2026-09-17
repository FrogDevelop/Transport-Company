const AppOfficeHub = {
  currentSubTab: "dashboard", // 'dashboard' | 'licenses' | 'drivers' | 'finance_products' | 'contracts' | 'achievements'

  OFFICE_LEVELS: [
    {
      level: 1,
      title: "Арендный кабинет",
      rankTitle: "Частный перевозчик",
      xpRequired: 0,
      maxDrivers: 3,
      perks: "Штат до 3 водителей. Базовые спотовые перевозки.",
      desc: "Небольшой рабочий кабинет в промзоне. Стартовая площадка для первых шагов в логистике."
    },
    {
      level: 2,
      title: "Операционный офис",
      rankTitle: "Региональный экспедитор",
      xpRequired: 700,
      maxDrivers: 6,
      perks: "Штат до 6 водителей. Доступ к коммерческим кредитам. +3% к росту репутации.",
      desc: "Полноценный диспетчерский пункт. Позволяет расширить команду и привлечь первые заемные средства."
    },
    {
      level: 3,
      title: "Бизнес-центр филиала",
      rankTitle: "Национальный оператор",
      xpRequired: 2400,
      maxDrivers: 10,
      perks: "Штат до 10 водителей. Доступ к закрытым B2B тендерам и долгосрочным контрактам.",
      desc: "Престижный офис в деловом квартале. Открывает крупные регулярные контракты с заводами Европы."
    },
    {
      level: 4,
      title: "Корпоративный комплекс",
      rankTitle: "Международная группа",
      xpRequired: 7000,
      maxDrivers: 16,
      perks: "Штат до 16 водителей. Инвестиционные транши до €200k. Налоговая скидка -5%.",
      desc: "Штаб-квартира с юридическим отделом и собственной бухгалтерией. Снижает накладные издержки."
    },
    {
      level: 5,
      title: "Logix Headquarters Skyscraper",
      rankTitle: "Трансъевропейский синдикат",
      xpRequired: 16000,
      maxDrivers: 30,
      perks: "Штат до 30 водителей. Эксклюзивные контракты класса А, максимальное доверие банков.",
      desc: "Вершина транспортного бизнеса в Европе. Неограниченные возможности масштабирования флота."
    }
  ],

  init() {
    this.ensureCompanyState();
    this.renderView();
  },

  ensureCompanyState() {
    const s = AppState.get();
    if (!s.company) s.company = {};
    if (typeof s.company.level !== "number") s.company.level = 1;
    if (typeof s.company.xp !== "number") s.company.xp = 0;
    if (!Array.isArray(s.company.licenses) || s.company.licenses.length === 0) {
      s.company.licenses = ["lic_standard"];
    }
  },

  getCurrentLevelSpec() {
    this.ensureCompanyState();
    const s = AppState.get();
    const lvl = s.company.level || 1;
    return this.OFFICE_LEVELS.find(l => l.level === lvl) || this.OFFICE_LEVELS[0];
  },

  getNextLevelSpec() {
    this.ensureCompanyState();
    const s = AppState.get();
    const lvl = s.company.level || 1;
    return this.OFFICE_LEVELS.find(l => l.level === lvl + 1) || null;
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderView();
  },

  renderView() {
    const container = document.getElementById("view-office_hub");
    if (!container) return;

    this.ensureCompanyState();
    const s = AppState.get();
    const currentSpec = this.getCurrentLevelSpec();
    const nextSpec = this.getNextLevelSpec();

    const activeContractsCount = s.activeContracts ? s.activeContracts.length : 0;
    const unlockedAchCount = s.unlockedAchievements ? s.unlockedAchievements.length : 0;
    const activeLicensesCount = s.company.licenses ? s.company.licenses.length : 1;

    let xpProgressPercent = 100;
    let xpLabel = `${s.company.xp.toLocaleString()} XP (MAX)`;

    if (nextSpec) {
      const prevThreshold = currentSpec.xpRequired;
      const range = nextSpec.xpRequired - prevThreshold;
      const currentProgress = s.company.xp - prevThreshold;
      xpProgressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
      xpLabel = `${s.company.xp.toLocaleString()} / ${nextSpec.xpRequired.toLocaleString()} XP`;
    }

    container.innerHTML = `
      <div class="view-scroll-content">
        <!-- Шапка штаб-квартиры компании -->
        <div class="glass-card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
          <div class="market-header-bar" style="margin-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.4px;">${s.company.name}</h2>
                <span class="badge" style="color: var(--accent-blue); border-color: rgba(10, 132, 255, 0.4);">
                  Офис Ур. ${currentSpec.level}
                </span>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                «${currentSpec.title}» • Статус: <strong style="color: var(--accent-green);">${currentSpec.rankTitle}</strong>
              </span>
            </div>

            <button class="btn-glass small" onclick="AppOfficeHub.openOfficeLevelsModal()">
              Карта уровней
            </button>
          </div>

          <!-- Полоса опыта -->
          <div style="margin-top: 4px;">
            <div class="garage-progress-bar-bg" style="height: 6px;">
              <div class="garage-progress-bar-fill" style="width: ${xpProgressPercent}%; background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              <span>Опыт компании: <strong>${xpLabel}</strong></span>
              <span>${nextSpec ? `До Ур. ${nextSpec.level}: ${xpProgressPercent}%` : 'Максимальный ранг'}</span>
            </div>
          </div>
        </div>

        <!-- Навигационные вкладки главного офиса -->
        <div class="finance-nav-tabs" style="margin-bottom: var(--space-4); overflow-x: auto;">
          <button class="fin-tab-btn ${this.currentSubTab === 'dashboard' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('dashboard')">
            📊 Сводка & KPI
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'licenses' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('licenses')">
            📜 Лицензии (${activeLicensesCount}/7)
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'drivers' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('drivers')">
            👨‍✈️ Водители (${s.drivers.length}/${currentSpec.maxDrivers})
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'finance_products' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('finance_products')">
            💳 Кредиты & Лизинг
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'contracts' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('contracts')">
            📑 Контракты (${activeContractsCount})
          </button>
          <button class="fin-tab-btn ${this.currentSubTab === 'achievements' ? 'active' : ''}" onclick="AppOfficeHub.setSubTab('achievements')">
            🏆 Достижения (${unlockedAchCount})
          </button>
        </div>

        <!-- Контейнер активного подраздела -->
        <div id="office-hub-subcontent">
          ${this.renderSubContentHTML()}
        </div>
      </div>
    `;
  },

  openOfficeLevelsModal() {
    const s = AppState.get();
    const currentLevel = s.company.level || 1;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <p style="font-size: 0.82rem; color: var(--text-secondary);">
          Опыт (XP) начисляется за каждый доставленный заказ (~30-40 XP):
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${this.OFFICE_LEVELS.map(lvl => {
            const isCurrent = lvl.level === currentLevel;
            const isUnlocked = currentLevel >= lvl.level;

            return `
              <div class="glass-subgroup" style="padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid ${isCurrent ? 'var(--accent-blue)' : (isUnlocked ? 'rgba(48, 209, 88, 0.3)' : 'var(--glass-border)')};">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <div style="font-weight: 700; font-size: 0.9rem;">
                    Ур. ${lvl.level}: ${lvl.title}
                  </div>
                  <span class="badge ${isCurrent ? 'diesel' : (isUnlocked ? 'diesel' : 'used')}">
                    ${isCurrent ? '★ Текущий' : (isUnlocked ? 'Пройден' : `${lvl.xpRequired.toLocaleString()} XP`)}
                  </span>
                </div>

                <div style="font-size: 0.74rem; color: var(--text-muted); margin: 3px 0;">
                  Ранг: <strong>${lvl.rankTitle}</strong>
                </div>

                <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35;">
                  ${lvl.perks}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    AppUI.openSheet("Карта развития офиса", html);
  },

  renderSubContentHTML() {
    switch (this.currentSubTab) {
      case "dashboard":
        return this.renderDashboardSubView();
      case "licenses":
        return this.renderLicensesSubView();
      case "drivers":
        return this.renderDriversSubView();
      case "finance_products":
        return this.renderFinanceProductsSubView();
      case "contracts":
        return this.renderContractsSubView();
      case "achievements":
        return this.renderAchievementsSubView();
      default:
        return this.renderDashboardSubView();
    }
  },

  renderDashboardSubView() {
    const s = AppState.get();
    const activeTripsCount = s.trips ? s.trips.length : 0;
    const utilization = s.trucks.length > 0 ? Math.round((activeTripsCount / s.trucks.length) * 100) : 0;
    const fleetValue = s.trucks.reduce((acc, t) => acc + (t.purchasePrice || 90000), 0);

    return `
      <div class="stats-overview-grid" style="margin-bottom: var(--space-4);">
        <div class="glass-card stat-card primary">
          <div class="card-label">Свободный капитал</div>
          <div class="card-val">€${Math.round(s.finances.balance).toLocaleString()}</div>
          <div class="card-sub-val positive">${s.finances.dailyNet >= 0 ? '+' : ''}€${Math.round(s.finances.dailyNet).toLocaleString()} / день</div>
        </div>
        <div class="glass-card stat-card">
          <div class="card-label">Выручка (Сегодня)</div>
          <div class="card-val" style="color: var(--accent-green);">+€${Math.round(s.finances.todayRevenue).toLocaleString()}</div>
          <div class="card-sub-val neutral">Расходы дня: €${Math.round(s.finances.todayExpenses).toLocaleString()}</div>
        </div>
        <div class="glass-card stat-card">
          <div class="card-label">Парк / Вместимость</div>
          <div class="card-val">${s.trucks.length} / ${s.garage.slots}</div>
          <div class="card-sub-val">В рейсах: ${activeTripsCount} (${utilization}%)</div>
        </div>
        <div class="glass-card stat-card">
          <div class="card-label">Репутация компании</div>
          <div class="card-val highlight">★ ${s.company.reputation} / 100</div>
          <div class="card-sub-val neutral">${s.company.rank || 'Частный перевозчик'}</div>
        </div>
      </div>

      <div class="glass-card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
        <div class="panel-header" style="margin-bottom: 8px;">
          <h3 style="font-size: 1rem; font-weight: 700;">Отчет P&L (Прибыли и убытки компании)</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">Текущая динамика кассовых потоков</span>
        </div>
        ${AppFinance.renderPnLHTML()}
      </div>

      <div class="glass-card" style="padding: var(--space-4);">
        <div class="panel-header" style="margin-bottom: 8px;">
          <h3 style="font-size: 1rem; font-weight: 700;">Операционные показатели & KPI бизнеса</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">Совокупная статистика перевозок и активов</span>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Балансовая стоимость парка техники:</td>
            <td><strong>€${fleetValue.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Всего завершено коммерческих рейсов:</td>
            <td style="color: var(--accent-blue);"><strong>${(s.statistics.completedTripsCount || 0).toLocaleString()} рейсов</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Суммарный пройденный километраж:</td>
            <td><strong>${(s.statistics.totalDistanceDrivenKm || 0).toLocaleString()} км</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Перевезено полезного груза:</td>
            <td style="color: var(--accent-green);"><strong>${(s.statistics.totalCargoHauledTons || 0).toLocaleString()} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Потрачено на топливо и зарядку (оценка):</td>
            <td style="color: var(--accent-orange);">€${Math.round((s.statistics.totalDistanceDrivenKm || 0) * 0.45).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Оплачено дорожных сборов (Toll):</td>
            <td style="color: var(--accent-orange);">€${Math.round((s.statistics.totalDistanceDrivenKm || 0) * 0.14).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Открытых лицензий допуска:</td>
            <td><strong style="color: var(--accent-blue);">${(s.company.licenses || ["lic_standard"]).length} из 7 категорий</strong></td>
          </tr>
        </table>
      </div>
    `;
  },

  renderLicensesSubView() {
    const s = AppState.get();
    const activeLicenses = s.company.licenses || ["lic_standard"];
    const licensesCatalog = (typeof CARGO_LICENSES !== "undefined") ? CARGO_LICENSES : [];
    const rep = s.company.reputation || 0;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Реестр категорий допуска ЕС</h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              На бирже отображаются только заказы открытых категорий. Покупка лицензии сразу расширяет список заказов.
            </span>
          </div>
          <span class="badge" style="color: var(--accent-blue);">
            Активно: ${activeLicenses.length} из ${licensesCatalog.length}
          </span>
        </div>

        <div class="market-trucks-compact-grid">
          ${licensesCatalog.map(lic => {
            const isOwned = activeLicenses.includes(lic.id);
            const hasRep = rep >= lic.minReputation;
            const canAfford = s.finances.balance >= lic.cost;
            const canBuy = !isOwned && hasRep && canAfford;

            return `
              <div class="truck-mini-card" style="cursor: default; justify-content: space-between; border-color: ${isOwned ? 'rgba(48, 209, 88, 0.4)' : 'var(--glass-border)'};">
                <div>
                  <div class="mini-card-top">
                    <span class="mini-card-model" style="-webkit-line-clamp: 1;">${lic.icon} ${lic.name}</span>
                    <span class="mini-card-badge ${isOwned ? 'diesel' : 'used'}">
                      ${isOwned ? '✓ Получена' : (hasRep ? 'Доступна' : `Реп. ${lic.minReputation}+`)}
                    </span>
                  </div>

                  <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">
                    ${lic.desc}
                  </p>
                  <div style="font-size: 0.7rem; color: var(--accent-blue); margin-bottom: 4px;">
                    Ср. доходность: ~€${lic.avgRatePerKmTon.toFixed(2)} / т·км
                  </div>
                </div>

                <div class="mini-card-price-row" style="margin-top: 6px;">
                  ${isOwned ? `
                    <div style="text-align: center; color: var(--accent-green); font-size: 0.75rem; font-weight: 700; width: 100%; padding: 4px;">
                      ✓ Действующий допуск
                    </div>
                  ` : `
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                      <span style="font-size: 0.68rem; color: var(--text-muted);">Пошлина:</span>
                      <strong style="font-size: 0.82rem; color: var(--accent-green);">€${lic.cost.toLocaleString()}</strong>
                    </div>
                    <button class="btn-glass primary small" style="width: 100%; padding: 5px; font-size: 0.72rem;" 
                      ${!canBuy ? 'disabled' : ''} 
                      onclick="AppOfficeHub.buyLicense('${lic.id}')">
                      ${!hasRep ? `Низкая репутация (<${lic.minReputation})` : (!canAfford ? 'Не хватает средств' : 'Оформить допуск')}
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  buyLicense(licenseId) {
    const s = AppState.get();
    const lic = (typeof CARGO_LICENSES !== "undefined") ? CARGO_LICENSES.find(l => l.id === licenseId) : null;
    if (!lic) return;

    if (!Array.isArray(s.company.licenses)) {
      s.company.licenses = ["lic_standard"];
    }

    if (s.company.licenses.includes(licenseId)) {
      AppUI.showToast("Эта лицензия уже оформлена!", "info");
      return;
    }

    if (s.company.reputation < lic.minReputation) {
      AppUI.showToast(`Недостаточно репутации! Требуется минимум ★ ${lic.minReputation}.`, "error");
      return;
    }

    if (s.finances.balance < lic.cost) {
      AppUI.showToast("Недостаточно средств для оплаты государственной пошлины!", "error");
      return;
    }

    s.finances.balance -= lic.cost;
    s.finances.todayExpenses += lic.cost;
    s.company.licenses.push(lic.id);

    s.company.reputation = Math.min(100, s.company.reputation + 2);

    // Сразу генерируем свежий пул заказов, чтобы появились грузы новой категории
    if (typeof AppOrders !== "undefined") {
      AppOrders.generateOrdersBatch(8);
    }

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderView();

    AppUI.showToast(`Лицензия «${lic.name}» оформлена! На биржу добавлены новые дорогие грузы.`, "success");
  },

  renderDriversSubView() {
    const s = AppState.get();
    const currentSpec = this.getCurrentLevelSpec();
    const isAtLimit = s.drivers.length >= currentSpec.maxDrivers;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Штат водителей: <strong>${s.drivers.length}</strong> из <strong>${currentSpec.maxDrivers}</strong> допустимых на Уровне ${currentSpec.level}
        </span>
        <button class="btn-glass small primary" 
          ${isAtLimit ? 'disabled' : ''} 
          onclick="AppUI.switchTab('market_hub'); AppMarketHub.setSubTab('hr');">
          ${isAtLimit ? 'Лимит штата достигнут' : '+ Нанять водителя'}
        </button>
      </div>

      <div class="drivers-grid">
        ${s.drivers.map(d => AppDrivers.generateDriverCardHTML(d)).join('')}
      </div>
    `;
  },

  renderFinanceProductsSubView() {
    return `
      <div class="glass-card" style="padding: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Финансовые инструменты компании</h3>
            <span style="font-size: 0.74rem; color: var(--text-muted);">Управление кредитными линиями, лизингом и страховыми договорами</span>
          </div>

          <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
            <button class="fleet-filter-chip ${AppFinance.currentSubTab === 'loans' ? 'active' : ''}" onclick="AppFinance.currentSubTab='loans'; AppOfficeHub.renderView();">Кредиты</button>
            <button class="fleet-filter-chip ${AppFinance.currentSubTab === 'leasing' ? 'active' : ''}" onclick="AppFinance.currentSubTab='leasing'; AppOfficeHub.renderView();">Лизинг техники</button>
            <button class="fleet-filter-chip ${AppFinance.currentSubTab === 'insurance' ? 'active' : ''}" onclick="AppFinance.currentSubTab='insurance'; AppOfficeHub.renderView();">Страхование</button>
          </div>
        </div>

        <div id="finance-subview-content" style="margin-top: 10px;">
          ${AppFinance.getSubViewHTML()}
        </div>
      </div>
    `;
  },

  renderContractsSubView() {
      return `
        <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3); flex-wrap: wrap;">
          <button class="fleet-filter-chip ${AppContracts.currentTab === 'active' ? 'active' : ''}" onclick="AppContracts.currentTab='active'; AppOfficeHub.renderView();">Действующие соглашения</button>
          <button class="fleet-filter-chip ${AppContracts.currentTab === 'tenders' ? 'active' : ''}" onclick="AppContracts.currentTab='tenders'; AppOfficeHub.renderView();">Биржа тендеров</button>
        </div>

        <div class="terminals-grid">
          ${AppContracts.currentTab === 'active' ? AppContracts.renderActiveContractsHTML() : AppContracts.renderTendersHTML()}
        </div>
      `;
    },

  renderAchievementsSubView() {
    return `
      <div style="margin-bottom: var(--space-3);">
        <h3 style="font-size: 1rem; font-weight: 700;">Корпоративные достижения & Награды</h3>
        <span style="font-size: 0.74rem; color: var(--text-muted);">Выполняйте условия для получения денежных грантов и роста репутации</span>
      </div>

      ${AppAnalytics.renderAchievementsSubviewHTML()}
    `;
  }
};