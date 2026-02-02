import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Delete all players first (due to foreign key)
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .neq('id', 0); // Delete all

    if (playersError) throw playersError;

    // Delete all teams
    const { error: teamsError } = await supabase
      .from('teams')
      .delete()
      .neq('id', 0);

    if (teamsError) throw teamsError;

    // Delete all groups
    const { error: groupsError } = await supabase
      .from('groups')
      .delete()
      .neq('code', '');

    if (groupsError) throw groupsError;

    return res.status(200).json({
      success: true,
      message: 'Game reset successfully!'
    });

  } catch (error) {
    console.error('Admin reset error:', error);
    return res.status(500).json({ error: error.message });
  }
}
