import React from 'react';
import './App.css';
import BookingCalculator from './BookingCalculator';
import { FLAT_RATES, COST_PER_MILE_LONG_TRIP, SURGE_FEE } from './pricing';

// Prices shown on the homepage come straight from src/pricing.js,
// so they always match what customers are actually charged.
const ROUTES = [
  {
    from: 'Ithaca',
    to: 'Syracuse',
    note: 'Cornell ↔ Syracuse Hancock Airport and campus',
    solo: FLAT_RATES.syracuse_ithaca.solo,
    shared: FLAT_RATES.syracuse_ithaca.perRiderShared,
  },
  {
    from: 'Ithaca',
    to: 'Rochester',
    note: 'Cornell ↔ Rochester and its airport',
    solo: FLAT_RATES.rochester_ithaca.solo,
    shared: FLAT_RATES.rochester_ithaca.perRiderShared,
  },
];

const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function App() {
  // Open the booking page straight away when Stripe sends a customer back (?payment=...).
  const [currentPage, setCurrentPage] = React.useState(
    () => (new URLSearchParams(window.location.search).has('payment') ? 'booking' : 'home')
  );

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'booking':
        return <BookingCalculator onNavigate={navigateTo} />;
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <main>
      {/* --- HERO --- */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>The shared shuttle between campus, home and the airport.</h1>
            <p className="hero-lede">
              Safe, upfront-priced rides for Cornell, Colgate and Syracuse students, to Ithaca,
              Rochester, NYC and beyond. Book in a few minutes and pay online or with your driver.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-large" onClick={() => navigateTo('booking')}>
                Book a ride
              </button>
              <a className="btn btn-ghost btn-large" href="#routes">See routes and prices</a>
            </div>
            <ul className="hero-points">
              <li><CheckIcon />Drivers available 24/7</li>
              <li><CheckIcon />Share a ride for a lower fare</li>
              <li><CheckIcon />Live tracking for parents</li>
            </ul>
          </div>
          <figure className="hero-photo">
            <img src="/bus-placeholder.png" alt="A shuttle bus at a campus stop at night" />
          </figure>
        </div>
      </section>

      {/* --- ROUTES --- */}
      <section className="routes-section" id="routes">
        <div className="section-inner">
          <div className="section-heading">
            <h2>Common routes and prices</h2>
            <p>Flat fares on our regular routes. Sharing with other riders lowers the price per person.</p>
          </div>

          <ol className="route-map">
            {ROUTES.map((r) => (
              <li className="route" key={r.to}>
                <div className="route-line" aria-label={`${r.from} to ${r.to}`}>
                  <span className="stop">{r.from}</span>
                  <span className="track" aria-hidden="true" />
                  <span className="stop">{r.to}</span>
                </div>
                <p className="route-note">{r.note}</p>
                <div className="route-fares">
                  <p><strong>${r.solo}</strong> riding solo</p>
                  <p><strong>${r.shared}</strong> per rider, shared</p>
                </div>
              </li>
            ))}
            <li className="route route-open">
              <div className="route-line" aria-label="Ithaca to anywhere">
                <span className="stop">Ithaca</span>
                <span className="track" aria-hidden="true" />
                <span className="stop">Anywhere</span>
              </div>
              <p className="route-note">NYC, JFK or any other destination, priced by driving distance</p>
              <div className="route-fares">
                <p><strong>${COST_PER_MILE_LONG_TRIP.toFixed(0)}</strong> per mile, one way</p>
              </div>
            </li>
          </ol>

          <div className="routes-footer">
            <p className="fine-print">Pickups between 8 PM and 8 AM add ${SURGE_FEE}. Card payments add 3%.</p>
            <button className="btn btn-primary" onClick={() => navigateTo('booking')}>Get an exact quote</button>
          </div>
        </div>
      </section>

      {/* --- ABOUT --- */}
      <section className="about-section">
        <div className="section-inner about-grid">
          <div className="about-text">
            <h2>About SafeRide</h2>
            <p>
              At SafeRide, we believe that getting to and from campus should be stress-free, safe, and community-driven. As a dedicated student transportation service, we provide reliable and comfortable rides for students traveling between colleges like Cornell, Colgate, and Syracuse to destinations like Ithaca, Rochester, and NYC. With upfront pricing, flexible scheduling, and a commitment to student safety, we ensure that every trip is smooth and hassle-free. Our small but growing team of experienced drivers is available 24/7, making sure students can count on us whenever they need a ride. Whether you're heading home for break, catching a flight, or just making a quick coffee stop along the way, SafeRide is here to get you there, comfortably and on time.
            </p>
            <p>
              What sets us apart? We keep things community-focused and transparent. Students can see if a ride has already been booked and request to share for a lower fare. We also offer live tracking for parents, push notifications for pickups and drop-offs, and a straightforward booking system that allows for stops, rebookings, and pre-payments.
            </p>
          </div>
          <div className="about-plate">
            <img src="/logo-plate.png" alt="SafeRide logo" />
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="testimonials-section">
        <div className="section-inner">
          <div className="section-heading">
            <h2>What riders say</h2>
          </div>
          <div className="testimonials-grid">
            <figure className="testimonial">
              <blockquote>
                <p className="testimonial-title">The most reliable driving service ever.</p>
                <p>
                  I am a woman and riding an Uber by myself made me a little anxious; however, I am so glad that I was able to find this service. I had faced a difficult situation that had me needing to urgently go to JFK Airport straight from Ithaca and Mr. Haider was able to kindly and swiftly accommodate my situation and take me to JFK Airport. When returning back to Ithaca, my flight kept getting delayed; however, Mr. David waited for me and helped me get back home safely. I wouldn’t have gotten to the airport and back home without Mr. David and Mr. Haider. They are very kind, caring and safe drivers - I highly recommend using their service!!
                </p>
              </blockquote>
              <figcaption>
                <img src="/profile1-placeholder.png" alt="" className="profile-image" />
                <span><strong>Female passenger</strong>Trip to JFK Airport</span>
              </figcaption>
            </figure>

            <figure className="testimonial">
              <blockquote>
                <p className="testimonial-title">Such a great experience!</p>
                <p>
                  I used Saferide to get from the Syracuse airport to Cornell, and it was such a great experience! David was on time, super friendly, and made the long ride feel comfortable and easy. Everything went smoothly from pickup to drop-off, and I felt comfortable the whole way. It took a lot of stress out of traveling, especially after a flight, and I’d definitely use Saferide again.
                </p>
              </blockquote>
              <figcaption>
                <img src="/profile2-placeholder.png" alt="" className="profile-image" />
                <span><strong>Male passenger</strong>Syracuse to Cornell</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* --- CLOSING CALL TO ACTION --- */}
      <section className="closing-cta">
        <div className="section-inner">
          <h2>Heading somewhere soon?</h2>
          <button className="btn btn-gold btn-large" onClick={() => navigateTo('booking')}>Book a ride</button>
        </div>
      </section>
    </main>
  );

  return (
    <div className="App">
      <header className="navbar">
        <div className="navbar-inner">
          <button className="logo" onClick={() => navigateTo('home')} aria-label="SafeRide home">
            <img src="/logo-plate.png" alt="SafeRide" className="nav-logo" />
          </button>
          <nav className="nav-links" aria-label="Main">
            <button
              onClick={() => navigateTo('home')}
              className={currentPage === 'home' ? 'active' : ''}
              aria-current={currentPage === 'home' ? 'page' : undefined}
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('booking')}
              className={`nav-book ${currentPage === 'booking' ? 'active' : ''}`}
              aria-current={currentPage === 'booking' ? 'page' : undefined}
            >
              Book a ride
            </button>
          </nav>
        </div>
      </header>

      {renderPage()}

      <footer>
        <div className="footer-inner">
          <img src="/logo-plate.png" alt="" className="footer-logo" />
          <p>&copy; {new Date().getFullYear()} SafeRide. Student shuttles across Upstate New York.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
