import { supabase, generateGroupCode } from './_lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Create a new group
      let code = generateGroupCode();
      let attempts = 0;
      const maxAttempts = 5;

      // Ensure unique code
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('groups')
          .select('code')
          .eq('code', code)
          .single();

        if (!existing) break;
        code = generateGroupCode();
        attempts++;
      }

      const { data: group, error } = await supabase
        .from('groups')
        .insert({ code })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        code: group.code,
        message: 'Group created! Share the code with your friends.'
      });

    } else if (req.method === 'GET') {
      // Get group info
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ error: 'Group code is required' });
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (groupError || !group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Get players in this group
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, nickname, joined_at')
        .eq('group_code', code.toUpperCase());

      if (playersError) throw playersError;

      return res.status(200).json({
        code: group.code,
        isComplete: group.is_complete,
        playerCount: players.length,
        players,
        slotsNeeded: 7 - players.length
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Groups API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
