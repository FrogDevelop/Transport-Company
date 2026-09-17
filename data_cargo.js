const CARGO_LICENSES = [
  {
    id: "lic_standard",
    code: "Категория 1",
    name: "Стандартные грузы",
    icon: "📦",
    cost: 0,
    minReputation: 0,
    desc: "Базовый допуск: товары народного потребления, тара, сухие строительные смеси и корпусная мебель.",
    avgRatePerKmTon: 0.16
  },
  {
    id: "lic_perishable",
    code: "Категория 2",
    name: "Скоропортящиеся грузы",
    icon: "🍎",
    cost: 10000,
    minReputation: 10,
    desc: "Санитарный сертификат: транспортировка продуктов питания, молочной продукции, свежих овощей и фруктов.",
    avgRatePerKmTon: 0.24
  },
  {
    id: "lic_fragile",
    code: "Категория 3",
    name: "Хрупкие грузы",
    icon: "🍷",
    cost: 24000,
    minReputation: 22,
    desc: "Сертификат деликатной транспортировки: архитектурное стекло, керамическая плитка, посуда и оптика.",
    avgRatePerKmTon: 0.34
  },
  {
    id: "lic_adr",
    code: "Категория 4",
    name: "Опасные грузы (ADR)",
    icon: "☣️",
    cost: 50000,
    minReputation: 38,
    desc: "Международный допуск ДОПОГ: промышленная химия, лакокрасочные материалы, удобрения и кислоты.",
    avgRatePerKmTon: 0.48
  },
  {
    id: "lic_heavy",
    code: "Категория 5",
    name: "Тяжеловесные грузы",
    icon: "🏗️",
    cost: 90000,
    minReputation: 55,
    desc: "Усиленный осевой допуск: крупногабаритные станки, стальные балки, арматура и промышленное железо.",
    avgRatePerKmTon: 0.62
  },
  {
    id: "lic_valuable",
    code: "Категория 6",
    name: "Дорогостоящий груз",
    icon: "💎",
    cost: 150000,
    minReputation: 72,
    desc: "Лицензия ценных активов: серверные стойки, микропроцессоры, телеком-оборудование и премиум-ритейл.",
    avgRatePerKmTon: 0.85
  },
  {
    id: "lic_oversized",
    code: "Категория 7",
    name: "Негабаритные спецгрузы",
    icon: "🚜",
    cost: 240000,
    minReputation: 85,
    desc: "Высший спецдопуск: лопасти ветрогенераторов, мостовые балки, карьерные экскаваторы и комбайны.",
    avgRatePerKmTon: 1.25
  }
];

