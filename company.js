const AppCompany = {
  currentSubTab: "hubs", // 'hubs' | 'freight_builder' | 'market_analytics' | 'infrastructure'

  init() {
    this.ensureWarehousesState();
    this.ensureInfrastructureState();
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
      if (typeof wh.autoSellExcess !== "boolean") wh.autoSellExcess = false;
      if (typeof wh.hasManager !== "boolean") wh.hasManager = false;
    });
  },

  ensureInfrastructureState() {
    const s = AppState.get();
    if (!Array.isArray(s.highwayInfrastructure)) {
      s.highwayInfrastructure = [];
    }
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderCompanyView();
  },

  renderCompanyView() {
    const container = document.getElementById("view-company");
    if (!container) return;

    this.ensureWarehousesState();
    this.ensureInfrastructureState();
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
            <button class="fin-tab-btn ${this.currentSubTab === 'infrastructure' ? 'active' : ''}" onclick="AppCompany.setSubTab('infrastructure')">
              🛣️ Инфраструктура
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
    if (this.currentSubTab === "infrastructure") {
      return this.renderInfrastructureSubViewHTML();
    }
    return this.renderHubsSubViewHTML();
  },

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
                <div class="terminal-title" style="font-size: 0.9rem; display: flex; justify-content: space-between;">
                  <span>${wh.icon} ${wh.cityName}</span>${wh.hasManager ? '<span title="Управляющий нанят" style="color: var(--accent-blue);">🤖</span>' : ''}
                </div>
                <div class="terminal-badge-row">
                  <span class="terminal-badge active">Ур. ${wh.level || 1}</span>
                </div>

                <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
                  ${wh.title}
                </div>

                <div style="margin: 8px 0 4px 0;">
                  <div class="component-meter" style="height: 5px;">
                    <div class="component-meter-fill good" style="width: ${percent}%;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.66rem; color: var(--text-muted); margin-top: 3px;">
                    <span>Консолидация: <strong>${Math.round(wh.currentTons)}</strong> /${wh.capacityTons} т</span>
                    <strong style="color: var(--accent-blue);">${percent}%</strong>
                  </div>
                </div>
              </div>

              <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                <div class="terminal-meta" style="font-size: 0.68rem;">
                  <span>Субаренда: <strong style="color: var(--accent-green);">+€${dailyRent}/д</strong></span>
                  <span style="color: var(--text-muted);">Upkeep: €${wh.dailyUpkeep + (wh.hasManager ? 250 : 0)}/д</span>
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
            Консолидированные сборные грузы дают повышенный тариф (+35% к базовой ставке).
          </span>
        </div>

        <div class="terminals-grid">
          ${hubsWithCargo.map(wh => {
            const availableTons = Math.round(wh.currentTons);
            const targetCity = wh.targetDestinations[Math.floor(Math.random() * wh.targetDestinations.length)] || "Берлин";
            const route = AppOrders.getRouteData(wh.cityName.toLowerCase(), targetCity.toLowerCase());
            const ratePerTon = Math.round(route.distanceKm * 0.30);

            return `
              <div class="terminal-card unlocked" style="cursor: default;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.88rem;">
                    ${wh.cityName} ➔${targetCity}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge active">Накоплено: ${availableTons} т</span>
                  </div>

                  <div style="font-size: 0.72rem; color: var(--accent-blue); margin: 6px 0 2px 0;">
                    📦 Сборная партия (Паллеты)
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    Плечо: ${route.distanceKm} км • Ставка: <strong style="color: var(--accent-green);">€${ratePerTon}/т</strong>
                  </div>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                  <button class="btn-glass primary terminal-action-btn"
                    onclick="AppCompany.openDispatchConsolidatedModal('${wh.id}', '${targetCity}', ${availableTons},${ratePerTon})">
                    Отправить тягач ➔
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

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
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Экономика складов</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Свободные тонны хранилищ сдаются локальным дистрибьюторам. Доход начисляется утром в 08:00.
          </span>

          <table class="spec-detail-table" style="margin-top: 12px;">
            <tr>
              <td style="color: var(--text-muted);">Всего складов:</td>
              <td><strong>${hubs.length} РЦ</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Общая емкость:</td>
              <td><strong>${totalStorage} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Накоплено груза:</td>
              <td style="color: var(--accent-blue);"><strong>${totalStored} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Свободно под субаренду:</td>
              <td style="color: var(--accent-green);"><strong>${totalFree} тонн</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Пассивный суточный доход:</td>
              <td style="color: var(--accent-green); font-size: 0.95rem;"><strong>+€${dailyIncome.toLocaleString()} / д</strong></td>
            </tr>
          </table>
        </div>
      </div>
    `;
  },

  renderInfrastructureSubViewHTML() {
    const s = AppState.get();
    if (!Array.isArray(s.highwayInfrastructure)) s.highwayInfrastructure = [];
    
    const catalog = typeof HIGHWAY_INFRASTRUCTURE_CATALOG !== "undefined" ? HIGHWAY_INFRASTRUCTURE_CATALOG : [];
    const ownedIds = s.highwayInfrastructure.map(o => o.id);

    const totalRevenue = s.highwayInfrastructure.reduce((acc, item) => acc + item.dailyRevenue, 0);
    const totalUpkeep = s.highwayInfrastructure.reduce((acc, item) => acc + item.dailyUpkeep, 0);
    const netProfit = totalRevenue - totalUpkeep;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="glass-card" style="padding: 14px 16px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Инвестиции в трассы Европы</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Мотели, АЗС и СТО обслуживают ИИ-трафик и приносят выплату в начале рабочего дня (08:00).
          </span>

          <table class="spec-detail-table" style="margin-top: 12px;">
            <tr>
              <td style="color: var(--text-muted);">Объектов в собственности:</td>
              <td><strong>${s.highwayInfrastructure.length} / ${catalog.length}</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Валовый пассивный доход:</td>
              <td style="color: var(--accent-green);"><strong>+€${totalRevenue.toLocaleString()} / день</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Содержание объектов:</td>
              <td style="color: var(--accent-orange);"><strong>-€${totalUpkeep.toLocaleString()} / день</strong></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Чистый суточный приток:</td>
              <td style="color: var(--accent-green); font-size: 0.95rem;"><strong>+€${netProfit.toLocaleString()} / день</strong></td>
            </tr>
          </table>
        </div>

        <div class="terminals-grid">
          ${catalog.map(item => {
            const isOwned = ownedIds.includes(item.id);
            const canAfford = s.finances.balance >= item.cost;
            const netItemProfit = item.dailyRevenue - item.dailyUpkeep;

            return `
              <div class="terminal-card ${isOwned ? 'unlocked' : 'locked'}" style="cursor: default;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.88rem;">
                    ${item.icon}${item.name}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge ${isOwned ? 'active' : 'locked'}">
                      ${isOwned ? '✓ В собственности' : item.highway}
                    </span>
                  </div>

                  <p style="font-size: 0.72rem; color: var(--text-secondary); margin: 6px 0; line-height: 1.35;">
                    ${item.desc}
                  </p>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 6px; margin-top: auto;">
                  <div class="terminal-meta" style="font-size: 0.68rem;">
                    <span>Чистая прибыль: <strong style="color: var(--accent-green);">+€${netItemProfit}/д</strong></span>
                    <span style="color: var(--text-muted);">Репутация: +${item.reputationBonus}★</span>
                  </div>

                  ${isOwned ? `
                    <div style="text-align: center; color: var(--accent-green); font-size: 0.75rem; font-weight: 700; padding: 6px; margin-top: 6px;">
                      ✓ Объект работает
                    </div>
                  ` : `
                    <button class="btn-glass primary terminal-action-btn" style="margin-top: 6px;"
                      ${!canAfford ? 'disabled' : ''}
                      onclick="AppCompany.buyInfrastructureFacility('${item.id}')">
                      ${canAfford ? `Купить за €${item.cost.toLocaleString()}` : 'Не хватает €'}
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

  buyInfrastructureFacility(facilityId) {
    const s = AppState.get();
    const catalog = typeof HIGHWAY_INFRASTRUCTURE_CATALOG !== "undefined" ? HIGHWAY_INFRASTRUCTURE_CATALOG : [];
    const item = catalog.find(i => i.id === facilityId);
    if (!item) return;

    if (!Array.isArray(s.highwayInfrastructure)) s.highwayInfrastructure = [];
    if (s.highwayInfrastructure.some(o => o.id === facilityId)) return;

    if (s.finances.balance < item.cost) {
      AppUI.showToast("Недостаточно средств для инвестиции!", "error");
      return;
    }

    s.finances.balance -= item.cost;
    s.finances.todayExpenses += item.cost;

    s.highwayInfrastructure.push({
      id: item.id,
      name: item.name,
      dailyRevenue: item.dailyRevenue,
      dailyUpkeep: item.dailyUpkeep
    });

    s.company.reputation = Math.min(100, s.company.reputation + item.reputationBonus);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderCompanyView();

    AppUI.showToast(`Приобретен объект инфраструктуры: «${item.name}»!`, "success");
  },

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

    const newWh = {
      id: template.id,
      cityName: template.cityName,
      country: template.country,
      title: template.title,
      icon: template.icon,
      level: 1,
      capacityTons: template.baseCapacityTons,
      currentTons: 15,
      dailyUpkeep: template.dailyUpkeep,
      accumulationRatePerHour: template.accumulationRatePerHour,
      rentalYieldPerTon: template.rentalYieldPerTon,
      targetDestinations: template.targetDestinations,
      autoSellExcess: false,
      hasManager: false
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

    AppUI.showToast(`РЦ ${wh.cityName} модернизирован до Уровня ${nextTier.level}!`, "success");
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
            <td style="color: var(--text-muted);">Емкость хранилища:</td>
            <td><strong>${wh.capacityTons} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Накоплено груза:</td>
            <td style="color: var(--accent-blue);"><strong>${Math.round(wh.currentTons)} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Субаренда (за пустоту):</td>
            <td style="color: var(--accent-green);"><strong>+€${rentRevenue}/день</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Содержание комплекса:</td>
            <td style="color: var(--accent-orange);">-€${wh.dailyUpkeep} / день</td>
          </tr>
        </table>

        <div style="margin-top: 4px; border-top: 1px solid var(--glass-border); padding-top: 14px;">
          <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 10px;">Автоматизация (QoL)</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="glass-subgroup" style="padding: 10px 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 700;">Сброс излишков (3PL)</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Продажа сверхлимита за 50% цены</div>
              </div>
              <button class="btn-glass small ${wh.autoSellExcess ? 'primary' : ''}" onclick="AppCompany.toggleAutoSell('${wh.id}')">
                ${wh.autoSellExcess ? '✓ Включен' : 'Выключен'}
              </button>
            </div>

            <div class="glass-subgroup" style="padding: 10px 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 700;">Директор склада</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                  ${wh.hasManager ? 'Сам диспетчирует фуры (Комиссия 10%)' : 'Оклад €250/день'}
                </div>
              </div>
              <button class="btn-glass small ${wh.hasManager ? 'primary' : ''}" 
                ${wh.hasManager ? 'disabled' : ''} 
                onclick="AppCompany.hireManager('${wh.id}')">
                ${wh.hasManager ? '👨‍💼 Нанят' : 'Нанять (€15k)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    AppUI.openSheet("Спецификация распределительного центра", html);
  },

  toggleAutoSell(warehouseId) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    if (!wh) return;

    wh.autoSellExcess = !wh.autoSellExcess;
    AppStorage.save(s);
    this.openWarehouseDetailsModal(warehouseId);
  },

  hireManager(warehouseId) {
    const s = AppState.get();
    const wh = (s.warehouses || []).find(w => w.id === warehouseId);
    if (!wh || wh.hasManager) return;

    if (s.finances.balance < 15000) {
      AppUI.showToast("Недостаточно средств для найма Директора!", "error");
      return;
    }

    s.finances.balance -= 15000;
    s.finances.todayExpenses += 15000;
    wh.hasManager = true;
    
    AppStorage.save(s);
    this.renderCompanyView();
    this.openWarehouseDetailsModal(warehouseId);
    AppUI.showToast(`Директор назначен на склад в г. ${wh.cityName}! Он начнет автоматическую отправку фур.`, "success");
  },

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
            Сборный автопоезд • Доступно: <strong>${availableTons} т</strong> • Расстояние: <strong>${route.distanceKm} км</strong>
          </div>
        </div>

        ${idleTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">🚛</div>
            <div style="font-weight: 700; font-size: 0.9rem;">Нет свободных тягачей</div>
            <p style="font-size: 0.76rem; color: var(--text-muted);">
              Дождитесь возвращения машин из рейсов.
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
      cargoName: "Сборный груз (FTL)",
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

    AppUI.showToast(`Сборный автопоезд ${truck.model} (${tons} т) отправлен из ${wh.cityName} в ${destinationCity}!`, "success");
  },

  tickWarehouses() {
    const s = AppState.get();
    if (!Array.isArray(s.warehouses) || s.warehouses.length === 0) return;

    s.warehouses.forEach(wh => {
      const ratePerMinute = (wh.accumulationRatePerHour || 4.0) / 60;
      
      if (wh.currentTons < wh.capacityTons) {
        wh.currentTons += ratePerMinute;
        
        if (wh.currentTons > wh.capacityTons) {
          const overflow = wh.currentTons - wh.capacityTons;
          wh.currentTons = wh.capacityTons;
          
          if (wh.autoSellExcess) {
            const profit = overflow * 120 * 0.5; 
            s.finances.balance += profit;
            s.finances.todayRevenue += profit;
            s.finances.totalEarned += profit;
          }
        }
      } else if (wh.autoSellExcess) {
        const profit = ratePerMinute * 120 * 0.5;
        s.finances.balance += profit;
        s.finances.todayRevenue += profit;
        s.finances.totalEarned += profit;
      }

      if (wh.hasManager && wh.currentTons >= 16 && s.time.currentMinute % 30 === 0) {
        this.managerAutoDispatch(wh.id);
      }
    });
  },

  managerAutoDispatch(warehouseId) {
    const s = AppState.get();
    const wh = s.warehouses.find(w => w.id === warehouseId);
    if (!wh || wh.currentTons < 16) return;

    const idleTrucks = s.trucks.filter(t => t.status === "idle");
    if (idleTrucks.length === 0) return;

    for (let rawTruck of idleTrucks) {
      const truck = typeof AppTrucks !== "undefined" ? AppTrucks.ensureTruckSpecs(rawTruck) : rawTruck;
      const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
      
      const currentPayload = typeof AppTrucks !== "undefined" ? AppTrucks.getTruckCurrentPayloadTons(truck) : (truck.maxPayloadTons || 24);
      
      const hasDriver = !!driver;
      const isRested = hasDriver && driver.stamina >= 25;
      const hasFuel = truck.fuelCurrentL >= 100;
      
      if (hasDriver && isRested && hasFuel) {
        const loadTons = Math.min(currentPayload, Math.round(wh.currentTons));
        const targetCity = wh.targetDestinations[Math.floor(Math.random() * wh.targetDestinations.length)] || "Берлин";
        const route = typeof AppOrders !== "undefined" ? AppOrders.getRouteData(wh.cityName.toLowerCase(), targetCity.toLowerCase()) : { distanceKm: 400, tollCost: 50 };
        
        const ratePerTon = Math.round(route.distanceKm * 0.25);
        const grossPayout = Math.round(loadTons * ratePerTon);
        const managerFee = Math.round(grossPayout * 0.10);
        const netPayout = grossPayout - managerFee;

        wh.currentTons = Math.max(0, wh.currentTons - loadTons);
        const initialEstimatedMinutes = Math.round((route.distanceKm / 75) * 60);

        const newTrip = {
          id: "trp-ftl-" + Date.now().toString(36),
          contractId: null,
          orderId: null,
          originCity: wh.cityName,
          destinationCity: targetCity,
          cargoName: "FTL (Авто-отправка)",
          cargoIcon: "🤖",
          weightTons: loadTons,
          totalDistanceKm: route.distanceKm,
          remainingDistanceKm: route.distanceKm,
          tollCost: route.tollCost,
          payout: netPayout,
          truckId: truck.id,
          driverId: driver.id,
          truckSpeedKmh: 75,
          estimatedMinutesRemaining: initialEstimatedMinutes,
          status: "active",
          refuelStopRemainingMinutes: 0,
          progressPercent: 0,
          lastEventTitle: `Комиссия менеджера: -€${managerFee.toLocaleString()}`,
          activeEvent: {
            title: "Управляющий РЦ",
            icon: "👨‍💼",
            type: "penalty",
            desc: `Директор организовал рейс и забрал комиссию: €${managerFee.toLocaleString()}`,
            payoutModPercent: 0,
            timeDeltaMinutes: 0
          }
        };

        truck.status = "trip";
        driver.status = "driving";
        s.trips.push(newTrip);
        
        if (typeof AppUI !== "undefined") {
          AppUI.showToast(`🤖 Директор склада ${wh.cityName} отправил FTL-рейс (${loadTons}т) в ${targetCity}.`, "info", 4000);
        }
        
        break;
      }
    }
  },

  // Начисление суточного дохода в 08:00 утра (учитывается в доход наступившего дня)
  processDailyWarehouseSublease() {
    const s = AppState.get();
    let totalPassiveIncome = 0;

    // 1. Субаренда складов
    if (Array.isArray(s.warehouses) && s.warehouses.length > 0) {
      s.warehouses.forEach(wh => {
        const freeTons = Math.max(0, wh.capacityTons - wh.currentTons);
        totalPassiveIncome += Math.round(freeTons * (wh.rentalYieldPerTon || 3.2));
      });
    }

    // 2. Инфраструктура
    if (Array.isArray(s.highwayInfrastructure) && s.highwayInfrastructure.length > 0) {
      s.highwayInfrastructure.forEach(item => {
        totalPassiveIncome += (item.dailyRevenue - item.dailyUpkeep);
      });
    }

    // 3. Субаренда тягачей
    let recalledCount = 0;
    if (Array.isArray(s.trucks) && s.trucks.length > 0) {
      s.trucks.forEach(truck => {
        if (truck.status === "sublease") {
          totalPassiveIncome += (truck.subleaseDailyIncome || 1200);

          if (truck.components) {
            Object.keys(truck.components).forEach(comp => {
              truck.components[comp] = Math.max(0, truck.components[comp] - 1.5);
            });
          }

          const sum = Object.values(truck.components).reduce((a, b) => a + b, 0);
          const avgHealth = sum / Object.keys(truck.components).length;

          if (avgHealth < 25) {
            truck.status = "idle";
            delete truck.subleaseDailyIncome;
            recalledCount += 1;
          }
        }
      });
    }

    if (totalPassiveIncome !== 0) {
      s.finances.balance += totalPassiveIncome;
      if (totalPassiveIncome > 0) {
        s.finances.todayRevenue += totalPassiveIncome;
        s.finances.totalEarned += totalPassiveIncome;
      } else {
        s.finances.todayExpenses += Math.abs(totalPassiveIncome);
        s.finances.totalSpent += Math.abs(totalPassiveIncome);
      }

      if (typeof AppUI !== "undefined") {
        AppUI.showToast(`💶 Утреннее поступление пассивного дохода: ${totalPassiveIncome >= 0 ? '+' : ''}€${totalPassiveIncome.toLocaleString()}`, totalPassiveIncome >= 0 ? "success" : "warning", 6000);
      }
    }

    if (recalledCount > 0 && typeof AppUI !== "undefined") {
      AppUI.showToast(`⚠️ ${recalledCount} тягач(а) возвращены из субаренды на базу из-за износа!`, "warning", 7000);
    }

    // 4. Дивиденды по акциям конкурентов (Фаза 4 Шаг 4)
    if (typeof AppCompetitors !== "undefined" && typeof AppCompetitors.processDailyDividends === "function") {
      AppCompetitors.processDailyDividends();
    }
  }
};