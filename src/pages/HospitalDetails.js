import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Header from '../components/Header';
import './HospitalDetails.css';
import api from '../api';

const ChevronLeft = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ArrowLeft = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const RefreshIcon = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
  </svg>
);

const TrendingUp = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TrendingDown = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const MapPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const Stethoscope = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
    <circle cx="20" cy="10" r="2"></circle>
  </svg>
);

const ChartIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="20" x2="6" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="18" y1="20" x2="18" y2="14"></line>
  </svg>
);

const ConsensusIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M8 12l2.5 2.5L16 9"></path>
  </svg>
);

const GalleryIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <circle cx="8" cy="10" r="1.5"></circle>
    <path d="M21 15l-5-5L5 19"></path>
  </svg>
);

const renderParagraphs = (text) => {
  if (!text) return <p>No explanation available.</p>;

  return text
    .split('\n')
    .filter((para) => para.trim() !== '')
    .map((para, index) => <p key={index}>{para}</p>);
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Good':
      return 'status-good';
    case 'Needs Attention':
      return 'status-warning';
    case 'Critical':
      return 'status-critical';
    default:
      return 'status-unknown';
  }
};

const CustomPdpTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];

    return (
      <div className="custom-tooltip">
        <p className="tooltip-header">{data.name}</p>
        <p>Value: <span className="tooltip-value">{data.payload.x}</span></p>
        <p>Risk: <span className="tooltip-value">{Number(data.payload.y).toFixed(2)}%</span></p>
      </div>
    );
  }

  return null;
};

const PdpGalleryCard = ({ plot }) => {
  if (!plot) return <div className="pdp-empty-state">No PDP chart available.</div>;

  return (
    <div className="pdp-gallery-card">
      <div className="pdp-chart-left">
        <div className="pdp-chart-title-row">
          <div>
            <h3>{plot.feature}</h3>
            <p className="subtitle">Predicted risk response curve</p>
          </div>

          <span className={`status-pill ${getStatusClass(plot.status)}`}>
            {plot.status || 'Unknown'}
          </span>
        </div>

        <div className="pdp-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart margin={{ top: 18, right: 24, bottom: 18, left: 80 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />

              <YAxis
                dataKey="y"
                type="number"
                domain={['dataMin', 'dataMax']}
                width={90}
                tickFormatter={(val) => Number(val).toFixed(2)}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomPdpTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              <Line
                type="monotone"
                dataKey="y"
                data={plot.curve || []}
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                name="Average Risk"
                isAnimationActive={false}
              />

              <Scatter
                data={plot.hospital_point ? [plot.hospital_point] : []}
                fill="#b91c1c"
                shape="circle"
                r={7}
                z={10}
                name="Current Hospital"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pdp-insight-right">
        <div className="pdp-insight-header">
          <h3>Action Insight</h3>
          <p>Current value compared with recommended operating point.</p>
        </div>

        <div className="pdp-insight-metrics">
          <div className="insight-metric">
            <span>Current</span>
            <strong>{plot.current_value}</strong>
          </div>

          <div className="insight-arrow">→</div>

          <div className="insight-metric">
            <span>Optimal</span>
            <strong className="target">{plot.optimal_value}</strong>
          </div>
        </div>

        <div className="pdp-suggestion-box">
          <span>Recommendation</span>
          <p>{plot.suggestion || 'No suggestion available.'}</p>
        </div>
      </div>
    </div>
  );
};

const HospitalDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hospitalName =
    location.state?.hospitalName || localStorage.getItem('selectedHospitalName');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('feature');
  const [activePdpIndex, setActivePdpIndex] = useState(0);

  const [waterfallView, setWaterfallView] = useState('chart');
  const [waterfallExplanation, setWaterfallExplanation] = useState('');
  const [waterfallExplanationLoading, setWaterfallExplanationLoading] = useState(false);
  const [waterfallExplanationError, setWaterfallExplanationError] = useState('');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!hospitalName) {
      navigate('/');
      return;
    }

    localStorage.setItem('selectedHospitalName', hospitalName);

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post('/individual-hospital', {
          hospital_name: hospitalName
        });
        setData(response.data);
      } catch (err) {
        const backendMessage = err?.response?.data?.detail;
        const status = err?.response?.status;
        setError(backendMessage || `Could not load hospital details${status ? ` (HTTP ${status})` : ''}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [hospitalName, navigate]);

  useEffect(() => {
    setActivePdpIndex(0);
  }, [data]);

  const handleWaterfallViewChange = async (view) => {
    setWaterfallView(view);

    if (view !== 'explainability' || waterfallExplanation || waterfallExplanationLoading || !data) return;

    setWaterfallExplanationLoading(true);
    setWaterfallExplanationError('');

    try {
      const response = await api.post('/llm/waterfall-explanation', {
        hospital: data.hospital,
        waterfall: data.waterfall
      });

      setWaterfallExplanation(response.data?.explanation || 'No explanation generated.');
    } catch (err) {
      setWaterfallExplanationError('Unable to generate feature contribution explanation.');
    } finally {
      setWaterfallExplanationLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const goPrevPdp = () => {
    setActivePdpIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNextPdp = (total) => {
    setActivePdpIndex((prev) => Math.min(prev + 1, total - 1));
  };

  if (loading) {
    return (
      <div className="hospital-details-page">
        <Header onLogout={handleLogout} />
        <div className="details-state">Loading Hospital Intelligence...</div>
        <footer className="hospital-details-footer">© {currentYear} Tata Consultancy Services. All rights reserved.</footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hospital-details-page">
        <Header onLogout={handleLogout} />
        <div className="details-state error-state">{error}</div>
        <footer className="hospital-details-footer">© {currentYear} Tata Consultancy Services. All rights reserved.</footer>
      </div>
    );
  }

  if (!data) return null;

  const hospital = data.hospital || {};
  const waterfall = data.waterfall || { features: [] };
  const treeVote = data.tree_vote || { risk_percent: 0, yes_votes: 0, no_votes: 0 };
  const pdpPlots = Array.isArray(data.pdp_plots) ? data.pdp_plots : [];
  const activePdp = pdpPlots[activePdpIndex];

  const getTierClass = (tier) => {
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
        return 'badge-unknown';
    }
  };

  return (
    <div className="hospital-details-page">
      <Header onLogout={handleLogout} />

      <main className="details-main">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="summary-card">
            <div className="summary-info">
              <h1 className="hospital-name">{hospital.hospital_name || hospitalName}</h1>

              <div className="meta-tags">
                {hospital.specialty && (
                  <div className="tag">
                    <Stethoscope size={14} />
                    {hospital.specialty}
                  </div>
                )}

                {hospital.location && (
                  <div className="tag">
                    <MapPin size={14} />
                    {hospital.location}
                  </div>
                )}
              </div>
            </div>

            <div className="metrics-row">
              <div className="metric-box">
                <span className="metric-label">Risk Score</span>
                <span className="metric-value">{Number(hospital.risk_score || 0).toFixed(1)}</span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Risk Tier</span>
                <span className={`badge ${getTierClass(hospital.risk_tier)}`}>
                  {hospital.risk_tier || 'Unknown'}
                </span>
              </div>

              {hospital.trend_indicator !== null && hospital.trend_indicator !== undefined && (
                <div className="metric-box">
                  <span className="metric-label">Trend (30d)</span>
                  <div className={`trend-pill ${hospital.trend_indicator < 0 ? 'trend-good' : 'trend-bad'}`}>
                    {hospital.trend_indicator < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    {Math.abs(hospital.trend_indicator)} pts
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="details-tabs">
          <button className={activeTab === 'feature' ? 'active' : ''} onClick={() => setActiveTab('feature')}>
            <ChartIcon />
            Feature Contribution
          </button>

          <button className={activeTab === 'consensus' ? 'active' : ''} onClick={() => setActiveTab('consensus')}>
            <ConsensusIcon />
            Model Consensus
          </button>

          <button className={activeTab === 'pdp' ? 'active' : ''} onClick={() => setActiveTab('pdp')}>
            <GalleryIcon />
            PDP Gallery
          </button>
        </div>

        <section className="tab-content-area">
          {activeTab === 'feature' && (
            <div className="card tab-card">
              <div className="card-header card-header-with-toggle">
                <div>
                  <h3>Feature Contribution</h3>
                  <p className="subtitle">Top factors increasing or decreasing risk score</p>
                </div>

                <div className="chart-toggle">
                  <button className={waterfallView === 'chart' ? 'active' : ''} onClick={() => handleWaterfallViewChange('chart')}>
                    Chart
                  </button>
                  <button className={waterfallView === 'explainability' ? 'active' : ''} onClick={() => handleWaterfallViewChange('explainability')}>
                    Explainability
                  </button>
                </div>
              </div>

              {waterfallView === 'chart' ? (
                <div className="waterfall-container">
                  {(waterfall.features || []).map((feat, idx) => (
                    <div key={idx} className="waterfall-row">
                      <div className="feature-label">{feat.feature}</div>

                      <div className="bar-area">
                        {feat.direction === 'decrease' && (
                          <div className="bar-bar decrease" style={{ width: `${Math.min(Math.abs(Number(feat.shap_value || 0)) * 100, 100)}%` }}></div>
                        )}

                        <div className="center-line"></div>

                        {feat.direction === 'increase' && (
                          <div className="bar-bar increase" style={{ width: `${Math.min(Math.abs(Number(feat.shap_value || 0)) * 100, 100)}%` }}></div>
                        )}
                      </div>

                      <div className="value-label">{Number(feat.shap_value || 0).toFixed(3)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="waterfall-explanation-panel">
                  {waterfallExplanationLoading ? (
                    <div className="inline-loading">
                      <RefreshIcon size={24} className="spin" color="#d71500" />
                      <span>Generating explanation...</span>
                    </div>
                  ) : waterfallExplanationError ? (
                    <div className="inline-error">{waterfallExplanationError}</div>
                  ) : (
                    renderParagraphs(waterfallExplanation)
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="card tab-card consensus-card">
              <div className="card-header">
                <h3>Model Consensus</h3>
                <p className="subtitle">Risk signal breakdown from the random forest model</p>
              </div>

              <div className="vote-visual">
                <div className="vote-percent">
                  {Number(treeVote.risk_percent || 0)}%
                  <span className="vote-sub">Risky</span>
                </div>

                <div className="vote-bar-container">
                  <div className="vote-segment risky" style={{ width: `${Number(treeVote.risk_percent || 0)}%` }}></div>
                  <div className="vote-segment safe" style={{ width: `${100 - Number(treeVote.risk_percent || 0)}%` }}></div>
                </div>

                <div className="vote-stats">
                  <div className="stat-item">
                    <span className="count">{Number(treeVote.yes_votes || 0)}</span>
                    <span className="label">Warning Indicators<p>High Risk Signals</p></span>
                  </div>

                  <div className="stat-item">
                    <span className="count">{Number(treeVote.no_votes || 0)}</span>
                    <span className="label">Confidence in Stability<p>Low Risk Signals</p></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdp' && (
            <div className="card tab-card pdp-tab-card">
              <div className="card-header pdp-gallery-top">
                <div>
                  <h3>PDP Gallery</h3>
                  <p className="subtitle">Scroll through feature action curves one chart at a time</p>
                </div>

                <div className="gallery-counter">
                  {pdpPlots.length === 0 ? 0 : activePdpIndex + 1} of {pdpPlots.length}
                </div>
              </div>

              {pdpPlots.length === 0 ? (
                <div className="pdp-empty-state">No feature analysis data available.</div>
              ) : (
                <div className="pdp-gallery-layout">
                  <button
                    className="gallery-side-arrow"
                    onClick={goPrevPdp}
                    disabled={activePdpIndex === 0}
                    aria-label="Previous PDP chart"
                  >
                    <ChevronLeft />
                  </button>

                  <div className="pdp-fade-shell" key={activePdpIndex}>
                    <PdpGalleryCard plot={activePdp} />
                  </div>

                  <button
                    className="gallery-side-arrow"
                    onClick={() => goNextPdp(pdpPlots.length)}
                    disabled={activePdpIndex === pdpPlots.length - 1}
                    aria-label="Next PDP chart"
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="hospital-details-footer">
        © {currentYear} Tata Consultancy Services. All rights reserved.
      </footer>
    </div>
  );
};

export default HospitalDetails;