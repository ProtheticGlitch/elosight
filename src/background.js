import {
  getPlayerById,
  getPlayerStats,
  getMatch,
  extractMapStats,
  getPlayerEloFromGames,
} from './utils/api.js';

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
  language: 'ru',
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...stored });
  });
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true;
});

async function handleMessage(message) {
  const settings = await getSettings();

  switch (message.type) {
    case 'GET_SETTINGS':
      return settings;

    case 'GET_PLAYER': {
      const player = await getPlayerById(message.playerId, settings.apiKey);
      const elo = getPlayerEloFromGames(player.games, message.game || 'cs2');
      return { ...player, elo };
    }

    case 'GET_PLAYER_STATS': {
      const stats = await getPlayerStats(message.playerId, message.game || 'cs2', settings.apiKey);
      return {
        ...stats,
        maps: extractMapStats(stats.segments),
      };
    }

    case 'GET_MATCH':
      return getMatch(message.matchId, settings.apiKey);

    case 'GET_PLAYERS_BULK': {
      const results = await Promise.allSettled(
        message.playerIds.map(async (id) => {
          const player = await getPlayerById(id, settings.apiKey);
          return {
            id,
            nickname: player.nickname,
            elo: getPlayerEloFromGames(player.games, message.game || 'cs2'),
            country: player.country,
            avatar: player.avatar,
          };
        })
      );
      return results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}
