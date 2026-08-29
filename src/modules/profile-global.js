(function () {
  var FP = window.FP;

  FP.initProfile = function (settings) {
    if (!settings.showExtendedLevels && !settings.showMapStats) return;
    enhanceProfile(settings);
    var observer = new MutationObserver(function () { enhanceProfile(settings); });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  function isProfilePage() {
    return /\/players\/[^/]+/.test(location.pathname);
  }

  function enhanceProfile(settings) {
    if (!isProfilePage()) return;
    var nickname = (location.pathname.match(/\/players\/([^/?#]+)/) || [])[1];
    if (!nickname) return;
    if (settings.showExtendedLevels) injectExtendedLevel(nickname);
    if (settings.showMapStats) injectMapStats(nickname);
  }

  function injectExtendedLevel(nickname) {
    if (document.querySelector('.fp-extended-level')) return;

    chrome.runtime.sendMessage({
      type: 'GET_PLAYER',
      playerId: decodeURIComponent(nickname),
      game: 'cs2',
    }).then(function (player) {
      var elo = player && player.elo;
      if (!Number.isFinite(elo)) return;

      var ext = FP.getExtendedLevel(elo);
      var badge = document.createElement('div');
      badge.className = 'fp-extended-level';
      badge.innerHTML =
        '<span class="fp-ext-level-icon" style="background:' + FP.getLevelColor(ext.extended) + '">' +
        (ext.isExtended ? ext.extended : ext.level) + '</span>' +
        '<span class="fp-ext-level-text"><strong>' + FP.formatElo(elo) + ' ELO</strong>' +
        (ext.isExtended ? '<span class="fp-ext-sub">Расширенный уровень ' + ext.extended + '</span>' : '') +
        '</span>';

      var anchor = document.querySelector('[class*="Profile"], [class*="profile"], [class*="player-header"], main');
      if (anchor) anchor.prepend(badge);
    }).catch(function () {});
  }

  function injectMapStats(nickname) {
    if (document.querySelector('.fp-map-stats')) return;

    chrome.runtime.sendMessage({
      type: 'GET_PLAYER',
      playerId: decodeURIComponent(nickname),
      game: 'cs2',
    }).then(function (player) {
      return chrome.runtime.sendMessage({
        type: 'GET_PLAYER_STATS',
        playerId: player.player_id,
        game: 'cs2',
      });
    }).then(function (stats) {
      var maps = (stats && stats.maps ? stats.maps.slice(0, 7) : []);
      if (!maps.length) return;

      var panel = document.createElement('div');
      panel.className = 'fp-panel fp-map-stats';
      panel.innerHTML =
        '<div class="fp-panel-header">Статистика по картам</div><div class="fp-map-grid">' +
        maps.map(function (m) {
          return '<div class="fp-map-card"><div class="fp-map-name">' + m.map + '</div>' +
            '<div class="fp-map-wr ' + (m.winRate >= 50 ? 'fp-good' : 'fp-bad') + '">' +
            m.winRate.toFixed(1) + '% WR</div>' +
            '<div class="fp-map-meta">' + m.matches + ' игр · K/D ' + m.avgKills.toFixed(2) + '</div></div>';
        }).join('') + '</div>';

      var anchor = document.querySelector('[class*="Profile"], [class*="profile"], main');
      if (anchor) anchor.appendChild(panel);
    }).catch(function () {});
  }
})();
