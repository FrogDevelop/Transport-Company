const AppFinance = {
  currentSubTab: "pnl",

  LOAN_PACKAGES: [
    { id: "loan-micro", title: "Оборотный микрокредит", principal: 25000, interestRate: 0.08, durationDays: 14, minReputation: 30 },
    { id: "loan-standard", title: "Инвестиционный кредит", principal: 75000, interestRate: 0.12, durationDays: 30, minReputation: 50 },
    { id: "loan-expansion", title: "Синдицированный транш", principal: 200000, interestRate: 0.16, durationDays: 60, minReputation: 75 }
  ],

  INSURANCE_POLICIES: {
    basic: { id: "basic", title: "ОСГО (Базовый полис)", dailyCost: 40, breakdownCoverRatio: 0.0, accidentDeductible: 1500, description: "Обязательное страхование автогражданской ответственности. Не покрывает поломки узлов." },
    comprehensive: { id: "comprehensive", title: "КАСКО Комфорт", dailyCost: 95, breakdownCoverRatio: 0.5, accidentDeductible: 500, description: "Покрывает 50% ущерба при дорожных инцидентах и проколах колес." },
    vip: { id: "vip", title: "VIP Транзит Премиум", dailyCost: 180, breakdownCoverRatio: 0.9, accidentDeductible: 0, description: "Полное покрытие рисков. Нулевая франшиза при авариях и поломках на маршруте." }
  },

  init() { this.renderFinanceView(); },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderFinanceView();
  },

  renderFinanceView() {
    const container = document.getElementById("view-finances");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div style="margin-bottom: var(--space-5);">
          <h2 style="font-size: 1.3rem; font-weight: 700;">Финансовый контроль & Казначейство</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Управление ликвидностью, кредитной нагрузкой и отчетом P&L</span>
        </div>

        <div class="finance-nav-tabs">
          <button class="fin-tab-btn ${this.currentSubTab === 'pnl' ? 'active' : ''}" onclick="AppFinance.setSubTab('pnl')">Отчет о прибылях (P&L)</button>
          <button class="fin-tab-btn ${this.currentSubTab === 'loans' ? 'active' : ''}" onclick="AppFinance.setSubTab('loans')">Кредиты</button>
          <button class="fin-tab-btn ${this.currentSubTab === 'leasing' ? 'active' : ''}" onclick="AppFinance.setSubTab('leasing')">Лизинг техники</button>
          <button class="fin-tab-btn ${this.currentSubTab === 'insurance' ? 'active' : ''}" onclick="AppFinance.setSubTab('insurance')">Страхование флота</button>
        </div>

        <div id="finance-subview-content">
          ${this.getSubViewHTML()}
        </div>
      </div>
    `;
  },

  getSubViewHTML() {
    switch (this.currentSubTab) {
      case "pnl": return this.getPNLHTML();
      case "loans": return this.getLoansHTML();
      case "leasing": return this.getLeasingHTML();
      case "insurance": return this.getInsuranceHTML();
      default: return "";
    }
  },

  getPNLHTML() {
    const s = AppState.get();
    const pnl = (s.finances.pnlHistory && s.finances.pnlHistory.length > 0) 
      ? s.finances.pnlHistory[s.finances.pnlHistory.length - 1] 
      : {
        freightRevenue: s.finances.todayRevenue,
        fuelExpense: 0,
        maintenanceExpense: 0,
        driverWages: 0,
        roadTolls: 0,
        garageUpkeep: s.garage.maintenanceCostDaily,
        loanAndLeasePayments: 0,
        insurancePremium: this.INSURANCE_POLICIES[s.finances.insurancePolicy || "basic"].dailyCost,
        netIncome: s.finances.dailyNet
      };

    const totalRev = pnl.freightRevenue;
    const totalExp = pnl.fuelExpense + pnl.maintenanceExpense + pnl.driverWages + pnl.roadTolls + pnl.garageUpkeep + pnl.loanAndLeasePayments + pnl.insurancePremium;
    const net = totalRev - totalExp;

    return `
      <div class="glass-card">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Отчет о прибылях и убытках (День ${s.time.currentDay})</h3>
        <table class="pnl-table">
          <thead>
            <tr>
              <th>Статья движения денежных средств</th>
              <th style="text-align: right;">Сумма (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="pnl-row-category">Выручка от перевозок грузов</td>
              <td class="pnl-row-val revenue">+€${totalRev.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Затраты на топливо и электроэнергию</td>
              <td class="pnl-row-val expense">-€${pnl.fuelExpense.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Техническое обслуживание и ремонт</td>
              <td class="pnl-row-val expense">-€${pnl.maintenanceExpense.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Зарплатный фонд водителей</td>
              <td class="pnl-row-val expense">-€${pnl.driverWages.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Оплата дорожных сборов (Toll)</td>
              <td class="pnl-row-val expense">-€${pnl.roadTolls.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Содержание базы и гаража</td>
              <td class="pnl-row-val expense">-€${pnl.garageUpkeep.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Платежи по кредитам и лизингу</td>
              <td class="pnl-row-val expense">-€${pnl.loanAndLeasePayments.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Страховые взносы</td>
              <td class="pnl-row-val expense">-€${pnl.insurancePremium.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 2px solid var(--glass-border);">
              <td style="font-weight: 700; font-size: 1rem;">Итоговая чистая прибыль (Net Profit)</td>
              <td class="pnl-row-val ${net >= 0 ? 'net-positive' : 'net-negative'}">
                ${net >= 0 ? '+' : ''}€${net.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  getLoansHTML() {
    const s = AppState.get();
    const activeLoans = s.finances.activeLoans || [];

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-5);">
        ${activeLoans.length > 0 ? `
          <div class="glass-card">
            <h3 style="font-size: 1.05rem; margin-bottom: var(--space-3);">Текущие кредитные обязательства</h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              ${activeLoans.map(loan => `
                <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 14px; border-radius: var(--radius-md);">
                  <div>
                    <div style="font-weight: 700;">${loan.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                      Остаток долга: €${loan.remainingDebt.toLocaleString()} | Дней осталось: ${loan.remainingDays}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="font-weight: 700; color: var(--accent-orange);">-€${loan.dailyPayment}/день</span>
                    <button class="btn-glass small" onclick="AppFinance.payOffLoanEarly('${loan.id}')">Погасить досрочно</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <h3 style="font-size: 1.05rem;">Доступные кредитные линии банков</h3>
        <div class="products-cards-grid">
          ${this.LOAN_PACKAGES.map(pkg => {
            const isEligible = s.company.reputation >= pkg.minReputation;
            const totalRepayment = Math.round(pkg.principal * (1 + pkg.interestRate));
            const dailyPayment = Math.round(totalRepayment / pkg.durationDays);

            return `
              <div class="finance-product-card">
                <div>
                  <div class="product-card-title">${pkg.title}</div>
                  <div class="product-amount-tag">€${pkg.principal.toLocaleString()}</div>
                  <div class="product-conditions-list">
                    <div class="product-condition-row">
                      <span>Ставка:</span>
                      <strong>${Math.round(pkg.interestRate * 100)}%</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Срок кредита:</span>
                      <strong>${pkg.durationDays} дней</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Платеж в день:</span>
                      <strong style="color: var(--accent-orange);">€${dailyPayment} / день</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Мин. репутация:</span>
                      <strong>${pkg.minReputation}</strong>
                    </div>
                  </div>
                </div>

                <button class="btn-glass primary" 
                  ${!isEligible ? 'disabled' : ''} 
                  onclick="AppFinance.takeLoan('${pkg.id}')">
                  ${isEligible ? 'Оформить займ' : 'Недостаточно репутации'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  getLeasingHTML() {
    const s = AppState.get();
    const activeLeases = s.finances.activeLeases || [];

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-5);">
        ${activeLeases.length > 0 ? `
          <div class="glass-card">
            <h3 style="font-size: 1.05rem; margin-bottom: var(--space-3);">Тягачи в коммерческом лизинге</h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              ${activeLeases.map(lease => `
                <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 14px; border-radius: var(--radius-md);">
                  <div>
                    <div style="font-weight: 700;">${lease.modelName}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                      Остаток выкупа: €${lease.remainingBuyout.toLocaleString()} | Дней до выкупа: ${lease.remainingDays}
                    </div>
                  </div>
                  <span style="font-weight: 700; color: var(--accent-orange);">-€${lease.dailyPayment}/день</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <h3 style="font-size: 1.05rem;">Каталог техники в лизинг (Первый взнос 20%)</h3>
        <div class="products-cards-grid">
          ${TRUCK_MODELS.map(truck => {
            const downPayment = Math.round(truck.basePrice * 0.20);
            const leaseTermDays = 40;
            const remainingToPay = Math.round(truck.basePrice * 0.90);
            const dailyPayment = Math.round(remainingToPay / leaseTermDays);

            return `
              <div class="finance-product-card">
                <div>
                  <div class="product-card-title">${truck.modelName}</div>
                  <div class="product-amount-tag" style="font-size: 1.25rem;">€${downPayment.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted);">взнос</span></div>
                  <div class="product-conditions-list">
                    <div class="product-condition-row">
                      <span>Полная цена:</span>
                      <strong>€${truck.basePrice.toLocaleString()}</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Срок лизинга:</span>
                      <strong>${leaseTermDays} дней</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Ежесуточный платеж:</span>
                      <strong style="color: var(--accent-orange);">€${dailyPayment} / день</strong>
                    </div>
                  </div>
                </div>

                <button class="btn-glass primary" onclick="AppFinance.leaseTruck('${truck.modelId}')">
                  Взять в лизинг
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  getInsuranceHTML() {
    const s = AppState.get();
    const currentPolicy = s.finances.insurancePolicy || "basic";

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Страховой полис защищает компанию от внезапных расходов при авариях, поломках на автобанах и проколах покрышек.
        </p>

        <div class="products-cards-grid">
          ${Object.values(this.INSURANCE_POLICIES).map(policy => {
            const isSelected = policy.id === currentPolicy;

            return `
              <div class="insurance-tier-card ${isSelected ? 'selected' : ''}">
                ${isSelected ? `<div class="insurance-badge">Активный полис</div>` : ''}
                <div>
                  <div class="product-card-title">${policy.title}</div>
                  <div class="product-amount-tag">€${policy.dailyCost} <span style="font-size: 0.8rem; color: var(--text-muted);">/ день</span></div>
                  <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: var(--space-3); line-height: 1.4;">
                    ${policy.description}
                  </p>
                  <div class="product-conditions-list">
                    <div class="product-condition-row">
                      <span>Покрытие ремонтов:</span>
                      <strong>${Math.round(policy.breakdownCoverRatio * 100)}%</strong>
                    </div>
                    <div class="product-condition-row">
                      <span>Франшиза ДТП:</span>
                      <strong>€${policy.accidentDeductible}</strong>
                    </div>
                  </div>
                </div>

                <button class="btn-glass ${isSelected ? '' : 'primary'}" 
                  ${isSelected ? 'disabled' : ''} 
                  onclick="AppFinance.selectInsurance('${policy.id}')">
                  ${isSelected ? 'Действующий' : 'Перейти на полис'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  takeLoan(packageId) {
    const pkg = this.LOAN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;

    const s = AppState.get();
    const totalRepayment = Math.round(pkg.principal * (1 + pkg.interestRate));
    const daily = Math.round(totalRepayment / pkg.durationDays);

    s.finances.balance += pkg.principal;
    s.finances.todayRevenue += pkg.principal;

    s.finances.activeLoans.push({
      id: "loan-" + Date.now().toString(36),
      title: pkg.title,
      principal: pkg.principal,
      totalRepayment: totalRepayment,
      remainingDebt: totalRepayment,
      dailyPayment: daily,
      remainingDays: pkg.durationDays
    });

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFinanceView();
    AppUI.showToast(`Кредит «${pkg.title}» оформлен. Зачислено +€${pkg.principal.toLocaleString()}`, "success");
  },

  payOffLoanEarly(loanId) {
    const s = AppState.get();
    const loanIndex = s.finances.activeLoans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) return;

    const loan = s.finances.activeLoans[loanIndex];
    if (s.finances.balance < loan.remainingDebt) {
      AppUI.showToast("Недостаточно средств для полного досрочного погашения займа!", "error");
      return;
    }

    s.finances.balance -= loan.remainingDebt;
    s.finances.todayExpenses += loan.remainingDebt;
    s.finances.activeLoans.splice(loanIndex, 1);

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFinanceView();
    AppUI.showToast(`Кредит «${loan.title}» успешно досрочно закрыт!`, "success");
  },

  leaseTruck(modelId) {
    const s = AppState.get();
    if (s.trucks.length >= s.garage.slots) {
      AppUI.showToast("В гараже нет свободных мест! Расширьте базу для получения тягача.", "warning");
      return;
    }

    const spec = TRUCK_MODELS.find(m => m.modelId === modelId);
    if (!spec) return;

    const downPayment = Math.round(spec.basePrice * 0.20);
    if (s.finances.balance < downPayment) {
      AppUI.showToast("Недостаточно средств для первоначального взноса по лизингу (20%)!", "error");
      return;
    }

    s.finances.balance -= downPayment;
    s.finances.todayExpenses += downPayment;

    const remainingToPay = Math.round(spec.basePrice * 0.90);
    const leaseDays = 40;
    const dailyPay = Math.round(remainingToPay / leaseDays);

    const newTruck = {
      id: "trk-ls-" + Date.now().toString(36),
      model: spec.modelName,
      brand: spec.brand,
      engineType: spec.engineType || "diesel",
      year: 2026,
      mileageKm: 0,
      fuelTankL: spec.fuelTankCapacityL,
      fuelCurrentL: spec.fuelTankCapacityL,
      avgConsumptionL100: spec.baseFuelConsumptionL100,
      assignedDriverId: null,
      status: "idle",
      tuning: [],
      isLeased: true,
      components: { engine: 100, transmission: 100, brakes: 100, suspension: 100, tires: 100, electronics: 100, cooling: 100 },
      purchasePrice: spec.basePrice,
      marketValue: spec.basePrice,
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    };

    s.trucks.push(newTruck);
    s.finances.activeLeases.push({
      id: "ls-" + Date.now().toString(36),
      truckId: newTruck.id,
      modelName: spec.modelName,
      remainingBuyout: remainingToPay,
      dailyPayment: dailyPay,
      remainingDays: leaseDays
    });

    AppStorage.save(s);
    AppUI.renderAll();
    this.renderFinanceView();
    AppUI.showToast(`Договор лизинга оформлен! Тягач ${spec.modelName} поступил в гараж.`, "success");
  },

  selectInsurance(policyId) {
    const s = AppState.get();
    if (!this.INSURANCE_POLICIES[policyId]) return;

    s.finances.insurancePolicy = policyId;
    AppStorage.save(s);
    this.renderFinanceView();
    AppUI.showToast(`Страховой план обновлен: ${this.INSURANCE_POLICIES[policyId].title}`, "info");
  },

  processDailyMidnightAccounting() {
    const s = AppState.get();
    let dailyLoanAndLease = 0;

    for (let i = s.finances.activeLoans.length - 1; i >= 0; i--) {
      const loan = s.finances.activeLoans[i];
      const payment = Math.min(loan.dailyPayment, loan.remainingDebt);
      s.finances.balance -= payment;
      loan.remainingDebt -= payment;
      loan.remainingDays -= 1;
      dailyLoanAndLease += payment;

      if (loan.remainingDebt <= 0 || loan.remainingDays <= 0) {
        s.finances.activeLoans.splice(i, 1);
      }
    }

    for (let i = s.finances.activeLeases.length - 1; i >= 0; i--) {
      const lease = s.finances.activeLeases[i];
      const payment = Math.min(lease.dailyPayment, lease.remainingBuyout);
      s.finances.balance -= payment;
      lease.remainingBuyout -= payment;
      lease.remainingDays -= 1;
      dailyLoanAndLease += payment;

      if (lease.remainingBuyout <= 0 || lease.remainingDays <= 0) {
        const truck = s.trucks.find(t => t.id === lease.truckId);
        if (truck) truck.isLeased = false;
        s.finances.activeLeases.splice(i, 1);
      }
    }

    let totalDriverWages = 0;
    s.drivers.forEach(d => {
      totalDriverWages += d.dailyWage;
      s.finances.balance -= d.dailyWage;
    });

    const insuranceCost = this.INSURANCE_POLICIES[s.finances.insurancePolicy || "basic"].dailyCost;
    s.finances.balance -= insuranceCost;

    if (!s.finances.pnlHistory) s.finances.pnlHistory = [];
    const pnlRecord = {
      day: s.time.currentDay,
      freightRevenue: s.finances.todayRevenue,
      fuelExpense: Math.round(s.trucks.reduce((acc, t) => acc + (t.tco ? t.tco.totalFuelCost : 0), 0)),
      maintenanceExpense: s.finances.todayExpenses,
      driverWages: totalDriverWages,
      roadTolls: 0,
      garageUpkeep: s.garage.maintenanceCostDaily,
      loanAndLeasePayments: dailyLoanAndLease,
      insurancePremium: insuranceCost,
      netIncome: s.finances.todayRevenue - (s.finances.todayExpenses + totalDriverWages + insuranceCost + dailyLoanAndLease + s.garage.maintenanceCostDaily)
    };

    s.finances.pnlHistory.push(pnlRecord);
    if (s.finances.pnlHistory.length > 14) s.finances.pnlHistory.shift();
  }
};