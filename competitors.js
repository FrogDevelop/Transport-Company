const AppCompetitors = {
  processDailyCompetitorsTick() {
    const s = AppState.get();
    const playerFleetCount = s.trucks.length;
    const playerRep = s.company.reputation;
    const playerPower = (playerFleetCount * 4) + (playerRep * 0.5);

    let totalAIPower = 0;
    s.competitors.forEach(ai => {
      if (Math.random() < 0.25) {
        ai.fleetSize += 1;
      }
      ai.calculatedPower = (ai.fleetSize * 4) + (ai.aggression * 20);
      totalAIPower += ai.calculatedPower;
    });

    const aggregateTotal = totalAIPower + playerPower;
    s.company.marketShare = Math.max(5, Math.round((playerPower / aggregateTotal) * 100));

    let remainingShare = 100 - s.company.marketShare;
    s.competitors.forEach((ai, idx) => {
      if (idx === s.competitors.length - 1) {
        ai.marketShare = Math.max(2, remainingShare);
      } else {
        const share = Math.round((ai.calculatedPower / totalAIPower) * (100 - s.company.marketShare));
        ai.marketShare = Math.max(2, share);
        remainingShare -= share;
      }
    });

    if (s.availableOrders && s.availableOrders.length > 2 && Math.random() < 0.4) {
      s.availableOrders.pop();
    }

    AppStorage.save(s);
  }
};
