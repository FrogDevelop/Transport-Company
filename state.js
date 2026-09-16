const AppState = {
  version: "1.6.0",
  
  data: {
    lastSavedTimestamp: Date.now(),
    tutorial: { completed: false, currentStepIndex: 0 },
    company: { name: "Logix Transport", reputation: 50, foundedDay: 1, rank: "Частный перевозчик", marketShare: 14 },
    finances: { balance: 100000, todayRevenue: 0, todayExpenses: 0, dailyNet: 0, totalEarned: 0, totalSpent: 0, activeLoans: [], activeLeases: [], insurancePolicy: "basic", pnlHistory: [] },
    statistics: { totalDistanceDrivenKm: 0, totalCargoHauledTons: 0, completedTripsCount: 0, totalFuelConsumedLiters: 0, totalTollFeesPaid: 0, emergencyRepairsCount: 0 },
    unlockedAchievements: [],
    market: { currentDieselPrice: 1.68, previousDieselPrice: 1.65, currentSeasonIndex: 0, seasonDayCounter: 1, usedTrucksMarket: [] },
    garage: { id: "garage-01", name: "Центральный парк", city: "Берлин", level: 1, slots: 3, occupiedSlots: 1, maintenanceCostDaily: 120, hasServiceBay: false, hasFuelStation: false },
    branches: [{ id: "br-berlin", cityName: "Берлин", country: "DE", level: 1, slotsProvided: 3, dailyUpkeep: 120, establishedDay: 1 }],
    warehouses: [],
    competitors: [
      { id: "comp-vanguard", marketShare: 28, fleetSize: 18, aggression: 1.2 },
      { id: "comp-nordic", marketShare: 24, fleetSize: 14, aggression: 0.9 },
      { id: "comp-continental", marketShare: 19, fleetSize: 12, aggression: 0.8 },
      { id: "comp-prestige", marketShare: 15, fleetSize: 10, aggression: 1.0 }
    ],
    trucks: [
      {
        id: "trk-001",
        model: "MAN TGX 18.510",
        brand: "MAN",
        year: 2026,
        mileageKm: 0,
        fuelTankL: 800,
        fuelCurrentL: 650,
        avgConsumptionL100: 29.5,
        assignedDriverId: "drv-001",
        status: "idle",
        components: { engine: 100, transmission: 100, brakes: 100, tires: 100, suspension: 100, electronics: 100, cooling: 100 },
        purchasePrice: 96000,
        marketValue: 96000,
        tco: { totalMaintenanceCost: 0, totalFuelCost: 0, totalKmDriven: 0, totalRevenueGenerated: 0 }
      }
    ],
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
        assignedTruckId: "trk-001",
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
