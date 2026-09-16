const TRUCK_MODELS = [
  // Дизельный сегмент - Standard & Eco
  {
    modelId: "daf-xf-480",
    brand: "DAF",
    modelName: "DAF XF 480 Super Space",
    engineType: "diesel",
    enginePowerHp: 480,
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
    enginePowerHp: 480,
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
    basePrice: 108000,
    fuelTankCapacityL: 850,
    baseFuelConsumptionL100: 29.0,
    durabilityRating: 0.9,
    serviceCostMultiplier: 1.05,
    icon: "🚛"
  },
  {
    modelId: "volvo-fh16-750",
    brand: "Volvo",
    modelName: "Volvo FH16 750 Monster XXL",
    engineType: "diesel",
    enginePowerHp: 750,
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
    basePrice: 114000,
    fuelTankCapacityL: 750,
    baseFuelConsumptionL100: 29.8,
    durabilityRating: 0.85,
    serviceCostMultiplier: 1.15,
    icon: "🚛"
  },
  {
    modelId: "scania-770s-v8",
    brand: "Scania",
    modelName: "Scania 770S V8 King of Road",
    engineType: "diesel",
    enginePowerHp: 770,
    basePrice: 154000,
    fuelTankCapacityL: 900,
    baseFuelConsumptionL100: 34.2,
    durabilityRating: 0.8,
    serviceCostMultiplier: 1.45,
    icon: "🚛"
  },

  // Электрический флагманский сегмент (Electric BEV)
  {
    modelId: "volvo-fh-electric",
    brand: "Volvo",
    modelName: "Volvo FH Electric 540kWh",
    engineType: "electric",
    enginePowerHp: 666,
    basePrice: 178000,
    fuelTankCapacityL: 540, // кВт⋅ч емкость
    baseFuelConsumptionL100: 105, // кВт⋅ч / 100 км
    durabilityRating: 0.65, // Реже ломается
    serviceCostMultiplier: 0.7,
    icon: "⚡"
  },
  {
    modelId: "scania-45s-bev",
    brand: "Scania",
    modelName: "Scania 45S BEV 624kWh",
    engineType: "electric",
    enginePowerHp: 610,
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
    basePrice: 162000,
    fuelTankCapacityL: 540,
    baseFuelConsumptionL100: 108,
    durabilityRating: 0.7,
    serviceCostMultiplier: 0.74,
    icon: "⚡"
  }
];

const TRUCK_TUNING_CATALOG = [
  {
    id: "tune-ecu",
    name: "Чип-тюнинг ECU (Stage 1)",
    cost: 4500,
    consumptionModifier: -0.06,
    powerBonusHp: 35,
    desc: "-6% к базовому расходу топлива/энергии"
  },
  {
    id: "tune-aero",
    name: "Аэродинамический обвес & Спойлеры",
    cost: 3200,
    consumptionModifier: -0.04,
    powerBonusHp: 0,
    desc: "-4% к сопротивлению воздуха на автобанах"
  },
  {
    id: "tune-tanks",
    name: "Увеличенные топливные баки (+200л)",
    cost: 2800,
    tankBonus: 200,
    desc: "+200 литров к запасу хода без остановок"
  },
  {
    id: "tune-retarder",
    name: "Гидравлический ретардер Voith",
    cost: 5800,
    brakesWearModifier: -0.4,
    desc: "Снижает износ тормозной системы на 40%"
  }
];