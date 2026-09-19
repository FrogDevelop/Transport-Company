const AppAchievements = {
  init() {
    this.ensureState();
  },

  ensureState() {
    const s = AppState.get();
    if (!Array.isArray(s.unlockedAchievements)) {
      s.unlockedAchievements = [];
    }
  },

  checkAndUnlockAll() {
    const s = AppState.get();
    this.ensureState();
    
    if (typeof ACHIEVEMENTS_CATALOG === "undefined") return;

    let newlyUnlocked = false;

    ACHIEVEMENTS_CATALOG.forEach(ach => {
      if (!s.unlockedAchievements.includes(ach.id)) {
        if (typeof ach.condition === "function" && ach.condition(s)) {
          s.unlockedAchievements.push(ach.id);
          newlyUnlocked = true;

          // Начисляем денежную награду
          const rewardVal = ach.rewardNumeric || 10000;
          s.finances.balance += rewardVal;
          s.finances.todayRevenue += rewardVal;
          s.finances.totalEarned += rewardVal;

          if (typeof AppUI !== "undefined") {
            AppUI.showToast(`🏆 Достижение разблокировано: «${ach.title}»! Награда: ${ach.reward}`, "success", 7000);
          }
        }
      }
    });

    if (newlyUnlocked) {
      AppStorage.save(s);
      if (typeof AppUI !== "undefined" && typeof AppUI.renderAll === "function") {
        AppUI.renderAll();
      }
    }
  }
};