const TRUCK_MODELS = [
  // Дизельный сегмент - Экономичный и средний класс (Колесная формула 4x2)
  {
    modelId: "daf-xf-480",
    brand: "DAF",
    modelName: "DAF XF 480 Super Space",
    engineType: "diesel",
    enginePowerHp: 483,
    maxPayloadTons: 25.0,
    basePrice: 88000,
    fuelTankCapacityL: 840,
    baseFuelConsumptionL100: 27.8,
    durabilityRating: 1.1,
    serviceCostMultiplier: 0.85,
    icon: "🚛"
  },
  {
    modelId: "man-tgx-18-470",
    brand: "MAN",
    modelName: "MAN TGX 18.470 EfficientLine",
    engineType: "diesel",
    enginePowerHp: 470,
    maxPayloadTons: 24.5,
    basePrice: 92000,
    fuelTankCapacityL: 780,
    baseFuelConsumptionL100: 27.5,
    durabilityRating: 1.05,
    serviceCostMultiplier: 0.9,
    icon: "🚛"
  },
  {
    modelId: "man-tgx-18-510",
    brand: "MAN",
    modelName: "MAN TGX 18.510 Individual Lion",
    engineType: "diesel",
    enginePowerHp: 510,
    maxPayloadTons: 25.2,
    basePrice: 96000,
    fuelTankCapacityL: 800,
    baseFuelConsumptionL100: 28.5,
    durabilityRating: 1.0,
    serviceCostMultiplier: 1.0,
    icon: "🚛"
  },
  {
    modelId: "iveco-sway-480",
    brand: "Iveco",
    modelName: "Iveco S-Way 480 Natural Power",
    engineType: "diesel",
    enginePowerHp: 480,
    maxPayloadTons: 24.8,
    basePrice: 85000,
    fuelTankCapacityL: 790,
    baseFuelConsumptionL100: 27.2,
    durabilityRating: 1.15,
    serviceCostMultiplier: 0.82,
    icon: "🚛"
  },
  {
    modelId: "iveco-sway-530",
    brand: "Iveco",
    modelName: "Iveco S-Way 530 Cursor 13",
    engineType: "diesel",
    enginePowerHp: 530,
    maxPayloadTons: 25.5,
    basePrice: 94000,
    fuelTankCapacityL: 820,
    baseFuelConsumptionL100: 28.6,
    durabilityRating: 1.0,
    serviceCostMultiplier: 0.88,
    icon: "🚛"
  },
  {
    modelId: "renault-t-high-480",
    brand: "Renault",
    modelName: "Renault T-High 480 Sleeper",
    engineType: "diesel",
    enginePowerHp: 480,
    maxPayloadTons: 24.6,
    basePrice: 89000,
    fuelTankCapacityL: 800,
    baseFuelConsumptionL100: 27.9,
    durabilityRating: 1.05,
    serviceCostMultiplier: 0.86,
    icon: "🚛"
  },
  {
    modelId: "renault-t-high-520",
    brand: "Renault",
    modelName: "Renault T-High 520 Turbo-Compound",
    engineType: "diesel",
    enginePowerHp: 520,
    maxPayloadTons: 25.4,
    basePrice: 99000,
    fuelTankCapacityL: 850,
    baseFuelConsumptionL100: 28.2,
    durabilityRating: 0.98,
    serviceCostMultiplier: 0.95,
    icon: "🚛"
  },
  {
    modelId: "mercedes-actros-1848",
    brand: "Mercedes-Benz",
    modelName: "Mercedes Actros 1848 StreamSpace",
    engineType: "diesel",
    enginePowerHp: 476,
    maxPayloadTons: 25.0,
    basePrice: 104000,
    fuelTankCapacityL: 820,
    baseFuelConsumptionL100: 27.6,
    durabilityRating: 0.96,
    serviceCostMultiplier: 1.1,
    icon: "🚛"
  },
  {
    modelId: "mercedes-actros-1853",
    brand: "Mercedes-Benz",
    modelName: "Mercedes Actros 1853 GigaSpace",
    engineType: "diesel",
    enginePowerHp: 530,
    maxPayloadTons: 25.6,
    basePrice: 112000,
    fuelTankCapacityL: 820,
    baseFuelConsumptionL100: 28.0,
    durabilityRating: 0.95,
    serviceCostMultiplier: 1.2,
    icon: "🚛"
  },
  {
    modelId: "mercedes-actros-1863",
    brand: "Mercedes-Benz",
    modelName: "Mercedes Actros 1863 Edition 2",
    engineType: "diesel",
    enginePowerHp: 625,
    maxPayloadTons: 27.0,
    basePrice: 129000,
    fuelTankCapacityL: 890,
    baseFuelConsumptionL100: 30.5,
    durabilityRating: 0.88,
    serviceCostMultiplier: 1.3,
    icon: "🚛"
  },
  {
    modelId: "volvo-fh-460",
    brand: "Volvo",
    modelName: "Volvo FH 460 I-Save TC",
    engineType: "diesel",
    enginePowerHp: 460,
    maxPayloadTons: 25.0,
    basePrice: 101000,
    fuelTankCapacityL: 860,
    baseFuelConsumptionL100: 26.5,
    durabilityRating: 0.92,
    serviceCostMultiplier: 1.0,
    icon: "🚛"
  },
  {
    modelId: "volvo-fh-540",
    brand: "Volvo",
    modelName: "Volvo FH 540 Globetrotter XL",
    engineType: "diesel",
    enginePowerHp: 540,
    maxPayloadTons: 26.2,
    basePrice: 108000,
    fuelTankCapacityL: 850,
    baseFuelConsumptionL100: 29.0,
    durabilityRating: 0.9,
    serviceCostMultiplier: 1.05,
    icon: "🚛"
  },
  {
    // Тяжелое 3-осное шасси (6x4) под негабарит и спецтехнику
    modelId: "volvo-fh16-750",
    brand: "Volvo",
    modelName: "Volvo FH16 750 Monster XXL",
    engineType: "diesel",
    enginePowerHp: 750,
    maxPayloadTons: 31.5,
    basePrice: 142000,
    fuelTankCapacityL: 920,
    baseFuelConsumptionL100: 33.0,
    durabilityRating: 0.82,
    serviceCostMultiplier: 1.35,
    icon: "🚛"
  },
  {
    modelId: "scania-r450",
    brand: "Scania",
    modelName: "Scania Super R450 Highline",
    engineType: "diesel",
    enginePowerHp: 450,
    maxPayloadTons: 24.8,
    basePrice: 106000,
    fuelTankCapacityL: 800,
    baseFuelConsumptionL100: 26.2,
    durabilityRating: 0.9,
    serviceCostMultiplier: 1.08,
    icon: "🚛"
  },
  {
    modelId: "scania-r500-v8",
    brand: "Scania",
    modelName: "Scania R500 V8 Streamline",
    engineType: "diesel",
    enginePowerHp: 500,
    maxPayloadTons: 25.8,
    basePrice: 114000,
    fuelTankCapacityL: 750,
    baseFuelConsumptionL100: 29.8,
    durabilityRating: 0.85,
    serviceCostMultiplier: 1.15,
    icon: "🚛"
  },
  {
    // Флагман V8 King of Road (усиленная рама под тяжелые грузы)
    modelId: "scania-770s-v8",
    brand: "Scania",
    modelName: "Scania 770S V8 King of Road",
    engineType: "diesel",
    enginePowerHp: 770,
    maxPayloadTons: 32.0,
    basePrice: 154000,
    fuelTankCapacityL: 900,
    baseFuelConsumptionL100: 34.2,
    durabilityRating: 0.8,
    serviceCostMultiplier: 1.45,
    icon: "🚛"
  },

  // Электрический флагманский сегмент (Electric BEV)
  // Из-за массы батарей (около 3.5–4.5 тонн) полезная нагрузка строго 22–24 тонны
  {
    modelId: "volvo-fh-electric",
    brand: "Volvo",
    modelName: "Volvo FH Electric 540kWh",
    engineType: "electric",
    enginePowerHp: 666,
    maxPayloadTons: 23.5,
    basePrice: 178000,
    fuelTankCapacityL: 540,
    baseFuelConsumptionL100: 105,
    durabilityRating: 0.65,
    serviceCostMultiplier: 0.7,
    icon: "⚡"
  },
  {
    modelId: "scania-45s-bev",
    brand: "Scania",
    modelName: "Scania 45S BEV 624kWh",
    engineType: "electric",
    enginePowerHp: 610,
    maxPayloadTons: 23.0,
    basePrice: 185000,
    fuelTankCapacityL: 624,
    baseFuelConsumptionL100: 112,
    durabilityRating: 0.62,
    serviceCostMultiplier: 0.72,
    icon: "⚡"
  },
  {
    modelId: "mercedes-eactros-600",
    brand: "Mercedes-Benz",
    modelName: "Mercedes eActros 600 LongHaul",
    engineType: "electric",
    enginePowerHp: 600,
    maxPayloadTons: 24.0,
    basePrice: 192000,
    fuelTankCapacityL: 600,
    baseFuelConsumptionL100: 98,
    durabilityRating: 0.6,
    serviceCostMultiplier: 0.75,
    icon: "⚡"
  },
  {
    modelId: "man-etgx-ultra",
    brand: "MAN",
    modelName: "MAN eTGX 480kWh Heavy Trans",
    engineType: "electric",
    enginePowerHp: 544,
    maxPayloadTons: 23.2,
    basePrice: 168000,
    fuelTankCapacityL: 480,
    baseFuelConsumptionL100: 102,
    durabilityRating: 0.68,
    serviceCostMultiplier: 0.78,
    icon: "⚡"
  },
  {
    modelId: "renault-e-tech-t",
    brand: "Renault",
    modelName: "Renault Trucks E-Tech T Diamond",
    engineType: "electric",
    enginePowerHp: 490,
    maxPayloadTons: 22.8,
    basePrice: 162000,
    fuelTankCapacityL: 540,
    baseFuelConsumptionL100: 108,
    durabilityRating: 0.7,
    serviceCostMultiplier: 0.74,
    icon: "⚡"
  }
];

