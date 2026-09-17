const AppState = {
  version: "1.9.1",
  
  data: {
    lastSavedTimestamp: Date.now(),
    tutorial: { completed: false, currentStepIndex: 0 },
    company: { 
      name: "Logix Transport", 
      reputation: 0,
      foundedDay: 1, 
      rank: "Начинающий перевозчик", 
      level: 1,
      xp: 0,
      marketShare: 1, 
      licenses: ["lic_standard"]
    },
    notifications: [], // Лог всех уведомлений игры
    unreadNotificationsCount: 0,
    finances: { balance: 100000, todayRevenue: 0, todayExpenses: 0, dailyNet: 0, totalEarned: 0, totalSpent: 0, activeLoans: [], activeLeases: [], insurancePolicy: "basic", pnlHistory: [] },
    statistics: { totalDistanceDrivenKm: 0, totalCargoHauledTons: 0, completedTripsCount: 0, totalFuelConsumedLiters: 0, totalTollFeesPaid: 0, emergencyRepairsCount: 0 },
    unlockedAchievements: [],
    market: { currentDieselPrice: 1.68, previousDieselPrice: 1.65, currentSeasonIndex: 0, seasonDayCounter: 1, usedTrucksMarket: [] },
    garage: { 
      id: "garage-01", 
      name: "Центральный парк", 
      city: "Берлин", 
      level: 1, 
      slots: 2, 
      occupiedSlots: 0, 
      maintenanceCostDaily: 90, 
      hasServiceBay: false, 
      hasFuelStation: false, 
      hasDriverLounge: false, 
      hasTelematicsCenter: false, 
      hasClimateHangar: false, 
      hasCrossDockTerminal: false,
      fuelStation: {
        level: 1,
        capacityLiters: 10000,
        currentLiters: 2500,
        pumpSpeedLPerMinute: 80,
        delivery: null
      }
    },
    branches: [{ id: "br-berlin", cityName: "Берлин", country: "DE", level: 1, slotsProvided: 3, dailyUpkeep: 120, establishedDay: 1 }],
    warehouses: [],
    competitors: [
      { id: "comp-vanguard", marketShare: 32, fleetSize: 18, aggression: 1.2 },
      { id: "comp-nordic", marketShare: 28, fleetSize: 14, aggression: 0.9 },
      { id: "comp-continental", marketShare: 23, fleetSize: 12, aggression: 0.8 },
      { id: "comp-prestige", marketShare: 16, fleetSize: 10, aggression: 1.0 }
    ],
    trucks: [],
    trailers: [],
    drivers: [
      {
        id: "drv-001",
        name: "Алексей Смирнов",
        age: 38,
        experienceYears: 12,
        rating: 4.8,
        dailyWage: 180,
        ecoDrivingSkill: 12,
        safetySkill: 14,
        stamina: 100,
        assignedTruckId: null,
        status: "rest"
      }
    ],
    trips: [],
    availableOrders: [],
    activeContracts: [],
    time: { currentMinute: 480, currentDay: 1, timeScale: 1, isPaused: false },
    settings: { theme: "dark", soundEnabled: true, lowPerformanceMode: false }
  },

  get() { return this.data; },
  set(newState) {
    this.data = Object.assign(this.data, newState);
    AppStorage.save(this.data);
  }
};