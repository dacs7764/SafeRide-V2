const PHOTON_URL = 'https://photon.komoot.io/api/';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const METERS_PER_MILE = 1609.344;

// osm_value entries we treat as "too broad": cities, states, countries, etc.
// A specific address/building/POI/street is allowed; a city or larger area is not.
const BROAD_PLACE_VALUES = new Set([
  'country', 'state', 'region', 'province', 'county', 'city', 'town',
  'municipality', 'district', 'borough', 'suburb', 'quarter', 'neighbourhood',
  'village', 'hamlet', 'locality', 'island', 'archipelago', 'continent',
]);

export const isSpecificLocation = (props) => {
  if (!props) return false;
  // Has a street (with or without house number) → specific
  if (props.street) return true;
  // Any non-"place" OSM category (amenity, building, shop, highway, aeroway, …) → specific
  if (props.osm_key && props.osm_key !== 'place') return true;
  // osm_key === 'place' but a specific subtype (e.g. house, street) → specific
  if (props.osm_key === 'place' && !BROAD_PLACE_VALUES.has(props.osm_value)) return true;
  return false;
};

const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .then(res => { clearTimeout(timer); return res; })
    .catch(err => { clearTimeout(timer); throw err.name === 'AbortError' ? new Error('Request timed out') : err; });
};

export const geocodeAddress = async (address) => {
  const params = new URLSearchParams({ q: address, limit: 8, lang: 'en', lat: 42.4534, lon: -76.4735 });
  const data = await fetchWithTimeout(`${PHOTON_URL}?${params}`, {}, 8000).then(r => r.json());
  const features = (data.features || []).filter(f => isSpecificLocation(f.properties));
  if (features.length === 0) {
    throw new Error(`"${address}" is too broad. Please enter a specific address, building, or street.`);
  }
  const [lng, lat] = features[0].geometry.coordinates;
  const p = features[0].properties || {};
  const parts = [p.name, p.city || p.town || p.county, p.state].filter(Boolean);
  return { lat, lng, address: parts.join(', ') || address };
};

export const calculateDistance = async (origin, destination) => {
  try {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new Error('Missing coordinates');
    }

    const url = `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
    const data = await fetchWithTimeout(url, {}, 10000).then(r => r.json());

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const distanceMiles = data.routes[0].distance / METERS_PER_MILE;
    return {
      distance: Math.round(distanceMiles * 10) / 10,
      duration: formatDuration(data.routes[0].duration),
    };
  } catch (error) {
    console.error('OSRM routing error, falling back to Haversine:', error);
    return fallbackDistanceCalculation(origin, destination);
  }
};

const fallbackDistanceCalculation = (origin, destination) => {
  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    return { distance: 100, duration: '~2 hours' };
  }
  const R = 3959;
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLon = (destination.lng - origin.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) *
      Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { distance: Math.round(distance * 10) / 10, duration: estimateDuration(distance), fallback: true };
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
};

const estimateDuration = (distance) => {
  const hours = Math.floor(distance / 55);
  const minutes = Math.round(((distance / 55) % 1) * 60);
  if (hours === 0) return `${minutes} mins`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
};

export const isValidLocation = (location) => {
  return location && location.lat && location.lng && location.address;
};