// Реалистичные ветки тюнинга с умеренными прибавками
const TRUCK_TUNING_BRANCHES = [
  {
    id: "ecu",
    name: "Калибровка ЭБУ (ECU)",
    icon: "💻",
    description: "Оптимизация карт впрыска топлива и наддува турбокомпрессора.",
    stages: [
      {
        stage: 1,
        title: "Stage 1: Eco-Flash",
        cost: 3200,
        powerBonusHp: 20, // +20 л.с.
        payloadBonusTons: 0,
        consumptionModifier: -0.04, // -4% расхода
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+20 л.с. мощности и сглаженная кривая момента (-4% расхода топлива)"
      },
      {
        stage: 2,
        title: "Stage 2: Heavy-Torque",
        cost: 6500,
        powerBonusHp: 45, // +45 л.с.
        payloadBonusTons: 0.5, // +0.5 т за счет тяги на низах
        consumptionModifier: 0.03, // +3% к расходу
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+45 л.с., +0.5 т к тяге на затяжных подъемах (+3% к расходу)"
      },
      {
        stage: 3,
        title: "Stage 3: High-Boost Master",
        cost: 11800,
        powerBonusHp: 75, // +75 л.с. (предел безопасного тюнинга для магистрального тягача)
        payloadBonusTons: 1.0,
        consumptionModifier: 0.08, // +8% к расходу
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+75 л.с. пиковой отдачи, +1.0 т к запасу тяги (+8% к расходу)"
      }
    ]
  },
  {
    id: "aero",
    name: "Шасси & Подвеска",
    icon: "🏗️",
    description: "Усиление рессор, осей и пневмобаллонов для распределения осевой нагрузки.",
    stages: [
      {
        stage: 1,
        title: "Stage 1: Усиленные амортизаторы",
        cost: 2800,
        powerBonusHp: 0,
        payloadBonusTons: 0.6, // +600 кг
        consumptionModifier: -0.02,
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+0.6 т к допустимой массе и лучшая устойчивость состава"
      },
      {
        stage: 2,
        title: "Stage 2: Пневмобаллоны Heavy Load",
        cost: 5400,
        powerBonusHp: 0,
        payloadBonusTons: 1.4, // +1.4 т
        consumptionModifier: -0.04,
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+1.4 т к грузоподъемности и защита подвески от пробоев"
      },
      {
        stage: 3,
        title: "Stage 3: Спец-комплект усиления рамы",
        cost: 8900,
        powerBonusHp: 0,
        payloadBonusTons: 2.5, // +2.5 т
        consumptionModifier: -0.05,
        brakesWearModifier: 0,
        tankBonus: 0,
        desc: "+2.5 т к полезной нагрузке и усиленные узлы крепления седла"
      }
    ]
  },
  {
    id: "tanks",
    name: "Топливная система / Бак",
    icon: "🛢️",
    description: "Дополнительные секции баков и энергоячеек без критического перевеса тягача.",
    stages: [
      {
        stage: 1,
        title: "Stage 1: Дополнительная секция (+100)",
        cost: 2200,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: 0,
        tankBonus: 100,
        desc: "+100 л/кВт⋅ч к автономному запасу хода"
      },
      {
        stage: 2,
        title: "Stage 2: Сдвоенные алюминиевые баки (+200)",
        cost: 4400,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: 0,
        tankBonus: 200,
        desc: "+200 л/кВт⋅ч запаса топлива/энергии"
      },
      {
        stage: 3,
        title: "Stage 3: Магистральный Long-Haul пакет (+350)",
        cost: 7200,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: 0,
        tankBonus: 350,
        desc: "+350 л/кВт⋅ч для проезда через всю Европу без частых заправок"
      }
    ]
  },
  {
    id: "retarder",
    name: "Тормозная система",
    icon: "🛑",
    description: "Вспомогательные гидравлические замедлители и термостойкие колодки.",
    stages: [
      {
        stage: 1,
        title: "Stage 1: Композитные колодки",
        cost: 2600,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: -0.20,
        tankBonus: 0,
        desc: "-20% износа тормозной системы на спусках"
      },
      {
        stage: 2,
        title: "Stage 2: Интегрированный интардер",
        cost: 5200,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: -0.38,
        tankBonus: 0,
        desc: "-38% износа колодок и дисков за счет гидрозамедления"
      },
      {
        stage: 3,
        title: "Stage 3: Voith Retarder Pro",
        cost: 8800,
        powerBonusHp: 0,
        payloadBonusTons: 0,
        consumptionModifier: 0,
        brakesWearModifier: -0.55,
        tankBonus: 0,
        desc: "-55% износа тормозов и непрерывное торможение без перегрева"
      }
    ]
  }
];