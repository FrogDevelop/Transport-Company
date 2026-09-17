const CITIES_CATALOG = [
  // Германия (Центральный логистический кластер)
  { id: "berlin", name: "Берлин", country: "DE", lat: 52.5200, lon: 13.4050, tollRatePerKm: 0.19 },
  { id: "hamburg", name: "Гамбург", country: "DE", lat: 53.5511, lon: 9.9937, tollRatePerKm: 0.19 },
  { id: "munich", name: "Мюнхен", country: "DE", lat: 48.1351, lon: 11.5820, tollRatePerKm: 0.19 },
  { id: "cologne", name: "Кёльн", country: "DE", lat: 50.9375, lon: 6.9603, tollRatePerKm: 0.19 },
  { id: "frankfurt", name: "Франкфурт", country: "DE", lat: 50.1109, lon: 8.6821, tollRatePerKm: 0.19 },
  { id: "leipzig", name: "Лейпциг", country: "DE", lat: 51.3397, lon: 12.3731, tollRatePerKm: 0.19 },
  { id: "stuttgart", name: "Штутгарт", country: "DE", lat: 48.7758, lon: 9.1829, tollRatePerKm: 0.19 },

  // Франция
  { id: "paris", name: "Париж", country: "FR", lat: 48.8566, lon: 2.3522, tollRatePerKm: 0.23 },
  { id: "lyon", name: "Лион", country: "FR", lat: 45.7640, lon: 4.8357, tollRatePerKm: 0.23 },
  { id: "marseille", name: "Марсель", country: "FR", lat: 43.2965, lon: 5.3698, tollRatePerKm: 0.23 },
  { id: "strasbourg", name: "Страсбург", country: "FR", lat: 48.5734, lon: 7.7521, tollRatePerKm: 0.23 },
  { id: "lille", name: "Лилль", country: "FR", lat: 50.6292, lon: 3.0573, tollRatePerKm: 0.22 },

  // Польша & Восточный коридор
  { id: "warsaw", name: "Варшава", country: "PL", lat: 52.2297, lon: 21.0122, tollRatePerKm: 0.12 },
  { id: "wroclaw", name: "Вроцлав", country: "PL", lat: 51.1079, lon: 17.0385, tollRatePerKm: 0.12 },
  { id: "poznan", name: "Познань", country: "PL", lat: 52.4064, lon: 16.9252, tollRatePerKm: 0.12 },
  { id: "gdansk", name: "Гданьск", country: "PL", lat: 54.3520, lon: 18.6466, tollRatePerKm: 0.12 },
  { id: "krakow", name: "Краков", country: "PL", lat: 50.0647, lon: 19.9450, tollRatePerKm: 0.12 },

  // Чехия & Словакия
  { id: "prague", name: "Прага", country: "CZ", lat: 50.0755, lon: 14.4378, tollRatePerKm: 0.18 },
  { id: "brno", name: "Брно", country: "CZ", lat: 49.1951, lon: 16.6068, tollRatePerKm: 0.18 },
  { id: "bratislava", name: "Братислава", country: "SK", lat: 48.1486, lon: 17.1077, tollRatePerKm: 0.16 },

  // Австрия & Альпы
  { id: "vienna", name: "Вена", country: "AT", lat: 48.2082, lon: 16.3738, tollRatePerKm: 0.24 },
  { id: "salzburg", name: "Зальцбург", country: "AT", lat: 47.8095, lon: 13.0550, tollRatePerKm: 0.24 },
  { id: "innsbruck", name: "Инсбрук", country: "AT", lat: 47.2692, lon: 11.4041, tollRatePerKm: 0.26 },

  // Бенилюкс
  { id: "amsterdam", name: "Амстердам", country: "NL", lat: 52.3676, lon: 4.9041, tollRatePerKm: 0.15 },
  { id: "rotterdam", name: "Роттердам", country: "NL", lat: 51.9244, lon: 4.4777, tollRatePerKm: 0.15 },
  { id: "brussels", name: "Брюссель", country: "BE", lat: 50.8503, lon: 4.3517, tollRatePerKm: 0.16 },

  // Италия
  { id: "milan", name: "Милан", country: "IT", lat: 45.4642, lon: 9.1900, tollRatePerKm: 0.25 },
  { id: "bologna", name: "Болонья", country: "IT", lat: 44.4949, lon: 11.3426, tollRatePerKm: 0.25 },
  { id: "rome", name: "Рим", country: "IT", lat: 41.9028, lon: 12.4964, tollRatePerKm: 0.25 },

  // Испания
  { id: "madrid", name: "Мадрид", country: "ES", lat: 40.4168, lon: -3.7038, tollRatePerKm: 0.20 },
  { id: "barcelona", name: "Барселона", country: "ES", lat: 41.3879, lon: 2.1699, tollRatePerKm: 0.22 },
  { id: "valencia", name: "Валенсия", country: "ES", lat: 39.4699, lon: -0.3763, tollRatePerKm: 0.20 }
];

// Базовые точные дорожные плечи (для калибровки)
const ROUTE_DISTANCES = {
  "berlin-warsaw": { distanceKm: 574, tollCost: 78 },
  "berlin-prague": { distanceKm: 348, tollCost: 52 },
  "berlin-hamburg": { distanceKm: 289, tollCost: 44 },
  "berlin-munich": { distanceKm: 585, tollCost: 92 },
  "berlin-frankfurt": { distanceKm: 546, tollCost: 86 },
  "berlin-paris": { distanceKm: 1054, tollCost: 182 },
  "paris-lyon": { distanceKm: 465, tollCost: 98 },
  "paris-marseille": { distanceKm: 775, tollCost: 165 },
  "paris-brussels": { distanceKm: 312, tollCost: 56 },
  "amsterdam-rotterdam": { distanceKm: 78, tollCost: 12 },
  "amsterdam-frankfurt": { distanceKm: 440, tollCost: 68 },
  "amsterdam-berlin": { distanceKm: 655, tollCost: 98 },
  "prague-vienna": { distanceKm: 332, tollCost: 62 },
  "vienna-munich": { distanceKm: 435, tollCost: 78 },
  "munich-milan": { distanceKm: 495, tollCost: 115 },
  "milan-rome": { distanceKm: 572, tollCost: 132 },
  "lyon-barcelona": { distanceKm: 642, tollCost: 138 },
  "barcelona-madrid": { distanceKm: 625, tollCost: 120 },
  "warsaw-krakow": { distanceKm: 295, tollCost: 38 },
  "warsaw-gdansk": { distanceKm: 340, tollCost: 46 }
};