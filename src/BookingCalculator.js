import React, { useState, useEffect } from 'react';
import LocationSearch from './LocationSearch';
import { calculateDistance, geocodeAddress } from './mapsUtils';

// --- Square Payment Integration Component ---
// This simulates the Square payment form being dynamically loaded and rendered.
const SquarePaymentForm = ({ price }) => {
    // NOTE: These are MOCK IDs. Your company must replace these with their actual Sandbox or Production IDs.
    const SQUARE_APP_ID = 'sq0idp-MOCK-APP-ID-12345';
    const SQUARE_LOCATION_ID = 'MOCK_LOCATION_ID_54321';

    useEffect(() => {
        const initializeSquare = () => {
            if (!window.SqPaymentForm) {
                console.error("Square SDK not loaded. Check index.html script tag.");
                return;
            }

            const fieldStyle = {
                input: {
                    fontSize: '14px',
                    padding: '8px 12px',
                    color: '#333',
                },
            };

            // eslint-disable-next-line no-unused-vars
            const paymentForm = new window.SqPaymentForm({
                applicationId: SQUARE_APP_ID,
                locationId: SQUARE_LOCATION_ID,
                
                // Define the IDs of the HTML elements where the secure fields will be injected
                cardNumber: { elementId: 'sq-card-number', style: fieldStyle },
                cvv: { elementId: 'sq-cvv', style: fieldStyle },
                expirationDate: { elementId: 'sq-expiration-date', style: fieldStyle },
                postalCode: { elementId: 'sq-postal-code', style: fieldStyle },
                
                callbacks: {
                    /*
                    NOTE: In a real app, this is where you would handle the tokenization (payment submission).
                    */
                    cardNonceResponseReceived: function(errors, nonce, cardData) {
                        if (errors) {
                            console.error("Payment tokenization failed:", errors);
                            alert(`Error processing card: ${errors[0].message}`);
                            return;
                        }
                        console.log("SUCCESS! Payment Nonce generated (Ready for backend processing):", nonce);
                        alert(`Booking Confirmed! (Mock Payment Nonce: ${nonce})`);
                    },
                    unsupportedBrowserDetected: function() {
                        console.error("Browser unsupported by Square SDK.");
                    },
                    paymentFormLoaded: function() {
                        console.log("Square Payment Form fields loaded successfully.");
                    }
                }
            });
        };
        
        if (window.SqPaymentForm) {
            initializeSquare();
        } else {
            const checkScript = setInterval(() => {
                if (window.SqPaymentForm) {
                    clearInterval(checkScript);
                    initializeSquare();
                }
            }, 100);
        }
    }, [price]);

    return (
        <div className="square-placeholder">
            <p style={{fontSize: '0.85rem', color: '#2F3691', fontWeight: 'bold', marginBottom: '10px'}}>
                (Secure Payment Fields are loading from Square's Servers)
            </p>
            <div className="square-form-mock">
                
                {/* These are the containers where Square will inject its secure iframes */}
                <div id="sq-card-number"></div>
                <div id="sq-expiration-date"></div>
                <div id="sq-cvv"></div>
                <div id="sq-postal-code"></div>

                <button 
                    className="square-pay-btn"
                    onClick={() => console.log("Simulating Square payment initiation...")}
                >
                    Complete Booking: Pay ${price}
                </button>
            </div>
        </div>
    );
};
// End of SquarePaymentForm component

// --- Mock Availability Logic ---
const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i + 1);
        dates.push(nextDay.toISOString().split('T')[0]);
    }
    return dates;
};

// Calendly scheduling
const CALENDLY_URL = 'https://calendly.com/hirschpaula88/30min';

// Cornell University Rate Card pricing
const MIN_TRIP_MILES = 2;              // shortest bookable trip
const COST_PER_MILE_LONG_TRIP = 2.00; // one-way; "Special Long Trips"
const SURGE_FEE = 20;                  // 8PM–8AM surcharge
const CARD_FEE_RATE = 0.03;            // 3% credit-card processing fee
const FLAT_RATES = {
  syracuse_ithaca:  { solo: 120, perRiderShared: 90 },
  rochester_ithaca: { solo: 250, perRiderShared: 150 },
};

