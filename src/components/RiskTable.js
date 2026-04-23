import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './RiskTable.css';

function RiskTable({ tableData }) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const getBadgeClass = (tier) => {
    switch (tier) {
      case 'Low': return 'badge-low';
      case 'Medium': return 'badge-medium';
      case 'High': return 'badge-high';
      case 'Critical': return 'badge-critical';
      default: return 'badge-low';
    }
  };

  // --- SORTING LOGIC ---
  const sortedData = useMemo(() => {
    if (!tableData) return [];

    let sortableItems = [...tableData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tableData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // --- NAVIGATION ---
  const handleViewClick = (hospitalName) => {
    navigate('/hospital-details', { state: { hospitalName } });
  };

  // --- RENDER HELPERS ---
  const getSortIndicator = (name) => {
    if (sortConfig.key !== name) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  if (!currentData || currentData.length === 0) {
    return <div className="table-empty-state">No data available</div>;
  }

  return (
    <div className="table-container">
      <table className="risk-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('hospital_name')}>
              Hospital {getSortIndicator('hospital_name')}
            </th>
            <th onClick={() => requestSort('risk_score')}>
              Risk Score {getSortIndicator('risk_score')}
            </th>
            <th onClick={() => requestSort('ar_exposure')}>
              Exposure {getSortIndicator('ar_exposure')}
            </th>
            <th onClick={() => requestSort('risk_tier')}>
              Risk Tier {getSortIndicator('risk_tier')}
            </th>
            <th onClick={() => requestSort('dso_30d')}>
              DSO {getSortIndicator('dso_30d')}
            </th>
            <th className="action-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((row, index) => (
            <tr key={index}>
              <td className="text-primary">{row.hospital_name}</td>
              <td>{typeof row.risk_score === 'number' ? row.risk_score.toFixed(1) : row.risk_score}</td>
              <td>
                ${typeof row.ar_exposure === 'number' ? row.ar_exposure.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : row.ar_exposure}
              </td>
              <td>
                <span className={`badge ${getBadgeClass(row.risk_tier)}`}>
                  {row.risk_tier}
                </span>
              </td>
              <td>{row.dso_30d}</td>
              <td className="action-col">
                <button 
                  className="view-btn"
                  onClick={() => handleViewClick(row.hospital_name)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button 
          onClick={goToPrevPage} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default RiskTable;