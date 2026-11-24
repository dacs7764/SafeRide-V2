// SafeRide pricing rules.
//
// This one file is used by BOTH the website (to show the quote) and the
// payment server in /api (to decide how much Stripe charges). To change a
// price, change it here and nowhere else, so the quote and the charge always match.
//
// (Written in the older "module.exports" style on purpose, so that both the
// website and the Vercel server functions can load it.)

const MIN_TRIP_MILES = 2;               // shortest bookable trip
const COST_PER_MILE_LONG_TRIP = 2.0;    // one-way; "Special Long Trips"
const SURGE_FEE = 20;                   // 8PM–8AM surcharge
const CARD_FEE_RATE = 0.03;             // 3% card processing fee
const FLAT_RATES = {
  syracuse_ithaca: { solo: 120, perRiderShared: 90 },
  rochester_ithaca: { solo: 250, perRiderShared: 150 },
};

// Areas that qualify for flat rates: a centre point plus a radius in miles.
const HUBS = {
  ithaca: { lat: 42.444, lng: -76.5019, radiusMiles: 12 },      // Ithaca, Cornell, Ithaca airport
  syracuse: { lat: 43.08, lng: -76.125, radiusMiles: 12 },      // Syracuse, SU, Hancock airport
  rochester: { lat: 43.1566, lng: -77.6088, radiusMiles: 15 },  // Rochester and its airport
};

// Straight-line distance in miles between two {lat, lng} points.
const haversineMiles = (a, b) => {
  const R = 3959;
  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const isNear = (point, hubName) => {
  const hub = HUBS[hubName];
  return Boolean(point) && haversineMiles(point, hub) <= hub.radiusMiles;
};

const classifyTrip = (origin, destination) => {
  const between = (x, y) =>
    (isNear(origin, x) && isNear(destination, y)) || (isNear(origin, y) && isNear(destination, x));
  if (between('syracuse', 'ithaca')) return 'syracuse_ithaca';
  if (between('rochester', 'ithaca')) return 'rochester_ithaca';
  return 'long_trip';
};

// Surge applies if pickup time is between 8PM (20:00) and 8AM (08:00)
const isSurgeTime = (timeStr) => {
  const hour = parseInt(String(timeStr || '').split(':')[0], 10);
  return Number.isFinite(hour) && (hour < 8 || hour >= 20);
};

// Works out the trip price (before any card fee).
const computeQuote = ({ distanceMiles, origin, destination, time, riders, fallback }) => {
  const numRiders = parseInt(riders, 10) || 1;
  const tripType = classifyTrip(origin, destination);

  let basePrice;
  let pricingDetails;
  if (tripType === 'syracuse_ithaca' || tripType === 'rochester_ithaca') {
    const rates = FLAT_RATES[tripType];
    const routeName = tripType === 'syracuse_ithaca'
      ? 'Syracuse Hancock ↔ Cornell/Ithaca'
      : 'Rochester ↔ Cornell/Ithaca';
    if (numRiders === 1) {
      basePrice = rates.solo;
      pricingDetails = `${routeName}: $${rates.solo} flat rate (solo)`;
    } else {
      basePrice = rates.perRiderShared * numRiders;
      pricingDetails = `${routeName} shared: $${rates.perRiderShared}/rider × ${numRiders} riders`;
    }
  } else {
    basePrice = Math.round(distanceMiles * COST_PER_MILE_LONG_TRIP);
    pricingDetails = `Long trip: ${distanceMiles} miles × $${COST_PER_MILE_LONG_TRIP.toFixed(2)}/mile${fallback ? ' (straight-line estimate)' : ''}`;
  }

  const surge = isSurgeTime(time) ? SURGE_FEE : 0;
  return {
    price: basePrice + surge,
    details: surge > 0 ? `${pricingDetails}; +$${SURGE_FEE} late-night surcharge (8PM–8AM)` : pricingDetails,
    tripType,
    surge,
  };
};

// Card total in cents (trip price + 3% fee), rounded to the nearest cent.
const cardTotalCents = (price) => Math.round(price * 100 * (1 + CARD_FEE_RATE));
// Same thing as a dollar string, e.g. "123.60".
const cardTotal = (price) => (cardTotalCents(price) / 100).toFixed(2);
const cardFee = (price) => ((cardTotalCents(price) - Math.round(price * 100)) / 100).toFixed(2);

module.exports = {
  MIN_TRIP_MILES,
  COST_PER_MILE_LONG_TRIP,
  SURGE_FEE,
  CARD_FEE_RATE,
  FLAT_RATES,
  HUBS,
  haversineMiles,
  classifyTrip,
  isSurgeTime,
  computeQuote,
  cardTotalCents,
  cardTotal,
  cardFee,
};
