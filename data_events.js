const TRIP_RANDOM_EVENTS = [
  // 1. Позитивные ситуации (ускорение, экономия, премия)
  {
    id: "evt_green_wave",
    title: "Зеленый коридор на автобане",
    icon: "🟢",
    type: "positive",
    desc: "Идеальный трафик и отсутствие пробок на платном участке.",
    timeDeltaMinutes: -25, // сокращает время рейса
    payoutModPercent: 0.05, // +5% к выплате за экспресс
    damage: null
  },
  {
    id: "evt_tail_wind",
    title: "Попутный аэродинамический поток",
    icon: "💨",
    type: "positive",
    desc: "Плотный попутный поток снизил сопротивление воздуха и расход дизеля.",
    timeDeltaMinutes: -15,
    payoutModPercent: 0.04,
    damage: null
  },
  {
    id: "evt_client_tip",
    title: "Бонус заказчика за срочность",
    icon: "💶",
    type: "positive",
    desc: "Логистический хаб получателя выплатил премию за опережение графика.",
    timeDeltaMinutes: 0,
    payoutModPercent: 0.10, // +10% к выплате
    damage: null
  },
  {
    id: "evt_eco_master",
    title: "Мастерство эко-вождения",
    icon: "🌱",
    type: "positive",
    desc: "Шофер эффективно использовал накат на горных спусках, сберег тормоза и ресурс мотора.",
    timeDeltaMinutes: -10,
    payoutModPercent: 0.03,
    damage: null
  },

  // 2. Дорожные задержки и проверки (удар по выплате / времени)
  {
    id: "evt_traffic_jam",
    title: "Многокилометровый затор",
    icon: "🚗",
    type: "delay",
    desc: "Ремонт дорожного полотна на мосту вызвал часовую пробку.",
    timeDeltaMinutes: 45,
    payoutModPercent: -0.05, // штраф за опоздание
    damage: { cooling: 2.5 }
  },
  {
    id: "evt_bag_inspection",
    title: "Внеплановый весовой контроль (BAG)",
    icon: "⚖️",
    type: "delay",
    desc: "Транспортная полиция отправила автопоезд на контрольное взвешивание осей.",
    timeDeltaMinutes: 30,
    payoutModPercent: -0.04,
    damage: null
  },
  {
    id: "evt_customs_scan",
    title: "Рентген-сканирование на терминале",
    icon: "🛂",
    type: "delay",
    desc: "Таможенный контроль груза затянул отправку из транзитного сектора.",
    timeDeltaMinutes: 35,
    payoutModPercent: -0.06,
    damage: null
  },
  {
    id: "evt_toll_gate_glitch",
    title: "Сбой транспондера Toll Collect",
    icon: "📟",
    type: "penalty",
    desc: "Автоматическая рамка оплаты не считала датчик, наложен мелкий штраф оператора.",
    timeDeltaMinutes: 15,
    payoutModPercent: -0.07,
    damage: null
  },

  // 3. Технические поломки и износ агрегатов
  {
    id: "evt_tire_puncture",
    title: "Прокол заднего ската полуприцепа",
    icon: "🛞",
    type: "breakdown",
    desc: "Попадание металлического мусора. Водитель потратил время на установку запаски.",
    timeDeltaMinutes: 40,
    payoutModPercent: -0.08,
    damage: { tires: 9.0, suspension: 2.0 }
  },
  {
    id: "evt_brake_overheat",
    title: "Перегрев колодок на серпантине",
    icon: "🛑",
    type: "breakdown",
    desc: "Затяжной спуск в предгорьях привел к перегреву тормозных дисков.",
    timeDeltaMinutes: 20,
    payoutModPercent: -0.05,
    damage: { brakes: 7.5 }
  },
  {
    id: "evt_coolant_leak",
    title: "Утечка антифриза из патрубка",
    icon: "❄️",
    type: "breakdown",
    desc: "Ослаб хомут радиатора. Экстренная протяжка и доливка охлаждающей жидкости на АЗС.",
    timeDeltaMinutes: 30,
    payoutModPercent: -0.07,
    damage: { cooling: 8.0, engine: 3.0 }
  },
  {
    id: "evt_suspension_hit",
    title: "Удар в выбоину на съезде",
    icon: "🔩",
    type: "breakdown",
    desc: "Жесткий пробой подвески на строительном объезде автобана.",
    timeDeltaMinutes: 10,
    payoutModPercent: -0.04,
    damage: { suspension: 7.0, tires: 3.5 }
  },
  {
    id: "evt_sensor_error",
    title: "Ошибка датчиков AdBlue / ЭБУ",
    icon: "⚡",
    type: "breakdown",
    desc: "Электроника мотора перешла в аварийный режим ограничения мощности.",
    timeDeltaMinutes: 35,
    payoutModPercent: -0.08,
    damage: { electronics: 6.5, engine: 2.0 }
  },
  {
    id: "evt_transmission_slip",
    title: "Пробуксовка сцепления КПП",
    icon: "🕹️",
    type: "breakdown",
    desc: "Перегрев диска сцепления под нагрузкой на крутом затяжном подъёме.",
    timeDeltaMinutes: 25,
    payoutModPercent: -0.06,
    damage: { transmission: 6.0 }
  },
  {
    id: "evt_windshield_crack",
    title: "Скол лобового стекла от щебня",
    icon: "🪟",
    type: "penalty",
    desc: "Камень из-под попутного тягача оставил трещину на стекле кабины.",
    timeDeltaMinutes: 0,
    payoutModPercent: -0.05,
    damage: { electronics: 2.5 }
  }
];