const CARGO_CATALOG = [
  // 1. Стандартные грузы (lic_standard)
  {
    id: "cargo-retail",
    name: "Потребительские товары",
    icon: "📦",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_standard",
    basePricePerKmTon: 0.15,
    weightRange: [12, 20],
    minPowerHp: 440
  },
  {
    id: "cargo-construction",
    name: "Строительные смеси и цемент",
    icon: "🧱",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_standard",
    basePricePerKmTon: 0.16,
    weightRange: [16, 24],
    minPowerHp: 460
  },
  {
    id: "cargo-furniture",
    name: "Корпусная мебель",
    icon: "🪑",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_standard",
    basePricePerKmTon: 0.17,
    weightRange: [12, 18],
    minPowerHp: 440
  },
  {
    id: "cargo-wood",
    name: "Пиломатериалы и доски",
    icon: "🪵",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_standard",
    basePricePerKmTon: 0.18,
    weightRange: [18, 24],
    minPowerHp: 470
  },

  // 2. Скоропортящиеся грузы (lic_perishable)
  {
    id: "cargo-produce",
    name: "Свежие овощи и фрукты",
    icon: "🍊",
    requiredTrailerType: "refrigerated",
    requiredLicense: "lic_perishable",
    basePricePerKmTon: 0.23,
    weightRange: [14, 21],
    minPowerHp: 460
  },
  {
    id: "cargo-dairy",
    name: "Молочная продукция и сыры",
    icon: "🧀",
    requiredTrailerType: "refrigerated",
    requiredLicense: "lic_perishable",
    basePricePerKmTon: 0.25,
    weightRange: [15, 22],
    minPowerHp: 470
  },
  {
    id: "cargo-meat",
    name: "Охлажденное мясо",
    icon: "🥩",
    requiredTrailerType: "refrigerated",
    requiredLicense: "lic_perishable",
    basePricePerKmTon: 0.27,
    weightRange: [16, 23],
    minPowerHp: 480
  },

  // 3. Хрупкие грузы (lic_fragile)
  {
    id: "cargo-glass",
    name: "Архитектурное стеклопакеты",
    icon: "🪟",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_fragile",
    basePricePerKmTon: 0.32,
    weightRange: [14, 20],
    minPowerHp: 470
  },
  {
    id: "cargo-ceramics",
    name: "Керамическая плитка и сантехника",
    icon: "🏺",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_fragile",
    basePricePerKmTon: 0.35,
    weightRange: [17, 23],
    minPowerHp: 480
  },
  {
    id: "cargo-beverages",
    name: "Элитные напитки в стекле",
    icon: "🍷",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_fragile",
    basePricePerKmTon: 0.37,
    weightRange: [15, 22],
    minPowerHp: 480
  },

  // 4. Опасные грузы ADR (lic_adr)
  {
    id: "cargo-chemicals",
    name: "Промышленная химия (ADR 3)",
    icon: "☣️",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_adr",
    basePricePerKmTon: 0.46,
    weightRange: [16, 24],
    minPowerHp: 500
  },
  {
    id: "cargo-paints",
    name: "Технические лаки и растворители",
    icon: "🎨",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_adr",
    basePricePerKmTon: 0.49,
    weightRange: [15, 22],
    minPowerHp: 490
  },
  {
    id: "cargo-fertilizer",
    name: "Агрохимические удобрения (ADR 5)",
    icon: "⚠️",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_adr",
    basePricePerKmTon: 0.52,
    weightRange: [18, 25],
    minPowerHp: 510
  },

  // 5. Тяжеловесные грузы (lic_heavy)
  {
    id: "cargo-machinery",
    name: "Промышленные ЧПУ-станки",
    icon: "⚙️",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_heavy",
    basePricePerKmTon: 0.58,
    weightRange: [22, 27],
    minPowerHp: 520
  },
  {
    id: "cargo-steel",
    name: "Металлопрокат & Тяжелые балки",
    icon: "🏗️",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_heavy",
    basePricePerKmTon: 0.62,
    weightRange: [24, 28],
    minPowerHp: 540
  },
  {
    id: "cargo-concrete",
    name: "Железобетонные перекрытия",
    icon: "🏛️",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_heavy",
    basePricePerKmTon: 0.66,
    weightRange: [25, 29],
    minPowerHp: 540
  },

  // 6. Дорогостоящий груз (lic_valuable)
  {
    id: "cargo-servers",
    name: "Серверные стойки & СХД",
    icon: "🖥️",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_valuable",
    basePricePerKmTon: 0.82,
    weightRange: [14, 19],
    minPowerHp: 480
  },
  {
    id: "cargo-semiconductors",
    name: "Полупроводниковые чипы",
    icon: "🔬",
    requiredTrailerType: "refrigerated",
    requiredLicense: "lic_valuable",
    basePricePerKmTon: 0.88,
    weightRange: [12, 17],
    minPowerHp: 480
  },
  {
    id: "cargo-luxury",
    name: "Премиальная одежда и ювелирка",
    icon: "💎",
    requiredTrailerType: "curtainsider",
    requiredLicense: "lic_valuable",
    basePricePerKmTon: 0.94,
    weightRange: [11, 16],
    minPowerHp: 460
  },

  // 7. Негабаритные спецгрузы (lic_oversized)
  {
    id: "cargo-turbine",
    name: "Ротор ветрогенератора",
    icon: "🌀",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_oversized",
    basePricePerKmTon: 1.18,
    weightRange: [26, 31],
    minPowerHp: 600
  },
  {
    id: "cargo-mining",
    name: "Карьерный экскаваторный модуль",
    icon: "🚜",
    requiredTrailerType: "flatbed",
    requiredLicense: "lic_oversized",
    basePricePerKmTon: 1.28,
    weightRange: [27, 32],
    minPowerHp: 625
  }
];