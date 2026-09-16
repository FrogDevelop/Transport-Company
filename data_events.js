const ROAD_EVENTS = [
  {
    id: "evt-traffic-jam",
    title: "Многокилометровый затор",
    description: "Ремонт дорожного полотна на автобане вызвал задержку в пути.",
    type: "delay",
    delayKmEquivalent: 40,
    costPenalty: 0,
    wearMultiplier: 1.1,
    icon: "🚧"
  },
  {
    id: "evt-punctured-tire",
    title: "Прокол покрышки",
    description: "Наезд на острый предмет повредил шину полуприцепа. Требуется срочная замена.",
    type: "breakdown",
    targetComponent: "tires",
    wearDamage: 25,
    costPenalty: 280,
    delayKmEquivalent: 20,
    icon: "🛞"
  },
  {
    id: "evt-border-delay",
    title: "Таможенный контроль",
    description: "Внеплановая проверка документов на пограничном переходе.",
    type: "delay",
    delayKmEquivalent: 30,
    costPenalty: 0,
    wearMultiplier: 1.0,
    icon: "🛂"
  },
  {
    id: "evt-express-bonus",
    title: "Срочная премия от заказчика",
    description: "Получатель груза готов доплатить бонус за бережную и пунктуальную транспортировку.",
    type: "bonus",
    bonusCash: 450,
    reputationGain: 2,
    icon: "💰"
  },
  {
    id: "evt-engine-overheat",
    title: "Перегрев системы охлаждения",
    description: "Крутой подъем в гору привел к росту температуры охлаждающей жидкости.",
    type: "wear",
    targetComponent: "cooling",
    wearDamage: 18,
    costPenalty: 120,
    delayKmEquivalent: 15,
    icon: "🌡️"
  }
];
