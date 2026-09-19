const ACHIEVEMENTS_CATALOG = [
  {
    id: "first-trip",
    title: "Первый километр",
    desc: "Успешно завершите свой первый коммерческий рейс в Европе.",
    icon: "🚛",
    reward: "€5 000",
    rewardNumeric: 5000,
    condition: (s) => (s.statistics && s.statistics.completedTripsCount >= 1) || (s.completedTripsCount >= 1)
  },
  {
    id: "fleet-3",
    title: "Малый автопарк",
    desc: "Расширьте собственный автопарк компании до 3 действующих тягачей.",
    icon: "🏢",
    reward: "€15 000",
    rewardNumeric: 15000,
    condition: (s) => (s.trucks || []).length >= 3
  },
  {
    id: "fleet-8",
    title: "Крупный перевозчик",
    desc: "Сформируйте флот из 8 магистральных тягачей в гараже.",
    icon: "🏭",
    reward: "€40 000",
    rewardNumeric: 40000,
    condition: (s) => (s.trucks || []).length >= 8
  },
  {
    id: "millionaire",
    title: "Транспортный капитал",
    desc: "Заработайте первый миллион евро совокупной операционной выручки.",
    icon: "💰",
    reward: "€50 000",
    rewardNumeric: 50000,
    condition: (s) => (s.finances.totalEarned || 0) >= 1000000
  },
  {
    id: "eco-master",
    title: "Зеленый транзит",
    desc: "Приобретите и выведите на линию 100% электрический тягач (BEV).",
    icon: "⚡",
    reward: "€25 000",
    rewardNumeric: 25000,
    condition: (s) => (s.trucks || []).some(t => t.engineType === "electric" || t.model.toLowerCase().includes("bev") || t.model.toLowerCase().includes("электро"))
  },
  {
    id: "tuning-master",
    title: "Инженерный максимум",
    desc: "Прокачайте любой тягач компании до максимального Stage 3.",
    icon: "⚙️",
    reward: "€20 000",
    rewardNumeric: 20000,
    condition: (s) => (s.trucks || []).some(t => t.tuningLevels && (t.tuningLevels.ecu === 3 || t.tuningLevels.aero === 3))
  },
  {
    id: "reputation-80",
    title: "Безупречная надежность",
    desc: "Поднимите деловой рейтинг компании выше 80 пунктов из 100.",
    icon: "⭐",
    reward: "€30 000",
    rewardNumeric: 30000,
    condition: (s) => (s.company && s.company.reputation >= 80)
  },
  {
    id: "king-of-roads",
    title: "Король автобанов",
    desc: "Преодолейте более 50 000 километров на европейских маршрутах.",
    icon: "👑",
    reward: "€75 000",
    rewardNumeric: 75000,
    condition: (s) => (s.statistics && s.statistics.totalDistanceDrivenKm >= 50000)
  }
];