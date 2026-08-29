const API_BASE = 'https://open.faceit.com/data/v4';
const CACHE_TTL = 5 * 60 * 1000;

const cache = new Map();

function cacheKey(url) {
  return url;
}

function getCached(url) {
  const entry = cache.get(cacheKey(url));
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    cache.delete(cacheKey(url));
    return null;
  }
  return entry.data;
}

function setCache(url, data) {
  cache.set(cacheKey(url), { data, time: Date.now() });
}

export async function fetchFaceitApi(path, apiKey) {
  const url = `${API_BASE}${path}`;
  const cached = getCached(url);
  if (cached) return cached;

  const headers = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`FACEIT API ${response.status}: ${path}`);
  }
  const data = await response.json();
  setCache(url, data);
  return data;
}

export async function getPlayerById(playerId, apiKey) {
  return fetchFaceitApi(`/players/${playerId}`, apiKey);
}

export async function getPlayerStats(playerId, game = 'cs2', apiKey) {
  return fetchFaceitApi(`/players/${playerId}/stats/${game}`, apiKey);
}

export async function getPlayerHistory(playerId, game = 'cs2', offset = 0, limit = 20, apiKey) {
  return fetchFaceitApi(
    `/players/${playerId}/history?game=${game}&offset=${offset}&limit=${limit}`,
    apiKey
  );
}

export async function getMatch(matchId, apiKey) {
  return fetchFaceitApi(`/matches/${matchId}`, apiKey);
}

export function extractMapStats(segments) {
  if (!segments?.length) return [];
  return segments
    .filter((s) => s.mode === '5v5' && s.label && s.stats)
    .map((s) => ({
      map: s.label,
      matches: parseInt(s.stats.Matches || '0', 10),
      wins: parseInt(s.stats.Wins || '0', 10),
      winRate: parseFloat(s.stats['Win Rate %'] || '0'),
      avgKills: parseFloat(s.stats['Average K/D Ratio'] || '0'),
    }))
    .sort((a, b) => b.matches - a.matches);
}

export function getPlayerEloFromGames(games, gameId = 'cs2') {
  const game = games?.[gameId];
  if (!game) return null;
  return game.faceit_elo ?? game.elo ?? null;
}
