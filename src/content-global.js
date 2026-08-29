(function () {
  var FP = window.FP;
  var API_EVENT = 'faceit-plus-api-data';

  var settings = null;
  var latestMatchData = null;

  function loadSettings() {
    return chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }).then(function (s) {
      settings = s;
      return settings;
    });
  }

  function onApiData(event) {
    var detail = event.detail;
    if (detail.type === 'match') {
      latestMatchData = detail.payload.data;
      document.dispatchEvent(new CustomEvent('faceit-plus-match-update', { detail: latestMatchData }));
    }
  }

  function refresh() {
    document.querySelectorAll('[data-fp-enhanced]').forEach(function (el) {
      el.removeAttribute('data-fp-enhanced');
      el.querySelectorAll('.fp-badge, .fp-panel, .fp-elo-change').forEach(function (n) { n.remove(); });
    });
    document.querySelectorAll('.fp-team-summary, .fp-extended-level, .fp-map-stats').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('[data-fp-history-enhanced]').forEach(function (el) {
      el.removeAttribute('data-fp-history-enhanced');
    });
    FP.initMatchroom(settings, function () { return latestMatchData; });
    FP.initMatchHistory(settings);
    FP.initProfile(settings);
  }

  function observeNavigation() {
    var lastPath = location.pathname;
    var observer = new MutationObserver(function () {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        setTimeout(refresh, 800);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('popstate', function () { setTimeout(refresh, 800); });
  }

  function init() {
    loadSettings().then(function () {
      window.addEventListener(API_EVENT, onApiData);

      chrome.storage.onChanged.addListener(function (changes) {
        var keys = ['showTeamElo', 'showPlayerElo', 'showExtendedLevels', 'showWinProbability',
          'showMapStats', 'showMatchHistoryElo', 'autoReady', 'autoAcceptInvite'];
        if (keys.some(function (k) { return changes[k]; })) {
          loadSettings().then(refresh);
        }
      });

      FP.initMatchroom(settings, function () { return latestMatchData; });
      FP.initMatchHistory(settings);
      FP.initProfile(settings);
      FP.initAutomation(settings);
      observeNavigation();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
