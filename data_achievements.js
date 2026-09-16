const ACHIEVEMENTS_CATALOG = [
  {
    id: "ach-first-delivery",
    title: "Первый километр",
    description: "Успешно завершить первый коммерческий рейс компании.",
    icon: "🏁",
    rewardCash: 2500,
    reputationGain: 2,
    check(state) {
      return (state.statistics && state.statistics.completedTripsCount || 0) >= 1;
    }
  },
  {
    id: "ach-fleet-5",
    title: "Собственная автоколонна",
    description: "Увеличить размер рабочего автопарка до 5 тягачей.",
    icon: "🚛",
    rewardCash: 12000,
    reputationGain: 4,
    check(state) {
      return state.trucks.length >= 5;
    }
  },
  {
    id: "ach-branches-3",
    title: "Трансъевропейская сеть",
    description: "Открыть не менее 3 региональных филиалов в городах Европы.",
    icon: "🏛️",
    rewardCash: 35000,
    reputationGain: 6,
    check(state) {
      return (state.branches ? state.branches.length : 0) >= 3;
    }
  },
  {
    id: "ach-half-million",
    title: "Транспортный барон",
    description: "Накопить чистый баланс компании свыше €500 000.",
    icon: "💰",
    rewardCash: 50000,
    reputationGain: 8,
    check(state) {
      return state.finances.balance >= 500000;
    }
  },
  {
    id: "ach-tender-master",
    title: "Надежный поставщик",
    description: "Заключить долгосрочный B2B-контракт с крупной корпорацией.",
    icon: "📜",
    rewardCash: 15000,
    reputationGain: 5,
    check(state) {
      return (state.activeContracts ? state.activeContracts.length : 0) >= 1;
    }
  },
  {
    id: "ach-green-logistics",
    title: "Эко-логистика",
    description: "Нанять в штат опытного водителя с бонусом эко-вождения 12% и выше.",
    icon: "🌱",
    rewardCash: 5000,
    reputationGain: 3,
    check(state) {
      return state.drivers.some(d => (d.ecoDrivingSkill || 0) >= 12);
    }
  },
  {
    id: "ach-market-leader",
    title: "Лидер грузооборота",
    description: "Завоевать не менее 25% доли всего логистического рынка Европы.",
    icon: "👑",
    rewardCash: 75000,
    reputationGain: 10,
    check(state) {
      return (state.company.marketShare || 0) >= 25;
    }
  },
  {
    id: "ach-reputation-90",
    title: "Безупречная репутация",
    description: "Достичь корпоративного рейтинга доверия 90 баллов из 100.",
    icon: "⭐",
    rewardCash: 25000,
    reputationGain: 5,
    check(state) {
      return state.company.reputation >= 90;
    }
  }
];
