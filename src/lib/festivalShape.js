import { FESTIVAL_NEIGHBORHOODS } from '@/data/festivals';

export { FESTIVAL_NEIGHBORHOODS };

export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Map a Festival entity record to the festival object shape used by
 * FestivalCard / FeaturedFestival / FestivalDetail (which were built around
 * the mock data in src/data/festivals.js).
 */
export function dbFestivalToShape(r) {
  if (!r) return null;
  const admissionType = r.admission_type || 'free';
  const categories = Array.isArray(r.categories) ? r.categories : [];
  const statusBadges = Array.isArray(r.status_badges) && r.status_badges.length
    ? r.status_badges
    : (admissionType === 'free' ? ['Free'] : admissionType === 'paid' ? ['Ticketed'] : ['Donation-Based']);

  return {
    id: r.id,
    slug: r.slug || slugify(r.name),
    name: r.name,
    image: r.image_url || '',
    description: r.description || '',
    longDescription: r.long_description || r.description || '',
    startDate: r.start_date,
    endDate: r.end_date || r.start_date,
    hours: r.hours || 'Times vary — see schedule',
    venue: r.venue || r.neighborhood || '',
    neighborhood: r.neighborhood || '',
    footprint: r.footprint || r.neighborhood || '',
    categories,
    admission: {
      type: admissionType,
      price: r.admission_price || (admissionType === 'free' ? 'Free' : ''),
      url: r.admission_url || '',
    },
    organizer: {
      name: r.organizer_name || '',
      logo: '',
      description: r.organizer_description || '',
      website: r.organizer_website || '',
      artsOrgId: '',
    },
    coordinates: { lat: r.coordinates_lat, lng: r.coordinates_lng },
    featured: !!r.featured,
    statusBadges,
    tags: Array.isArray(r.tags) && r.tags.length
      ? r.tags
      : categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    format: r.format || 'Festival',
    audience: r.audience || 'All Ages',
    accessibility: {
      wheelchair: !!r.accessibility?.wheelchair,
      asl: !!r.accessibility?.asl,
      restrooms: r.accessibility?.restrooms !== false,
      seating: r.accessibility?.seating !== false,
      sensoryFriendly: !!r.accessibility?.sensoryFriendly,
      transit: r.accessibility?.transit !== false,
    },
    rainOrShine: r.rain_or_shine !== false,
    expectedAttendance: r.expected_attendance || 'TBA',
    ageRestriction: r.age_restriction || 'All ages',
    petPolicy: r.pet_policy || 'Service animals welcome. Check organizer policy for pets.',
    social: {
      website: r.social?.website || r.website || '',
      instagram: r.social?.instagram || '',
      facebook: r.social?.facebook || '',
      twitter: r.social?.twitter || '',
    },
    experiences: Array.isArray(r.experiences) ? r.experiences : [],
    highlights: {
      headliners: r.highlights?.headliners || [],
      installations: r.highlights?.installations || [],
      performances: r.highlights?.performances || [],
      family: r.highlights?.family || [],
      food: r.highlights?.food || [],
    },
    schedule: Array.isArray(r.schedule) ? r.schedule : [],
    artists: Array.isArray(r.artists) ? r.artists : [],
    vendors: Array.isArray(r.vendors) ? r.vendors : [],
    foodVendors: Array.isArray(r.food_vendors) ? r.food_vendors : [],
    transportation: {
      lightRail: r.transportation?.lightRail || 'See MTA Maryland for routes.',
      metro: r.transportation?.metro || 'See MTA Maryland for routes.',
      bus: r.transportation?.bus || 'See MTA Maryland for routes.',
      rideshare: r.transportation?.rideshare || 'Drop-off near main entrance.',
      bikeParking: r.transportation?.bikeParking || 'Bike racks near entrance.',
      walking: r.transportation?.walking || 'Walkable from nearby neighborhoods.',
    },
    parking: {
      notes: r.parking?.notes || 'Street parking and nearby garages. Transit recommended.',
      garages: Array.isArray(r.parking?.garages) ? r.parking.garages : [],
    },
    rules: {
      bags: r.rules?.bags || 'Small bags allowed.',
      chairs: r.rules?.chairs || 'Low chairs permitted on lawns.',
      outsideFood: r.rules?.outsideFood || 'Vendors on site.',
      alcohol: r.rules?.alcohol || 'Designated areas only.',
      smoking: r.rules?.smoking || 'No smoking in crowds.',
      pets: r.rules?.pets || 'Service animals welcome.',
      reentry: r.rules?.reentry || 'Re-entry allowed.',
      children: r.rules?.children || 'Family friendly.',
      photography: r.rules?.photography || 'Personal photography welcome.',
    },
    nearby: { restaurants: [], bars: [], galleries: [], museums: [], hotels: [], parking: [] },
    gallery: { photos: Array.isArray(r.gallery_photos) ? r.gallery_photos : [], videos: [] },
    updates: Array.isArray(r.updates) ? r.updates : [],
    faq: Array.isArray(r.faq) ? r.faq : [],
    owner_id: r.owner_id || r.created_by_id || '',
    isUserCreated: true,
  };
}