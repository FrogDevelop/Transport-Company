const AppContracts = {
  currentTab: "active",

  init() { this.renderContractsView(); },

  setTab(tab) {
    this.currentTab = tab;
    this.renderContractsView();
  },

  renderContractsView() {
    const container = document.getElementById("view-contracts");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="contracts-header-bar">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700;">Контракты & Корпоративные тендеры</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Долгосрочные соглашения с фиксированными обязательствами</span>
          </div>
        </div>

        <div class="contracts-tabs-row">
          <button class="fin-tab-btn ${this.currentTab === 'active' ? 'active' : ''}" onclick="AppContracts.setTab('active')">
            Действующие договоры (${AppState.get().activeContracts.length})
          </button>
          <button class="fin-tab-btn ${this.currentTab === 'tenders' ? 'active' : ''}" onclick="AppContracts.setTab('tenders')">
            Тендерная биржа
          </button>
        </div>

        <div class="contracts-grid">
          ${this.currentTab === 'active' ? this.renderActiveContractsHTML() : this.renderTendersHTML()}
        </div>
      </div>
    `;
  },

  renderActiveContractsHTML() {
    const s = AppState.get();
    if (s.activeContracts.length === 0) {
      return `
        <div class="glass-card empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">📜</div>
          <div class="empty-title">Нет действующих корпоративных контрактов</div>
          <p class="empty-desc">Заключите долгосрочный контракт на тендерной бирже для обеспечения стабильного притока заказов.</p>
          <button class="btn-glass primary small" onclick="AppContracts.setTab('tenders')">Смотреть тендеры</button>
        </div>
      `;
    }

    return s.activeContracts.map(c => {
      const quotaPercent = Math.min(100, Math.round((c.completedThisCycle / c.weeklyQuotaTrips) * 100));

      return `
        <div class="glass-card contract-card">
          <div class="client-brand-row">
            <div class="client-logo-avatar">${c.logoIcon}</div>
            <div class="client-meta">
              <span class="client-name-title">${c.clientName}</span>
              <span class="client-industry-sub">${c.industry}</span>
            </div>
            <span class="contract-status-pill active">В работе</span>
          </div>

          <div class="quota-tracker-box">
            <div class="quota-labels">
              <span>Норма рейсов за неделю: ${c.completedThisCycle} из ${c.weeklyQuotaTrips}</span>
              <span style="color: ${quotaPercent >= 100 ? 'var(--accent-green)' : 'var(--accent-blue)'};">${quotaPercent}%</span>
            </div>
            <div class="quota-track">
              <div class="quota-fill" style="width: ${quotaPercent}%"></div>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              Дней до аудита выполнения нормы: <strong>${c.daysUntilAudit}</strong>
            </div>
          </div>

          <div class="contract-conditions-grid">
            <div class="contract-condition-cell">
              <span class="condition-label">Оплата за рейс:</span>
              <span class="condition-val reward">€${c.ratePerTrip.toLocaleString()}</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Штраф за срыв SLA:</span>
              <span class="condition-val penalty">-€${c.failurePenalty.toLocaleString()}</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Срок действия:</span>
              <span class="condition-val">${c.remainingTermDays} дней</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Тип прицепа:</span>
              <span class="condition-val">${c.requiredTrailerType}</span>
            </div>
          </div>

          <button class="btn-glass primary small" onclick="AppOrders.generateContractExpressOrder('${c.id}')">
            Сгенерировать рейс по контракту
          </button>
        </div>
      `;
    }).join('');
  },

  renderTendersHTML() {
    const s = AppState.get();

    return TENDERS_CATALOG.map(tnd => {
      const isAlreadySigned = s.activeContracts.some(c => c.catalogId === tnd.id);
      const meetsRep = s.company.reputation >= tnd.minReputation;
      const meetsFleet = s.trucks.length >= tnd.minFleetSize;
      const canApply = !isAlreadySigned && meetsRep && meetsFleet;

      return `
        <div class="glass-card contract-card">
          <div class="client-brand-row">
            <div class="client-logo-avatar">${tnd.logoIcon}</div>
            <div class="client-meta">
              <span class="client-name-title">${tnd.clientName}</span>
              <span class="client-industry-sub">${tnd.industry}</span>
            </div>
            <span class="contract-status-pill tender">Тендер</span>
          </div>

          <div class="contract-conditions-grid">
            <div class="contract-condition-cell">
              <span class="condition-label">Маршрутная сетка:</span>
              <span class="condition-val">${tnd.routeDescription}</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Ставка за рейс:</span>
              <span class="condition-val reward">€${tnd.ratePerTrip.toLocaleString()}</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Квота доставок:</span>
              <span class="condition-val">${tnd.weeklyQuotaTrips} рейсов / 7 дней</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Неустойка за срыв:</span>
              <span class="condition-val penalty">-€${tnd.failurePenalty.toLocaleString()}</span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Мин. репутация:</span>
              <span class="condition-val" style="color: ${meetsRep ? 'var(--text-primary)' : 'var(--accent-red)'}">
                ★ ${tnd.minReputation}
              </span>
            </div>
            <div class="contract-condition-cell">
              <span class="condition-label">Мин. автопарк:</span>
              <span class="condition-val" style="color: ${meetsFleet ? 'var(--text-primary)' : 'var(--accent-red)'}">
                ${tnd.minFleetSize} тягача
              </span>
            </div>
          </div>

          <button class="btn-glass primary" 
            ${!canApply ? 'disabled' : ''} 
            onclick="AppContracts.signContract('${tnd.id}')">
            ${isAlreadySigned ? 'Договор уже заключен' : (canApply ? `Подписать (Аванс +€${tnd.payoutAdvanceBonus.toLocaleString()})` : 'Не соответствует требованиям')}
          </button>
        </div>
      `;
    }).join('');
  },

  signContract(tenderCatalogId) {
    const tnd = TENDERS_CATALOG.find(t => t.id === tenderCatalogId);
    if (!tnd) return;

    const s = AppState.get();
    const contract = {
      id: "cnt-" + Date.now().toString(36),
      catalogId: tnd.id,
      clientName: tnd.clientName,
      industry: tnd.industry,
      logoIcon: tnd.logoIcon,
      weeklyQuotaTrips: tnd.weeklyQuotaTrips,
      completedThisCycle: 0,
      daysUntilAudit: 7,
      ratePerTrip: tnd.ratePerTrip,
      remainingTermDays: tnd.termDays,
      failurePenalty: tnd.failurePenalty,
      requiredTrailerType: tnd.requiredTrailerType
    };

    s.activeContracts.push(contract);
    s.finances.balance += tnd.payoutAdvanceBonus;
    s.finances.todayRevenue += tnd.payoutAdvanceBonus;

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderContractsView();

    AppUI.showToast(`Контракт с "${tnd.clientName}" успешно подписан! Получен аванс €${tnd.payoutAdvanceBonus.toLocaleString()}.`, "success");
  },

  onContractTripCompleted(contractId) {
    const s = AppState.get();
    const contract = s.activeContracts.find(c => c.id === contractId);
    if (contract) {
      contract.completedThisCycle += 1;
      AppStorage.save(s);
    }
  },

  processDailyContracts() {
    const s = AppState.get();
    if (!s.activeContracts || s.activeContracts.length === 0) return;

    for (let i = s.activeContracts.length - 1; i >= 0; i--) {
      const c = s.activeContracts[i];
      c.daysUntilAudit -= 1;
      c.remainingTermDays -= 1;

      if (c.daysUntilAudit <= 0) {
        if (c.completedThisCycle < c.weeklyQuotaTrips) {
          s.finances.balance -= c.failurePenalty;
          s.finances.todayExpenses += c.failurePenalty;
          s.company.reputation = Math.max(10, s.company.reputation - 8);

          AppUI.showToast(`Срыв контракта: "${c.clientName}" удержала неустойку €${c.failurePenalty.toLocaleString()} за невыполнение нормы!`, "error", 5000);
          s.activeContracts.splice(i, 1);
          continue;
        } else {
          c.completedThisCycle = 0;
          c.daysUntilAudit = 7;
        }
      }

      if (c.remainingTermDays <= 0) {
        AppUI.showToast(`Договор с "${c.clientName}" успешно завершен в полном объеме!`, "success");
        s.company.reputation = Math.min(100, s.company.reputation + 4);
        s.activeContracts.splice(i, 1);
      }
    }
  }
};