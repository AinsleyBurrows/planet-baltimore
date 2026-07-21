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
  const statusBadges =
    admissionType === 'free' ? ['Free'] :
    admissionType === 'paid' ? ['Ticketed'] :
    ['Donation-Based'];

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
    featured: false,
    statusBadges,
    tags: Array.isArray(r.tags) && r.tags.length
      ? r.tags
      : categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    format: r.format || 'Festival',
    audience: r.audience || 'All Ages',
    accessibility: {
      wheelchair: false, asl: false, restrooms: true, seating: true,
      sensoryFriendly: false, transit: true,
    },
    rainOrShine: r.rain_or_shine !== false,
    expectedAttendance: r.expected_attendance || 'TBA',
    ageRestriction: r.age_restriction || 'All ages',
    petPolicy: r.pet_policy || 'Service animals welcome. Check organizer policy for pets.',
    social: { website: r.website || '', instagram: '', facebook: '', twitter: '' },
    experiences: [],
    highlights: { headliners: [], installations: [], performances: [], family: [], food: [] },
    schedule: [],
    artists: [],
    vendors: [],
    foodVendors: [],
    transportation: {
      lightRail: 'See MTA Maryland for routes.', metro: 'See MTA Maryland for routes.',
      bus: 'See MTA Maryland for routes.', rideshare: 'Drop-off near main entrance.',
      bikeParking: 'Bike racks near entrance.', walking: 'Walkable from nearby neighborhoods.',
    },
    parking: { notes: 'Street parking and nearby garages. Transit recommended.', garages: [] },
    rules: {
      bags: 'Small bags allowed.', chairs: 'Low chairs permitted on lawns.',
      outsideFood: 'Vendors on site.', alcohol: 'Designated areas only.',
      smoking: 'No smoking in crowds.', pets: 'Service animals welcome.',
      reentry: 'Re-entry allowed.', children: 'Family friendly.',
      photography: 'Personal photography welcome.',
    },
    nearby: { restaurants: [], bars: [], galleries: [], museums: [], hotels: [], parking: [] },
    gallery: { photos: [], videos: [] },
    updates: [],
    faq: [],
    isUserCreated: true,
  };
}