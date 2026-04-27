#!/bin/bash

# Update pricing to $1 per mile one-way
sed -i 's/const roundTripDistance = distance \* 2;/\/\/ Pricing changed to $1 per mile one-way/g' src/BookingCalculator.js
sed -i 's/estimatedPrice = roundTripDistance \* 1\.00; \/\/ \$1 per mile round trip/estimatedPrice = distance \* 1\.00; \/\/ \$1 per mile one-way/g' src/BookingCalculator.js
sed -i 's/if (estimatedPrice < 150) {/if (estimatedPrice < 75) {/g' src/BookingCalculator.js
sed -i 's/pricingDetails = `Minimum custom trip fee applied. Calculated at \$1\/mile round-trip (\${roundTripDistance.toFixed(1)} miles).`;/pricingDetails = `Minimum custom trip fee applied. Calculated at \$1\/mile one-way (\${distance.toFixed(1)} miles).`;/g' src/BookingCalculator.js
sed -i 's/pricingDetails = `\$${1\.00}\/mile round-trip (\${roundTripDistance.toFixed(1)} miles total).`;/pricingDetails = `\$${1\.00}\/mile one-way (\${distance.toFixed(1)} miles).`;/g' src/BookingCalculator.js

# Update payment options to simplified version
sed -i '386,418c\
                <div className="payment-method-options">\
                    <button \
                        className="payment-option-btn" \
                        onClick={() => handlePaymentMethodSelection('\''pay-person'\'')}\
                    >\
                        <div className="payment-option-icon">💵</div>\
                        <div className="payment-option-text">\
                            <strong>Pay in Person</strong>\
                            <p>Pay the driver when they arrive</p>\
                        </div>\
                    </button>\
                    \
                    <button \
                        className="payment-option-btn" \
                        onClick={() => handlePaymentMethodSelection('\''pay-card'\'')}\
                    >\
                        <div className="payment-option-icon">💳</div>\
                        <div className="payment-option-text">\
                            <strong>Pay by Card</strong>\
                            <p>Secure payment by card to confirm booking</p>\
                        </div>\
                    </button>\
                </div>' src/BookingCalculator.js

# Update payment processing logic
sed -i "s/paymentMethod === 'card-now' ? \"Please use the secure form below to complete your payment and confirm your booking.\" : /paymentMethod === 'pay-card' ? \"Please use the secure form below to complete your payment and confirm your booking.\" : /g" src/BookingCalculator.js
sed -i "s/paymentMethod === 'cash-person' ? \"Your booking will be confirmed. You'll pay the driver when they arrive with cash.\" :/\"Your booking will be confirmed. You'll pay the driver when they arrive.\" :/g" src/BookingCalculator.js
sed -i "s/paymentMethod === 'card-person')/paymentMethod === 'pay-person')/g" src/BookingCalculator.js
sed -i "s/paymentMethod === 'card-now' && /paymentMethod === 'pay-card' && /g" src/BookingCalculator.js
sed -i "s/(paymentMethod === 'cash-person' || paymentMethod === 'card-person') && (/(paymentMethod === 'pay-person') && (/g" src/BookingCalculator.js

# Simplify confirmation box
sed -i 's/{paymentMethod === '\''cash-person'\'' ? (/<>/g' src/BookingCalculator.js
sed -i 's/) : (/)/g' src/BookingCalculator.js
sed -i 's/<h4>💵 Pay with Cash in Person</h4>/<h4>💵 Pay in Person</h4>/g' src/BookingCalculator.js
sed -i 's/<h4>💳 Pay with Card in Person</h4>/<h4>💳 Pay by Card in Person</h4>/g' src/BookingCalculator.js
sed -i 's/Please have the exact amount ready (\${quote.price} USD) when the driver arrives./Pay the driver when they arrive./g' src/BookingCalculator.js
sed -i 's/The driver will accept card payments via a card reader when they arrive./Pay the driver when they arrive./g' src/BookingCalculator.js

echo "Updates completed"
