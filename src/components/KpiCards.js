import React from 'react';
import './KpiCards.css';

/* -------- ICONS -------- */

const HospitalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D71500" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const RiskIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D71500" strokeWidth="2">
    <path d="M12 3l9 18H3L12 3z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D71500" strokeWidth="2">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PercentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D71500" strokeWidth="2">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

function KpiCards({ cards }) {
  if (!cards) return null;

  const items = [
    { label: 'Total Hospitals', value: cards.total_hospitals, icon: <HospitalIcon /> },
    { label: 'High Risk Count', value: cards.total_at_risk, icon: <RiskIcon /> },
    { label: 'Total Exposure', value: `$${(cards.total_exposure || 0).toLocaleString()}`, icon: <MoneyIcon /> },
    { label: '% Exposure At Risk', value: `${cards.exposure_at_risk || 0}%`, icon: <PercentIcon /> }
  ];

  return (
    <div className="kpi-container">
      {items.map((item, index) => (

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
          </div>

          <div className="kpi-icon">
            {item.icon}
          </div>
        </div>
        
        // <div key={index} className="kpi-card">

        //   <div className="kpi-header">
        //     <div className="kpi-icon">
        //       {item.icon}
        //     </div>
        //     <div className="kpi-label">{item.label}</div>
        //   </div>

        //   <div className="kpi-value">{item.value}</div>

        // </div>
      ))
      }
    </div >
  );
}

export default KpiCards;