import { supabase, generateTeamName, getIncompleteTeam, getNextQueuePosition } from './_lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Add a solo player
      const { nickname } = req.body;

      if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ error: 'Nickname is required' });
      }

      // Try to find an incomplete team
      let team = await getIncompleteTeam();

      if (!team) {
        // Create a new team
        const { data: newTeam, error: createError } = await supabase
          .from('teams')
          .insert({ name: generateTeamName() })
          .select()
          .single();

        if (createError) throw createError;
        team = newTeam;
      }

      // Add player to team
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ 
          nickname: nickname.trim(), 
          team_id: team.id 
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Check if team is now complete (7 players)
      const { data: teamPlayers, error: countError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', team.id);

      if (countError) throw countError;

      if (teamPlayers.length === 7 && !team.queue_position) {
        // Team is complete, assign to queue
        const nextPos = await getNextQueuePosition();
        await supabase
          .from('teams')
          .update({ queue_position: nextPos })
          .eq('id', team.id);
      }

      return res.status(200).json({
        success: true,
        assigned: true,
        message: `Joined ${team.name}!`,
        player,
        team: team.name
      });

    } else if (req.method === 'DELETE') {
      // Remove a player
      const { playerId } = req.body;

      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      // Get player's team before deleting
      const { data: player, error: findError } = await supabase
        .from('players')
        .select('team_id')
        .eq('id', playerId)
        .single();

      if (findError || !player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const teamId = player.team_id;

      // Delete the player
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (deleteError) throw deleteError;

      // Check if team is now empty
      const { data: remaining, error: countError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId);

      if (countError) throw countError;

      if (remaining.length === 0) {
        // Delete empty team
        await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);
      } else {
        // If team was in queue and now incomplete, remove from queue
        const { data: team } = await supabase
          .from('teams')
          .select('queue_position')
          .eq('id', teamId)
          .single();

        if (team?.queue_position && remaining.length < 7) {
          await supabase
            .from('teams')
            .update({ queue_position: null })
            .eq('id', teamId);
        }
      }

      return res.status(200).json({ success: true, message: 'Player removed' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Players API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
