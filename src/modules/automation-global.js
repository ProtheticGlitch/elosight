(function () {
  var FP = window.FP;
  var POLL_INTERVAL = 1000;

  FP.initAutomation = function (settings) {
    if (!settings.autoReady && !settings.autoAcceptInvite) return;

    var interval = setInterval(function () {
      if (!settings.autoReady && !settings.autoAcceptInvite) {
        clearInterval(interval);
        return;
      }
      runAutomation(settings);
    }, POLL_INTERVAL);

    chrome.storage.onChanged.addListener(function (changes) {
      if (changes.autoReady) settings.autoReady = changes.autoReady.newValue;
      if (changes.autoAcceptInvite) settings.autoAcceptInvite = changes.autoAcceptInvite.newValue;
    });
  };

  function runAutomation(settings) {
    if (settings.autoReady) clickReadyButton();
    if (settings.autoAcceptInvite) clickAcceptInvite();
  }

  function clickReadyButton() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll('button, [role="button"]'));
    for (var i = 0; i < candidates.length; i++) {
      var btn = candidates[i];
      var text = (btn.textContent || '').trim().toLowerCase();
      var aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      if ((text === 'ready' || text === 'готов' || text.indexOf('ready up') !== -1 || aria.indexOf('ready') !== -1) &&
          !btn.disabled && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }

  function clickAcceptInvite() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll('button, [role="button"]'));
    for (var i = 0; i < candidates.length; i++) {
      var btn = candidates[i];
      var text = (btn.textContent || '').trim().toLowerCase();
      if ((text.indexOf('accept') !== -1 || text.indexOf('принять') !== -1) &&
          (text.indexOf('invite') !== -1 || text.indexOf('party') !== -1 || text.indexOf('приглаш') !== -1) &&
          !btn.disabled && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }
})();
