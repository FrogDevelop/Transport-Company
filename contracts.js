const AppContracts = {
  currentTab: "tenders", // 'active' | 'tenders'

  init() {
    this.ensureState();
    const s = AppState.get();
    if (!s.marketTenders || s.marketTenders.length === 0) {
      this.generateTendersBatch(6);
    }
  },

  ensureState() {
    const s = AppState.get();
    if (!Array.isArray(s.activeContracts)) s.activeContracts = [];
    if (!Array.isArray(s.marketTenders)) s.marketTenders = [];

    // Защита от старых сохранений без таймеров:
    s.marketTenders.forEach(t => {
      if (typeof t.expiresInMinutes !== "number" || isNaN(t.expiresInMinutes)) {
        t.expiresInMinutes = Math.floor(Math.random() * 48 + 24) * 60;
      }
    });

    s.activeContracts.forEach(cnt => {
      if (typeof cnt.daysRemaining !== "number" || isNaN(cnt.daysRemaining)) {
        cnt.daysRemaining = cnt.deadlineDays || cnt.totalDays || 7;
      }
      if (typeof cnt.remainingMinutes !== "number" || isNaN(cnt.remainingMinutes)) {
        cnt.remainingMinutes = cnt.daysRemaining * 1440;
      }
      if (typeof cnt.totalDays !== "number" || isNaN(cnt.totalDays)) {
        cnt.totalDays = cnt.deadlineDays || cnt.daysRemaining || 7;
      }
    });
  },

  formatTenderTime(minutes) {
    if (typeof minutes !== "number" || isNaN(minutes)) {
      minutes = 1440;
    }
    const m = Math.max(0, Math.round(minutes));
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  },

  formatContractDeadline(cnt) {
    if (!cnt) return "—";
    let remMins = cnt.remainingMinutes;
    if (typeof remMins !== "number" || isNaN(remMins)) {
      remMins = (typeof cnt.daysRemaining === "number" && !isNaN(cnt.daysRemaining))
        ? cnt.daysRemaining * 1440
        : (cnt.deadlineDays || 7) * 1440;
      cnt.remainingMinutes = remMins;
    }
    remMins = Math.max(0, Math.round(remMins));
    const days = Math.floor(remMins / 1440);
    const hours = Math.floor((remMins % 1440) / 60);
    const mins = remMins % 60;
    if (days > 0) {
      return `${days}д ${hours}ч`;
    }
    return `${hours}ч ${mins}м`;
  },

  generateTendersBatch(count = 6) {
    const s = AppState.get();
    const rep = s.company.reputation || 0;
    const ownedLicenses = s.company.licenses || ["lic_standard"];
    const cities = (typeof CITIES_CATALOG !== "undefined") ? CITIES_CATALOG : [];
    const allCargo = (typeof CARGO_CATALOG !== "undefined") ? CARGO_CATALOG : [];
    const templates = (typeof CONTRACT_CLIENT_TEMPLATES !== "undefined") ? CONTRACT_CLIENT_TEMPLATES : [];

    if (cities.length < 2 || allCargo.length === 0 || templates.length === 0) return;

    const allowedCargo = allCargo.filter(c => ownedLicenses.includes(c.requiredLicense));
    if (allowedCargo.length === 0) return;

    const newTenders = [];

    for (let i = 0; i < count; i++) {
      const cargo = allowedCargo[Math.floor(Math.random() * allowedCargo.length)];
      const matchingTemplates = templates.filter(t => t.licenses.includes(cargo.requiredLicense));
      const template = matchingTemplates.length > 0
        ? matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)]
        : templates[Math.floor(Math.random() * templates.length)];

      const origin = cities[Math.floor(Math.random() * cities.length)];
      let destination = cities[Math.floor(Math.random() * cities.length)];
      while (destination.id === origin.id) {
        destination = cities[Math.floor(Math.random() * cities.length)];
      }

      const route = AppOrders.getRouteData(origin.id, destination.id);
      const tierFactor = 1 + Math.floor(rep / 25);
      const totalVolume = Math.round((60 + Math.random() * 120 * tierFactor) / 10) * 10;
      const minReputation = Math.max(0, Math.min(85, Math.floor(rep * 0.75 + (Math.random() * 15 - 5))));

      const baseKmRate = cargo.basePricePerKmTon || 0.2;
      const ratePerTon = Math.round(route.distanceKm * baseKmRate * 1.18);
      const completionBonus = Math.round(totalVolume * ratePerTon * 0.25);
      const deadlineDays = Math.max(6, Math.round((totalVolume / 35) + (route.distanceKm / 300) + 4));
      const tenderLifespanMinutes = Math.floor(Math.random() * 48 + 24) * 60;

      newTenders.push({
        id: "tnd-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 4),
        clientName: template.name,
        clientLogo: template.logo,
        industry: template.industry,
        originCity: origin.name,
        originId: origin.id,
        destinationCity: destination.name,
        destinationId: destination.id,
        cargoName: cargo.name,
        cargoIcon: cargo.icon || "📦",
        requiredLicense: cargo.requiredLicense,
        requiredTrailerType: cargo.requiredTrailerType,
        totalVolumeTons: totalVolume,
        ratePerTon: ratePerTon,
        completionBonus: completionBonus,
        deadlineDays: deadlineDays,
        minReputation: minReputation,
        distanceKm: route.distanceKm,
        expiresInMinutes: tenderLifespanMinutes
      });
    }

    s.marketTenders = newTenders;
    AppStorage.save(s);
  },

  tickTendersLifespan() {
    const s = AppState.get();
    let changed = false;

    // 1. Уменьшаем таймеры тендеров на бирже
    if (Array.isArray(s.marketTenders) && s.marketTenders.length > 0) {
      let expiredAny = false;

      s.marketTenders.forEach(t => {
        if (typeof t.expiresInMinutes !== "number" || isNaN(t.expiresInMinutes)) {
          t.expiresInMinutes = 1440;
        }
        t.expiresInMinutes -= 1;
        if (t.expiresInMinutes <= 0) expiredAny = true;

        const timerEl = document.getElementById(`tender-timer-${t.id}`);
        if (timerEl) {
          timerEl.innerText = `⏱ ${this.formatTenderTime(t.expiresInMinutes)}`;
        }
      });

      if (expiredAny) {
        s.marketTenders = s.marketTenders.filter(t => t.expiresInMinutes > 0);
        const needed = 6 - s.marketTenders.length;
        if (needed > 0) {
          this.generateTendersBatch(needed);
        }
        changed = true;
      }
    }

    // 2. Уменьшаем дедлайн активных контрактов
    if (Array.isArray(s.activeContracts) && s.activeContracts.length > 0) {
      s.activeContracts.forEach(cnt => {
        if (typeof cnt.remainingMinutes !== "number" || isNaN(cnt.remainingMinutes)) {
          cnt.remainingMinutes = ((typeof cnt.daysRemaining === "number" && !isNaN(cnt.daysRemaining)) ? cnt.daysRemaining : 7) * 1440;
        }
        cnt.remainingMinutes = Math.max(0, cnt.remainingMinutes - 1);
        cnt.daysRemaining = Math.ceil(cnt.remainingMinutes / 1440);

        const deadlineEl = document.getElementById(`contract-deadline-${cnt.id}`);
        if (deadlineEl) {
          deadlineEl.innerText = `Срок: ${this.formatContractDeadline(cnt)}`;
        }
      });
    }

    if (changed && AppUI.currentTab === "office_hub" && typeof AppOfficeHub !== "undefined" && AppOfficeHub.currentSubTab === "contracts") {
      AppOfficeHub.renderView();
    }
  },

  renderActiveContractsHTML() {
    this.ensureState();
    const s = AppState.get();
    const active = s.activeContracts || [];

    if (active.length === 0) {
      return `
        <div class="empty-state-card" style="padding: var(--space-6); grid-column: 1 / -1;">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">📑</div>
          <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">Нет активных соглашений</div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
            Компания работает только по разовым спотовым рейсам. Изучите предложения на бирже тендеров.
          </p>
          <button class="btn-glass primary small" onclick="AppContracts.currentTab='tenders'; AppOfficeHub.renderView();">
            Открыть биржу тендеров
          </button>
        </div>
      `;
    }

    return active.map(cnt => {
      const progressPercent = Math.min(100, Math.round((cnt.deliveredVolumeTons / cnt.totalVolumeTons) * 100));

      return `
        <div class="terminal-card unlocked" onclick="AppContracts.openActiveContractModal('${cnt.id}')">
          <div class="terminal-top-block">
            <div class="terminal-title" style="font-size: 0.86rem;">
              ${cnt.originCity} ➔ ${cnt.destinationCity}
            </div>
            <div class="terminal-badge-row">
              <span class="terminal-badge active" id="contract-deadline-${cnt.id}">
                Срок: ${this.formatContractDeadline(cnt)}
              </span>
            </div>

            <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
              ${cnt.clientLogo} ${cnt.clientName}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">
              ${cnt.cargoIcon} ${cnt.cargoName} • <strong style="color: var(--accent-green);">€${cnt.ratePerTon}/т</strong>
            </div>
          </div>

          <div>
            <div style="margin: 6px 0 4px 0;">
              <div class="component-meter" style="height: 5px;">
                <div class="component-meter-fill good" style="width: ${progressPercent}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 3px;">
                <span>${Math.round(cnt.deliveredVolumeTons)} / ${cnt.totalVolumeTons} т</span>
                <strong style="color: var(--accent-blue);">${progressPercent}%</strong>
              </div>
            </div>

            <div class="terminal-bottom-block" style="padding-top: 4px; margin-top: 2px;">
              <div class="terminal-meta" style="font-size: 0.68rem;">
                <span style="color: var(--text-muted);">Премия:</span>
                <strong style="color: var(--accent-green);">+€${cnt.completionBonus.toLocaleString()}</strong>
              </div>
              <button class="btn-glass primary terminal-action-btn" style="margin-top: 4px;">
                Рейс по контракту ➔
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTendersHTML() {
    this.ensureState();
    const s = AppState.get();
    const rep = s.company.reputation || 0;
    const tenders = s.marketTenders || [];
    const ownedLicenses = s.company.licenses || ["lic_standard"];

    if (tenders.length === 0) {
      this.generateTendersBatch(6);
      return this.renderTendersHTML();
    }

    return tenders.map(t => {
      const hasRep = rep >= t.minReputation;
      const hasLic = ownedLicenses.includes(t.requiredLicense);
      const canSign = hasRep && hasLic;

      return `
        <div class="terminal-card ${canSign ? 'unlocked' : 'locked'}" onclick="AppContracts.openTenderDetailModal('${t.id}')">
          <div class="terminal-top-block">
            <div class="terminal-title" style="font-size: 0.86rem;">
              ${t.originCity} ➔ ${t.destinationCity}
            </div>
            <div class="terminal-badge-row">
              <span class="terminal-badge ${hasRep ? 'active' : 'locked'}">
                ${hasRep ? `${t.totalVolumeTons} т` : `Реп. ★ ${t.minReputation}+`}
              </span>
            </div>

            <div style="font-size: 0.72rem; color: var(--text-secondary); margin: 5px 0 2px 0;">
              ${t.clientLogo} ${t.clientName}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">
              ${t.cargoIcon} ${t.cargoName} • Срок: <strong>${t.deadlineDays} дн.</strong>
            </div>
          </div>

          <div class="terminal-bottom-block" style="padding-top: 5px; margin-top: auto;">
            <div class="terminal-meta" style="font-size: 0.68rem;">
              <span>Ставка: <strong style="color: var(--accent-green);">€${t.ratePerTon}/т</strong></span>
              <span id="tender-timer-${t.id}" style="color: var(--accent-blue); font-weight: 600;">⏱ ${this.formatTenderTime(t.expiresInMinutes)}</span>
            </div>
            <button class="btn-glass ${canSign ? 'primary' : ''} terminal-action-btn" style="margin-top: 4px;">
              ${canSign ? 'Изучить тендер ➔' : (hasRep ? 'Нужна лицензия' : `Требуется ★ ${t.minReputation}`)}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  openTenderDetailModal(tenderId) {
    const s = AppState.get();
    const t = (s.marketTenders || []).find(x => x.id === tenderId);
    if (!t) return;

    const rep = s.company.reputation || 0;
    const ownedLicenses = s.company.licenses || ["lic_standard"];
    const hasRep = rep >= t.minReputation;
    const hasLic = ownedLicenses.includes(t.requiredLicense);
    const canSign = hasRep && hasLic;

    const potentialGross = Math.round(t.totalVolumeTons * t.ratePerTon + t.completionBonus);
    const fastCloseBonus = Math.round(t.completionBonus * 0.25);

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">${t.originCity} ➔ ${t.destinationCity}</h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Заказчик: <strong>${t.clientLogo} ${t.clientName}</strong> (${t.industry})
            </span>
          </div>
          <span class="badge ${hasRep ? 'active' : 'locked'}">
            ★ ${t.minReputation} Реп.
          </span>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Общий контрактный объём:</td>
            <td><strong>${t.totalVolumeTons} тонн</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Груз / Лицензия:</td>
            <td>${t.cargoIcon} ${t.cargoName}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Тариф за перевозку:</td>
            <td style="color: var(--accent-green);"><strong>€${t.ratePerTon} / тонна</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Базовая премия за закрытие:</td>
            <td style="color: var(--accent-green);"><strong>+€${t.completionBonus.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Бонус за досрочную сдачу (&ge;50% срока):</td>
            <td style="color: var(--accent-blue);"><strong>+€${fastCloseBonus.toLocaleString()}</strong> (+2 реп.)</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Срок выполнения договора:</td>
            <td><strong>${t.deadlineDays} дней</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Актуальность тендера:</td>
            <td style="color: var(--accent-blue);"><strong>⏱ ${this.formatTenderTime(t.expiresInMinutes)}</strong></td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Потенциальный суммарный доход:</td>
            <td style="color: var(--accent-blue);"><strong>~€${potentialGross.toLocaleString()}</strong></td>
          </tr>
        </table>

        <button class="btn-glass primary" style="width: 100%;"
          ${!canSign ? 'disabled' : ''}
          onclick="AppContracts.signContract('${t.id}')">
          ${!hasRep ? `Недостаточно репутации (нужно ★ ${t.minReputation})` : (!hasLic ? 'Нет лицензии на этот тип груза' : 'Подписать контракт')}
        </button>
      </div>
    `;

    AppUI.openSheet("Тендерное соглашение", html);
  },

  openActiveContractModal(contractId) {
    const s = AppState.get();
    const cnt = (s.activeContracts || []).find(c => c.id === contractId);
    if (!cnt) return;

    const remainingTons = Math.max(0, Math.round(cnt.totalVolumeTons - cnt.deliveredVolumeTons));
    const progressPercent = Math.min(100, Math.round((cnt.deliveredVolumeTons / cnt.totalVolumeTons) * 100));
    const isEarlyQualify = cnt.daysRemaining >= Math.ceil(cnt.totalDays / 2);
    const fastCloseBonus = Math.round(cnt.completionBonus * 0.25);

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">${cnt.originCity} ➔ ${cnt.destinationCity}</h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Клиент: <strong>${cnt.clientLogo} ${cnt.clientName}</strong>
            </span>
          </div>
          <span class="badge active">
            Срок: ${this.formatContractDeadline(cnt)}
          </span>
        </div>

        <div style="background: rgba(0,0,0,0.22); border-radius: var(--radius-sm); padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 4px;">
            <span>Выполнение квоты:</span>
            <strong>${progressPercent}%</strong>
          </div>
          <div class="component-meter" style="height: 6px;">
            <div class="component-meter-fill good" style="width: ${progressPercent}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            <span>Доставлено: ${Math.round(cnt.deliveredVolumeTons)} т</span>
            <span>Осталось перевезти: <strong>${remainingTons} т</strong></span>
          </div>
        </div>

        <table class="spec-detail-table">
          <tr>
            <td style="color: var(--text-muted);">Груз:</td>
            <td>${cnt.cargoIcon} ${cnt.cargoName}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Оплата за 1 тонну:</td>
            <td style="color: var(--accent-green);">€${cnt.ratePerTon}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Базовый бонус завершения:</td>
            <td style="color: var(--accent-green);">+€${cnt.completionBonus.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Статус бонуса скорости:</td>
            <td style="color: ${isEarlyQualify ? 'var(--accent-green)' : 'var(--text-muted)'}; font-weight: 700;">
              ${isEarlyQualify ? `✓ Действует (+€${fastCloseBonus.toLocaleString()})` : 'Истёк (нормальный график)'}
            </td>
          </tr>
        </table>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn-glass primary" style="width: 100%;"
            onclick="AppUI.closeSheet(); setTimeout(() => AppContracts.openDispatchModalForContract('${cnt.id}'), 150);">
            Отправить рейс по контракту
          </button>
          <button class="btn-glass small" style="color: var(--accent-red); border-color: rgba(255, 69, 58, 0.4);"
            onclick="AppContracts.terminateContract('${cnt.id}')">
            Расторгнуть договор (Штраф)
          </button>
        </div>
      </div>
    `;

    AppUI.openSheet("Управление контрактом", html);
  },

  signContract(tenderId) {
    this.ensureState();
    const s = AppState.get();
    const idx = (s.marketTenders || []).findIndex(t => t.id === tenderId);
    if (idx === -1) return;

    const tender = s.marketTenders[idx];
    const initialMinutes = tender.deadlineDays * 1440;

    const newContract = Object.assign({}, tender, {
      deliveredVolumeTons: 0,
      daysRemaining: tender.deadlineDays,
      remainingMinutes: initialMinutes,
      totalDays: tender.deadlineDays,
      signedDay: s.time.currentDay
    });

    s.activeContracts.push(newContract);
    s.marketTenders.splice(idx, 1);

    if (s.marketTenders.length < 6) {
      this.generateTendersBatch(1);
    }

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    this.currentTab = "active";
    AppOfficeHub.renderView();

    AppUI.showToast(`Контракт с «${tender.clientName}» на ${tender.totalVolumeTons} т успешно заключен!`, "success");
  },

  openDispatchModalForContract(contractId) {
    const s = AppState.get();
    const cnt = (s.activeContracts || []).find(c => c.id === contractId);
    if (!cnt) return;

    const remainingTons = Math.max(0, cnt.totalVolumeTons - cnt.deliveredVolumeTons);
    if (remainingTons <= 0) {
      AppUI.showToast("Контракт уже полностью выполнен!", "info");
      return;
    }

    const idleTrucks = (s.trucks || []).filter(t => t.status === "idle");
    const route = AppOrders.getRouteData(cnt.originId, cnt.destinationId);

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3); max-height: 75vh;">
        <div>
          <div style="font-size: 0.95rem; font-weight: 800;">${cnt.clientLogo} ${cnt.clientName}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
            Маршрут: <strong>${cnt.originCity} ➔ ${cnt.destinationCity}</strong> (${route.distanceKm} км)
          </div>
          <div style="font-size: 0.72rem; color: var(--accent-blue); margin-top: 1px;">
            Груз: <strong>${cnt.cargoIcon} ${cnt.cargoName}</strong> • Осталось: <strong>${remainingTons} т</strong>
          </div>
        </div>

        ${idleTrucks.length === 0 ? `
          <div class="empty-state-card" style="padding: var(--space-4);">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">🚛</div>
            <div style="font-weight: 700; font-size: 0.9rem;">Нет свободных тягачей в гараже</div>
            <p style="font-size: 0.76rem; color: var(--text-muted);">
              Дождитесь возвращения тягачей из рейсов или завершения сервисных работ.
            </p>
          </div>
        ` : `
          <div class="terminals-grid" style="padding-bottom: 10px; overflow-y: auto;">
            ${idleTrucks.map(rawTruck => {
              const truck = AppTrucks.ensureTruckSpecs(rawTruck);
              const driver = s.drivers ? s.drivers.find(d => d.id === truck.assignedDriverId) : null;
              const currentHp = AppTrucks.getTruckCurrentPowerHp(truck);
              const currentPayload = AppTrucks.getTruckCurrentPayloadTons(truck);

              const tripTons = Math.min(currentPayload, remainingTons);
              const tripPayout = Math.round(tripTons * cnt.ratePerTon);

              const hasDriver = !!driver;
              const isRested = hasDriver && driver.stamina >= 20;
              const hasFuel = truck.fuelCurrentL >= 15;
              const canDispatch = hasDriver && isRested && hasFuel;

              let reason = "";
              if (!hasDriver) reason = "Без водителя";
              else if (!isRested) reason = "Шофер устал (<20%)";
              else if (!hasFuel) reason = "Пустой бак (<15 л)";

              return `
                <div class="terminal-card unlocked" style="cursor: default; padding: 10px 11px;">
                  <div class="terminal-top-block">
                    <div class="terminal-title" style="font-size: 0.86rem;">${truck.model}</div>
                    <div class="terminal-badge-row">
                      <span class="terminal-badge ${canDispatch ? 'active' : 'locked'}">
                        ${canDispatch ? `Партия ${tripTons} т` : reason}
                      </span>
                    </div>

                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin: 4px 0 2px 0;">
                      Шасси: <strong>до ${currentPayload} т</strong> • <strong>${currentHp} л.с.</strong>
                    </div>

                    <div style="font-size: 0.68rem; color: var(--text-muted);">
                      Оплата за рейс: <strong style="color: var(--accent-green);">€${tripPayout.toLocaleString()}</strong>
                    </div>

                    <div style="font-size: 0.7rem; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${driver ? `👨‍✈️ ${driver.name.split(' ')[0]} (${Math.round(driver.stamina)}%)` : '⚠️ Без водителя'}
                    </div>
                  </div>

                  <div class="terminal-bottom-block" style="padding-top: 5px; margin-top: 6px;">
                    <button class="btn-glass primary terminal-action-btn"
                      ${!canDispatch ? 'disabled' : ''}
                      onclick="AppContracts.dispatchContractTrip('${cnt.id}', '${truck.id}', ${tripTons}, ${tripPayout})">
                      ${canDispatch ? 'Отправить в рейс ➔' : 'Недоступен'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    AppUI.openSheet("Отправка партии по контракту", html);
  },

  dispatchContractTrip(contractId, truckId, tons, payout) {
    const s = AppState.get();
    const cnt = s.activeContracts.find(c => c.id === contractId);
    const rawTruck = s.trucks.find(t => t.id === truckId);
    if (!cnt || !rawTruck) return;

    const truck = AppTrucks.ensureTruckSpecs(rawTruck);
    const driver = s.drivers.find(d => d.id === truck.assignedDriverId);
    if (!driver) return;

    const route = AppOrders.getRouteData(cnt.originId, cnt.destinationId);
    const hpToWeightRatio = (truck.enginePowerHp || 480) / (tons + 14);
    let speedKmh = 75;
    if (hpToWeightRatio > 16) speedKmh = 80;
    else if (hpToWeightRatio < 12) speedKmh = 70;

    const initialEstimatedMinutes = Math.round((route.distanceKm / speedKmh) * 60);

    const newTrip = {
      id: "trp-cnt-" + Date.now().toString(36),
      contractId: cnt.id,
      orderId: null,
      originCity: cnt.originCity,
      destinationCity: cnt.destinationCity,
      cargoName: cnt.cargoName,
      cargoIcon: cnt.cargoIcon || "📦",
      weightTons: tons,
      totalDistanceKm: route.distanceKm,
      remainingDistanceKm: route.distanceKm,
      tollCost: route.tollCost,
      payout: payout,
      truckId: truck.id,
      driverId: driver.id,
      truckSpeedKmh: speedKmh,
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

    AppUI.showToast(`Автопоезд ${truck.model} с контрактным грузом «${cnt.cargoName}» (${tons} т) выехал в ${cnt.destinationCity}!`, "success");
  },

  terminateContract(contractId) {
    const s = AppState.get();
    const idx = (s.activeContracts || []).findIndex(c => c.id === contractId);
    if (idx === -1) return;

    const cnt = s.activeContracts[idx];
    const penalty = Math.round(cnt.completionBonus * 0.4);

    const confirmed = window.confirm(`Расторгнуть контракт с «${cnt.clientName}»? Неустойка за срыв обязательств составит €${penalty.toLocaleString()}, а репутация компании снизится на 3 пункта.`);
    if (!confirmed) return;

    s.finances.balance -= penalty;
    s.finances.todayExpenses += penalty;
    s.company.reputation = Math.max(0, s.company.reputation - 3);

    s.activeContracts.splice(idx, 1);
    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    AppOfficeHub.renderView();

    AppUI.showToast(`Контракт расторгнут. Уплачен штраф €${penalty.toLocaleString()}.`, "warning");
  },

  processDailyContracts() {
    const s = AppState.get();
    if (!s.activeContracts || s.activeContracts.length === 0) return;

    const expired = s.activeContracts.filter(c => (c.remainingMinutes != null ? c.remainingMinutes <= 0 : c.daysRemaining <= 0) && c.deliveredVolumeTons < c.totalVolumeTons);
    if (expired.length > 0) {
      expired.forEach(exp => {
        const penalty = Math.round(exp.completionBonus * 0.5);
        s.finances.balance -= penalty;
        s.finances.todayExpenses += penalty;
        s.company.reputation = Math.max(0, s.company.reputation - 5);
        AppUI.showToast(`СРЫВ СРОКА! Контракт с «${exp.clientName}» просрочен. Штраф: -€${penalty.toLocaleString()}!`, "error", 6000);
      });

      s.activeContracts = s.activeContracts.filter(c => (c.remainingMinutes != null ? c.remainingMinutes > 0 : c.daysRemaining > 0));
      AppStorage.save(s);
    }
  }
};