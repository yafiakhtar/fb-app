import { supabase, getNextQueuePosition } from '../_lib/supabase.js';

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
    const { winnerPosition } = req.body;

    if (!winnerPosition || (winnerPosition !== 1 && winnerPosition !== 2)) {
      return res.status(400).json({ error: 'Winner position must be 1 or 2' });
    }

    // Get the two teams currently playing (positions 1 and 2)
    const { data: playingTeams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, queue_position')
      .in('queue_position', [1, 2]);

    if (teamsError) throw teamsError;

    if (playingTeams.length < 2) {
      return res.status(400).json({ error: 'Need two teams playing to declare a winner' });
    }

    const winner = playingTeams.find(t => t.queue_position === winnerPosition);
    const loser = playingTeams.find(t => t.queue_position !== winnerPosition);

    if (!winner || !loser) {
      return res.status(400).json({ error: 'Could not find winner and loser teams' });
    }

    // Get the next team in queue (position 3)
    const { data: nextTeam } = await supabase
      .from('teams')
      .select('id, name, queue_position')
      .eq('queue_position', 3)
      .single();

    // Move loser to the back of the queue
    const backOfQueue = await getNextQueuePosition();
    await supabase
      .from('teams')
      .update({ queue_position: backOfQueue })
      .eq('id', loser.id);

    // If there's a next team, move them to position 2
    if (nextTeam) {
      await supabase
        .from('teams')
        .update({ queue_position: 2 })
        .eq('id', nextTeam.id);

      // Shift all other queued teams down by 1
      const { data: queuedTeams } = await supabase
        .from('teams')
        .select('id, queue_position')
        .gt('queue_position', 3)
        .lt('queue_position', backOfQueue)
        .order('queue_position', { ascending: true });

      for (const team of queuedTeams || []) {
        await supabase
          .from('teams')
          .update({ queue_position: team.queue_position - 1 })
          .eq('id', team.id);
      }
    }

    // Winner stays at position 1 (or move to position 1 if they were at 2)
    if (winner.queue_position !== 1) {
      await supabase
        .from('teams')
        .update({ queue_position: 1 })
        .eq('id', winner.id);
    }

    return res.status(200).json({
      success: true,
      message: `${winner.name} wins! ${loser.name} goes to the back of the queue.`,
      winner: winner.name,
      loser: loser.name
    });

  } catch (error) {
    console.error('Admin win error:', error);
    return res.status(500).json({ error: error.message });
  }
}
