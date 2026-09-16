const AppGarage = {
  EXPANSION_COST_PER_SLOT: 25000,
  SERVICE_BAY_UPGRADE_COST: 45000,
  FUEL_STATION_UPGRADE_COST: 60000,

  init() { this.renderGarageView(); },

  renderGarageView() {
    const s = AppState.get();
    const g = s.garage;
    const viewContainer = document.getElementById("view-garage");
    if (!viewContainer) return;

    const usedSlots = s.trucks.length;
    const percentFilled = Math.min(100, Math.round((usedSlots / g.slots) * 100));

    viewContainer.innerHTML = `
      <div class="view-scroll-content">
        <div class="garage-grid">
          <div class="glass-card garage-info-banner">
            <div class="garage-header-row">
              <div>
                <h2 class="garage-title">${g.name}</h2>
                <span class="garage-location">Локация: ${g.city} | Уровень базы: ${g.level}</span>
              </div>
              <button class="btn-glass small primary" onclick="AppGarage.promptAddSlot()">+ Место (€${this.EXPANSION_COST_PER_SLOT.toLocaleString()})</button>
            </div>

            <div class="garage-slots-progress">
              <div class="garage-progress-bar-bg">
                <div class="garage-progress-bar-fill" style="width: ${percentFilled}%"></div>
              </div>
              <div class="garage-slots-label">
                <span>Занято парковочных мест: ${usedSlots} из ${g.slots}</span>
                <span>${percentFilled}%</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-2);">
              <div class="glass-subgroup" style="padding: var(--space-3); border-radius: var(--radius-md);">
                <span style="font-size: 0.75rem; color: var(--text-muted);">Ежедневное содержание</span>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent-orange); margin-top: 2px;">
                  €${g.maintenanceCostDaily} / день
                </div>
              </div>
              <div class="glass-subgroup" style="padding: var(--space-3); border-radius: var(--radius-md);">
                <span style="font-size: 0.75rem; color: var(--text-muted);">Стоимость базы</span>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                  €${(g.slots * 30000 + (g.hasServiceBay ? 50000 : 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card">
            <div class="panel-header" style="margin-bottom: var(--space-4);">
              <h3>Модули инфраструктуры базы</h3>
            </div>
            <div class="garage-modules-list">
              <div class="module-item-card">
                <div class="module-item-info">
                  <div class="module-icon-box">🔧</div>
                  <div>
                    <div class="module-text-title">Собственный сервисный бокс</div>
                    <div class="module-text-desc">${g.hasServiceBay ? "Скидка 30% на все ремонты и ТО" : "Снижает расходы на ремонт флота на 30%"}</div>
                  </div>
                </div>
                ${g.hasServiceBay 
                  ? `<span class="badge" style="color: var(--accent-green);">Активен</span>` 
                  : `<button class="btn-glass small module-action-btn primary" onclick="AppGarage.buyServiceBay()">Купить (€${this.SERVICE_BAY_UPGRADE_COST.toLocaleString()})</button>`
                }
              </div>

              <div class="module-item-card">
                <div class="module-item-info">
                  <div class="module-icon-box">⛽</div>
                  <div>
                    <div class="module-text-title">Оптовая АЗС базы</div>
                    <div class="module-text-desc">${g.hasFuelStation ? "Топливо по оптовой цене со скидкой 18%" : "Снижает стоимость заправки тягачей на 18%"}</div>
                  </div>
                </div>
                ${g.hasFuelStation 
                  ? `<span class="badge" style="color: var(--accent-green);">Активна</span>` 
                  : `<button class="btn-glass small module-action-btn primary" onclick="AppGarage.buyFuelStation()">Купить (€${this.FUEL_STATION_UPGRADE_COST.toLocaleString()})</button>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  promptAddSlot() {
    const s = AppState.get();
    if (s.finances.balance < this.EXPANSION_COST_PER_SLOT) {
      AppUI.showToast("Недостаточно средств для расширения базы!", "error");
      return;
    }
    s.finances.balance -= this.EXPANSION_COST_PER_SLOT;
    s.garage.slots += 1;
    s.garage.maintenanceCostDaily += 35;
    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast("База расширена: добавлен +1 слот флота!", "success");
  },

  buyServiceBay() {
    const s = AppState.get();
    if (s.finances.balance < this.SERVICE_BAY_UPGRADE_COST) {
      AppUI.showToast("Недостаточно средств для постройки ремонтного бокса!", "error");
      return;
    }
    s.finances.balance -= this.SERVICE_BAY_UPGRADE_COST;
    s.garage.hasServiceBay = true;
    s.garage.maintenanceCostDaily += 80;
    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast("Сервисный бокс построен! Скидка 30% на ремонт активирована.", "success");
  },

  buyFuelStation() {
    const s = AppState.get();
    if (s.finances.balance < this.FUEL_STATION_UPGRADE_COST) {
      AppUI.showToast("Недостаточно средств для постройки АЗС!", "error");
      return;
    }
    s.finances.balance -= this.FUEL_STATION_UPGRADE_COST;
    s.garage.hasFuelStation = true;
    s.garage.maintenanceCostDaily += 60;
    AppStorage.save(s);
    AppUI.renderAll();
    this.renderGarageView();
    AppUI.showToast("Оптовая АЗС запущена! Топливо со скидкой 18% доступно на базе.", "success");
  }
};