const classifyTrip = (pickup, dropoff) => {
  const a = (pickup || '').toLowerCase();
  const b = (dropoff || '').toLowerCase();
  const isIthaca    = (s) => s.includes('cornell')  || s.includes('ithaca');
  const isSyracuse  = (s) => s.includes('syracuse') || s.includes('hancock');
  const isRochester = (s) => s.includes('rochester');
  if ((isSyracuse(a)  && isIthaca(b)) || (isSyracuse(b)  && isIthaca(a))) return 'syracuse_ithaca';
  if ((isRochester(a) && isIthaca(b)) || (isRochester(b) && isIthaca(a))) return 'rochester_ithaca';
  return 'long_trip';
};

// Surge applies if pickup time is between 8PM (20:00) and 8AM (08:00)
const isSurgeTime = (timeStr) => {
  const hour = parseInt((timeStr || '').split(':')[0], 10);
  return Number.isFinite(hour) && (hour < 8 || hour >= 20);
};


function BookingCalculator({ onNavigate }) {
  const availableDates = getAvailableDates();
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    pickupLocation: null,
    dropoffLocation: null,
    date: availableDates[0],
    time: '12:00',
    riders: 1,
  });
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [calendlyConfirmed, setCalendlyConfirmed] = useState(false);
  const [calendlyInviteeUuid, setCalendlyInviteeUuid] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [showCloseHint, setShowCloseHint] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }
    setBookingRef(`SAFERIDE-${Math.floor(Math.random() * 1000000)}`);
    setEmailSubmitted(true);
  };

  const handleCloseTab = () => {
    window.close();
    setTimeout(() => setShowCloseHint(true), 250);
  };

  const handleCancelBooking = () => {
    const ok = window.confirm(
      "Are you sure you want to cancel this booking? We'll redirect you to Calendly to release your reserved time slot."
    );
    if (!ok) return;
    if (calendlyInviteeUuid) {
      window.open(
        `https://calendly.com/cancellations/${calendlyInviteeUuid}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
    // Reset booking flow
    setEmailSubmitted(false);
    setBookingRef('');
    setEmail('');
    setCalendlyConfirmed(false);
    setCalendlyInviteeUuid('');
    setPaymentMethod(null);
    setQuote(null);
    setStep(1);
  };

  // Listen for Calendly postMessage events; only mark scheduling confirmed when
  // the user actually completes a booking inside the embedded widget.
  useEffect(() => {
    const isCalendlyEvent = (e) =>
      e.origin === 'https://calendly.com' &&
      e.data && typeof e.data.event === 'string' &&
      e.data.event.indexOf('calendly.') === 0;
    const handler = (e) => {
      if (!isCalendlyEvent(e)) return;
      if (e.data.event === 'calendly.event_scheduled') {
        setCalendlyConfirmed(true);
        const inviteeUri = e.data.payload?.invitee?.uri || '';
        const uuid = inviteeUri.split('/').filter(Boolean).pop();
        if (uuid) setCalendlyInviteeUuid(uuid);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Load the Calendly widget script (once) and initialise the inline embed
  // whenever the user lands on step 2.
  useEffect(() => {
    if (step !== 2) return;
    const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';
    const initWidget = () => {
      const target = document.getElementById('calendly-inline-target');
      if (target && window.Calendly) {
        target.innerHTML = '';
        window.Calendly.initInlineWidget({ url: CALENDLY_URL, parentElement: target });
      }
    };
    if (window.Calendly) {
      initWidget();
      return undefined;
    }
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', initWidget);
    return () => script.removeEventListener('load', initWidget);
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setQuote(null);
    setError('');
  };

  const handleLocationSelect = (type, locationData) => {
    setFormData(prev => ({
      ...prev,
      [type]: locationData.address,
      [`${type}Location`]: locationData
    }));
    setQuote(null);
    setError('');
  };

  const calculateQuote = async () => {
    const { pickup, dropoff, riders } = formData;
    if (!pickup || !dropoff || !riders || !formData.date || !formData.time) {
      setError("Please fill out all required fields (Location, Date, and Time).");
      setQuote(null);
      return;
    }

    setIsCalculating(true);
    setError('');
    setQuote(null);

    try {
      let origin = formData.pickupLocation;
      let destination = formData.dropoffLocation;

      if (!origin || !origin.lat) {
        origin = await geocodeAddress(pickup);
      }
      if (!destination || !destination.lat) {
        destination = await geocodeAddress(dropoff);
      }

      const result = await calculateDistance(origin, destination);
      const distanceMiles = result.distance;
      if (distanceMiles < MIN_TRIP_MILES) {
        throw new Error(`Trips must be at least ${MIN_TRIP_MILES} miles. This route is only ${distanceMiles} miles, please choose a longer trip.`);
      }
      const numRiders = parseInt(formData.riders, 10) || 1;

      const tripType = classifyTrip(origin.address || pickup, destination.address || dropoff);

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
        pricingDetails = `Long trip: ${distanceMiles} miles × $${COST_PER_MILE_LONG_TRIP.toFixed(2)}/mile${result.fallback ? ' (straight-line estimate)' : ''}`;
      }

      const surge = isSurgeTime(formData.time) ? SURGE_FEE : 0;
      const estimatedPrice = basePrice + surge;
      const details = surge > 0
        ? `${pricingDetails}; +$${SURGE_FEE} late-night surcharge (8PM–8AM)`
        : pricingDetails;

      setQuote({
        price: estimatedPrice,
        distance: distanceMiles,
        duration: result.duration,
        details,
        tripType,
        surge,
      });
    } catch (err) {
      setError(`Could not calculate route: ${err.message}. Please check your locations and try again.`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleBook = () => {
    setStep(2); // Proceed to Schedule
  };

  const handleSchedule = () => {
      setStep(3); // Proceed to Payment Method Selection
  };

  const handlePaymentMethodSelection = (method) => {
      setPaymentMethod(method);
      setStep(4); // Proceed to Payment Processing/Confirmation
  };

  // UI for the Quote Calculator (Step 1)
  const renderQuoteCalculator = () => (
    <div className="booking-container">
      <div className="calculator-panel">
        <h2 className="panel-title">1. Get Your Ride Quote</h2>

        <div className="form-group">
            <label>Pick Up Location</label>
            <LocationSearch
                placeholder="e.g., Cornell University, Ithaca, NY"
                value={formData.pickup}
                onChange={(value) => {
                    setFormData(prev => ({ ...prev, pickup: value, pickupLocation: null }));
                    setQuote(null);
                    setError('');
                }}
                onSelect={(locationData) => handleLocationSelect('pickup', locationData)}
            />
        </div>
        
        <div className="form-group">
            <label>Drop Off Location</label>
            <LocationSearch
                placeholder="e.g., JFK Airport, Rochester, NY"
                value={formData.dropoff}
                onChange={(value) => {
                    setFormData(prev => ({ ...prev, dropoff: value, dropoffLocation: null }));
                    setQuote(null);
                    setError('');
                }}
                onSelect={(locationData) => handleLocationSelect('dropoff', locationData)}
            />
        </div>

        <div className="form-row">
            <div className="form-group half-width">
                <label htmlFor="date">Date (Availability Check)</label>
                <select 
                    id="date" name="date" value={formData.date} onChange={handleInputChange} required
                >
                    {availableDates.map(dateStr => (
                        <option key={dateStr} value={dateStr}>{new Date(dateStr).toLocaleDateString()}</option>
                    ))}
                </select>
            </div>

            <div className="form-group half-width">
                <label htmlFor="time">Time</label>
                <input 
                    id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} required
                />
            </div>
        </div>

        <div className="form-group">
            <label htmlFor="riders">Number of Riders</label>
            <select id="riders" name="riders" value={formData.riders} onChange={handleInputChange}>
                {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Rider{num > 1 ? 's' : ''}</option>
                ))}
            </select>
        </div>

        {error && <p className="error-message">{error}</p>}
        
        <button className="quote-btn large" onClick={calculateQuote} disabled={isCalculating}>
          {isCalculating ? 'CALCULATING...' : 'CALCULATE ESTIMATE'}
        </button>
      </div>

      <div className="quote-results-panel">
        <h2 className="panel-title">Route Preview & Estimate</h2>
        
        {isCalculating ? (
          <div className="map-placeholder-box">
            <p className="preview-message">Calculating driving distance via live routing...</p>
          </div>
        ) : quote ? (
          <div className="quote-display">
            <p className="quote-price-label">Total Price</p>
            <p className="quote-price">${quote.price}<span className="currency"> USD</span></p>
            <p className="quote-total-line"><strong>Price per rider:</strong> ${(quote.price / formData.riders).toFixed(2)} USD</p>

            <div className="quote-details">
                <p><strong>Route:</strong> {formData.pickup} to {formData.dropoff}</p>
                <p><strong>Distance:</strong> {quote.distance} miles</p>
                {quote.duration && <p><strong>Est. Drive Time:</strong> {quote.duration}</p>}
                <p><strong>Riders:</strong> {formData.riders}</p>
                <p><strong>Pricing:</strong> {quote.details}</p>
            </div>
            
            <button className="book-btn" onClick={handleBook}>PROCEED TO SCHEDULE</button>
          </div>
        ) : (
          <div className="map-placeholder-box">
            <img src="/map-placeholder.png" alt="Map Preview" className="map-preview-image" />
            <p className="preview-message">Enter your trip details above to calculate distance and receive an instant quote.</p>
          </div>
        )}
      </div>
    </div>
  );

  // UI for the Scheduling Step (Step 2)
  const renderScheduleRide = () => (
    <div className="schedule-payment-container">
        <h2 className="panel-title">2. Schedule Your Ride</h2>
        <div className="back-link" onClick={() => { setCalendlyConfirmed(false); setStep(1); }}>&larr; Back to Quote</div>

        <div className="schedule-details">
            <div className="detail-card">
                <h3>Trip Summary</h3>
                <p><strong>From:</strong> {formData.pickup}</p>
                <p><strong>To:</strong> {formData.dropoff}</p>
                <p><strong>Date/Time:</strong> {new Date(formData.date).toLocaleDateString()} at {formData.time}</p>
                <p><strong>Riders:</strong> {formData.riders}</p>
                <p className="final-price"><strong>Total Cost:</strong> ${quote.price} USD</p>
            </div>

            <div className="payment-placeholder-card schedule-card">
                <h3>Select Final Time &amp; Driver</h3>
                <p className="subtext">
                    Pick a slot below to book your driver. The proceed button unlocks automatically as soon as Calendly confirms your reservation.
                </p>

                <div
                    id="calendly-inline-target"
                    className="calendly-inline-target"
                    style={{ minWidth: '320px', height: '720px' }}
                />

                {calendlyConfirmed ? (
                    <p className="subtext schedule-status schedule-status-ready" style={{ marginTop: '1.5rem' }}>
                        ✓ Scheduled on Calendly. You can now proceed to payment.
                    </p>
                ) : (
                    <p className="subtext schedule-status schedule-status-locked" style={{ marginTop: '1.5rem' }}>
                        Locked. Complete your Calendly booking above to unlock payment.
                    </p>
                )}

                <button
                    className="book-btn pretty-btn"
                    onClick={handleSchedule}
                    disabled={!calendlyConfirmed}
                    aria-disabled={!calendlyConfirmed}
                    title={!calendlyConfirmed ? 'Finish your Calendly booking first' : ''}
                >
                    PROCEED TO PAYMENT
                </button>
            </div>
        </div>
    </div>
  );

  // UI for the Payment Step (Step 3) - Payment Method Selection
  const renderPaymentMethodSelection = () => (
    <div className="schedule-payment-container">
        <h2 className="panel-title">3. Select Payment Method</h2>
        <div className="back-link" onClick={() => setStep(2)}>&larr; Back to Scheduling</div>
        
        <div className="schedule-details">
            <div className="detail-card">
                <h3>Trip Summary</h3>
                <p><strong>From:</strong> {formData.pickup}</p>
                <p><strong>To:</strong> {formData.dropoff}</p>
                <p><strong>Date/Time:</strong> {new Date(formData.date).toLocaleDateString()} at {formData.time}</p>
                <p><strong>Riders:</strong> {formData.riders}</p>
                <p className="final-price"><strong>Total Cost:</strong> ${quote.price} USD</p>
                <p className="card-fee-note">
                    Note: paying the driver by card adds a 3% processing fee. Cash avoids the fee.
                </p>
            </div>

            <div className="payment-method-selection-card">
                <h3>How Would You Like to Pay?</h3>
                <p className="subtext">
                    Choose your preferred payment method to secure your booking.
                </p>

                <div className="payment-method-options">
                    <button
                        className="payment-option-btn"
                        onClick={() => handlePaymentMethodSelection('pay-person')}
                    >
                        <div className="payment-option-icon">💵</div>
                        <div className="payment-option-text">
                            <strong>Pay in Person</strong>
                            <p>Cash or card with the driver. Total ${quote.price} cash, or ${(quote.price * (1 + CARD_FEE_RATE)).toFixed(2)} on card (+3%)</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="payment-option-btn payment-option-disabled"
                        onClick={(e) => e.preventDefault()}
                        disabled
                        aria-disabled="true"
                        title="Online payment is not available yet"
                    >
                        <div className="payment-option-icon">💳</div>
                        <div className="payment-option-text">
                            <strong>
                                Pay Online <span className="coming-soon-badge">COMING SOON</span>
                            </strong>
                            <p>Online card checkout isn't live yet, please choose Pay in Person.</p>
                        </div>
                    </button>
                </div>
                </div>
            </div>
        </div>
  );

  // UI for Step 4 - Payment Processing or Confirmation
  const renderPaymentProcessing = () => (
    <div className="schedule-payment-container">
        <h2 className="panel-title">4. Complete Your Booking</h2>
        {!emailSubmitted && (
            <div className="back-link" onClick={() => setStep(3)}>&larr; Back to Payment Method</div>
        )}
        
        <div className="schedule-details">
            <div className="detail-card">
                <h3>Trip Summary</h3>
                <p><strong>From:</strong> {formData.pickup}</p>
                <p><strong>To:</strong> {formData.dropoff}</p>
                <p><strong>Date/Time:</strong> {new Date(formData.date).toLocaleDateString()} at {formData.time}</p>
                <p><strong>Riders:</strong> {formData.riders}</p>
                <p className="final-price"><strong>Total Cost:</strong> ${quote.price} USD</p>
            </div>
            
            <div className="payment-placeholder-card">
                <h3>Payment & Confirmation</h3>
                <p className="subtext">
                    {paymentMethod === 'pay-card' ? "Pay online with the secure card form below to confirm your booking." :
                     "Enter your email and we'll send your booking confirmation. You'll pay the driver when they arrive."}
                </p>

                {paymentMethod === 'pay-card' && (
                    <>
                        <p className="subtext">
                            Subtotal: ${quote.price.toFixed(2)} &nbsp;•&nbsp;
                            Card processing (3%): ${(quote.price * CARD_FEE_RATE).toFixed(2)} &nbsp;•&nbsp;
                            <strong>Total: ${(quote.price * (1 + CARD_FEE_RATE)).toFixed(2)}</strong>
                        </p>
                        <SquarePaymentForm price={Number((quote.price * (1 + CARD_FEE_RATE)).toFixed(2))} />
                    </>
                )}
                
                {paymentMethod === 'pay-person' && !emailSubmitted && (
                    <form className="email-capture-form" onSubmit={handleEmailSubmit}>
                        <h4>💵 Pay in Person</h4>
                        <p className="subtext">
                            Enter your email so we can send your booking confirmation, driver details, and tracking link.
                        </p>
                        <label htmlFor="confirm-email">Email Address</label>
                        <input
                            id="confirm-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                        <button type="submit" className="book-btn pretty-btn">
                            CONFIRM BOOKING &amp; SEND CONFIRMATION
                        </button>
                    </form>
                )}

                {paymentMethod === 'pay-person' && emailSubmitted && (
                    <div className="in-person-payment-confirmation">
                        <div className="confirmation-box">
                            <h4>💵 Pay in Person</h4>
                            <p>Your booking is confirmed! Please have ${quote.price} USD ready in cash, or ${(quote.price * (1 + CARD_FEE_RATE)).toFixed(2)} if paying by card (+3% fee), when the driver arrives.</p>
                            <p className="confirmation-details">
                                <strong>Booking Reference:</strong> {bookingRef}
                            </p>
                            <p className="confirmation-details">
                                A confirmation email has been sent to <strong>{email}</strong> with your driver details and tracking information.
                            </p>
                        </div>
                        <div className="confirmation-actions">
                            <button className="book-btn confirmation-btn" onClick={() => onNavigate('home')}>
                                Return to Homepage
                            </button>
                            <button className="book-btn confirmation-btn close-tab-btn" onClick={handleCloseTab}>
                                Close Tab
                            </button>
                            <button className="book-btn confirmation-btn cancel-booking-btn" onClick={handleCancelBooking}>
                                Cancel Booking
                            </button>
                        </div>
                        {showCloseHint && (
                            <p className="close-tab-hint">
                                If the tab didn't close, please close it manually.
                            </p>
                        )}
                    </div>
                )}
                
                {paymentMethod === 'pay-card' && (
                    <p className="subtext">
                        Upon successful payment, you will receive a confirmation email with driver and tracking details.
                    </p>
                )}
            </div>
        </div>
        
    </div>
  );

  // UI for the Payment Step (Step 3)
  const renderSchedulePayment = () => (
    <div className="schedule-payment-container">
        <h2 className="panel-title">3. Secure Payment</h2>
        <div className="back-link" onClick={() => setStep(2)}>&larr; Back to Scheduling</div>

        <div className="schedule-details">
            <div className="detail-card">
                <h3>Trip Summary</h3>
                <p><strong>From:</strong> {formData.pickup}</p>
                <p><strong>To:</strong> {formData.dropoff}</p>
                <p><strong>Date/Time:</strong> {new Date(formData.date).toLocaleDateString()} at {formData.time}</p>
                <p><strong>Riders:</strong> {formData.riders}</p>
                <p className="final-price"><strong>Total Cost:</strong> ${quote.price} USD</p>
            </div>
            
            <div className="payment-placeholder-card">
                <h3>Secure Payment & Confirmation</h3>
                <p className="subtext">
                    Please use the secure form below to complete your payment and confirm your booking.
                    (Your payment is processed by Square, ensuring security.)
                </p>
                
                <SquarePaymentForm price={quote.price} />
                
                <p className="subtext">
                    Upon successful payment, you will receive a confirmation email with driver and tracking details.
                </p>
            </div>
        </div>
        
    </div>
  );


  return (
    <div className="booking-page-wrapper">
        <h1 className="booking-page-header">Book Your SafeRide Shuttle</h1>
        {step === 1 && renderQuoteCalculator()}
        {step === 2 && renderScheduleRide()}
        {step === 3 && renderPaymentMethodSelection()}
        {step === 4 && renderPaymentProcessing()}
        <button className="back-home-btn" onClick={() => onNavigate('home')}>&larr; Return to Homepage</button>
    </div>
  );
}

export default BookingCalculator;