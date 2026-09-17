const AppCompany = {
  currentSubTab: "hubs", // 'hubs' | 'freight_builder' | 'market_analytics'

  init() {
    this.ensureWarehousesState();
    this.renderCompanyView();
  },

  ensureWarehousesState() {
    const s = AppState.get();
    if (!Array.isArray(s.warehouses)) {
      s.warehouses = [];
    }

    s.warehouses.forEach(wh => {
      if (typeof wh.currentTons !== "number") wh.currentTons = 0;
      if (typeof wh.level !== "number") wh.level = 1;
    });
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderCompanyView();
  },

  renderCompanyView() {
    const container = document.getElementById("view-company");
    if (!container) return;

    this.ensureWarehousesState();
    const s = AppState.get();
    const ownedCount = s.warehouses.length;
    const totalStorageTons = s.warehouses.reduce((acc, w) => acc + w.capacityTons, 0);
    const totalStoredNow = Math.round(s.warehouses.reduce((acc, w) => acc + w.currentTons, 0));
    const totalDailyRent = Math.round(s.warehouses.reduce((acc, w) => {
      const freeTons = Math.max(0, w.capacityTons - w.currentTons);
      return acc + (freeTons * (w.rentalYieldPerTon || 3.0));
    }, 0));

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <!-- Шапка сети распределительных складов -->
          <div class="market-header-bar" style="margin-bottom: var(--space-3);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.25rem; font-weight: 800;">Складская сеть Европы</h2>
                <span class="badge" style="color: var(--accent-blue);">Хабов: ${ownedCount}/4</span>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                Хранилища: <strong>${totalStoredNow} / ${totalStorageTons} т</strong> • Пассивная субаренда: <strong style="color: var(--accent-green);">+€${totalDailyRent.toLocaleString()}/день</strong>
              </span>
            </div>

            <button class="btn-glass primary small" onclick="AppCompany.openBuyWarehouseModal()">
              + Новый РЦ
            </button>
          </div>

          <!-- Навигация вкладки Сеть -->
          <div class="finance-nav-tabs" style="margin-bottom: var(--space-3); overflow-x: auto;">
            <button class="fin-tab-btn ${this.currentSubTab === 'hubs' ? 'active' : ''}" onclick="AppCompany.setSubTab('hubs')">
              🏬 Терминалы & РЦ (${ownedCount})
            </button>
            <button class="fin-tab-btn ${this.currentSubTab === 'freight_builder' ? 'active' : ''}" onclick="AppCompany.setSubTab('freight_builder')">
              📦 Сборные автопоезда (FTL)
            </button>
            <button class="fin-tab-btn ${this.currentSubTab === 'market_analytics' ? 'active' : ''}" onclick="AppCompany.setSubTab('market_analytics')">
              📊 Аналитика & Субаренда
            </button>
          </div>

          <div id="company-network-subcontent">
            ${this.renderSubContentHTML()}
          </div>
        </div>
      </div>
    `;
  },

  renderSubContentHTML() {
    if (this.currentSubTab === "freight_builder") {
      return this.renderFreightBuilderSubViewHTML();
    }
    if (this.currentSubTab === "market_analytics") {
      return this.renderMarketAnalyticsSubViewHTML();
    }
    return this.renderHubsSubViewHTML();
  },

  // 1. КАРТОЧКИ ПОСТРОЕННЫХ СКЛАДОВ (2 В РЯД)
  renderHubsSubViewHTML() {
    const s = AppState.get();
    const hubs = s.warehouses || [];

    if (hubs.length === 0) {
      return `
        <div class="empty-state-card" style="padding: var(--space-6);">
          <div style="font-size: 2.4rem; margin-bottom: 6px;">🏬</div>
          <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">У компании нет складских распределительных центров</div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.4;">
            Постройте первый распределительный центр (РЦ) в стратегическом городе Европы. Склады автоматически аккумулируют сборные грузы и приносят пассивную прибыль от субаренды.
          </p>
          <button class="btn-glass primary small" onclick="AppCompany.openBuyWarehouseModal()">
            Каталог логистических хабов
          </button>
        </div>
      `;
    }

    return `
      <div class="terminals-grid">
        ${hubs.map(wh => {
          const percent = Math.min(100, Math.round((wh.currentTons / wh.capacityTons) * 100));
          const freeTons = Math.max(0, wh.capacityTons - wh.currentTons);
          const dailyRent = Math.round(freeTons * (wh.rentalYieldPerTon || 3.2));
          const nextTier = (typeof WAREHOUSE_UPGRADE_TIERS !== "undefined")
            ? WAREHOUSE_UPGRADE_TIERS.find(t => t.level === (wh.level || 1) + 1)
            : null;

          return `
            <div class="terminal-card unlocked" style="cursor: default;">
              <div class="terminal-top-block">
                <div class="terminal-title" style="font-size: 0.9rem;">
                  ${wh.icon} ${wh.cityName} • РЦ
                </div>
                <div class="terminal-badge-row">
                  <span class="terminal-badge active">Ур. ${wh.level || 1}</span>
                </div>

                <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
                  ${wh.title}
                </div>

                <!-- Прогресс заполненности склада сборными партиями -->
                <div style="margin: 8px 0 4px 0;">
                  <div class="component-meter" style="height: 5px;">
                    <div class="component-meter-fill good" style="width: ${percent}%;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.66rem; color: var(--text-muted); margin-top: 3px;">
                    <span>Консолидация: <strong>${Math.round(wh.currentTons)}</strong> / ${wh.capacityTons} т</span>
                    <strong style="color: var(--accent-blue);">${percent}%</strong>
                  </div>
                </div>
              </div>

              <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                <div class="terminal-meta" style="font-size: 0.68rem;">
                  <span>Субаренда: <strong style="color: var(--accent-green);">+€${dailyRent}/д</strong></span>
                  <span style="color: var(--text-muted);">Upkeep: €${wh.dailyUpkeep}/д</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                  <button class="btn-glass small" onclick="AppCompany.openWarehouseDetailsModal('${wh.id}')">
                    Детали
                  </button>
                  ${nextTier ? `
                    <button class="btn-glass primary small" onclick="AppCompany.upgradeWarehouse('${wh.id}')">
                      Ур. ${nextTier.level} (€${Math.round(nextTier.cost / 1000)}k)
                    </button>
                  ` : `
                    <span class="badge" style="color: var(--accent-green); justify-content: center;">★ MAX</span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // 2. ПОДВКЛАДКА: ФОРМИРОВАНИЕ СБОРНЫХ АВТОПОЕЗДОВ
  renderFreightBuilderSubViewHTML() {
    const s = AppState.get();
    const hubsWithCargo = (s.warehouses || []).filter(w => w.currentTons >= 12);

    if (hubsWithCargo.length === 0) {
      return `
        <div class="empty-state-card" style="padding: var(--space-6);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">⏳</div>
          <div style="font-weight: 700; font-size: 0.95rem;">Идет накопление сборных грузов на складах</div>
          <p style="font-size: 0.76rem; color: var(--text-muted); max-width: 420px; margin: 6px auto 12px auto; line-height: 1.4;">
            Для отправки сборного автопоезда необходимо накопить минимум 12 тонн консолидированного груза на одном из ваших РЦ.
          </p>
          <span class="badge" style="color: var(--accent-blue);">Скорость: ~4–5 тонн / час</span>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="glass-card" style="padding: 12px 14px;">
          <div style="font-weight: 700; font-size: 0.9rem;">Формирование сборных экспресс-рейсов (FTL)</div>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Консолидированные сборные грузы дают повышенный тариф (+35% к базовой ставке за тонно-километр).
          </span>
        </div>

        <div class="terminals-grid">
          ${hubsWithCargo.map(wh => {
            const availableTons = Math.round(wh.currentTons);
            const targetCity = wh.targetDestinations[Math.floor(Math.random() * wh.targetDestinations.length)] || "Берлин";
            const route = AppOrders.getRouteData(wh.cityName.toLowerCase(), targetCity.toLowerCase());
            const ratePerTon = Math.round(route.distanceKm * 0.38); // Повышенная сборная ставка

            return `
              <div class="terminal-card unlocked" style="cursor: default;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.88rem;">
                    ${wh.cityName} ➔ ${targetCity}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge active">Накоплено: ${availableTons} т</span>
                  </div>

                  <div style="font-size: 0.72rem; color: var(--accent-blue); margin: 6px 0 2px 0;">
                    📦 Сборная партия (Паллеты & Ритейл)
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    Дистанция: ${route.distanceKm} км • Ставка: <strong style="color: var(--accent-green);">€${ratePerTon}/т</strong>
                  </div>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                  <button class="btn-glass primary terminal-action-btn"
                    onclick="AppCompany.openDispatchConsolidatedModal('${wh.id}', '${targetCity}', ${availableTons}, ${ratePerTon})">
                    Назначить тягач на рейс ➔
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // 3. ПОДВКЛАДКА: АНАЛИТИКА И СУБАРЕНДА
  renderMarketAnalyticsSubViewHTML() {
    const s = AppState.get();
    const hubs = s.warehouses || [];

    const totalStorage = hubs.reduce((acc, w) => acc + w.capacityTons, 0);
    const totalStored = Math.round(hubs.reduce((acc, w) => acc + w.currentTons, 0));
    const totalFree = Math.max(0, totalStorage - totalStored);
    const dailyIncome = Math.round(hubs.reduce((acc, w) => acc + (Math.max(0, w.capacityTons - w.currentTons) * (w.rentalYieldPerTon || 3.2)), 0));

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="glass-card" style="padding: 14px 16px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Экономика субаренды складских площадей</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Все свободные тонны хранилищ автоматически сдаются региональным дистрибьюторам. Доход начисляется ежесуточно в полночь.
          </span>

          <table class="spec-detail-table" style="margin-top: 12px;">
            <tr>
              <td style="color: var(--text-muted);">Всего складских комплексов в сети:</td>
              <td><strong>${hubs.length} РЦ</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Общая емкость хранения:</td>
              <td><strong>${totalStorage} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Занято сборными грузами (к отправке):</td>
              <td style="color: var(--accent-blue);"><strong>${totalStored} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Сдано в субаренду фабрикам Европы:</td>
              <td style="color: var(--accent-green);"><strong>${totalFree} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Пассивный суточный доход со складов:</td>
              <td style="color: var(--accent-green); font-size: 0.95rem;"><strong>+€${dailyIncome.toLocaleString()} / день</strong></td>
            </tr>
          </table>
        </div>
      </div>
    `;
  },

  // Модалка покупки нового распределительного хаба
  openBuyWarehouseModal() {
    const s = AppState.get();
    const catalog = (typeof WAREHOUSE_HUBS_CATALOG !== "undefined") ? WAREHOUSE_HUBS_CATALOG : [];
    const ownedIds = (s.warehouses || []).map(w => w.id);
    const available = catalog.filter(w => !ownedIds.includes(w.id));

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3); max-height: 75vh;">
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700;">Приобретение логистического терминала</h4>
          <span style="font-size: 0.74rem; color: var(--text-muted);">Выберите транспортный узел для постройки</span>
        </div>

        ${available.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">★</div>
            <div style="font-weight: 700;">Все ключевые РЦ Европы уже построены!</div>
          </div>
        ` : `
          <div class="terminals-grid" style="overflow-y: auto; padding-bottom: 10px;">
            ${available.map(wh => {
              const canAfford = s.finances.balance >= wh.cost;

              return `
                <div class="terminal-card unlocked" style="cursor: default; padding: 10px 12px;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.88rem;">${wh.icon} ${wh.cityName}</div>
                    <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 3px 0;">${wh.title}</div>
                    <p style="font-size: 0.68rem; color: var(--text-muted); line-height: 1.35; margin: 4px 0;">${wh.desc}</p>
                  </div>

                  <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                    <div class="terminal-meta" style="font-size: 0.68rem;">
                      <span>Вместимость: <strong>${wh.baseCapacityTons} т</strong></span>
                      <strong style="color: var(--accent-green); font-size: 0.82rem;">€${wh.cost.toLocaleString()}</strong>
                    </div>
                    <button class="btn-glass primary terminal-action-btn" style="margin-top: 4px;"
                      ${!canAfford ? 'disabled' : ''}
                      onclick="AppCompany.purchaseWarehouse('${wh.id}')">
                      ${canAfford ? 'Построить РЦ' : 'Не хватает €'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    AppUI.openSheet("Каталог складских хабов", html);
  },

  purchaseWarehouse(warehouseId) {
    const s = AppState.get();
    const catalog = (typeof WAREHOUSE_HUBS_CATALOG !== "undefined") ? WAREHOUSE_HUBS_CATALOG : [];
    const template = catalog.find(w => w.id === warehouseId);
    if (!template) return;

    if (s.finances.balance < template.cost) {
      AppUI.showToast("Недостаточно средств для постройки РЦ!", "error");
      return;
    }

    s.finances.balance -= template.cost;
    s.finances.todayExpenses += template.cost;
    s.finances.totalSpent += template.cost;

    const newWh = {
      id: template.id,
      cityName: template.cityName,
      country: template.country,
      title: template.title,
      icon: template.icon,
      level: 1,
      capacityTons: template.baseCapacityTons,
      currentTons: 15, // Стартовая партия
      dailyUpkeep: template.dailyUpkeep,
      accumulationRatePerHour: template.accumulationRatePerHour,
      rentalYieldPerTon: template.rentalYieldPerTon,
      targetDestinations: template.targetDestinations
    };

    s.warehouses.push(newWh);
    s.company.reputation = Math.min(100, s.company.reputation + 4);

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    this.renderCompanyView();

    AppUI.showToast(`Логистический комплекс в г. ${template.cityName} введен в строй!`, "success");
  },

  upgradeWarehouse(warehouseId) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    if (!wh) return;

    const currentLvl = wh.level || 1;
    const nextTier = (typeof WAREHOUSE_UPGRADE_TIERS !== "undefined")
      ? WAREHOUSE_UPGRADE_TIERS.find(t => t.level === currentLvl + 1)
      : null;
    if (!nextTier) return;

    if (s.finances.balance < nextTier.cost) {
      AppUI.showToast("Недостаточно средств для модернизации РЦ!", "error");
      return;
    }

    s.finances.balance -= nextTier.cost;
    s.finances.todayExpenses += nextTier.cost;

    wh.level = nextTier.level;
    wh.capacityTons = Math.round(wh.capacityTons * 1.5);
    wh.accumulationRatePerHour = Math.round((wh.accumulationRatePerHour * 1.3) * 10) / 10;
    wh.dailyUpkeep += 40;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderCompanyView();

    AppUI.showToast(`РЦ ${wh.cityName} модернизирован до Уровня ${nextTier.level}! Емкость расширена.`, "success");
  },

  openWarehouseDetailsModal(warehouseId) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    if (!wh) return;

    const percent = Math.min(100, Math.round((wh.currentTons / wh.capacityTons) * 100));
    const freeTons = Math.max(0, wh.capacityTons - wh.currentTons);
    const rentRevenue = Math.round(freeTons * (wh.rentalYieldPerTon || 3.2));

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">${wh.icon} РЦ ${wh.cityName}</h3>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${wh.title} (Уровень ${wh.level || 1})</span>
          </div>
          <span class="badge active">${percent}% заполнен</span>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Вместимость хранилища:</td>
            <td><strong>${wh.capacityTons} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Сборного груза на складе:</td>
            <td style="color: var(--accent-blue);"><strong>${Math.round(wh.currentTons)} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Свободно под субаренду:</td>
            <td style="color: var(--accent-green);"><strong>${freeTons} тонн</strong> (+€${rentRevenue}/день)</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Скорость консолидации:</td>
            <td>~${wh.accumulationRatePerHour} т / игровой час</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Содержание комплекса:</td>
            <td style="color: var(--accent-orange);">-€${wh.dailyUpkeep} / день</td>
          </tr>
        </table>
      </div>
    `;

    AppUI.openSheet("Спецификация распределительного центра", html);
  },

  // Модалка назначения тягача на сборный рейс
  openDispatchConsolidatedModal(warehouseId, destinationCity, availableTons, ratePerTon) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    if (!wh) return;

    const idleTrucks = (s.trucks || []).filter(t => t.status === "idle");
    const route = AppOrders.getRouteData(wh.cityName.toLowerCase(), destinationCity.toLowerCase());

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3); max-height: 75vh;">
        <div>
          <div style="font-size: 0.95rem; font-weight: 800;">${wh.cityName} ➔ ${destinationCity}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
            Сборный автопоезд • Доступно на складе: <strong>${availableTons} т</strong> • Расстояние: <strong>${route.distanceKm} км</strong>
          </div>
        </div>

        ${idleTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">🚛</div>
            <div style="font-weight: 700; font-size: 0.9rem;">Нет свободных тягачей</div>
            <p style="font-size: 0.76rem; color: var(--text-muted);">
              Дождитесь возвращения машин из рейсов для загрузки партии.
            </p>
          </div>
        ` : `
          <div class="terminals-grid" style="overflow-y: auto; padding-bottom: 10px;">
            ${idleTrucks.map(rawTruck => {
              const truck = AppTrucks.ensureTruckSpecs(rawTruck);
              const driver = s.drivers ? s.drivers.find(d => d.id === truck.assignedDriverId) : null;
              const currentPayload = AppTrucks.getTruckCurrentPayloadTons(truck);

              const loadTons = Math.min(currentPayload, availableTons);
              const payout = Math.round(loadTons * ratePerTon);

              const hasDriver = !!driver;
              const isRested = hasDriver && driver.stamina >= 20;
              const hasFuel = truck.fuelCurrentL >= 15;
              const canDispatch = hasDriver && isRested && hasFuel;

              return `
                <div class="terminal-card unlocked" style="cursor: default; padding: 10px 11px;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.86rem;">${truck.model}</div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${canDispatch ? 'active' : 'locked'}">
                        Загрузка: ${loadTons} т
                      </span>
                    </div>

                    <div style="font-size: 0.7rem; color: var(--accent-green); font-weight: 700; margin: 4px 0 2px 0;">
                      Выручка: €${payout.toLocaleString()}
                    </div>
                    <div style="font-size: 0.68rem; color: var(--text-muted);">
                      ${driver ? `👨‍✈️ ${driver.name.split(' ')[0]} (${Math.round(driver.stamina)}%)` : '⚠️ Нет шофера'}
                    </div>
                  </div>

                  <div class="terminal-bottom-block" style="padding-top: 5px; margin-top: 6px;">
                    <button class="btn-glass primary terminal-action-btn"
                      ${!canDispatch ? 'disabled' : ''}
                      onclick="AppCompany.dispatchConsolidatedTrip('${wh.id}', '${destinationCity}', '${truck.id}', ${loadTons}, ${payout})">
                      ${canDispatch ? 'Отправить FTL ➔' : 'Не готов'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    AppUI.openSheet("Отправка сборного автопоезда", html);
  },

  dispatchConsolidatedTrip(warehouseId, destinationCity, truckId, tons, payout) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!wh || !rawTruck) return;

    const truck = AppTrucks.ensureTruckSpecs(rawTruck);
    const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
    if (!driver) return;

    wh.currentTons = Math.max(0, wh.currentTons - tons);

    const route = AppOrders.getRouteData(wh.cityName.toLowerCase(), destinationCity.toLowerCase());
    const initialEstimatedMinutes = Math.round((route.distanceKm / 75) * 60);

    const newTrip = {
      id: "trp-ftl-" + Date.now().toString(36),
      contractId: null,
      orderId: null,
      originCity: wh.cityName,
      destinationCity: destinationCity,
      cargoName: "Сборный сборный груз (FTL Express)",
      cargoIcon: "📦",
      weightTons: tons,
      totalDistanceKm: route.distanceKm,
      remainingDistanceKm: route.distanceKm,
      tollCost: route.tollCost,
      payout: payout,
      truckId: truck.id,
      driverId: driver.id,
      truckSpeedKmh: 75,
      estimatedMinutesRemaining: initialEstimatedMinutes,
      status: "active",
      refuelStopRemainingMinutes: 0,
      progressPercent: 0
    };

    truck.status = "trip";
    driver.status = "driving";

    s.trips.push(newTrip);
    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();

    AppUI.showToast(`Сборный автопоезд ${truck.model} (${tons} т) отправлен со склада ${wh.cityName} в ${destinationCity}!`, "success");
  },

  // Фоновое накопление тонн груза на складах (вызывается каждую минуту из time.js)
  tickWarehouses() {
    const s = AppState.get();
    if (!Array.isArray(s.warehouses) || s.warehouses.length === 0) return;

    s.warehouses.forEach(wh => {
      if (wh.currentTons < wh.capacityTons) {
        const ratePerMinute = (wh.accumulationRatePerHour || 4.0) / 60;
        wh.currentTons = Math.min(wh.capacityTons, wh.currentTons + ratePerMinute);
      }
    });
  },

  // Начисление суточного дохода от субаренды (вызывается в полночь из time.js)
  processDailyWarehouseSublease() {
    const s = AppState.get();
    if (!Array.isArray(s.warehouses) || s.warehouses.length === 0) return;

    let totalSubleaseIncome = 0;
    let totalUpkeep = 0;

    s.warehouses.forEach(wh => {
      const freeTons = Math.max(0, wh.capacityTons - wh.currentTons);
      const rent = Math.round(freeTons * (wh.rentalYieldPerTon || 3.2));
      totalSubleaseIncome += rent;
      totalUpkeep += (wh.dailyUpkeep || 0);
    });

    s.finances.balance += totalSubleaseIncome;
    s.finances.todayRevenue += totalSubleaseIncome;
    s.finances.totalEarned += totalSubleaseIncome;

    if (totalSubleaseIncome > 0) {
      AppUI.showToast(`🏢 Поступил суточный доход от субаренды складов: +€${totalSubleaseIncome.toLocaleString()}!`, "info");
    }
  }
};