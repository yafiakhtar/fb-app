import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate unique team names
const teamAdjectives = ['Swift', 'Mighty', 'Golden', 'Thunder', 'Iron', 'Royal', 'Silver', 'Brave', 'Storm', 'Wild'];
const teamNouns = ['Lions', 'Eagles', 'Wolves', 'Hawks', 'Tigers', 'Bears', 'Panthers', 'Falcons', 'Dragons', 'Phoenix'];

export function generateTeamName() {
  const adj = teamAdjectives[Math.floor(Math.random() * teamAdjectives.length)];
  const noun = teamNouns[Math.floor(Math.random() * teamNouns.length)];
  return `${adj} ${noun}`;
}

// Generate a short random group code
export function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get game state helper
export async function getGameState() {
  // Get all teams with their players
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      queue_position,
      players (id, nickname, joined_at)
    `)
    .order('queue_position', { ascending: true, nullsFirst: false });

  if (teamsError) throw teamsError;

  // Separate teams by status
  const playing = teams
    .filter(t => t.queue_position === 1 || t.queue_position === 2)
    .sort((a, b) => a.queue_position - b.queue_position);
  
  const queued = teams
    .filter(t => t.queue_position > 2)
    .sort((a, b) => a.queue_position - b.queue_position);
  
  const formingTeams = teams.filter(t => t.queue_position === null);

  // Count complete teams (including those on field and in queue)
  const completeTeams = teams.filter(t => t.players.length === 7);
  const canPlay = playing.filter(t => t.players.length === 7).length >= 2;

  return {
    playing,
    queued,
    formingTeams,
    totalTeams: completeTeams.length,
    canPlay
  };
}

// Get next queue position
export async function getNextQueuePosition() {
  const { data, error } = await supabase
    .from('teams')
    .select('queue_position')
    .not('queue_position', 'is', null)
    .order('queue_position', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data.length > 0 ? data[0].queue_position + 1 : 1;
}

// Get incomplete team (for solo player assignment)
export async function getIncompleteTeam() {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      queue_position,
      players (id)
    `)
    .is('queue_position', null);

  if (error) throw error;

  // Find first team with less than 7 players
  for (const team of data) {
    if (team.players.length < 7) {
      return team;
    }
  }
  return null;
}
