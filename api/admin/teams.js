import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Delete all players in the team first
    await supabase
      .from('players')
      .delete()
      .eq('team_id', teamId);

    // Delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Team removed successfully'
    });

  } catch (error) {
    console.error('Admin teams error:', error);
    return res.status(500).json({ error: error.message });
  }
}
