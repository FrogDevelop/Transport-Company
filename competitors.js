if (typeof window.COMPETITORS_CATALOG === "undefined") {
  window.COMPETITORS_CATALOG = [
    {
      id: "vanguard",
      name: "Vanguard Logistical",
      country: "Германия",
      icon: "🛡️",
      sharePrice: 450,
      totalShares: 1000,
      dividendYieldPercent: 4.5,
      description: "Крупнейший немецкий контейнерный перевозчик. Стабильные дивидендные выплаты.",
      acquisitionCost: 450000,
      reputationBonus: 15
    },
    {
      id: "nordic",
      name: "Nordic Haul AB",
      country: "Швеция",
      icon: "❄️",
      sharePrice: 680,
      totalShares: 800,
      dividendYieldPercent: 5.2,
      description: "Северный гигант рефрижераторных перевозок. Высокая капитализация.",
      acquisitionCost: 544000,
      reputationBonus: 20
    },
    {
      id: "transalpine",
      name: "TransAlpine Express",
      country: "Австрия",
      icon: "🏔️",
      sharePrice: 320,
      totalShares: 1200,
      dividendYieldPercent: 3.8,
      description: "Горно-логистический оператор Южной Европы. Динамично растущие акции.",
      acquisitionCost: 384000,
      reputationBonus: 12
    }
  ];
}

