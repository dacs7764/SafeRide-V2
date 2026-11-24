// Vercel server function: GET /api/checkout-status?session_id=cs_...
//
// After Stripe sends the customer back to the website, the website calls this
// to confirm with Stripe that the payment really went through, and to get the
// trip details to show on the confirmation screen.

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'Online payment is not set up.' });

  const sessionId = String((req.query && req.query.session_id) || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid payment reference.' });
  }

  try {
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const s = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error('Stripe error:', s && s.error ? s.error.message : stripeRes.status);
      return res.status(404).json({ error: 'We could not find this payment.' });
    }
    const m = s.metadata || {};
    return res.status(200).json({
      paid: s.payment_status === 'paid',
      amountTotal: (s.amount_total || 0) / 100,
      email: (s.customer_details && s.customer_details.email) || '',
      reference: `SAFERIDE-${sessionId.slice(-8).toUpperCase()}`,
      pickup: m.pickup || '',
      dropoff: m.dropoff || '',
      date: m.date || '',
      time: m.time || '',
      riders: m.riders || '',
    });
  } catch (err) {
    console.error('Could not reach Stripe:', err.message);
    return res.status(502).json({ error: 'Could not check the payment right now. Please refresh the page.' });
  }
};
