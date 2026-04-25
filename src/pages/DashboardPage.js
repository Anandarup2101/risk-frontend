import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SidebarFilters from '../components/SidebarFilters';
import GlobalShapExplainer from '../components/GlobalShapExplainer';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import KpiCards from '../components/KpiCards';
import RiskTable from '../components/RiskTable';
import ChartPanel from '../components/ChartPanel';
import api from '../api';
import './DashboardPage.css';

function DashboardPage() {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const RefreshIcon = ({ size = 24, color = "currentColor", className = "" }) => (
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

      if (currentFilters.specialty && currentFilters.specialty.length > 0) {
        payload.specialty = currentFilters.specialty;
      }

      if (currentFilters.risk_tier && currentFilters.risk_tier.length > 0) {
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
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApplyFilters = useCallback(async (newFilters) => {
    setFilters(newFilters);
    await fetchDashboardData(newFilters);
  }, [fetchDashboardData]);

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
    if (!data) return;

    setShowOverviewModal(true);
    setOverviewLoading(true);
    setOverview('');
    setOverviewError('');

    try {
      const response = await api.post('/llm/dashboard-overview', data);
      setOverview(response.data?.overview || 'No overview generated.');
    } catch (error) {
      console.error('Failed to generate overview', error);
      setOverviewError('Unable to generate dashboard overview.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleCloseOverviewModal = () => {
    setShowOverviewModal(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <Header onLogout={handleLogout} />

      <main className="main-content">
        <aside className="unified-sidebar">
          <div className="sidebar-section filters-section">
            <div className="sidebar-section-header">
              <h3>Dashboard Filters</h3>
            </div>
            <SidebarFilters
              filters={filters}
              setFilters={setFilters}
              onApply={handleApplyFilters}
            />
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section shap-section">
            <div className="sidebar-section-header">
              <h3>Explainability</h3>
            </div>
            <GlobalShapExplainer />
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section analytics-section">
            <div className="sidebar-section-header">
              <h3>Advanced Analytics</h3>
            </div>
            <AdvancedAnalytics filters={filters} />
          </div>
        </aside>

        <section className="content-area">
          {loading ? (
            <div className="loading-state">Loading data...</div>
          ) : (
            <>
              <div className="dashboard-overview-card">
                <div className="dashboard-overview-content">
                  <div className="dashboard-overview-label">Dashboard Overview</div>
                  <div className="dashboard-overview-title">
                    Generate Business Interpretation of Current Filtered view
                  </div>
                </div>

                <button
                  className="dashboard-overview-btn"
                  onClick={handleGenerateOverview}
                  disabled={!data || overviewLoading}
                >
                  {overviewLoading ? 'Generating...' : 'Generate Overview'}
                </button>
              </div>

              <KpiCards cards={data?.cards} />
              <RiskTable tableData={data?.table} />
              <ChartPanel chartData={data?.charts} />
            </>
          )}
        </section>
      </main>

      {showOverviewModal && (
        <div className="overview-modal-backdrop" onClick={handleCloseOverviewModal}>
          <div className="overview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="overview-modal-header">
              <div>
                <div className="overview-modal-label">Dashboard Overview</div>
                <h3>Business Risk Interpretation</h3>
              </div>

              <button className="overview-modal-close" onClick={handleCloseOverviewModal}>
                ×
              </button>
            </div>

            <div className="overview-modal-body">
              {overviewLoading ? (
                <div className="loading-container">
                  <RefreshIcon size={32} className="spin" color="#d71500" />
                  <div className="loading-text">Generating insights...</div>
                </div>
              ) : overviewError ? (
                <div className="overview-error">{overviewError}</div>
              ) : (
                <div className="overview-text">
                  {overview
                    ?.split('\n')
                    .filter(p => p.trim() !== '')
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;