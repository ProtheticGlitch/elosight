const DEFAULT_SETTINGS = {
  showTeamElo: true,
  showPlayerElo: true,
  showExtendedLevels: true,
  showWinProbability: true,
  showMapStats: true,
  showMatchHistoryElo: true,
  autoReady: false,
  autoAcceptInvite: false,
  apiKey: '',
};

const FIELDS = [
  'showTeamElo',
  'showPlayerElo',
  'showExtendedLevels',
  'showWinProbability',
  'showMapStats',
  'showMatchHistoryElo',
  'autoReady',
  'autoAcceptInvite',
  'apiKey',
];

let saveTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    FIELDS.forEach((field) => {
      const el = document.getElementById(field);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = settings[field];
      } else {
        el.value = settings[field] || '';
      }
    });
  });

  FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (!el) return;
    el.addEventListener('change', saveSettings);
    if (el.type === 'password' || el.type === 'text') {
      el.addEventListener('input', saveSettings);
    }
  });
});

function saveSettings() {
  const data = {};
  FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (!el) return;
    data[field] = el.type === 'checkbox' ? el.checked : el.value.trim();
  });

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    chrome.storage.sync.set(data, () => {
      showStatus();
    });
  }, 300);
}

function showStatus() {
  const status = document.getElementById('status');
  status.textContent = 'Сохранено';
  status.classList.add('visible');
  setTimeout(() => status.classList.remove('visible'), 1500);
}
