# SafeRide - College Shuttle Service

A modern React-based booking platform for SafeRide, a shared shuttle service for college students traveling between Cornell, Colgate, Syracuse, and major cities.

## Features

- **Accurate Location Search**: Integrated OpenStreetMap Nominatim API for precise location autocomplete
- **Real-time Distance Calculation**: OpenRouteService Directions API for accurate pricing and duration estimates
- **Flexible Payment Options**: 
  - Pay with card online (secure Square integration)
  - Pay with cash in person
  - Pay with card in person
- **Multi-step Booking Flow**: Quote → Schedule → Payment Method → Confirmation
- **Responsive Design**: Mobile-friendly interface with SafeRide branding
- **Free Mapping Services**: No API keys required - uses free tier of OpenStreetMap and OpenRouteService

## Tech Stack

- **Frontend**: React 19, React Router
- **Maps Integration**: OpenStreetMap Nominatim (geocoding), OpenRouteService Directions API
- **Payment Processing**: Square Payment API (mock implementation)
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
src/
├── App.js                 # Main app component
├── App.css               # Global styles
├── BookingCalculator.js  # Main booking component
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
- Square payment integration (mock)

## Usage

1. Enter pickup and dropoff locations using the search fields
2. Select your preferred travel date and time
3. Choose your payment method
4. Review and confirm your booking

## Deployment

The app is ready for deployment to any static hosting service like Netlify, Vercel, or GitHub Pages.

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
