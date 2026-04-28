import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SidebarFilters from '../components/SidebarFilters';
import GlobalShapExplainer from '../components/GlobalShapExplainer';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import KpiCards from '../components/KpiCards';
import RiskTable from '../components/RiskTable';
import ChartPanel from '../components/ChartPanel';
import api from '../api';
import ChatbotAssistant from '../components/ChatbotAssistant';
import './DashboardPage.css';

const RiskAnalysisIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="20" x2="6" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="18" y1="20" x2="18" y2="14"></line>
  </svg>
);

const RefreshIcon = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
  </svg>
);

function DashboardPage() {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openSidebarSection, setOpenSidebarSection] = useState('filters');

  const [overview, setOverview] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const [showRiskModal, setShowRiskModal] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchDashboardData = useCallback(async (currentFilters) => {
    setLoading(true);
    setOverview('');
    setOverviewError('');

    try {
      const payload = {};

      if (currentFilters.location) {
        const { min_lat, max_lat, min_lon, max_lon } = currentFilters.location;

        if (min_lat && max_lat && min_lon && max_lon) {
          payload.location = {
            min_lat: parseFloat(min_lat),
            max_lat: parseFloat(max_lat),
            min_lon: parseFloat(min_lon),
            max_lon: parseFloat(max_lon)
          };
        }
      }

      if (currentFilters.specialty?.length > 0) {
        payload.specialty = currentFilters.specialty;
      }

      if (currentFilters.risk_tier?.length > 0) {
        payload.risk_tier = currentFilters.risk_tier;
      }

      if (currentFilters.exposure_range) {
        const { min, max } = currentFilters.exposure_range;

        if (min && max) {
          payload.exposure_range = {
            min: parseFloat(min),
            max: parseFloat(max)
          };
        }
      }

      const response = await api.post('/dashboard', payload);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApplyFilters = useCallback(
    async (newFilters) => {
      setFilters(newFilters);
      await fetchDashboardData(newFilters);
    },
    [fetchDashboardData]
  );

  useEffect(() => {
    handleApplyFilters({
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
  }, [handleApplyFilters]);

  const handleGenerateOverview = async () => {
    if (!data || overviewLoading) return;

    setShowOverviewModal(true);
    setOverviewLoading(true);
    setOverview('');
    setOverviewError('');

    try {
      const response = await api.post('/llm/dashboard-overview', data);
      setOverview(response.data?.overview || 'No overview generated.');
    } catch (error) {
      setOverviewError('Unable to generate overview.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const toggleSidebarSection = (section) => {
    setOpenSidebarSection((prev) => (prev === section ? '' : section));
  };

  return (
    <div className="dashboard-container">
      <Header onLogout={handleLogout} />

      <main className="main-content">
        <aside className="unified-sidebar">
          <div className="sidebar-accordion-section">
            <button
              className="sidebar-accordion-header"
              onClick={() => toggleSidebarSection('filters')}
              type="button"
            >
              <span>Dashboard Filters</span>
              <span className="accordion-symbol">
                {openSidebarSection === 'filters' ? '−' : '+'}
              </span>
            </button>

            {openSidebarSection === 'filters' && (
              <div className="sidebar-accordion-body">
                <SidebarFilters filters={filters} onApply={handleApplyFilters} />
              </div>
            )}
          </div>

          <div className="sidebar-accordion-section">
            <button
              className="sidebar-accordion-header"
              onClick={() => toggleSidebarSection('analysis')}
              type="button"
            >
              <span>Analysis Tools</span>
              <span className="accordion-symbol">
                {openSidebarSection === 'analysis' ? '−' : '+'}
              </span>
            </button>

            {openSidebarSection === 'analysis' && (
              <div className="sidebar-accordion-body analysis-tools-body">
                <button
                  className="shap-action-button"
                  onClick={() => setShowRiskModal(true)}
                  disabled={!data}
                  type="button"
                >
                  <div className="shap-icon-wrapper">
                    <RiskAnalysisIcon />
                  </div>
                  <span>Risk Analysis</span>
                </button>

                <GlobalShapExplainer />

                <AdvancedAnalytics filters={filters} />
              </div>
            )}
          </div>
        </aside>

        <section className="content-area">
          {loading ? (
            <div className="loading-state">Loading data...</div>
          ) : (
            <>
              <div className="dashboard-top-row">
                <div className="dashboard-overview-card">
                  <div>
                    <div className="dashboard-overview-label">Dashboard Overview</div>
                    <div className="dashboard-overview-title">
                      Generate Business Interpretation
                    </div>
                  </div>

                  <button
                    className="dashboard-overview-btn"
                    onClick={handleGenerateOverview}
                    type="button"
                    disabled={!data || overviewLoading}
                  >
                    {overviewLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>

                <ChatbotAssistant />
              </div>

              <KpiCards cards={data?.cards} />

              <div className="risk-table-page-wrapper">
                <RiskTable tableData={data?.table} />
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        © {currentYear} Tata Consultancy Services. All rights reserved.
      </footer>

      {showRiskModal && (
        <div className="risk-modal-backdrop" onClick={() => setShowRiskModal(false)}>
          <div className="risk-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="risk-modal-header">
              <h3>Risk Analysis</h3>
              <button onClick={() => setShowRiskModal(false)} type="button">
                ×
              </button>
            </div>

            <div className="risk-modal-body">
              <ChartPanel chartData={data?.charts} />
            </div>
          </div>
        </div>
      )}

      {showOverviewModal && (
        <div className="overview-modal-backdrop" onClick={() => setShowOverviewModal(false)}>
          <div className="overview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="overview-modal-header">
              <h3>Business Overview</h3>
              <button onClick={() => setShowOverviewModal(false)} type="button">
                ×
              </button>
            </div>

            <div className="overview-modal-body">
              {overviewLoading && (
                <div className="overview-loading-container">
                  <RefreshIcon size={32} className="dashboard-spin" color="#d71500" />
                  <span className="overview-loading-text">
                    Generating business interpretation...
                  </span>
                </div>
              )}

              {!overviewLoading && overviewError && (
                <div className="overview-error-container">{overviewError}</div>
              )}

              {!overviewLoading && !overviewError && overview && (
                <div className="overview-text">{overview}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;