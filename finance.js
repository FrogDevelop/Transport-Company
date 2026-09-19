const AppFinance = {
  currentSubTab: "loans", // 'loans' | 'leasing' | 'insurance' | 'pnl'

  LOAN_OFFERS: [
    { id: "loan-micro", title: "Овердрафт на кассовый разрыв", amount: 25000, dailyInterestPercent: 0.22, durationDays: 14, minReputation: 10 },
    { id: "loan-standart", title: "Коммерческий кредит на флот", amount: 75000, dailyInterestPercent: 0.18, durationDays: 30, minReputation: 30 },
    { id: "loan-expansion", title: "Инвестиционный транш развития", amount: 200000, dailyInterestPercent: 0.15, durationDays: 60, minReputation: 55 }
  ],

  INSURANCE_POLICIES: [
    { id: "basic", name: "Базовый ОСГО (Basic Transit)", dailyCostPerTruck: 18, accidentCoverPercent: 40, desc: "Покрывает 40% ущерба при ДТП и поломках на трассе." },
    { id: "standard", name: "Стандарт КАСКО (Fleet Standard)", dailyCostPerTruck: 36, accidentCoverPercent: 70, desc: "Покрывает 70% ремонта при инцидентах и эвакуацию техники." },
    { id: "premium", name: "Премиум All-Inclusive Cargo & Truck", dailyCostPerTruck: 62, accidentCoverPercent: 95, desc: "95% компенсации затрат ремонта, груза и бесплатное ТО при аварии." }
  ],

  init() {},

  getSubViewHTML() {
    switch (this.currentSubTab) {
      case "loans":
        return this.renderLoansHTML();
      case "leasing":
        return this.renderLeasingHTML();
      case "insurance":
        return this.renderInsuranceHTML();
      case "pnl":
        return this.renderPnLHTML();
      default:
        return this.renderLoansHTML();
    }
  },

  renderPnLHTML() {
    const s = AppState.get();
    const todayNet = s.finances.todayRevenue - s.finances.todayExpenses;
    const isNetPositive = todayNet >= 0;

    return `
      <table class="spec-detail-table">
        <tr>
          <td>Операционная выручка за сегодня:</td>
          <td style="color: var(--accent-green);">+€${Math.round(s.finances.todayRevenue).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Операционные расходы за сегодня:</td>
          <td style="color: var(--accent-orange);">-€${Math.round(s.finances.todayExpenses).toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid var(--glass-border); font-weight: 800;">
          <td>Чистый финансовый итог дня (Net Profit):</td>
          <td style="color: ${isNetPositive ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1rem;">
            ${isNetPositive ? '+' : ''}€${Math.round(todayNet).toLocaleString()}
          </td>
        </tr>
        <tr>
          <td>Совокупный доход за все время:</td>
          <td style="color: var(--accent-green);">€${Math.round(s.finances.totalEarned || 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Совокупные расходы за все время:</td>
          <td style="color: var(--accent-orange);">€${Math.round(s.finances.totalSpent || 0).toLocaleString()}</td>
        </tr>
      </table>
    `;
  },

  renderLoansHTML() {
    const s = AppState.get();
    const activeLoans = s.finances.activeLoans || [];

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        ${activeLoans.length > 0 ? `
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Действующие кредиты</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${activeLoans.map(loan => {
                const dailyPayment = Math.round((loan.principalRemaining / loan.daysRemaining) + (loan.principalRemaining * (loan.dailyInterestPercent / 100)));
                return `
                  <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: var(--radius-md);">
                    <div>
                      <div style="font-weight: 700; font-size: 0.88rem;">${loan.title}</div>
                      <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                        Остаток долга: <strong style="color: var(--accent-orange);">€${Math.round(loan.principalRemaining).toLocaleString()}</strong> | Срок: ${loan.daysRemaining} дн.
                      </div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">
                        Ежесуточный платёж: €${dailyPayment}/день
                      </div>
                    </div>
                    <button class="btn-glass small" onclick="AppFinance.payOffLoanEarly('${loan.id}')">
                      Погасить (€${Math.round(loan.principalRemaining).toLocaleString()})
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            ✓ У компании нет активных кредитных задолженностей.
          </div>
        `}

        <div>
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Доступные банковские линии</h4>
          <div class="terminals-grid">
            ${this.LOAN_OFFERS.map(offer => {
              const rep = s.company.reputation || 0;
              const hasRep = rep >= offer.minReputation;
              const hasActiveSame = activeLoans.some(l => l.offerId === offer.id);

              return `
                <div class="terminal-card unlocked" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.88rem;">💳 ${offer.title}</div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${hasRep ? 'active' : 'locked'}">
                        ${hasRep ? 'Доступен' : `Репутация ${offer.minReputation}+`}
                      </span>
                    </div>

                    <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">
                      Сумма займа: <strong style="color: var(--accent-green);">€${offer.amount.toLocaleString()}</strong><br>
                      Срок возврата: <strong>${offer.durationDays} дней</strong> (${offer.dailyInterestPercent}% в день)
                    </p>
                  </div>

                  <div class="terminal-bottom-block" style="margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--glass-border);">
                    <button class="btn-glass primary small" style="width: 100%;" 
                      ${(!hasRep || hasActiveSame) ? 'disabled' : ''} 
                      onclick="AppFinance.takeLoan('${offer.id}')">
                      ${hasActiveSame ? 'Уже оформлен' : (!hasRep ? `Требуется ★ ${offer.minReputation}` : 'Взять кредит')}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  takeLoan(offerId) {
    const s = AppState.get();
    const offer = this.LOAN_OFFERS.find(o => o.id === offerId);
    if (!offer) return;

    if (!s.finances.activeLoans) s.finances.activeLoans = [];

    s.finances.balance += offer.amount;
    s.finances.totalEarned = (s.finances.totalEarned || 0) + offer.amount;
    s.finances.activeLoans.push({
      id: "loan-" + Date.now().toString(36),
      offerId: offer.id,
      title: offer.title,
      principalRemaining: offer.amount,
      dailyInterestPercent: offer.dailyInterestPercent,
      daysRemaining: offer.durationDays
    });

    AppStorage.save(s);
    AppUI.renderAll();
    AppOfficeHub.renderView();
    AppUI.showToast(`Кредит на сумму €${offer.amount.toLocaleString()} получен!`, "success");
  },

  payOffLoanEarly(loanId) {
    const s = AppState.get();
    const idx = (s.finances.activeLoans || []).findIndex(l => l.id === loanId);
    if (idx === -1) return;

    const loan = s.finances.activeLoans[idx];
    if (s.finances.balance < loan.principalRemaining) {
      AppUI.showToast("Недостаточно средств для досрочного погашения кредита!", "error");
      return;
    }

    s.finances.balance -= loan.principalRemaining;
    s.finances.totalSpent = (s.finances.totalSpent || 0) + loan.principalRemaining;
    s.finances.activeLoans.splice(idx, 1);

    AppStorage.save(s);
    AppUI.renderAll();
    AppOfficeHub.renderView();
    AppUI.showToast(`Кредит «${loan.title}» полностью погашен!`, "success");
  },

  renderLeasingHTML() {
    const s = AppState.get();
    const activeLeases = s.finances.activeLeases || [];
    const availableSlots = s.garage.slots - s.trucks.length;

    const leaseCatalog = (typeof TRUCK_MODELS !== "undefined")
      ? TRUCK_MODELS.slice(0, 6)
      : [];

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Лизинг требует аванс 15% и свободный слот в гараже (Свободно: <strong>${availableSlots}</strong>).
          </span>
        </div>

        ${activeLeases.length > 0 ? `
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Действующие лизинговые договоры</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${activeLeases.map(lease => `
                <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: var(--radius-md);">
                  <div>
                    <div style="font-weight: 700; font-size: 0.88rem;">${lease.truckModel}</div>
                    <div style="font-size: 0.74rem; color: var(--text-muted);">
                      Суточный платёж: <strong style="color: var(--accent-orange);">€${lease.dailyPayment}/день</strong> | Дней осталось: ${lease.daysRemaining}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                      Выкупной остаток: €${Math.round(lease.buyoutPrice).toLocaleString()}
                    </div>
                  </div>
                  <button class="btn-glass small" onclick="AppFinance.buyoutLeaseEarly('${lease.id}')">
                    Выкупить (€${Math.round(lease.buyoutPrice).toLocaleString()})
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div>
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Оформить тягач в лизинг (Аванс 15%)</h4>
          <div class="terminals-grid">
            ${leaseCatalog.map(m => {
              const downPayment = Math.round(m.basePrice * 0.15);
              const dailyRate = Math.round((m.basePrice * 0.92) / 30);
              const canAfford = s.finances.balance >= downPayment && availableSlots > 0;

              return `
                <div class="terminal-card unlocked" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.88rem;">🚚 ${m.modelName}</div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge active">${m.enginePowerHp} л.с.</span>
                    </div>

                    <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">
                      Аванс (15%): <strong style="color: var(--accent-green);">€${downPayment.toLocaleString()}</strong><br>
                      Платёж: <strong>€${dailyRate}/день</strong> (на 30 дней)
                    </p>
                  </div>

                  <div class="terminal-bottom-block" style="margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--glass-border);">
                    <button class="btn-glass primary small" style="width: 100%;" 
                      ${!canAfford ? 'disabled' : ''} 
                      onclick="AppFinance.signTruckLease('${m.modelId}')">
                      ${availableSlots <= 0 ? 'Нет мест в гараже' : (s.finances.balance < downPayment ? 'Не хватает аванса' : 'Оформить лизинг')}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  signTruckLease(modelId) {
    const s = AppState.get();
    const spec = (typeof TRUCK_MODELS !== "undefined") ? TRUCK_MODELS.find(m => m.modelId === modelId) : null;
    if (!spec) return;

    if (s.trucks.length >= s.garage.slots) {
      AppUI.showToast("В гараже нет свободных мест для новой техники!", "error");
      return;
    }

    const downPayment = Math.round(spec.basePrice * 0.15);
    if (s.finances.balance < downPayment) {
      AppUI.showToast("Недостаточно средств для первоначального взноса!", "error");
      return;
    }

    s.finances.balance -= downPayment;
    s.finances.totalSpent = (s.finances.totalSpent || 0) + downPayment;

    if (!s.finances.activeLeases) s.finances.activeLeases = [];

    const dailyRate = Math.round((spec.basePrice * 0.92) / 30);
    const leaseId = "lease-" + Date.now().toString(36);

    s.finances.activeLeases.push({
      id: leaseId,
      truckModel: spec.modelName,
      modelId: spec.modelId,
      dailyPayment: dailyRate,
      daysRemaining: 30,
      buyoutPrice: Math.round(spec.basePrice * 0.85)
    });

    s.trucks.push({
      id: "trk-l-" + Date.now().toString(36),
      model: spec.modelName,
      brand: spec.brand,
      engineType: spec.engineType,
      year: 2026,
      mileageKm: 0,
      enginePowerHp: spec.enginePowerHp,
      maxPayloadTons: spec.maxPayloadTons || 24.5,
      fuelTankL: spec.fuelTankCapacityL,
      fuelCurrentL: spec.fuelTankCapacityL,
      avgConsumptionL100: spec.baseFuelConsumptionL100,
      assignedDriverId: null,
      status: "idle",
      tuningLevels: { ecu: 0, aero: 0, tanks: 0, retarder: 0 },
      components: { engine: 100, transmission: 100, brakes: 100, suspension: 100, tires: 100, electronics: 100, cooling: 100 },
      purchasePrice: spec.basePrice,
      marketValue: spec.basePrice,
      isLeased: true,
      leaseId: leaseId,
      tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
    });

    AppStorage.save(s);
    AppUI.renderAll();
    AppOfficeHub.renderView();
    AppUI.showToast(`Тягач ${spec.modelName} оформлен в лизинг и доставлен на базу!`, "success");
  },

  buyoutLeaseEarly(leaseId) {
    const s = AppState.get();
    const idx = (s.finances.activeLeases || []).findIndex(l => l.id === leaseId);
    if (idx === -1) return;

    const lease = s.finances.activeLeases[idx];
    if (s.finances.balance < lease.buyoutPrice) {
      AppUI.showToast("Недостаточно средств для выкупа тягача из лизинга!", "error");
      return;
    }

    s.finances.balance -= lease.buyoutPrice;
    s.finances.totalSpent = (s.finances.totalSpent || 0) + lease.buyoutPrice;

    const trk = s.trucks.find(t => t.leaseId === leaseId);
    if (trk) {
      delete trk.isLeased;
      delete trk.leaseId;
    }

    s.finances.activeLeases.splice(idx, 1);

    AppStorage.save(s);
    AppUI.renderAll();
    AppOfficeHub.renderView();
    AppUI.showToast(`Тягач ${lease.truckModel} полностью выкуплен в собственность компании!`, "success");
  },

  renderInsuranceHTML() {
    const s = AppState.get();
    const currentPolicyId = s.finances.insurancePolicy || "basic";

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="font-size: 0.78rem; color: var(--text-muted);">
          Страховка покрывает убытки компании при авариях, поломках узлов и непредвиденных срывах сроков.
        </div>

        <div class="terminals-grid">
          ${this.INSURANCE_POLICIES.map(pol => {
            const isCurrent = pol.id === currentPolicyId;
            const totalDaily = pol.dailyCostPerTruck * s.trucks.length;

            return `
              <div class="terminal-card unlocked" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="terminal-top-block">
                  <div class="terminal-title" style="font-size: 0.88rem;">🛡️ ${pol.name}</div>
                  <div class="terminal-badge-row">
                    <span class="terminal-badge ${isCurrent ? 'active' : 'locked'}">
                      ${isCurrent ? 'Активен' : `${pol.accidentCoverPercent}% покр.`}
                    </span>
                  </div>

                  <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin: 6px 0;">
                    ${pol.desc}<br>
                    Покрытие инцидентов: <strong style="color: var(--accent-green);">${pol.accidentCoverPercent}%</strong><br>
                    Тариф за тягач: <strong>€${pol.dailyCostPerTruck}/день</strong>
                  </p>
                </div>

                <div class="terminal-bottom-block" style="margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--glass-border);">
                  ${isCurrent ? `
                    <div style="text-align: center; color: var(--accent-green); font-size: 0.76rem; font-weight: 700; padding: 4px;">
                      ✓ Текущий полис (€${totalDaily}/день)
                    </div>
                  ` : `
                    <button class="btn-glass primary small" style="width: 100%;" 
                      onclick="AppFinance.selectInsurancePolicy('${pol.id}')">
                      Перейти на полис
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

  selectInsurancePolicy(policyId) {
    const s = AppState.get();
    const pol = this.INSURANCE_POLICIES.find(p => p.id === policyId);
    if (!pol) return;

    s.finances.insurancePolicy = policyId;
    AppStorage.save(s);
    AppUI.renderAll();
    AppOfficeHub.renderView();
    AppUI.showToast(`Страховой договор обновлен на «${pol.name}»!`, "success");
  },

  processDailyMidnightAccounting() {
    const s = AppState.get();

    if (s.finances.activeLoans && s.finances.activeLoans.length > 0) {
      s.finances.activeLoans.forEach(loan => {
        const interest = loan.principalRemaining * (loan.dailyInterestPercent / 100);
        const principalPart = loan.principalRemaining / loan.daysRemaining;
        const totalDayPay = Math.round(interest + principalPart);

        s.finances.balance -= totalDayPay;
        s.finances.totalSpent = (s.finances.totalSpent || 0) + totalDayPay;
        loan.principalRemaining = Math.max(0, loan.principalRemaining - principalPart);
        loan.daysRemaining -= 1;
      });

      s.finances.activeLoans = s.finances.activeLoans.filter(l => l.daysRemaining > 0 && l.principalRemaining > 10);
    }

    if (s.finances.activeLeases && s.finances.activeLeases.length > 0) {
      s.finances.activeLeases.forEach(lease => {
        s.finances.balance -= lease.dailyPayment;
        s.finances.totalSpent = (s.finances.totalSpent || 0) + lease.dailyPayment;
        lease.daysRemaining -= 1;
        lease.buyoutPrice = Math.max(0, lease.buyoutPrice - (lease.dailyPayment * 0.7));
      });

      s.finances.activeLeases = s.finances.activeLeases.filter(l => l.daysRemaining > 0);
    }

    const pol = this.INSURANCE_POLICIES.find(p => p.id === (s.finances.insurancePolicy || "basic"));
    if (pol && s.trucks.length > 0) {
      const insuranceCost = pol.dailyCostPerTruck * s.trucks.length;
      s.finances.balance -= insuranceCost;
      s.finances.totalSpent = (s.finances.totalSpent || 0) + insuranceCost;
    }
  }
};