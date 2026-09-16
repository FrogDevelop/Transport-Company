const CARGO_CATALOG = [
  {
    id: "cargo-electronics",
    name: "Потребительская электроника",
    icon: "💻",
    requiredTrailerType: "curtainsider",
    basePricePerKmTon: 0.28,
    fragility: 0.7,
    densityKgM3: 220,
    minReputation: 50
  },
  {
    id: "cargo-frozen-food",
    name: "Замороженные продукты (-18°C)",
    icon: "❄️",
    requiredTrailerType: "refrigerated",
    basePricePerKmTon: 0.35,
    fragility: 0.4,
    densityKgM3: 400,
    minReputation: 55
  },
  {
    id: "cargo-pharma",
    name: "Фармацевтика и вакцины (+4°C)",
    icon: "💉",
    requiredTrailerType: "refrigerated",
    basePricePerKmTon: 0.48,
    fragility: 0.9,
    densityKgM3: 280,
    minReputation: 70
  },
  {
    id: "cargo-construction",
    name: "Строительные материалы",
    icon: "🧱",
    requiredTrailerType: "curtainsider",
    basePricePerKmTon: 0.19,
    fragility: 0.1,
    densityKgM3: 650,
    minReputation: 0
  },
  {
    id: "cargo-heavy-machinery",
    name: "Промышленное оборудование",
    icon: "⚙️",
    requiredTrailerType: "flatbed",
    basePricePerKmTon: 0.42,
    fragility: 0.3,
    densityKgM3: 750,
    minReputation: 65
  }
];