const AppCompetitors = {
  init() {
    this.ensureState();
  },

  ensureState() {
    const s = AppState.get();
    if (!s.competitorsStock) {
      s.competitorsStock = {};
    }
    if (!Array.isArray(s.acquiredCompetitors)) {
      s.acquiredCompetitors = [];
    }
  },

  buyShares(competitorId, amount = 10) {
    const s = AppState.get();
    this.ensureState();
    const catalog = window.COMPETITORS_CATALOG || [];
    const comp = catalog.find(c => c.id === competitorId);
    if (!comp) return;

    if (s.acquiredCompetitors.includes(competitorId)) {
      AppUI.showToast("Компания уже полностью поглощена вашей корпорацией!", "info");
      return;
    }

    const totalCost = comp.sharePrice * amount;
    const owned = s.competitorsStock[competitorId] || 0;

    if (owned + amount > comp.totalShares) {
      AppUI.showToast("Нельзя купить больше общего числа акций компании!", "error");
      return;
    }

    if (s.finances.balance < totalCost) {
      AppUI.showToast("Недостаточно свободных средств для покупки акций!", "error");
      return;
    }

    s.finances.balance -= totalCost;
    s.finances.todayExpenses += totalCost;
    s.competitorsStock[competitorId] = owned + amount;

    AppStorage.save(s);
    AppUI.renderAll();
    if (typeof AppOfficeHub !== "undefined") AppOfficeHub.renderView();

    AppUI.showToast(`Приобретено ${amount} акций «${comp.name}» за €${totalCost.toLocaleString()}!`, "success");
  },

  sellShares(competitorId, amount = 10) {
    const s = AppState.get();
    this.ensureState();
    const catalog = window.COMPETITORS_CATALOG || [];
    const comp = catalog.find(c => c.id === competitorId);
    if (!comp) return;

    const owned = s.competitorsStock[competitorId] || 0;
    const sellAmount = Math.min(owned, amount);
    if (sellAmount <= 0) {
      AppUI.showToast("У вас нет акций этой компании для продажи!", "error");
      return;
    }

    const totalRevenue = comp.sharePrice * sellAmount;
    s.competitorsStock[competitorId] = owned - sellAmount;

    s.finances.balance += totalRevenue;
    s.finances.todayRevenue += totalRevenue;
    s.finances.totalEarned += totalRevenue;

    AppStorage.save(s);
    AppUI.renderAll();
    if (typeof AppOfficeHub !== "undefined") AppOfficeHub.renderView();

    AppUI.showToast(`Продано ${sellAmount} акций «${comp.name}» за €${totalRevenue.toLocaleString()}.`, "info");
  },

  acquireCompany(competitorId) {
    const s = AppState.get();
    this.ensureState();
    const catalog = window.COMPETITORS_CATALOG || [];
    const comp = catalog.find(c => c.id === competitorId);
    if (!comp || s.acquiredCompetitors.includes(competitorId)) return;

    const owned = s.competitorsStock[competitorId] || 0;
    if (owned < comp.totalShares) {
      AppUI.showToast("Для полного поглощения необходимо выкупить 100% акций компании!", "warning");
      return;
    }

    if (s.finances.balance < comp.acquisitionCost) {
      AppUI.showToast(`Для завершения юридической сделки M&A требуется €${comp.acquisitionCost.toLocaleString()}!`, "error");
      return;
    }

    s.finances.balance -= comp.acquisitionCost;
    s.finances.todayExpenses += comp.acquisitionCost;
    s.acquiredCompetitors.push(competitorId);
    s.company.reputation = Math.min(100, s.company.reputation + comp.reputationBonus);

    AppStorage.save(s);
    AppUI.renderAll();
    if (typeof AppOfficeHub !== "undefined") AppOfficeHub.renderView();

    AppUI.showToast(`🎉 Сделка M&A завершена! Корпорация «${comp.name}» полностью поглощена!`, "success", 8000);
  },

  processDailyDividends() {
    const s = AppState.get();
    this.ensureState();
    const catalog = window.COMPETITORS_CATALOG || [];
    let totalDividends = 0;

    catalog.forEach(comp => {
      const owned = s.competitorsStock[comp.id] || 0;
      if (owned > 0 && !s.acquiredCompetitors.includes(comp.id)) {
        const shareFraction = owned / comp.totalShares;
        const div = Math.round((comp.sharePrice * comp.totalShares) * (comp.dividendYieldPercent / 100 / 365) * shareFraction);
        totalDividends += div;
      }
    });

    if (totalDividends > 0) {
      s.finances.balance += totalDividends;
      s.finances.todayRevenue += totalDividends;
      s.finances.totalEarned += totalDividends;

      if (typeof AppUI !== "undefined") {
        AppUI.showToast(`📈 Получены дивиденды по портфелю акций: +€${totalDividends.toLocaleString()}!`, "info");
      }
    }
  },

  renderStockMarketSubViewHTML() {
    const s = AppState.get();
    this.ensureState();
    const catalog = window.COMPETITORS_CATALOG || [];

    const portfolioValue = catalog.reduce((acc, comp) => {
      const owned = s.competitorsStock[comp.id] || 0;
      return acc + (owned * comp.sharePrice);
    }, 0);

    const acquiredCount = s.acquiredCompetitors.length;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="glass-card" style="padding: 16px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 4px;">Фондовая биржа & M&A (Слияния и поглощения)</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Инвестируйте в акции ИИ-конкурентов, получайте ежедневные дивиденды или выкупите 100% пакет для полного поглощения бизнеса.
          </span>

          <div style="margin-top: 12px; display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="font-size: 0.8rem;">Стоимость портфеля: <strong style="color: var(--accent-green);">€${portfolioValue.toLocaleString()}</strong></div>
            <div style="font-size: 0.8rem;">Поглощено конкурентов: <strong style="color: var(--accent-blue);">${acquiredCount} / ${catalog.length}</strong></div>
          </div>
        </div>

        <div class="terminals-grid">
          ${catalog.map(comp => {
            const owned = s.competitorsStock[comp.id] || 0;
            const isFullyAcquired = s.acquiredCompetitors.includes(comp.id);
            const sharePercent = Math.round((owned / comp.totalShares) * 100);
            const canAfford10 = s.finances.balance >= (comp.sharePrice * 10);
            const canAcquire = owned >= comp.totalShares && s.finances.balance >= comp.acquisitionCost;

            return `
              <div class="terminal-card unlocked" style="cursor: default;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.9rem;">
                    ${comp.icon}${comp.name}
                  </div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge ${isFullyAcquired ? 'active' : 'locked'}">
                      ${isFullyAcquired ? '✓ Поглощена (100%)' : `Пакет: ${sharePercent}% (${owned} ак.)`}
                    </span>
                  </div>

                  <p style="font-size: 0.72rem; color: var(--text-secondary); margin: 6px 0; line-height: 1.35;">
                    ${comp.description}
                  </p>
                </div>

                <div class="terminal-bottom-block" style="padding-top: 8px; margin-top: auto;">
                  <div class="terminal-meta" style="font-size: 0.68rem; margin-bottom: 6px;">
                    <span>Цена акции: <strong style="color: var(--accent-blue);">€${comp.sharePrice}</strong></span>
                    <span style="color: var(--accent-green);">Доходность: ~${comp.dividendYieldPercent}% год.</span>
                  </div>

                  ${isFullyAcquired ? `
                    <div style="text-align: center; color: var(--accent-green); font-size: 0.75rem; font-weight: 700; padding: 6px;">
                      ★ Корпорация под вашим контролем
                    </div>
                  ` : `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
                      <button class="btn-glass primary small" ${!canAfford10 ? 'disabled' : ''} onclick="AppCompetitors.buyShares('${comp.id}', 10)">
                        +10 акций (€${(comp.sharePrice * 10).toLocaleString()})
                      </button>
                      <button class="btn-glass small" ${owned <= 0 ? 'disabled' : ''} onclick="AppCompetitors.sellShares('${comp.id}', 10)">
                        Продать 10
                      </button>
                    </div>

                    ${owned >= comp.totalShares ? `
                      <button class="btn-glass primary small" style="width: 100%; background: var(--accent-green); color: #000;" 
                        ${!canAcquire ? 'disabled' : ''} onclick="AppCompetitors.acquireCompany('${comp.id}')">
                        Поглотить M&A (€${comp.acquisitionCost.toLocaleString()})
                      </button>
                    ` : `
                      <div style="font-size: 0.68rem; color: var(--text-muted); text-align: center; margin-top: 2px;">
                        Для M&A нужно скупить все ${comp.totalShares} акций (сейчас ${owned})
                      </div>
                    `}
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};