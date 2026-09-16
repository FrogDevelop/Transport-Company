const AppDrivers = {
  currentFilter: "all",

  FIRST_NAMES: ["Михаил", "Томаш", "Лукас", "Марк", "Жан", "Ханс", "Давид", "Алексей", "Маттео", "Стефан", "Эрик", "Николай"],
  LAST_NAMES: ["Мюллер", "Ковальски", "Бернар", "Шмидт", "Новак", "Дюпон", "Росси", "Волков", "Моретти", "Линдквист", "Вебер", "Соколов"],

  init() {
    const s = AppState.get();
    if (!s.marketDrivers || s.marketDrivers.length === 0) {
      this.generateCandidatesPool(6);
    }
    this.renderDriversView();
  },

  generateCandidatesPool(count = 6) {
    const s = AppState.get();
    const pool = [];

    for (let i = 0; i < count; i++) {
      const fName = this.FIRST_NAMES[Math.floor(Math.random() * this.FIRST_NAMES.length)];
      const lName = this.LAST_NAMES[Math.floor(Math.random() * this.LAST_NAMES.length)];
      const age = Math.floor(Math.random() * 32) + 24;
      const experience = Math.max(1, age - 22);
      const rating = (3.6 + Math.random() * 1.39).toFixed(1);
      const dailyWage = Math.round(110 + experience * 7 + (rating - 3) * 25);
      const ecoSkill = Math.min(22, Math.floor(experience * 1.2 + Math.random() * 6));
      const safetySkill = Math.min(25, Math.floor(experience * 1.3 + Math.random() * 5));
      const hiringBonus = Math.round(dailyWage * (4 + Math.random() * 4));

      pool.push({
        id: "cand-" + Date.now().toString(36) + "-" + i,
        name: `${fName} ${lName}`,
        age: age,
        experienceYears: experience,
        rating: parseFloat(rating),
        dailyWage: dailyWage,
        ecoDrivingSkill: ecoSkill,
        safetySkill: safetySkill,
        stamina: 100,
        hiringBonus: hiringBonus
      });
    }

    s.marketDrivers = pool;
    AppStorage.save(s);
  },

  renderDriversView() {
    const s = AppState.get();
    const container = document.getElementById("view-drivers");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="drivers-controls-bar">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Штат дальнобойщиков</h2>
            <span style="font-size: 0.78rem; color: var(--text-muted);">В штате: ${s.drivers.length} чел.</span>
          </div>
          <button class="btn-glass primary small" onclick="AppUI.switchTab('drivers_market')">+ Биржа найма</button>
        </div>

        <div class="drivers-grid">
          ${s.drivers.map(d => this.generateDriverCardHTML(d)).join('')}
        </div>
      </div>
    `;
  },

  generateDriverCardHTML(driver) {
    const s = AppState.get();
    const assignedTruck = s.trucks.find(t => t.id === driver.assignedTruckId);
    let staminaStatus = "good";
    if (driver.stamina < 30) staminaStatus = "exhausted";
    else if (driver.stamina < 65) staminaStatus = "tired";

    return `
      <div class="glass-card driver-card">
        <div class="driver-card-header">
          <div class="driver-avatar-box">👨‍✈️</div>
          <div class="driver-identity">
            <span class="driver-name">${driver.name}</span>
            <span class="driver-rank-sub">${driver.age} лет | Опыт: ${driver.experienceYears} лет | ★ ${driver.rating}</span>
          </div>
          <span class="driver-status-badge ${driver.status}">${driver.status === 'driving' ? 'В рейсе' : 'Отдых'}</span>
        </div>

        <div class="driver-skills-matrix">
          <div class="driver-skill-row">
            <span class="driver-skill-label">Эко-вождение:</span>
            <span class="driver-skill-val">-${driver.ecoDrivingSkill || 5}% расхода</span>
          </div>
          <div class="driver-skill-row">
            <span class="driver-skill-label">Дневная ставка:</span>
            <span class="driver-skill-val">€${driver.dailyWage} / день</span>
          </div>
          <div class="driver-skill-row" style="grid-column: span 2;">
            <span class="driver-skill-label">Тягач:</span>
            <span class="driver-skill-val">${assignedTruck ? assignedTruck.model : 'Не закреплен'}</span>
          </div>
        </div>

        <div class="driver-stamina-container">
          <div class="driver-stamina-header">
            <span>Выносливость</span>
            <span>${Math.round(driver.stamina)}%</span>
          </div>
          <div class="driver-stamina-track">
            <div class="driver-stamina-fill ${staminaStatus}" style="width: ${Math.round(driver.stamina)}%"></div>
          </div>
        </div>

        <div class="driver-card-actions">
          <button class="btn-glass small" onclick="AppDrivers.openAssignTruckModal('${driver.id}')">Закрепить авто</button>
          <button class="btn-glass small" style="color: var(--accent-red);" onclick="AppDrivers.fireDriver('${driver.id}')">Уволить</button>
        </div>
      </div>
    `;
  },

  renderMarketTab() {
    const s = AppState.get();
    const container = document.getElementById("view-drivers_market");
    if (!container) return;

    container.innerHTML = `
      <div class="view-scroll-content">
        <div class="drivers-controls-bar">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Европейская биржа труда</h2>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Квалифицированные водители категорий C+E</span>
          </div>
          <button class="btn-glass small" onclick="AppDrivers.generateCandidatesPool(6); AppDrivers.renderMarketTab();">Обновить анкеты</button>
        </div>

        <div class="drivers-grid">
          ${s.marketDrivers.map(cand => `
            <div class="glass-card driver-card">
              <div class="driver-card-header">
                <div class="driver-avatar-box">📑</div>
                <div class="driver-identity">
                  <span class="driver-name">${cand.name}</span>
                  <span class="driver-rank-sub">${cand.age} лет | Стаж: ${cand.experienceYears} лет | Рейтинг ★ ${cand.rating}</span>
                </div>
              </div>

              <div class="driver-skills-matrix">
                <div class="driver-skill-row">
                  <span class="driver-skill-label">Экономия топлива:</span>
                  <span class="driver-skill-val">-${cand.ecoDrivingSkill}%</span>
                </div>
                <div class="driver-skill-row">
                  <span class="driver-skill-label">Ставка в день:</span>
                  <span class="driver-skill-val">€${cand.dailyWage}</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Бонус при найме:</span>
                  <div style="font-weight: 700; color: var(--accent-orange);">€${cand.hiringBonus.toLocaleString()}</div>
                </div>
                <button class="btn-glass primary small" onclick="AppDrivers.hireCandidate('${cand.id}')">Подписать контракт</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  hireCandidate(candidateId) {
    const s = AppState.get();
    const idx = s.marketDrivers.findIndex(c => c.id === candidateId);
    if (idx === -1) return;

    const cand = s.marketDrivers[idx];
    if (s.finances.balance < cand.hiringBonus) {
      alert("Недостаточно средств для выплаты бонуса за подписание!");
      return;
    }

    s.finances.balance -= cand.hiringBonus;
    s.finances.todayExpenses += cand.hiringBonus;

    s.drivers.push({
      id: "drv-" + Date.now().toString(36),
      name: cand.name,
      age: cand.age,
      experienceYears: cand.experienceYears,
      rating: cand.rating,
      dailyWage: cand.dailyWage,
      ecoDrivingSkill: cand.ecoDrivingSkill,
      safetySkill: cand.safetySkill,
      stamina: 100,
      assignedTruckId: null,
      status: "rest"
    });

    s.marketDrivers.splice(idx, 1);
    AppStorage.save(s);
    AppUI.renderAll();
    this.renderMarketTab();
    alert(`Водитель ${cand.name} зачислен в компанию!`);
  },

  fireDriver(driverId) {
    const s = AppState.get();
    if (s.drivers.length <= 1) {
      alert("В компании должен быть минимум один водитель!");
      return;
    }
    const idx = s.drivers.findIndex(d => d.id === driverId);
    if (idx === -1) return;

    const d = s.drivers[idx];
    if (d.status === "driving") {
      alert("Нельзя уволить шофера в рейсе!");
      return;
    }

    const trk = s.trucks.find(t => t.id === d.assignedTruckId);
    if (trk) trk.assignedDriverId = null;

    s.drivers.splice(idx, 1);
    AppStorage.save(s);
    AppUI.renderAll();
    this.renderDriversView();
  },

  openAssignTruckModal(driverId) {
    const s = AppState.get();
    const driver = s.drivers.find(d => d.id === driverId);
    if (!driver) return;

    const availableTrucks = s.trucks.filter(t => t.status !== "trip");

    const html = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Закрепление машины за шофером ${driver.name}:</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${availableTrucks.map(truck => `
            <div class="glass-subgroup" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: var(--radius-md);">
              <div>
                <strong>${truck.model}</strong>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${truck.mileageKm.toLocaleString()} км | ${truck.engineType === 'electric' ? '⚡ Электро' : '⛽ Дизель'}</div>
              </div>
              <button class="btn-glass small" onclick="AppDrivers.assignTruck('${driver.id}', '${truck.id}')">Закрепить</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    AppUI.openSheet("Выбор машины", html);
  },

  assignTruck(driverId, truckId) {
    const s = AppState.get();
    const driver = s.drivers.find(d => d.id === driverId);
    const truck = s.trucks.find(t => t.id === truckId);
    if (!driver || !truck) return;

    s.drivers.forEach(d => { if (d.assignedTruckId === truckId) d.assignedTruckId = null; });
    s.trucks.forEach(t => { if (t.assignedDriverId === driverId) t.assignedDriverId = null; });

    driver.assignedTruckId = truck.id;
    truck.assignedDriverId = driver.id;

    AppStorage.save(s);
    AppUI.closeSheet();
    AppUI.renderAll();
    this.renderDriversView();
  }
};