import React, { useState, useEffect } from 'react';
import './SidebarFilters.css';

// Debounce Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const specialties = [
  "Cardiology",
  "Oncology",
  "Neurology",
  "Orthopedics",
  "Surgery",
  "General Medicine",
  "Dermatology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology"
];

const riskTiers = ["Low", "Medium", "High", "Critical"];

const EXPOSURE_MIN = 100000;
const EXPOSURE_MAX = 1000000;
const EXPOSURE_STEP = 10000;

function SidebarFilters({ filters, onApply }) {
  const [localFilters, setLocalFilters] = useState({
    location: {
      min_lat: '47.0',
      max_lat: '55.0',
      min_lon: '5.5',
      max_lon: '15.5'
    },
    specialty: [],
    risk_tier: [],
    exposure_range: {
      min: '100000',
      max: '1000000'
    }
  });

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      setLocalFilters((prev) => ({ ...prev, ...filters }));
    }
  }, [filters]);

  const debouncedFilters = useDebounce(localFilters, 800);

  useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
      onApply(debouncedFilters);
    }
  }, [debouncedFilters, filters, onApply]);

  const handleExposureChange = (field, value) => {
    const numericValue = Number(value);

    setLocalFilters((prev) => {
      let minVal = Number(prev.exposure_range.min);
      let maxVal = Number(prev.exposure_range.max);

      if (field === 'min') {
        minVal = Math.min(numericValue, maxVal);
      } else {
        maxVal = Math.max(numericValue, minVal);
      }

      return {
        ...prev,
        exposure_range: {
          min: String(minVal),
          max: String(maxVal)
        }
      };
    });
  };

  const toggleArrayFilter = (category, value) => {
    setLocalFilters((prev) => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      return { ...prev, [category]: newArray };
    });
  };

  const minExposure = Number(localFilters.exposure_range.min);
  const maxExposure = Number(localFilters.exposure_range.max);

  const minPercent =
    ((minExposure - EXPOSURE_MIN) / (EXPOSURE_MAX - EXPOSURE_MIN)) * 100;
  const maxPercent =
    ((maxExposure - EXPOSURE_MIN) / (EXPOSURE_MAX - EXPOSURE_MIN)) * 100;

  return (
    <div className="sidebar-content">
      <div className="filter-section">
        <h4>Specialty</h4>
        <div className="checkbox-group">
          {specialties.map((spec) => (
            <label key={spec} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.specialty.includes(spec)}
                onChange={() => toggleArrayFilter('specialty', spec)}
              />
              <span>{spec}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Risk Tier</h4>
        <div className="checkbox-group">
          {riskTiers.map((tier) => (
            <label key={tier} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.risk_tier.includes(tier)}
                onChange={() => toggleArrayFilter('risk_tier', tier)}
              />
              <span>{tier}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Exposure Range</h4>
        <div className="range-group">
          <div className="range-label">
            Exposure (${minExposure.toLocaleString()} - ${maxExposure.toLocaleString()})
          </div>

          <div className="dual-range-wrapper">
            <div className="slider-track"></div>
            <div
              className="slider-range"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`
              }}
            ></div>

            <input
              type="range"
              min={EXPOSURE_MIN}
              max={EXPOSURE_MAX}
              step={EXPOSURE_STEP}
              value={minExposure}
              onChange={(e) => handleExposureChange('min', e.target.value)}
              className="thumb thumb-left"
            />

            <input
              type="range"
              min={EXPOSURE_MIN}
              max={EXPOSURE_MAX}
              step={EXPOSURE_STEP}
              value={maxExposure}
              onChange={(e) => handleExposureChange('max', e.target.value)}
              className="thumb thumb-right"
            />
          </div>

          <div className="range-values-row">
            <span className="slider-sublabel">Min: ${minExposure.toLocaleString()}</span>
            <span className="slider-sublabel">Max: ${maxExposure.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarFilters;