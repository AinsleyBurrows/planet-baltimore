import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's followed interests and past RSVPs
    const [follows, rsvps] = await Promise.all([
      base44.asServiceRole.entities.Follow.filter({
        follower_id: user.id,
      }, '-created_date', 50),
      base44.asServiceRole.entities.RSVP.filter({
        user_id: user.id,
      }, '-created_date', 20),
    ]);

    // Get events they've attended
    const attendedEventIds = rsvps.map(r => r.event_id);
    const allEvents = await base44.entities.Event.filter({
      status: 'upcoming',
    }, '-date', 100);

    // Filter to events not attended
    const recommendableEvents = allEvents.filter(e => !attendedEventIds.includes(e.id));

    // Use LLM to get personalized recommendations
    const followedCategories = follows
      .filter(f => f.target_type === 'artist' || f.target_type === 'business')
      .map(f => f.target_name)
      .join(', ');

    const eventContext = recommendableEvents.slice(0, 30).map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      description: e.description,
    }));

    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an event recommendation engine for Planet Baltimore, a community platform.

User follows: ${followedCategories || 'various interests'}
User has attended events in these categories: ${rsvps.length > 0 ? 'multiple' : 'none yet'}

Based on the user's interests, recommend the top 5 events from this list that they would most enjoy. Return a JSON array with event IDs ranked by recommendation score (1-10).

Available events: ${JSON.stringify(eventContext)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                eventId: { type: 'string' },
                score: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Map recommendations to event details
    const recommendedEvents = recommendations.recommendations
      .map(rec => {
        const event = allEvents.find(e => e.id === rec.eventId);
        return event ? { ...event, score: rec.score, reason: rec.reason } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return Response.json({
      userId: user.id,
      recommendations: recommendedEvents,
      totalRecommendations: recommendedEvents.length,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});