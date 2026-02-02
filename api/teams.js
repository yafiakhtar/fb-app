import { getGameState, supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameState = await getGameState();
    
    // Get waitlist (players without a team - not implemented in this version)
    // Since we always create a team for solo players, waitlist is empty
    const waitlist = [];

    return res.status(200).json({
      ...gameState,
      waitlist
    });
  } catch (error) {
    console.error('Teams API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
