import React, { useState, useEffect, useRef } from 'react';
import { isSpecificLocation } from './mapsUtils';

const PHOTON_URL = 'https://photon.komoot.io/api/';

const buildLabel = (props) => {
  const parts = [];
  if (props.name) parts.push(props.name);
  if (props.housenumber && props.street && !props.name) parts.push(`${props.housenumber} ${props.street}`);
  else if (props.street && !props.name) parts.push(props.street);
  const locality = props.city || props.town || props.village || props.district || props.county;
  if (locality && locality !== props.name) parts.push(locality);
  if (props.state) parts.push(props.state);
  return parts.join(', ') || 'Unknown location';
};

const buildFullAddress = (props) => {
  const parts = [];
  if (props.name) parts.push(props.name);
  if (props.housenumber && props.street) parts.push(`${props.housenumber} ${props.street}`);
  else if (props.street) parts.push(props.street);
  const locality = props.city || props.town || props.village || props.county;
  if (locality) parts.push(locality);
  if (props.state) parts.push(props.state);
  if (props.postcode) parts.push(props.postcode);
  if (props.country) parts.push(props.country);
  return parts.join(', ');
};

const LocationSearch = ({ placeholder, value, onChange, onSelect }) => {
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);
  const abortRef = useRef(null);

  const searchLocations = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: 8,
        lang: 'en',
        lat: 42.4534,
        lon: -76.4735,
      });
      const response = await fetch(`${PHOTON_URL}?${params}`, {
        signal: abortRef.current.signal,
      });
      const data = await response.json();

      const formatted = (data.features || [])
        .filter((feature) => isSpecificLocation(feature.properties))
        .map((feature) => {
          const props = feature.properties || {};
          const [lng, lat] = feature.geometry.coordinates;
          return {
            id: `${props.osm_type}${props.osm_id}`,
            label: buildLabel(props),
            address: buildFullAddress(props),
            lat,
            lng,
            type: props.osm_value || props.osm_key || '',
          };
        });

      setSuggestions(formatted);
      setShowSuggestions(formatted.length > 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Photon geocoding error:', err);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchLocations(newValue), 250);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.label);
    onSelect({ address: suggestion.address || suggestion.label, lat: suggestion.lat, lng: suggestion.lng });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div className="location-search-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="location-input"
        autoComplete="off"
      />

      {isLoading && (
        <div className="loading-indicator">
          <span>Searching...</span>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className="suggestion-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-address">{suggestion.label}</div>
              {suggestion.type && (
                <div className="suggestion-type">{suggestion.type.replace(/_/g, ' ')}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
