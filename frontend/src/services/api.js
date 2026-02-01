const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };
  
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Teams API
export const getTeams = () => request('/teams');
export const getWaitlist = () => request('/teams/waitlist');

// Players API
export const addPlayer = (nickname) => 
  request('/players', { method: 'POST', body: { nickname } });

export const removePlayer = (id) => 
  request(`/players/${id}`, { method: 'DELETE' });

// Groups API
export const createGroup = () => 
  request('/groups', { method: 'POST' });

export const getGroup = (code) => 
  request(`/groups/${code}`);

export const joinGroup = (code, nickname) => 
  request(`/groups/${code}/join`, { method: 'POST', body: { nickname } });

// Admin API
export const resetGame = () => 
  request('/admin/reset', { method: 'POST' });

export const declareWin = (winnerPosition) => 
  request('/admin/win', { method: 'POST', body: { winnerPosition } });

export const declareDraw = () => 
  request('/admin/draw', { method: 'POST' });

export const removeTeam = (id) =>
  request(`/admin/teams/${id}`, { method: 'DELETE' });

export const getGameState = () => 
  request('/admin/state');
