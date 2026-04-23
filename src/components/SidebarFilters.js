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
  "Cardiology", "Oncology", "Neurology", "Orthopedics", "Surgery", 
  "General Medicine", "Dermatology", "Gastroenterology", "Pulmonology", "Endocrinology"
];

const riskTiers = ["Low", "Medium", "High", "Critical"];

function SidebarFilters({ filters, setFilters, onApply }) {
  const [localFilters, setLocalFilters] = useState({
    // Initial state with requested defaults
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
        setLocalFilters(prev => ({ ...prev, ...filters }));
    }
  }, [filters]);

  const debouncedFilters = useDebounce(localFilters, 800);

  useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
       onApply(debouncedFilters);
    }
  }, [debouncedFilters, onApply]);

  const handleLocationChange = (field, value) => {
    // Convert to number to ensure math works, then back to string for consistency
    setLocalFilters(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const handleExposureChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      exposure_range: { ...prev.exposure_range, [field]: value }
    }));
  };

  const toggleArrayFilter = (category, value) => {
    setLocalFilters(prev => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [category]: newArray };
    });
  };

  return (
    <div className="sidebar-content">
      
      {/* Specialty Section */}
      <div className="filter-section">
        <h4>Specialty</h4>
        <div className="checkbox-group">
          {specialties.map(spec => (
            <label key={spec} className="checkbox-label">
              <input 
                type="checkbox" 
                checked={localFilters.specialty.includes(spec)}
                onChange={() => toggleArrayFilter('specialty', spec)}
              />
              {spec}
            </label>
          ))}
        </div>
      </div>

      {/* Risk Tier Section */}
      <div className="filter-section">
        <h4>Risk Tier</h4>
        <div className="checkbox-group">
          {riskTiers.map(tier => (
            <label key={tier} className="checkbox-label">
              <input 
                type="checkbox" 
                checked={localFilters.risk_tier.includes(tier)}
                onChange={() => toggleArrayFilter('risk_tier', tier)}
              />
              {tier}
            </label>
          ))}
        </div>
      </div>

      {/* Exposure Section */}
      <div className="filter-section">
        <h4>Exposure Range</h4>
        <div className="range-group">
          <div className="range-label">
            Exposure (Min: ${Number(localFilters.exposure_range.min).toLocaleString()} / Max: ${Number(localFilters.exposure_range.max).toLocaleString()})
          </div>
          <div className="slider-row">
            <span className="slider-sublabel">Min</span>
            <input 
              type="range" 
              min="100000" max="1000000" step="10000"
              value={localFilters.exposure_range.min}
              onChange={(e) => handleExposureChange('min', e.target.value)}
              className="range-input"
            />
            <span className="slider-sublabel">Max</span>
            <input 
              type="range" 
              min="100000" max="1000000" step="10000"
              value={localFilters.exposure_range.max}
              onChange={(e) => handleExposureChange('max', e.target.value)}
              className="range-input"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

export default SidebarFilters;