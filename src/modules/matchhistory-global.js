(function () {
  var FP = window.FP;
  var POLL_INTERVAL = 2000;

  FP.initMatchHistory = function (settings) {
    if (!settings.showMatchHistoryElo) return;
    enhanceHistory(settings);
    var interval = setInterval(function () {
      if (!isHistoryPage()) {
        clearInterval(interval);
        return;
      }
      enhanceHistory(settings);
    }, POLL_INTERVAL);
  };

  function isHistoryPage() {
    return location.pathname.includes('/players/') ||
      document.querySelector('[class*="MatchHistory"], [class*="match-history"], [class*="history"]');
  }

  function extractMatchElos(match) {
    var elos = [];
    var teams = match && match.teams;
    if (!teams) return elos;

    function collect(team) {
      (team.roster || []).forEach(function (p) {
        if (p.elo || p.faceit_elo) elos.push(p.elo || p.faceit_elo);
      });
    }

    if (Array.isArray(teams)) teams.forEach(collect);
    else Object.keys(teams).forEach(function (k) { collect(teams[k]); });
    return elos;
  }

  function enhanceHistory(settings) {
    var rows = document.querySelectorAll(
      '[class*="MatchHistory"] [class*="row"], [class*="match-history"] tr, table tbody tr, [class*="HistoryRow"]'
    );

    rows.forEach(function (row) {
      if (row.dataset.fpHistoryEnhanced) return;

      var scoreEl = row.querySelector('[class*="score"], [class*="result"]');
      if (!scoreEl) return;

      var text = row.textContent || '';
      var isWin = /win|победа/i.test(text) && !/loss|поражение/i.test(text);
      var isLoss = /loss|поражение/i.test(text);

      var eloChangeEl = document.createElement('span');
      eloChangeEl.className = 'fp-elo-change';

      var matchLink = row.querySelector('a[href*="/room/"], a[href*="/match/"]');
      if (matchLink) {
        var href = matchLink.getAttribute('href') || '';
        var matchId = (href.match(/\/(room|match)\/([^/?#]+)/) || [])[2];
        if (matchId) {
          chrome.runtime.sendMessage({ type: 'GET_MATCH', matchId: matchId })
            .then(function (match) {
              var elos = extractMatchElos(match);
              if (elos.length) {
                var avg = FP.averageElo(elos);
                eloChangeEl.textContent = 'AVG ' + FP.formatElo(avg);
                eloChangeEl.title = 'Средний ELO в матче: ' + avg;
                eloChangeEl.classList.add('fp-elo-avg');
                row.appendChild(eloChangeEl);
                row.dataset.fpHistoryEnhanced = '1';
              }
            }).catch(function () {});
          return;
        }
      }

      if (isWin || isLoss) {
        eloChangeEl.textContent = isWin ? '+18' : '−18';
        eloChangeEl.classList.add(isWin ? 'fp-elo-positive' : 'fp-elo-negative');
        eloChangeEl.title = 'Примерное изменение ELO';
        row.appendChild(eloChangeEl);
        row.dataset.fpHistoryEnhanced = '1';
      }
    });
  }
})();
