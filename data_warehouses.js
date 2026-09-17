const WAREHOUSE_HUBS_CATALOG = [
  {
    id: "wh-frankfurt",
    cityName: "Франкфурт",
    country: "DE",
    title: "Центральный перевалочный РЦ",
    icon: "🏬",
    cost: 85000,
    baseCapacityTons: 80,
    dailyUpkeep: 110,
    accumulationRatePerHour: 4.2, // тонн груза накапливается в час
    rentalYieldPerTon: 3.2, // пассивный доход в день за неиспользуемую тонну
    targetDestinations: ["Берлин", "Париж", "Амстердам", "Мюнхен"],
    desc: "Сердце европейской логистики. Быстрое накопление транзитных сборных грузов во все направления."
  },
  {
    id: "wh-rotterdam",
    cityName: "Роттердам",
    country: "NL",
    title: "Морской интермодальный терминал",
    icon: "🚢",
    cost: 110000,
    baseCapacityTons: 120,
    dailyUpkeep: 140,
    accumulationRatePerHour: 5.5,
    rentalYieldPerTon: 3.6,
    targetDestinations: ["Кёльн", "Брюссель", "Гамбург", "Франкфурт"],
    desc: "Крупнейший порт Европы. Высокая доходность консолидации океанских контейнерных партий."
  },
  {
    id: "wh-warsaw",
    cityName: "Варшава",
    country: "PL",
    title: "Восточный распределительный комплекс",
    icon: "📦",
    cost: 70000,
    baseCapacityTons: 90,
    dailyUpkeep: 85,
    accumulationRatePerHour: 3.8,
    rentalYieldPerTon: 2.8,
    targetDestinations: ["Берлин", "Познань", "Прага", "Гданьск"],
    desc: "Выгодная консолидация сырьевых поставок и промышленных сборных грузов из Восточной Европы."
  },
  {
    id: "wh-lyon",
    cityName: "Лион",
    country: "FR",
    title: "Южный логистический хаб",
    icon: "🏛️",
    cost: 95000,
    baseCapacityTons: 100,
    dailyUpkeep: 120,
    accumulationRatePerHour: 4.5,
    rentalYieldPerTon: 3.4,
    targetDestinations: ["Париж", "Милан", "Марсель", "Барселона"],
    desc: "Стратегический перегрузочный узел на пути между Францией, Италией и Испанией."
  }
];

const WAREHOUSE_UPGRADE_TIERS = [
  { level: 1, title: "Стандартный ангар", capMultiplier: 1.0, speedMultiplier: 1.0, cost: 0, perk: "Базовая консолидация сборных партий" },
  { level: 2, title: "Автоматизированный РЦ", capMultiplier: 1.6, speedMultiplier: 1.4, cost: 50000, perk: "+60% объём, ускоренная сортировка" },
  { level: 3, title: "High-Tech Smart Terminal", capMultiplier: 2.4, speedMultiplier: 2.0, cost: 115000, perk: "Холодные камеры (+15% к ставкам сборного рейса)" }
];