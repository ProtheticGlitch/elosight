window.FP = window.FP || {};

window.FP.FACEIT_LEVELS = [
  { min: 100, max: 500, level: 1 },
  { min: 501, max: 750, level: 2 },
  { min: 751, max: 900, level: 3 },
  { min: 901, max: 1050, level: 4 },
  { min: 1051, max: 1200, level: 5 },
  { min: 1201, max: 1350, level: 6 },
  { min: 1351, max: 1530, level: 7 },
  { min: 1531, max: 1750, level: 8 },
  { min: 1751, max: 2000, level: 9 },
  { min: 2001, max: Infinity, level: 10 },
];

window.FP.getExtendedLevel = function (elo) {
  const base = window.FP.getFaceitLevel(elo);
  if (elo <= 2000) {
    return { level: base, extended: base, label: String(base), isExtended: false };
  }
  const extended = 10 + Math.floor((elo - 2001) / 250) + 1;
  return { level: base, extended, label: 'L' + extended, isExtended: true };
};

window.FP.getFaceitLevel = function (elo) {
  if (!Number.isFinite(elo) || elo < 100) return 0;
  for (const tier of window.FP.FACEIT_LEVELS) {
    if (elo >= tier.min && elo <= tier.max) return tier.level;
  }
  return 10;
};

window.FP.getLevelColor = function (level) {
  const colors = {
    1: '#6b7280', 2: '#22c55e', 3: '#22c55e', 4: '#eab308', 5: '#eab308',
    6: '#f97316', 7: '#f97316', 8: '#ef4444', 9: '#ef4444', 10: '#a855f7',
  };
  if (level > 10) return '#ec4899';
  return colors[Math.min(level, 10)] || '#6b7280';
};

window.FP.estimateWinProbability = function (teamElo, enemyElo) {
  const diff = teamElo - enemyElo;
  return Math.round((1 / (1 + Math.pow(10, -diff / 400))) * 100);
};

window.FP.estimateEloChange = function (playerElo, enemyAvgElo, win) {
  const diff = enemyAvgElo - playerElo;
  const expected = 1 / (1 + Math.pow(10, diff / 400));
  return Math.round(25 * ((win ? 1 : 0) - expected));
};

window.FP.averageElo = function (elos) {
  const valid = elos.filter(function (e) { return Number.isFinite(e) && e > 0; });
  if (!valid.length) return 0;
  return Math.round(valid.reduce(function (a, b) { return a + b; }, 0) / valid.length);
};

window.FP.formatElo = function (elo) {
  if (!Number.isFinite(elo)) return '—';
  return elo.toLocaleString('ru-RU');
};
