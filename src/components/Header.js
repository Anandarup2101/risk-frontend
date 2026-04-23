import React, { useState, useRef } from 'react';
import api from '../api';
import './Header.css';
import riskIcon from '../assets/risk-icon.png';

function Header({ onLogout }) {
  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || 'Analyst';
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timerRef = useRef(null);

  // Handle Hover Enter (Cancel any closing timer, ensure open)
  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsDropdownOpen(true);
  };

  // Handle Hover Leave (Wait 200ms before closing)
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  // Handle Refresh Data
  const handleRefresh = async () => {
    setIsDropdownOpen(false);
    
    try {
      const response = await api.post('/refresh');
      alert(response.data.message || "Data refreshed successfully!");
      
      // --- REFRESH SCREEN CLAUSE ---
      window.location.reload(); 
      
    } catch (error) {
      console.error("Refresh failed", error);
      alert("Failed to refresh data.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    <header className="header">
      <div className="header-content">

        <div className="brand">
          <img src={riskIcon} alt="Risk" className="header-icon" />
          <h2>RISK ANALYSIS APP</h2>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span className="username">{username}</span>
            <span className="role">{role}</span>
          </div>

          {/* Profile Wrapper with Debounced Hover */}
          <div 
            className="profile-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="avatar-circle">
              {username.charAt(0).toUpperCase()}
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={handleRefresh}>
                  Refresh Data
                </div>
                <div className="dropdown-item" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;