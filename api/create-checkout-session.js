// Vercel server function: POST /api/create-checkout-session
//
// The website sends the trip details here. This function recalculates the
// price itself (so nobody can change the amount in their browser), then asks
// Stripe to create a secure checkout page and sends back its address.
//
// Needs the environment variable STRIPE_SECRET_KEY (set it in Vercel →
// Project → Settings → Environment Variables). Optional: SITE_URL.

const {
  MIN_TRIP_MILES,
  CARD_FEE_RATE,
  computeQuote,
  cardTotalCents,
  haversineMiles,
} = require('../src/pricing.js');

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const METERS_PER_MILE = 1609.344;

const round1 = (n) => Math.round(n * 10) / 10;

// Same driving-distance lookup the website uses, with the same fallback.
async function drivingDistanceMiles(origin, destination) {
  try {
    const url = `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await r.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('No route found');
    return { distance: round1(data.routes[0].distance / METERS_PER_MILE), fallback: false };
  } catch (err) {
    console.error('Routing failed, using straight-line distance:', err.message);
    return { distance: round1(haversineMiles(origin, destination)), fallback: true };
  }
}

const isPoint = (p) =>
  p &&
  Number.isFinite(Number(p.lat)) && Math.abs(Number(p.lat)) <= 90 &&
  Number.isFinite(Number(p.lng)) && Math.abs(Number(p.lng)) <= 180;

// Keep text short and on one line (Stripe limits metadata to 500 characters).
const clean = (v, max = 200) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Online payment is not set up yet. Please choose Pay in Person.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const { pickup, dropoff, date, time, riders, expectedPrice, calendlyInviteeUuid } = body || {};

  const numRiders = parseInt(riders, 10);
  if (
    !isPoint(pickup) || !isPoint(dropoff) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) ||
    !/^\d{2}:\d{2}$/.test(String(time)) ||
    !(numRiders >= 1 && numRiders <= 6)
  ) {
    return res.status(400).json({ error: 'Some trip details are missing. Please go back and recalculate your quote.' });
  }

  const origin = { lat: Number(pickup.lat), lng: Number(pickup.lng) };
  const destination = { lat: Number(dropoff.lat), lng: Number(dropoff.lng) };

  const { distance, fallback } = await drivingDistanceMiles(origin, destination);
  if (distance < MIN_TRIP_MILES) {
    return res.status(400).json({ error: `Trips must be at least ${MIN_TRIP_MILES} miles.` });
  }

  const quote = computeQuote({ distanceMiles: distance, origin, destination, time, riders: numRiders, fallback });

  // If the price we just worked out doesn't match what the customer was shown,
  // stop rather than charge a surprise amount.
  if (expectedPrice != null && Math.abs(quote.price - Number(expectedPrice)) > 1) {
    return res.status(409).json({
      error: `The price for this trip is now $${quote.price} (you were shown $${expectedPrice}). Please go back and recalculate your quote.`,
      price: quote.price,
    });
  }

  const tripCents = Math.round(quote.price * 100);
  const totalCents = cardTotalCents(quote.price);
  const feeCents = totalCents - tripCents;

  const from = clean(pickup.address) || 'Pickup';
  const to = clean(dropoff.address) || 'Drop-off';
  const summary = clean(`SafeRide ${date} ${time}: ${from} → ${to}`, 250);

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const siteUrl = (process.env.SITE_URL || `${proto}://${host}`).replace(/\/+$/, '');

  const metadata = {
    pickup: from,
    dropoff: to,
    date: String(date),
    time: String(time),
    riders: String(numRiders),
    distance_miles: String(distance),
    trip_price: (tripCents / 100).toFixed(2),
    card_fee: (feeCents / 100).toFixed(2),
    pricing: clean(quote.details, 450),
    calendly_invitee: clean(calendlyInviteeUuid, 100),
  };

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${siteUrl}/?payment=cancelled`);
  params.append('phone_number_collection[enabled]', 'true');

  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][unit_amount]', String(tripCents));
  params.append('line_items[0][price_data][product_data][name]', clean(`SafeRide trip: ${from} → ${to}`, 250));
  params.append('line_items[0][price_data][product_data][description]',
    clean(`${date} at ${time} · ${numRiders} rider${numRiders > 1 ? 's' : ''} · ${quote.details}`, 500));

  if (feeCents > 0) {
    params.append('line_items[1][quantity]', '1');
    params.append('line_items[1][price_data][currency]', 'usd');
    params.append('line_items[1][price_data][unit_amount]', String(feeCents));
    params.append('line_items[1][price_data][product_data][name]',
      `Card processing fee (${Math.round(CARD_FEE_RATE * 100)}%)`);
  }

  params.append('payment_intent_data[description]', summary);
  for (const [k, v] of Object.entries(metadata)) {
    if (!v) continue;
    params.append(`metadata[${k}]`, v);
    params.append(`payment_intent_data[metadata][${k}]`, v);
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await stripeRes.json();
    if (!stripeRes.ok || !data.url) {
      console.error('Stripe error:', data && data.error ? data.error.message : stripeRes.status);
      return res.status(502).json({ error: 'Could not start the payment. Please try again or choose Pay in Person.' });
    }
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Could not reach Stripe:', err.message);
    return res.status(502).json({ error: 'Could not start the payment. Please try again or choose Pay in Person.' });
  }
};
