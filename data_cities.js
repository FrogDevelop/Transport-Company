const CITIES_CATALOG = [
  { id: "berlin", name: "Берлин", country: "DE", x: 520, y: 310 },
  { id: "hamburg", name: "Гамбург", country: "DE", x: 480, y: 260 },
  { id: "munich", name: "Мюнхен", country: "DE", x: 505, y: 440 },
  { id: "frankfurt", name: "Франкфурт", country: "DE", x: 440, y: 370 },
  { id: "cologne", name: "Кёльн", country: "DE", x: 400, y: 340 },
  { id: "paris", name: "Париж", country: "FR", x: 300, y: 380 },
  { id: "lyon", name: "Лион", country: "FR", x: 340, y: 470 },
  { id: "marseille", name: "Марсель", country: "FR", x: 360, y: 560 },
  { id: "amsterdam", name: "Амстердам", country: "NL", x: 390, y: 280 },
  { id: "rotterdam", name: "Роттердам", country: "NL", x: 380, y: 300 },
  { id: "brussels", name: "Брюссель", country: "BE", x: 360, y: 330 },
  { id: "prague", name: "Прага", country: "CZ", x: 570, y: 360 },
  { id: "brno", name: "Брно", country: "CZ", x: 620, y: 390 },
  { id: "warsaw", name: "Варшава", country: "PL", x: 710, y: 290 },
  { id: "krakow", name: "Краков", country: "PL", x: 700, y: 360 },
  { id: "gdansk", name: "Гданьск", country: "PL", x: 670, y: 210 },
  { id: "vienna", name: "Вена", country: "AT", x: 610, y: 420 },
  { id: "salzburg", name: "Зальцбург", country: "AT", x: 550, y: 440 },
  { id: "milan", name: "Милан", country: "IT", x: 450, y: 520 },
  { id: "verona", name: "Верона", country: "IT", x: 490, y: 530 },
  { id: "bologna", name: "Болонья", country: "IT", x: 500, y: 560 },
  { id: "copenhagen", name: "Копенгаген", country: "DK", x: 510, y: 180 },
  { id: "stockholm", name: "Стокгольм", country: "SE", x: 640, y: 90 },
  { id: "gothenburg", name: "Гётеборг", country: "SE", x: 530, y: 130 }
];

const ROUTE_DISTANCES = {
  "berlin-hamburg": { distanceKm: 290, tollCost: 35 },
  "berlin-prague": { distanceKm: 350, tollCost: 45 },
  "berlin-warsaw": { distanceKm: 575, tollCost: 70 },
  "berlin-munich": { distanceKm: 590, tollCost: 80 },
  "berlin-paris": { distanceKm: 1050, tollCost: 160 },
  "hamburg-paris": { distanceKm: 900, tollCost: 140 },
  "munich-prague": { distanceKm: 380, tollCost: 50 },
  "munich-milan": { distanceKm: 495, tollCost: 110 },
  "munich-vienna": { distanceKm: 435, tollCost: 60 },
  "prague-vienna": { distanceKm: 330, tollCost: 40 },
  "prague-warsaw": { distanceKm: 680, tollCost: 85 },
  "paris-milan": { distanceKm: 850, tollCost: 155 }
};

function getRouteInfo(c1Id, c2Id) {
  const key1 = `${c1Id}-${c2Id}`;
  const key2 = `${c2Id}-${c1Id}`;
  if (ROUTE_DISTANCES[key1]) return ROUTE_DISTANCES[key1];
  if (ROUTE_DISTANCES[key2]) return ROUTE_DISTANCES[key2];

  const city1 = CITIES_CATALOG.find(c => c.id === c1Id);
  const city2 = CITIES_CATALOG.find(c => c.id === c2Id);
  if (!city1 || !city2) return { distanceKm: 500, tollCost: 75 };

  const dx = city1.x - city2.x;
  const dy = city1.y - city2.y;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  const distKm = Math.round(pixelDist * 2.8);
  const toll = Math.round(distKm * 0.13);
  return { distanceKm: distKm, tollCost: toll };
}