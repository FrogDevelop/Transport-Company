const AppGarage = {
  currentSubTab: "fleet", // 'fleet' | 'infrastructure' | 'fuel_terminal'

  GARAGE_LEVELS: [
    {
      level: 1,
      title: "Малая стоянка",
      cost: 0,
      slots: 2,
      maxStage: 0,
      repairTimeMinutes: 360, // 6 часов
      tuningTimeMinutes: 0,
      upkeepDaily: 90,
      desc: "Открытая стоянка без инженерных боксов. Тюнинг заблокирован, базовый сервис на сторонних СТО."
    },
    {
      level: 2,
      title: "Логистическая база",
      cost: 45000,
      slots: 4,
      maxStage: 1,
      repairTimeMinutes: 240, // 4 часа
      tuningTimeMinutes: 300, // 5 часов
      upkeepDaily: 170,
      desc: "Оборудован тёплый ангар. Доступен Stage 1 тюнинга и возведение вспомогательных модулей."
    },
    {
      level: 3,
      title: "Технический комплекс",
      cost: 110000,
      slots: 7,
      maxStage: 2,
      repairTimeMinutes: 180, // 3 часа
      tuningTimeMinutes: 180, // 3 часа
      upkeepDaily: 320,
      desc: "Стенды калибровки и ускоренный сервис. Доступен Stage 2 тюнинга и терминал кросс-докинга."
    },
    {
      level: 4,
      title: "Флагманский хаб",
      cost: 240000,
      slots: 12,
      maxStage: 3,
      repairTimeMinutes: 90, // 1.5 часа
      tuningTimeMinutes: 120, // 2 часа
      upkeepDaily: 580,
      desc: "Промышленный логистический центр. Максимальный тюнинг Stage 3 и телематический контроль флота."
    }
  ],

  FACILITIES: [
    {
      id: "hasServiceBay",
      name: "Сервисный бокс СТО",
      shortPerk: "-30% стоимость ремонта",
      icon: "🔧",
      cost: 45000,
      upkeepDaily: 80,
      desc: "Собственные ремонтные ямы и штатные автомеханики снижают стоимость обслуживания узлов на 30%."
    },
    {
      id: "hasFuelStation",
      name: "Оптовая АЗС базы",
      shortPerk: "Оптовый дизель и заправка",
      icon: "⛽",
      cost: 60000,
      upkeepDaily: 65,
      desc: "Резервуарный парк для оптовых поставок дизеля по цене НПЗ и заправки тягачей прямо на базе."
    },
    {
      id: "hasDriverLounge",
      name: "Мотель для экипажей",
      shortPerk: "Отдых в 2 раза быстрее",
      icon: "☕",
      cost: 35000,
      upkeepDaily: 40,
      desc: "Зона отдыха с душевыми и комнатами сна. Восстанавливает бодрость водителей со скоростью 2.0%/мин."
    },
    {
      id: "hasTelematicsCenter",
      name: "Телематика & IoT",
      shortPerk: "+15% скорость рейсов",
      icon: "📡",
      cost: 55000,
      upkeepDaily: 70,
      desc: "Спутниковый GPS-мониторинг магистралей оптимизирует маршруты и сокращает время в пути на 15%."
    },
    {
      id: "hasClimateHangar",
      name: "Крытый паркинг",
      shortPerk: "-10% износ подвески и шин",
      icon: "🏛️",
      cost: 40000,
      upkeepDaily: 50,
      desc: "Климатический ангар защищает машины от осадков и снижает деградацию резины и амортизаторов."
    },
    {
      id: "hasCrossDockTerminal",
      name: "Кросс-докинг хаб",
      shortPerk: "+8% к ставкам заказов",
      icon: "📦",
      cost: 75000,
      upkeepDaily: 110,
      desc: "Складской консолидационный терминал повышает базовый доход со всех рейсов из домашнего города на 8%."
    }
  ],

  FUEL_STATION_LEVELS: [
    { level: 1, title: "Резервуар 10 000 л", capacityLiters: 10000, pumpSpeed: 80, upgradeCost: 0, discountPercent: 0, desc: "Базовый подземный резервуар и одна колонка." },
    { level: 2, title: "Модульный терминал 25 000 л", capacityLiters: 25000, pumpSpeed: 150, upgradeCost: 35000, discountPercent: 5, desc: "Скоростные насосы (150 л/мин) и оптовая скидка 5%." },
    { level: 3, title: "Нефтебаза 60 000 л", capacityLiters: 60000, pumpSpeed: 250, upgradeCost: 75000, discountPercent: 10, desc: "Высоконапорные пистолеты (250 л/мин) и скидка 10%." }
  ],

  EXPANSION_COST_PER_SLOT: 22000,
  BASE_WHOLESALE_FUEL_PRICE: 1.24,

  init() { 
    this.ensureGarageState();
    this.renderGarageView(); 
  },

  ensureGarageState() {
    const s = AppState.get();
    if (!s.garage) return;

    this.FACILITIES.forEach(f => {
      if (typeof s.garage[f.id] !== "boolean") s.garage[f.id] = false;
    });

    if (!s.garage.fuelStation) {
      s.garage.fuelStation = {
        level: 1,
        capacityLiters: 10000,
        currentLiters: 2500,
        pumpSpeedLPerMinute: 80,
        delivery: null
      };
    }
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderGarageView();
  },

  getCurrentLevelSpec() {
    const s = AppState.get();
    const lvl = s.garage.level || 1;
    return this.GARAGE_LEVELS.find(l => l.level === lvl) || this.GARAGE_LEVELS[0];
  },

  getFuelStationLevelSpec() {
    const s = AppState.get();
    const lvl = (s.garage.fuelStation && s.garage.fuelStation.level) || 1;
    return this.FUEL_STATION_LEVELS.find(l => l.level === lvl) || this.FUEL_STATION_LEVELS[0];
  },

  renderGarageView() {
    const s = AppState.get();
    const g = s.garage;
    const viewContainer = document.getElementById("view-garage_hub");
    if (!viewContainer) return;

    this.ensureGarageState();
    const currentSpec = this.getCurrentLevelSpec();
    const usedSlots = s.trucks.length;
    const hasFuelStation = !!g.hasFuelStation;

    if (this.currentSubTab === 'fuel_terminal' && !hasFuelStation) {
      this.currentSubTab = 'fleet';
    }

    viewContainer.innerHTML = `
      <div class="view-scroll-content">
        <div class="orders-viewport-wrapper">
          <div class="market-header-bar" style="margin-bottom: var(--space-3);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.25rem; font-weight: 800;">${g.name}</h2>
                <span class="badge" style="color: var(--accent-blue); border-color: rgba(10, 132, 255, 0.4);">
                  Ур. ${currentSpec.level}
                </span>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                «${currentSpec.title}» • База: <strong>${g.city}</strong> • Upkeep: <strong>€${g.maintenanceCostDaily}/день</strong>
              </span>
            </div>

            <span class="badge" style="color: var(--accent-green);">
              Слотов: ${usedSlots}/${g.slots}
            </span>
          </div>

          <!-- Навигационные вкладки -->
          <div class="finance-nav-tabs" style="margin-bottom: var(--space-3); overflow-x: auto;">
            <button class="fin-tab-btn ${this.currentSubTab === 'fleet' ? 'active' : ''}" onclick="AppGarage.setSubTab('fleet')">
              🚛 Автопарк
            </button>
            <button class="fin-tab-btn ${this.currentSubTab === 'infrastructure' ? 'active' : ''}" onclick="AppGarage.setSubTab('infrastructure')">
              🏭 Инфраструктура
            </button>
            ${hasFuelStation ? `
              <button class="fin-tab-btn ${this.currentSubTab === 'fuel_terminal' ? 'active' : ''}" onclick="AppGarage.setSubTab('fuel_terminal')">
                ⛽ Заправка (${Math.round(g.fuelStation.currentLiters).toLocaleString()} л)
              </button>
            ` : ''}
          </div>

          <div id="garage-subcontent">
            ${this.renderSubContentHTML()}
          </div>
        </div>
      </div>
    `;
  },

  renderSubContentHTML() {
    if (this.currentSubTab === 'infrastructure') {
      return this.renderInfrastructureSubViewHTML();
    }
    if (this.currentSubTab === 'fuel_terminal') {
      return this.renderFuelTerminalSubViewHTML();
    }
    return this.renderFleetSubViewHTML();
  },

  // ИСПРАВЛЕННЫЙ БЛОК: Разделение на тягачи и прицепы
  renderFleetSubViewHTML() {
    const s = AppState.get();
    if (!s.trailers) s.trailers = [];

    const mode = (typeof AppTrucks !== "undefined") ? AppTrucks.displayMode : "trucks";
    const filter = (typeof AppTrucks !== "undefined") ? AppTrucks.currentFilter : "all";

    let filteredTrucks = (s.trucks || []).filter(t => filter === "all" || t.status === filter);
    let filteredTrailers = (s.trailers || []).filter(t => filter === "all" || t.status === filter);

    return `
      <div class="finance-nav-tabs" style="margin-bottom: var(--space-3); overflow-x: auto; white-space: nowrap; padding-bottom: 4px;">
        <button class="fin-tab-btn ${mode === 'trucks' ? 'active' : ''}" onclick="AppTrucks.setDisplayMode('trucks');">
          🚛 Тягачи (${s.trucks.length})
        </button>
        <button class="fin-tab-btn ${mode === 'trailers' ? 'active' : ''}" onclick="AppTrucks.setDisplayMode('trailers');">
          📦 Полуприцепы (${s.trailers.length})
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); flex-wrap: wrap; gap: 8px;">
        <div class="fleet-filter-group">
          <button class="fleet-filter-chip ${filter === 'all' ? 'active' : ''}" onclick="AppTrucks.setFilter('all')">Все</button>
          <button class="fleet-filter-chip ${filter === 'idle' ? 'active' : ''}" onclick="AppTrucks.setFilter('idle')">На базе</button>
          <button class="fleet-filter-chip ${filter === 'trip' ? 'active' : ''}" onclick="AppTrucks.setFilter('trip')">В работе</button>
        </div>
        <button class="btn-glass primary small" onclick="AppUI.switchTab('market_hub'); AppMarketHub.setSubTab('dealership');">+ В автосалон</button>
      </div>

      ${mode === 'trucks' ? `
        ${filteredTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-6);">
            <div style="font-size: 2.2rem; margin-bottom: 6px;">🚛</div>
            <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">Нет тягачей</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">По выбранному фильтру ничего не найдено.</p>
          </div>
        ` : `
          <div class="terminals-grid">
            ${filteredTrucks.map(truck => AppTrucks.generateCompactFleetCardHTML(truck)).join('')}
          </div>
        `}
      ` : `
        ${filteredTrailers.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-6);">
            <div style="font-size: 2.2rem; margin-bottom: 6px;">📦</div>
            <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">Нет полуприцепов</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">Купите первый полуприцеп в автосалоне, чтобы брать грузы.</p>
          </div>
        ` : `
          <div class="terminals-grid">
            ${filteredTrailers.map(trailer => AppTrucks.generateCompactTrailerCardHTML(trailer)).join('')}
          </div>
        `}
      `}
    `;
  },

  renderInfrastructureSubViewHTML() {
    const s = AppState.get();
    const g = s.garage;
    const currentSpec = this.getCurrentLevelSpec();
    const nextSpec = this.GARAGE_LEVELS.find(l => l.level === currentSpec.level + 1);
    const usedSlots = s.trucks.length;
    const percentFilled = Math.min(100, Math.round((usedSlots / g.slots) * 100));

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="glass-card" style="padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem;">${currentSpec.title}</div>
              <span style="font-size: 0.72rem; color: var(--text-muted);">
                Тюнинг: <strong style="color: var(--accent-green);">${currentSpec.maxStage === 0 ? 'Выкл' : `до Stage ${currentSpec.maxStage}`}</strong> • Ремонт: ~${currentSpec.repairTimeMinutes}м
              </span>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn-glass small" onclick="AppGarage.promptAddSlot()" title="Купить дополнительный слот">
                +1 Слот (€${Math.round(this.EXPANSION_COST_PER_SLOT / 1000)}k)
              </button>
              ${nextSpec ? `
                <button class="btn-glass primary small" onclick="AppGarage.upgradeGarageLevel()">
                  Ур. ${nextSpec.level} (€${Math.round(nextSpec.cost / 1000)}k)
                </button>
              ` : `
                <span class="badge" style="color: var(--accent-green); font-size: 0.68rem;">★ MAX</span>
              `}
            </div>
          </div>

          <div>
            <div class="component-meter" style="height: 5px;">
              <div class="component-meter-fill good" style="width: ${percentFilled}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 3px;">
              <span>Стоянка: <strong>${usedSlots}</strong> из <strong>${g.slots}</strong> мест</span>
              <span>${percentFilled}%</span>
            </div>
          </div>
        </div>

        <div class="terminals-grid">
          ${this.FACILITIES.map(fac => {
            const isBuilt = !!g[fac.id];
            const canAfford = s.finances.balance >= fac.cost;

            return `
              <div class="terminal-card ${isBuilt ? 'unlocked' : 'locked'}" onclick="AppGarage.openFacilityDetailModal('${fac.id}')">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.86rem;">
                    ${fac.icon}${fac.name}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge ${isBuilt ? 'active' : 'locked'}">
                      ${isBuilt ? '✓ Построен' : 'Не куплен'}
                    </span>
                  </div>

                  <div style="font-size: 0.72rem; color: var(--accent-blue); font-weight: 600; margin: 5px 0 2px 0;">
                    ${fac.shortPerk}
                  </div>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 5px; margin-top: auto;">
                  <div class="terminal-meta" style="font-size: 0.68rem;">
                    <span>${isBuilt ? 'Upkeep:' : 'Цена:'}</span>
                    <strong style="color: ${isBuilt ? 'var(--accent-orange)' : 'var(--accent-green)'}; font-size: 0.8rem;">
                      €${(isBuilt ? fac.upkeepDaily : fac.cost).toLocaleString()}${isBuilt ? '/д' : ''}
                    </strong>
                  </div>

                  <button class="btn-glass ${isBuilt ? '' : 'primary'} terminal-action-btn" style="margin-top: 4px;"
                    ${(!isBuilt && !canAfford) ? 'disabled' : ''}
                    onclick="event.stopPropagation(); ${isBuilt ? `AppGarage.openFacilityDetailModal('${fac.id}')` : `AppGarage.buildFacility('${fac.id}')`}">
                    ${isBuilt ? 'Инфо ➔' : (canAfford ? 'Построить' : 'Не хватает €')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openFacilityDetailModal(facilityId) {
    const s = AppState.get();
    const fac = this.FACILITIES.find(f => f.id === facilityId);
    if (!fac) return;

    const isBuilt = !!s.garage[fac.id];
    const canAfford = s.finances.balance >= fac.cost;

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">${fac.icon} ${fac.name}</h3>
            <span style="font-size: 0.74rem; color: var(--accent-blue); font-weight: 600;">
              ${fac.shortPerk}
            </span>
          </div>
          <span class="badge ${isBuilt ? 'active' : 'locked'}">
            ${isBuilt ? 'Активен' : 'Доступен к постройке'}
          </span>
        </div>

        <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
          ${fac.desc}
        </p>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Стоимость возведения:</td>
            <td style="color: var(--accent-green);"><strong>€${fac.cost.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Ежедневное обслуживание (Upkeep):</td>
            <td style="color: var(--accent-orange);"><strong>€${fac.upkeepDaily} / день</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Текущий статус:</td>
            <td><strong>${isBuilt ? '✓ Введен в эксплуатацию' : 'Не возведен'}</strong></td>
          </tr>
        </table>

        ${!isBuilt ? `
          <button class="btn-glass primary" style="width: 100%;"
            ${!canAfford ? 'disabled' : ''}
            onclick="AppUI.closeSheet(); AppGarage.buildFacility('${fac.id}');">
            ${canAfford ? `Построить за €${fac.cost.toLocaleString()}` : 'Недостаточно средств'}
          </button>
        ` : `
          <button class="btn-glass" style="width: 100%;" onclick="AppUI.closeSheet();">
            Закрыть
          </button>
        `}
      </div>
    `;

    AppUI.openSheet("Спецификация инфраструктуры", html);
  },

  renderFuelTerminalSubViewHTML() {
    const s = AppState.get();
    const fs = s.garage.fuelStation;
    const currentSpec = this.getFuelStationLevelSpec();
    const nextSpec = this.FUEL_STATION_LEVELS.find(l => l.level === currentSpec.level + 1);

    const percent = Math.min(100, Math.round((fs.currentLiters / fs.capacityLiters) * 100));
    const effectiveWholesalePrice = Math.round(this.BASE_WHOLESALE_FUEL_PRICE * (1 - currentSpec.discountPercent / 100) * 100) / 100;
    const idleTrucks = s.trucks.filter(t => t.status === "idle" || t.status === "refueling");

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="glass-card" style="padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 1rem; font-weight: 800;">Резервуарный парк</h3>
                <span class="badge" style="color: var(--accent-green);">Ур. ${currentSpec.level}</span>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-muted);">
                «${currentSpec.title}» • Насосы: <strong>${fs.pumpSpeedLPerMinute} л/мин</strong>
              </span>
            </div>

            ${nextSpec ? `
              <button class="btn-glass small primary" onclick="AppGarage.upgradeFuelStationLevel()">
                Апгрейд (€${Math.round(nextSpec.upgradeCost / 1000)}k)
              </button>
            ` : `
              <span class="badge" style="color: var(--accent-green);">★ MAX</span>
            `}
          </div>

          <div style="margin: 8px 0 4px 0;">
            <div class="component-meter" style="height: 6px;">
              <div class="component-meter-fill good" style="width: ${percent}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 3px;">
              <span>Запас: <strong>${Math.round(fs.currentLiters).toLocaleString()} л</strong> из ${fs.capacityLiters.toLocaleString()} л</span>
              <strong style="color: ${percent < 25 ? 'var(--accent-red)' : 'var(--accent-green)'};">${percent}%</strong>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted); border-top: 1px solid var(--glass-border); padding-top: 6px; margin-top: 6px;">
            <span>Опт: <strong style="color: var(--accent-green);">€${effectiveWholesalePrice.toFixed(2)}/л</strong></span>
            <span style="color: var(--accent-blue);">Выгода ~${Math.round((1 - effectiveWholesalePrice / s.market.currentDieselPrice) * 100)}%</span>
          </div>
        </div>

        ${fs.delivery ? this.renderActiveDeliveryCardHTML(fs.delivery) : `
          <div class="glass-card" style="padding: 12px 14px;">
            <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 8px;">Заказ партии дизеля</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              ${this.renderFuelOrderOption(3000, effectiveWholesalePrice)}
              ${this.renderFuelOrderOption(6000, effectiveWholesalePrice)}${this.renderFuelOrderOption(fs.capacityLiters - fs.currentLiters, effectiveWholesalePrice, "Полный")}
            </div>
          </div>
        `}

        <div class="glass-card" style="padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 700; font-size: 0.88rem;">Тягачи на базе</span>
            ${idleTrucks.length > 0 && fs.currentLiters > 500 ? `
              <button class="btn-glass small" onclick="AppGarage.refuelAllTrucks()">Заправить все</button>
            ` : ''}
          </div>

          ${idleTrucks.length === 0 ? `
            <div class="empty-state-card" style="padding: var(--space-4);">
              <div style="font-size: 1.6rem; margin-bottom: 2px;">🚛</div>
              <div style="font-size: 0.82rem; font-weight: 600;">Нет тягачей на базе</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${idleTrucks.map(truck => this.renderTruckRefuelRowHTML(truck, fs)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderFuelOrderOption(liters, pricePerL, label = null) {
    const s = AppState.get();
    const fs = s.garage.fuelStation;
    const cleanLiters = Math.max(0, Math.min(fs.capacityLiters - fs.currentLiters, Math.round(liters)));
    const totalCost = Math.round(cleanLiters * pricePerL);
    const canAfford = s.finances.balance >= totalCost && cleanLiters >= 500;

    return `
      <div class="glass-subgroup" style="padding: 8px; border-radius: var(--radius-sm); text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span style="font-size: 0.68rem; color: var(--text-muted);">${label || `${cleanLiters} л`}</span>
          <div style="font-size: 0.86rem; font-weight: 800; color: var(--accent-green); margin: 2px 0;">
            €${totalCost.toLocaleString()}
          </div>
        </div>
        <button class="btn-glass primary small" style="width: 100%; padding: 4px; font-size: 0.7rem; margin-top: 4px;"
          ${!canAfford ? 'disabled' : ''} 
          onclick="AppGarage.orderFuelDelivery(${cleanLiters}, ${totalCost})">
          ${cleanLiters < 500 ? 'Полон' : 'Заказать'}
        </button>
      </div>
    `;
  },

  renderActiveDeliveryCardHTML(delivery) {
    const phaseTitles = {
      loading: "1/3. Залив на нефтебазе",
      transit: "2/3. Бензовоз в пути",
      unloading: "3/3. Слив в резервуар"
    };

    const phasePercent = Math.min(100, Math.round(((delivery.phaseDuration - delivery.minutesRemainingInPhase) / delivery.phaseDuration) * 100));

    return `
      <div class="glass-card" style="padding: 12px 14px; border-color: rgba(255, 159, 10, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>
            <div style="font-size: 0.86rem; font-weight: 800;">🚛 Бензовоз: ${delivery.liters.toLocaleString()} л</div>
            <span style="font-size: 0.72rem; color: var(--accent-orange); font-weight: 700;">
              ${phaseTitles[delivery.currentPhase]}
            </span>
          </div>
          <span class="badge" style="color: var(--accent-orange); font-size: 0.68rem;">
            ⏱ ${delivery.minutesRemainingInPhase}м
          </span>
        </div>

        <div class="component-meter" style="height: 5px;">
          <div class="component-meter-fill" style="width: ${phasePercent}%; background: var(--accent-orange);"></div>
        </div>
      </div>
    `;
  },

  renderTruckRefuelRowHTML(truck, fs) {
    const isRefueling = truck.status === "refueling";
    const neededLiters = Math.max(0, Math.round(truck.fuelTankL - truck.fuelCurrentL));
    const percent = Math.round((truck.fuelCurrentL / truck.fuelTankL) * 100);
    const hasEnoughFuelInStorage = fs.currentLiters >= neededLiters && neededLiters > 5;
    const canRefuel = !isRefueling && hasEnoughFuelInStorage && percent < 98;
    const refuelDurationMinutes = Math.max(2, Math.round(neededLiters / fs.pumpSpeedLPerMinute));

    return `
      <div class="glass-subgroup" style="padding: 8px 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1; min-width: 0; padding-right: 8px;">
          <div style="font-size: 0.82rem; font-weight: 700;">${truck.model}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;">
            ${Math.round(truck.fuelCurrentL)} / ${truck.fuelTankL} л (${percent}%) • Не хватает: <strong style="color: var(--accent-orange);">${neededLiters} л</strong>
          </div>
        </div>

        <button class="btn-glass primary small" style="padding: 4px 8px; font-size: 0.7rem;"
          ${!canRefuel ? 'disabled' : ''} 
          onclick="AppGarage.refuelTruck('${truck.id}')">
          ${isRefueling ? `Заправка (${truck.busyMinutesRemaining}м)` : (percent >= 98 ? 'Полон' : `Заправить (~${refuelDurationMinutes}м)`)}
        </button>
      </div>
    `;
  },

  orderFuelDelivery(liters, totalCost) {
    const s = AppState.get();
    const fs = s.garage.fuelStation;
    if (!fs || fs.delivery) return;

    if (s.finances.balance < totalCost) {
      AppUI.showToast("Недостаточно средств для закупки топлива!", "error");
      return;
    }

    s.finances.balance -= totalCost;
    s.finances.todayExpenses += totalCost;

    fs.delivery = {
      liters: liters,
      currentPhase: "loading",
      phaseDuration: 30,
      minutesRemainingInPhase: 30,
      totalMinutesRemaining: 150
    };

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast(`Партия топлива (${liters.toLocaleString()} л) заказана!`, "success");
  },

  refuelTruck(truckId) {
    const s = AppState.get();
    const truck = s.trucks.find(t => t.id === truckId);
    const fs = s.garage.fuelStation;
    if (!truck || !fs) return;

    const neededLiters = Math.max(0, truck.fuelTankL - truck.fuelCurrentL);
    if (neededLiters <= 5) {
      AppUI.showToast("Бак тягача уже полон!", "info");
      return;
    }

    if (fs.currentLiters < neededLiters) {
      AppUI.showToast("В резервуарах базы недостаточно дизеля!", "error");
      return;
    }

    fs.currentLiters = Math.max(0, fs.currentLiters - neededLiters);
    const minutes = Math.max(2, Math.round(neededLiters / fs.pumpSpeedLPerMinute));

    truck.status = "refueling";
    truck.busyMinutesRemaining = minutes;
    truck.pendingFuelFillLiters = neededLiters;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast(`Тягач ${truck.model} подключен к колонке (~${minutes}м)!`, "success");
  },

  refuelAllTrucks() {
    const s = AppState.get();
    const fs = s.garage.fuelStation;
    const idleTrucks = s.trucks.filter(t => t.status === "idle" && (t.fuelTankL - t.fuelCurrentL) > 10);
    if (idleTrucks.length === 0) return;

    let count = 0;
    idleTrucks.forEach(trk => {
      const needed = trk.fuelTankL - trk.fuelCurrentL;
      if (fs.currentLiters >= needed) {
        fs.currentLiters -= needed;
        const minutes = Math.max(2, Math.round(needed / fs.pumpSpeedLPerMinute));
        trk.status = "refueling";
        trk.busyMinutesRemaining = minutes;
        trk.pendingFuelFillLiters = needed;
        count++;
      }
    });

    if (count > 0) {
      AppStorage.save(s);
      AppUI.renderAll();
      this.renderGarageView();
      AppUI.showToast(`Заправляются ${count} тягачей одновременно!`, "success");
    } else {
      AppUI.showToast("В резервуаре базы недостаточно топлива!", "error");
    }
  },

  completeTruckRefueling(truck) {
    truck.fuelCurrentL = Math.min(truck.fuelTankL, truck.fuelCurrentL + (truck.pendingFuelFillLiters || 0));
    delete truck.pendingFuelFillLiters;
    truck.status = "idle";
    truck.busyMinutesRemaining = 0;
  },

  upgradeFuelStationLevel() {
    const s = AppState.get();
    const fs = s.garage.fuelStation;
    const currentSpec = this.getFuelStationLevelSpec();
    const nextSpec = this.FUEL_STATION_LEVELS.find(l => l.level === currentSpec.level + 1);
    if (!nextSpec) return;

    if (s.finances.balance < nextSpec.upgradeCost) {
      AppUI.showToast("Недостаточно средств!", "error");
      return;
    }

    s.finances.balance -= nextSpec.upgradeCost;
    s.finances.todayExpenses += nextSpec.upgradeCost;

    fs.level = nextSpec.level;
    fs.capacityLiters = nextSpec.capacityLiters;
    fs.pumpSpeedLPerMinute = nextSpec.pumpSpeed;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast(`Топливный терминал улучшен до Уровня ${nextSpec.level}!`, "success");
  },

  upgradeGarageLevel() {
    const s = AppState.get();
    const currentSpec = this.getCurrentLevelSpec();
    const nextSpec = this.GARAGE_LEVELS.find(l => l.level === currentSpec.level + 1);
    if (!nextSpec) return;

    if (s.finances.balance < nextSpec.cost) {
      AppUI.showToast(`Недостаточно средств для улучшения базы!`, "error");
      return;
    }

    s.finances.balance -= nextSpec.cost;
    s.finances.todayExpenses += nextSpec.cost;

    s.garage.level = nextSpec.level;
    s.garage.slots = Math.max(s.garage.slots, nextSpec.slots);
    s.garage.maintenanceCostDaily += (nextSpec.upkeepDaily - currentSpec.upkeepDaily);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast(`База улучшена до Уровня ${nextSpec.level}!`, "success");
  },

  promptAddSlot() {
    const s = AppState.get();
    if (s.finances.balance < this.EXPANSION_COST_PER_SLOT) {
      AppUI.showToast("Недостаточно средств!", "error");
      return;
    }
    s.finances.balance -= this.EXPANSION_COST_PER_SLOT;
    s.finances.todayExpenses += this.EXPANSION_COST_PER_SLOT;

    s.garage.slots += 1;
    s.garage.maintenanceCostDaily += 30;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast("+1 машиноместо на стоянке базы!", "success");
  },

  buildFacility(facilityId) {
    const s = AppState.get();
    const fac = this.FACILITIES.find(f => f.id === facilityId);
    if (!fac) return;

    if (s.finances.balance < fac.cost) {
      AppUI.showToast("Недостаточно средств!", "error");
      return;
    }

    s.finances.balance -= fac.cost;
    s.finances.todayExpenses += fac.cost;

    s.garage[fac.id] = true;
    s.garage.maintenanceCostDaily += fac.upkeepDaily;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast(`«${fac.name}» введен в эксплуатацию!`, "success");
  }
};