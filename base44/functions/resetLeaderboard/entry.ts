import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Delete all posts and comments older than the current month
    // by simply clearing the leaderboard snapshot entity if one exists.
    // Since scores are calculated live from Posts/Comments,
    // we reset by deleting all LeaderboardReset records and creating a new one
    // that stores the reset timestamp — the frontend will filter activity
    // after this timestamp.

    // Store a reset record in PlatformSettings
    const existing = await base44.asServiceRole.entities.PlatformSettings.list();
    const resetEntry = {
      key: 'leaderboard_reset_at',
      value: new Date().toISOString(),
    };

    if (existing.length > 0) {
      const setting = existing.find(s => s.key === 'leaderboard_reset_at');
      if (setting) {
        await base44.asServiceRole.entities.PlatformSettings.update(setting.id, resetEntry);
      } else {
        await base44.asServiceRole.entities.PlatformSettings.create(resetEntry);
      }
    } else {
      await base44.asServiceRole.entities.PlatformSettings.create(resetEntry);
    }

    console.log('Leaderboard reset at:', resetEntry.value);
    return Response.json({ success: true, reset_at: resetEntry.value });
  } catch (error) {
    console.error('Reset error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});