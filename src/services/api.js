const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Players
export async function addPlayer(nickname) {
  return fetchApi('/players', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export async function removePlayer(playerId) {
  return fetchApi('/players', {
    method: 'DELETE',
    body: JSON.stringify({ playerId }),
  });
}

// Teams / Game State
export async function getGameState() {
  return fetchApi('/teams');
}

// Groups
export async function createGroup() {
  return fetchApi('/groups', {
    method: 'POST',
  });
}

export async function getGroup(code) {
  return fetchApi(`/groups?code=${code}`);
}

export async function joinGroup(code, nickname) {
  return fetchApi(`/groups/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

// Admin
export async function resetGame() {
  return fetchApi('/admin/reset', {
    method: 'POST',
  });
}

export async function declareWin(winnerPosition) {
  return fetchApi('/admin/win', {
    method: 'POST',
    body: JSON.stringify({ winnerPosition }),
  });
}

export async function declareDraw() {
  return fetchApi('/admin/draw', {
    method: 'POST',
  });
}

export async function removeTeam(teamId) {
  return fetchApi('/admin/teams', {
    method: 'DELETE',
    body: JSON.stringify({ teamId }),
  });
}
