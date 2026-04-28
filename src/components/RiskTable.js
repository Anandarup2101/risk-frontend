import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RiskTable.css';

function RiskTable({ tableData }) {
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [hospitalSearch, setHospitalSearch] = useState('');

  const rowsPerPage = 10;

  const getBadgeClass = (tier) => {
    switch (tier) {
      case 'Low':
        return 'badge-low';
      case 'Medium':
        return 'badge-medium';
      case 'High':
        return 'badge-high';
      case 'Critical':
        return 'badge-critical';
      default:
        return 'badge-low';
    }
  };

  const filteredData = useMemo(() => {
    if (!tableData) return [];

    const query = hospitalSearch.trim().toLowerCase();

    if (!query) return tableData;

    return tableData.filter((row) =>
      String(row.hospital_name || '').toLowerCase().includes(query)
    );
  }, [tableData, hospitalSearch]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }

        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

        return 0;
      });
    }

    return sortableItems;
  }, [filteredData, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [hospitalSearch, tableData]);

  const requestSort = (key) => {
    let direction = 'ascending';

    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleViewClick = (hospitalName) => {
    localStorage.setItem('selectedHospitalName', hospitalName);
    navigate('/hospital-details', { state: { hospitalName } });
  };

  const getSortIndicator = (name) => {
    if (sortConfig.key !== name) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  return (
    <div className="table-container">
      <table className="risk-table">
        <thead>
          <tr>
            <th className="hospital-header-cell">
              <div className="hospital-header-row">
                <button
                  type="button"
                  className="hospital-sort-btn"
                  onClick={() => requestSort('hospital_name')}
                >
                  Hospital {getSortIndicator('hospital_name')}
                </button>

                <div className="hospital-search-wrapper">
                  <input
                    type="text"
                    className="hospital-search-input"
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Search..."
                  />

                  {hospitalSearch && (
                    <button
                      type="button"
                      className="hospital-search-clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHospitalSearch('');
                      }}
                      aria-label="Clear hospital search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
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
          {currentData.length === 0 ? (
            <tr>
              <td colSpan="6" className="table-empty-cell">
                No hospitals found{hospitalSearch ? ` for "${hospitalSearch}"` : ''}
              </td>
            </tr>
          ) : (
            currentData.map((row, index) => (
              <tr key={`${row.hospital_name}-${index}`}>
                <td className="text-primary">{row.hospital_name}</td>

                <td>
                  {typeof row.risk_score === 'number'
                    ? row.risk_score.toFixed(1)
                    : row.risk_score}
                </td>

                <td>
                  $
                  {typeof row.ar_exposure === 'number'
                    ? row.ar_exposure.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : row.ar_exposure}
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
                    type="button"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className="pagination-btn"
          type="button"
        >
          Previous
        </button>

        <span className="pagination-info">
          Page {currentPage} of {totalPages} · {sortedData.length} hospitals
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="pagination-btn"
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default RiskTable;