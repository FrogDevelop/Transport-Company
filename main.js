document.addEventListener("DOMContentLoaded", () => {
  const savedData = AppStorage.load();
  if (savedData) {
    const processedState = AppStorage.processOfflineProgress(savedData.state, savedData.savedAt);
    AppState.set(processedState);
  }

  AppUI.init();
  AppGarage.init();
  AppTrucks.init();
  AppDrivers.init();
  AppOrders.init();
  AppTrips.init();
  AppFinance.init();
  AppContracts.init();
  AppMarket.init();
  AppCompany.init();
  AppAnalytics.init();
  AppTime.init();
  AppOnboarding.init();

  const s = AppState.get();
  if (s.pendingOfflineSummary) {
    const summary = s.pendingOfflineSummary;
    delete s.pendingOfflineSummary;
    AppStorage.save(s);

    const offlineHtml = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4); text-align: center;">
        <div style="font-size: 2.6rem;">☕</div>
        <h3 style="font-size: 1.25rem;">Пока вас не было</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Компания продолжала работать автономно в течение <strong>${summary.realMinutesAway} минут</strong>.
        </p>
        
        <div class="offline-stats-list">
          <div class="offline-stats-row">
            <span>Завершено рейсов водителями:</span>
            <strong style="color: var(--accent-blue);">${summary.tripsFinished}</strong>
          </div>
          <div class="offline-stats-row">
            <span>Получено выручки:</span>
            <strong style="color: var(--accent-green);">+€${summary.offlineEarnings.toLocaleString()}</strong>
          </div>
          <div class="offline-stats-row">
            <span>Текущие расходы (база, сборы):</span>
            <strong style="color: var(--accent-orange);">-€${summary.offlineExpenses.toLocaleString()}</strong>
          </div>
          <div class="offline-stats-row" style="border-top: 1px dashed var(--glass-border); padding-top: 6px; margin-top: 2px;">
            <span>Чистый финансовый итог:</span>
            <strong style="color: ${summary.netEarned >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1rem;">
              ${summary.netEarned >= 0 ? '+' : ''}€${summary.netEarned.toLocaleString()}
            </strong>
          </div>
        </div>

        <button class="btn-glass primary" onclick="AppUI.closeSheet()">Принять отчет</button>
      </div>
    `;
    AppUI.openSheet("Операционный оффлайн-отчет", offlineHtml);
  }

  console.info(`[Transport Company] Симулятор полностью развернут. Версия v${AppState.version}. Все системы активны.`);
});
