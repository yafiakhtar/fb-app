import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

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
