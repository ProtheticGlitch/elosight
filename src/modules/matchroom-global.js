(function () {
  var FP = window.FP;
  var POLL_INTERVAL = 1500;

  FP.initMatchroom = function (settings, getMatchData) {
    if (!settings.showTeamElo && !settings.showPlayerElo && !settings.showWinProbability) return;

    enhanceMatchroom(settings, getMatchData);
    document.addEventListener('faceit-plus-match-update', function () {
      enhanceMatchroom(settings, getMatchData);
    });

    var interval = setInterval(function () {
      if (!isMatchroomPage()) {
        clearInterval(interval);
        return;
      }
      enhanceMatchroom(settings, getMatchData);
    }, POLL_INTERVAL);
  };

  function isMatchroomPage() {
    return /\/(room|match)\//.test(location.pathname) ||
      document.querySelector('[class*="MatchRoom"], [class*="matchroom"], [data-testid*="match-room"]');
  }

  function parsePlayersFromDom() {
    var players = [];
    document.querySelectorAll('a[href*="/players/"]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var match = href.match(/\/players\/([^/?#]+)/);
      if (!match) return;

      var nickname = decodeURIComponent(match[1]);
      var row = link.closest('[class*="Slot"], [class*="slot"], [class*="Player"], li, tr, div');
      if (!row || row.dataset.fpEnhanced) return;

      var teamContainer = row.closest('[class*="team"], [class*="Team"], [class*="faction"]');
      var team = 'unknown';
      if (teamContainer) {
        var parentIndex = Array.prototype.indexOf.call(
          teamContainer.parentElement ? teamContainer.parentElement.children : [],
          teamContainer
        );
        team = parentIndex === 0 ? 'team1' : parentIndex === 1 ? 'team2' : 'team' + parentIndex;
      }

      players.push({ nickname: nickname, row: row, link: link, team: team });
    });
    return players;
  }

  function parsePlayersFromApi(matchData) {
    if (!matchData) return [];
    var teams = matchData.teams || matchData.payload && matchData.payload.teams || [];
    var result = [];

    function extract(team, teamKey) {
      var roster = team.roster || team.players || [];
      roster.forEach(function (p) {
        result.push({
          id: p.player_id || p.id,
          nickname: p.nickname || p.name,
          elo: p.elo || p.faceit_elo || p.skill_level_elo,
          team: teamKey,
        });
      });
    }

    if (Array.isArray(teams)) {
      teams.forEach(function (t, i) { extract(t, 'team' + (i + 1)); });
    } else if (typeof teams === 'object') {
      Object.keys(teams).forEach(function (key) { extract(teams[key], key); });
    }
    return result;
  }

  function fetchPlayerElos(playerIds) {
    if (!playerIds.length) return Promise.resolve([]);
    return chrome.runtime.sendMessage({
      type: 'GET_PLAYERS_BULK',
      playerIds: playerIds,
      game: 'cs2',
    }).catch(function () { return []; });
  }

  function createBadge(text, color, title) {
    var badge = document.createElement('span');
    badge.className = 'fp-badge';
    badge.textContent = text;
    badge.style.backgroundColor = color;
    if (title) badge.title = title;
    return badge;
  }

  function createEloBadge(elo, settings) {
    if (!Number.isFinite(elo)) return createBadge('—', '#374151', 'ELO неизвестен');
    var ext = FP.getExtendedLevel(elo);
    var color = FP.getLevelColor(ext.extended);
    var label = settings.showExtendedLevels && ext.isExtended
      ? FP.formatElo(elo) + ' (' + ext.label + ')'
      : FP.formatElo(elo);
    return createBadge(label, color, 'FACEIT ELO: ' + elo);
  }

  function groupByTeam(players) {
    var teams = {};
    players.forEach(function (p, i) {
      var key = p.team || (i < 5 ? 'team1' : 'team2');
      if (!teams[key]) teams[key] = [];
      teams[key].push(p);
    });
    if (Object.keys(teams).length === 1 && players.length >= 2) {
      var half = Math.ceil(players.length / 2);
      return { team1: players.slice(0, half), team2: players.slice(half) };
    }
    return teams;
  }

  function injectTeamSummary(players, settings) {
    if (!settings.showTeamElo && !settings.showWinProbability) return;

    var existing = document.querySelector('.fp-team-summary');
    if (existing) existing.remove();

    var teams = groupByTeam(players);
    var teamKeys = Object.keys(teams);
    if (teamKeys.length < 2) return;

    var key1 = teamKeys[0];
    var key2 = teamKeys[1];
    var avg1 = FP.averageElo(teams[key1].map(function (p) { return p.elo; }));
    var avg2 = FP.averageElo(teams[key2].map(function (p) { return p.elo; }));
    if (!avg1 && !avg2) return;

    var panel = document.createElement('div');
    panel.className = 'fp-panel fp-team-summary';

    var html = '<div class="fp-panel-header">EloSight — Анализ матча</div>' +
      '<div class="fp-team-row">' +
      '<div class="fp-team-col"><span class="fp-team-label">Команда 1</span>' +
      '<span class="fp-team-elo">' + FP.formatElo(avg1) + ' ELO</span>' +
      '<span class="fp-team-count">' + teams[key1].length + ' игроков</span></div>' +
      '<div class="fp-vs">VS</div>' +
      '<div class="fp-team-col"><span class="fp-team-label">Команда 2</span>' +
      '<span class="fp-team-elo">' + FP.formatElo(avg2) + ' ELO</span>' +
      '<span class="fp-team-count">' + teams[key2].length + ' игроков</span></div></div>';

    if (settings.showWinProbability && avg1 && avg2) {
      var win1 = FP.estimateWinProbability(avg1, avg2);
      var win2 = 100 - win1;
      var diff = avg1 - avg2;
      html += '<div class="fp-win-bar">' +
        '<div class="fp-win-segment fp-win-team1" style="width:' + win1 + '%">' + win1 + '%</div>' +
        '<div class="fp-win-segment fp-win-team2" style="width:' + win2 + '%">' + win2 + '%</div></div>' +
        '<div class="fp-win-labels"><span>Шанс победы команды 1</span>' +
        '<span>Разница: ' + (diff > 0 ? '+' : '') + diff + ' ELO</span>' +
        '<span>Шанс победы команды 2</span></div>';
    }

    if (settings.showPlayerElo && avg1 && avg2) {
      var gain = FP.estimateEloChange(avg1, avg2, true);
      var loss = FP.estimateEloChange(avg1, avg2, false);
      html += '<div class="fp-elo-predict">' +
        '<span class="fp-elo-win">+' + Math.abs(gain) + ' при победе</span>' +
        '<span class="fp-elo-loss">−' + Math.abs(loss) + ' при поражении</span></div>';
    }

    panel.innerHTML = html;
    var anchor = document.querySelector('[class*="MatchRoom"], [class*="matchroom"], main, #root');
    (anchor || document.body).prepend(panel);
  }

  function injectPlayerBadges(apiPlayers, settings, domPlayers) {
    if (!settings.showPlayerElo) return;
    domPlayers.forEach(function (_ref) {
      var nickname = _ref.nickname;
      var row = _ref.row;
      var link = _ref.link;
      if (row.dataset.fpEnhanced) return;

      var player = apiPlayers.find(function (p) {
        return p.nickname && p.nickname.toLowerCase() === nickname.toLowerCase();
      });
      if (!player || !player.elo) return;

      var badge = createEloBadge(player.elo, settings);
      (link.parentElement || row).appendChild(badge);
      row.dataset.fpEnhanced = '1';
    });
  }

  function enhanceMatchroom(settings, getMatchData) {
    if (!isMatchroomPage()) return;

    var matchData = getMatchData();
    var apiPlayers = parsePlayersFromApi(matchData);

    var domPlayers = parsePlayersFromDom();

    var chain = Promise.resolve();

    if (!apiPlayers.length && domPlayers.length) {
      var nicknames = domPlayers.map(function (p) { return p.nickname; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; });

      chain = Promise.all(nicknames.map(function (nickname) {
        return chrome.runtime.sendMessage({
          type: 'GET_PLAYER',
          playerId: nickname,
          game: 'cs2',
        }).then(function (player) {
          if (player && player.elo) {
            apiPlayers.push({
              nickname: player.nickname || nickname,
              elo: player.elo,
              id: player.player_id,
            });
          }
        }).catch(function () {});
      }));
    } else {
      var missingElos = apiPlayers.filter(function (p) { return !p.elo && p.id; }).map(function (p) { return p.id; });
      if (missingElos.length) {
        chain = fetchPlayerElos(missingElos).then(function (fetched) {
          fetched.forEach(function (fp) {
            var target = apiPlayers.find(function (p) { return p.id === fp.id; });
            if (target) target.elo = fp.elo;
          });
        });
      }
    }

    chain.then(function () {
      if (!apiPlayers.length) return;
      injectTeamSummary(apiPlayers, settings);
      injectPlayerBadges(apiPlayers, settings, domPlayers);
    });
  }
})();
