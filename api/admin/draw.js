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
    // Get the two teams currently playing (positions 1 and 2)
    const { data: playingTeams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, queue_position')
      .in('queue_position', [1, 2])
      .order('queue_position', { ascending: true });

    if (teamsError) throw teamsError;

    if (playingTeams.length < 2) {
      return res.status(400).json({ error: 'Need two teams playing to declare a draw' });
    }

    const team1 = playingTeams[0];
    const team2 = playingTeams[1];

    // Get the next two teams in queue (positions 3 and 4)
    const { data: nextTeams } = await supabase
      .from('teams')
      .select('id, name, queue_position')
      .in('queue_position', [3, 4])
      .order('queue_position', { ascending: true });

    // Move both playing teams to the back of the queue
    const backPos1 = await getNextQueuePosition();
    await supabase
      .from('teams')
      .update({ queue_position: backPos1 })
      .eq('id', team1.id);

    const backPos2 = backPos1 + 1;
    await supabase
      .from('teams')
      .update({ queue_position: backPos2 })
      .eq('id', team2.id);

    // Move next teams to playing positions
    if (nextTeams && nextTeams.length >= 1) {
      await supabase
        .from('teams')
        .update({ queue_position: 1 })
        .eq('id', nextTeams[0].id);

      if (nextTeams.length >= 2) {
        await supabase
          .from('teams')
          .update({ queue_position: 2 })
          .eq('id', nextTeams[1].id);
      }

      // Shift all other queued teams down by 2
      const { data: queuedTeams } = await supabase
        .from('teams')
        .select('id, queue_position')
        .gt('queue_position', 4)
        .lt('queue_position', backPos1)
        .order('queue_position', { ascending: true });

      for (const team of queuedTeams || []) {
        await supabase
          .from('teams')
          .update({ queue_position: team.queue_position - 2 })
          .eq('id', team.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: `It's a draw! Both ${team1.name} and ${team2.name} go to the back of the queue.`,
      teams: [team1.name, team2.name]
    });

  } catch (error) {
    console.error('Admin draw error:', error);
    return res.status(500).json({ error: error.message });
  }
}
