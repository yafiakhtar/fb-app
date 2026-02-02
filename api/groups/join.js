import { supabase, generateTeamName, getNextQueuePosition } from '../_lib/supabase.js';

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
    const { code, nickname } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Group code is required' });
    }

    if (!nickname || nickname.trim().length === 0) {
      return res.status(400).json({ error: 'Nickname is required' });
    }

    const groupCode = code.toUpperCase();

    // Verify group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('code', groupCode)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.is_complete) {
      return res.status(400).json({ error: 'This group is already complete' });
    }

    // Count current players in group
    const { data: existingPlayers, error: countError } = await supabase
      .from('players')
      .select('id')
      .eq('group_code', groupCode);

    if (countError) throw countError;

    if (existingPlayers.length >= 7) {
      return res.status(400).json({ error: 'Group is already full' });
    }

    // Add player to group (without team assignment yet)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ 
        nickname: nickname.trim(),
        group_code: groupCode
      })
      .select()
      .single();

    if (playerError) throw playerError;

    const newPlayerCount = existingPlayers.length + 1;
    let assignment = null;

    // If group reaches 7 players, create a team and assign all players
    if (newPlayerCount === 7) {
      // Mark group as complete
      await supabase
        .from('groups')
        .update({ is_complete: true })
        .eq('code', groupCode);

      // Create a new team
      const nextPos = await getNextQueuePosition();
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ 
          name: generateTeamName(),
          queue_position: nextPos 
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Assign all group players to this team
      await supabase
        .from('players')
        .update({ team_id: team.id })
        .eq('group_code', groupCode);

      assignment = {
        success: true,
        teamName: team.name,
        message: `Team "${team.name}" is ready! Your group has been added to the queue.`
      };
    }

    // Get updated group info
    const { data: players } = await supabase
      .from('players')
      .select('id, nickname')
      .eq('group_code', groupCode);

    return res.status(200).json({
      success: true,
      player,
      playerCount: players.length,
      players,
      slotsNeeded: 7 - players.length,
      assignment
    });

  } catch (error) {
    console.error('Group join error:', error);
    return res.status(500).json({ error: error.message });
  }
}
