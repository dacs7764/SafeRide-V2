# SafeRide - College Shuttle Service

A modern React-based booking platform for SafeRide, a shared shuttle service for college students traveling between Cornell, Colgate, Syracuse, and major cities.

## Features

- **Accurate Location Search**: Integrated OpenStreetMap Nominatim API for precise location autocomplete
- **Real-time Distance Calculation**: OpenRouteService Directions API for accurate pricing and duration estimates
- **Flexible Payment Options**: 
  - Pay with card online (Stripe Checkout)
  - Pay with cash or card in person
- **Multi-step Booking Flow**: Quote → Schedule → Payment Method → Confirmation
- **Responsive Design**: Mobile-friendly interface with SafeRide branding
- **Free Mapping Services**: No API keys required - uses free tier of OpenStreetMap and OpenRouteService

## Tech Stack

- **Frontend**: React 19, React Router
- **Maps Integration**: OpenStreetMap Nominatim (geocoding), OpenRouteService Directions API
- **Payment Processing**: Stripe Checkout, via two small Vercel server functions in `api/`
- **Styling**: CSS with responsive design
- **Build Tool**: Create React App

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/saferide-sp26.git
   cd saferide-sp26
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   
   The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Mapping Services

This app uses free mapping services with no API keys required:

- **OpenStreetMap Nominatim**: For location search and geocoding
- **OpenRouteService**: For distance and duration calculations

Both services have generous free tiers suitable for development and small-scale production use.

## Project Structure

```
api/
├── create-checkout-session.js  # Re-checks the price and opens a Stripe checkout page
└── checkout-status.js          # Confirms with Stripe that a payment went through
src/
├── App.js                 # Main app component
├── App.css               # Global styles
├── BookingCalculator.js  # Main booking component
├── pricing.js            # All prices (shared by the website and the payment server)
├── LocationSearch.js     # OpenStreetMap location search component
├── mapsUtils.js          # OpenRouteService utility functions
├── index.js              # App entry point
└── index.css            # Base styles
```

## Key Components

### LocationSearch
- OpenStreetMap Nominatim API integration
- Autocomplete location suggestions
- US-only location restriction for SafeRide

### mapsUtils
- OpenRouteService Directions API integration
- Distance and duration calculations
- Fallback to Haversine formula if API fails

### BookingCalculator
- Multi-step booking flow
- Real-time quote calculation
- Payment method selection
- Online card payment through Stripe Checkout

## Usage

1. Enter pickup and dropoff locations using the search fields
2. Select your preferred travel date and time
3. Choose your payment method
4. Review and confirm your booking

## Online Payments (Stripe)

Customers who choose **Pay Online by Card** are sent to Stripe's secure checkout page,
then brought back to a confirmation screen. Card details never touch this website.
The payment server re-calculates the price itself (using `src/pricing.js`), so the amount
can't be changed from the browser. Each payment in your Stripe Dashboard shows the
pickup, drop-off, date, time, riders and Calendly booking.

To change prices, edit **`src/pricing.js` only**. The quote and the charge both use it.

### Setup (one time)

1. **Create a Stripe account** at https://dashboard.stripe.com/register.
2. **Copy your test secret key**: Stripe Dashboard → Developers → API keys (make sure
   "Test mode" is on). It starts with `sk_test_`. Keep it private, never put it in the code.
3. **Put the site on Vercel** (free): sign in at https://vercel.com with GitHub →
   Add New → Project → pick this repository → Deploy. Vercel detects everything automatically.
4. **Add the key to Vercel**: Project → Settings → Environment Variables →
   name `STRIPE_SECRET_KEY`, value = your `sk_test_...` key → Save. Then Deployments →
   ⋯ on the latest one → Redeploy (the key only takes effect after a redeploy).

### Testing (no real money)

Book a trip, choose **Pay Online by Card**, and on Stripe's page use card number
`4242 4242 4242 4242`, any future expiry date, any 3-digit CVC and any ZIP code.
The payment appears in your Stripe Dashboard under Test mode → Payments.

### Going live

1. Finish activating your Stripe account (business and bank details).
2. Turn off Test mode in Stripe, copy the **live** secret key (`sk_live_...`).
3. In Vercel, replace `STRIPE_SECRET_KEY` with the live key and redeploy.
4. Recommended: in Stripe → Settings → Emails, turn on "Successful payments" receipts
   for customers, and payment notifications for yourself.

> Note: online payments need the Vercel server functions, so they won't work with
> `npm start` alone. To test locally, install the Vercel CLI, copy `.env.example`
> to `.env.local`, add your test key, and run `vercel dev`.

## Deployment

Deploy on Vercel so the payment functions in `api/` run (see above). Static-only hosts like GitHub Pages can't run them.

```bash
npm run build
# Deploy the build/ folder contents
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
