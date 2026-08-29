/**
 * Runs in page context (MAIN world) to intercept FACEIT internal API responses.
 */
(function () {
  const EVENT = 'faceit-plus-api-data';

  function dispatch(type, payload) {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { type, payload } }));
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (url.includes('faceit.com') && response.ok) {
        const clone = response.clone();
        clone.json().then((data) => {
          if (url.includes('/matchmaking/v2/match/') || url.includes('/match/v2/match/')) {
            dispatch('match', { url, data });
          } else if (url.includes('/users/v1/sessions/me')) {
            dispatch('session', { url, data });
          } else if (url.includes('/matchmaking/v2/queue')) {
            dispatch('queue', { url, data });
          } else if (url.includes('/users/v1/users/') && url.includes('/history')) {
            dispatch('history', { url, data });
          }
        }).catch(() => {});
      }
    } catch (_) {}
    return response;
  };

  const XHROpen = XMLHttpRequest.prototype.open;
  const XHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._fpUrl = url;
    return XHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const url = this._fpUrl || '';
        if (url.includes('faceit.com') && this.status >= 200 && this.status < 300) {
          const data = JSON.parse(this.responseText);
          if (url.includes('/matchmaking/v2/match/') || url.includes('/match/v2/match/')) {
            dispatch('match', { url, data });
          }
        }
      } catch (_) {}
    });
    return XHRSend.apply(this, args);
  };
})();
