import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import './GlobalShapExplainer.css';
import api from '../api';

/* ---------------- INLINE ICONS ---------------- */

const ActivityIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const BarChartIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const RefreshIcon = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
  </svg>
);

const XIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

/* ---------------- HELPERS ---------------- */

const getShapColor = (shapValue) => {
  return Number(shapValue || 0) >= 0 ? '#d71500' : '#22c55e';
};

const renderParagraphs = (text) => {
  if (!text) return <p>No explanation available.</p>;

  return text
    .split('\n')
    .filter((para) => para.trim() !== '')
    .map((para, index) => <p key={index}>{para}</p>);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="shap-custom-tooltip">
        <p className="shap-tooltip-heading">{data.feature}</p>
        <p>SHAP Value: <strong>{Number(data.shapValue || 0).toFixed(4)}</strong></p>
        <p>Feature Value: <strong>{Number(data.featureValue || 0).toFixed(4)}</strong></p>
      </div>
    );
  }

  return null;
};

/* ---------------- CHARTS ---------------- */

const ShapBeeswarmChart = ({ data }) => {
  const { chartData, features, ticks } = useMemo(() => {
    if (!data || !data.points) {
      return { chartData: [], features: [], ticks: [] };
    }

    const uniqueFeatures = [...new Set(data.points.map((p) => p.feature))];

    const featureIndexMap = {};
    uniqueFeatures.forEach((feature, index) => {
      featureIndexMap[feature] = index;
    });

    const processed = data.points.map((p) => ({
      x: p.shap_value,
      y: featureIndexMap[p.feature] + (Math.random() - 0.5) * 0.8,
      feature: p.feature,
      shapValue: p.shap_value,
      featureValue: p.feature_value,
      color: getShapColor(p.shap_value)
    }));

    const axisTicks = uniqueFeatures.map((feature, index) => ({
      value: index,
      label: feature
    }));

    return {
      chartData: processed,
      features: uniqueFeatures,
      ticks: axisTicks
    };
  }, [data]);

  const CustomPoint = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={payload.color}
        stroke="#ffffff"
        strokeWidth={1}
        opacity={0.85}
      />
    );
  };

  if (!chartData.length) {
    return <div className="shap-empty-state">No beeswarm data available</div>;
  }

  return (
    <div className="shap-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="x"
            name="SHAP Value"
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Feature"
            domain={[-1, features.length]}
            ticks={ticks.map((tick) => tick.value)}
            tickFormatter={(value) =>
              ticks.find((tick) => tick.value === Math.round(value))?.label || ''
            }
            tick={{ fontSize: 11 }}
            width={90}
            stroke="#94a3b8"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={chartData} shape={CustomPoint} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

const ShapBarChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
  }, [data]);

  if (!chartData.length) {
    return <div className="shap-empty-state">No bar data available</div>;
  }

  return (
    <div className="shap-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={100} stroke="#94a3b8" />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#d71500" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ---------------- SECTION ---------------- */

const ShapSection = ({
  title,
  subtitle,
  activeView,
  setActiveView,
  chart,
  explanation
}) => {
  return (
    <div className="shap-plot-card">
      <div className="shap-plot-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <div className="shap-chart-toggle">
          <button
            className={activeView === 'chart' ? 'active' : ''}
            onClick={() => setActiveView('chart')}
            type="button"
          >
            Chart
          </button>

          <button
            className={activeView === 'explainability' ? 'active' : ''}
            onClick={() => setActiveView('explainability')}
            type="button"
          >
            Explainability
          </button>
        </div>
      </div>

      <div className="shap-plot-body">
        {activeView === 'chart' ? (
          chart
        ) : (
          <div className="shap-explainability-panel">
            {renderParagraphs(explanation)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

const GlobalShapExplainer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activePlot, setActivePlot] = useState('bar');
  const [summaryView, setSummaryView] = useState('chart');
  const [barView, setBarView] = useState('chart');

  const fetchData = async (forceRefresh = false) => {
    if (data && !forceRefresh) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/global-shap');

      if (!response.data || (!response.data.shap_summary && !response.data.shap_bar)) {
        throw new Error('Invalid response structure');
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching SHAP data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load explainability data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchData();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRefresh = () => {
    setData(null);
    setActivePlot('bar');
    setSummaryView('chart');
    setBarView('chart');
    fetchData(true);
  };

  return (
    <>
      <button onClick={handleOpen} className="shap-action-button" type="button">
        <div className="shap-icon-wrapper">
          <ActivityIcon size={18} />
        </div>
        <span>Global SHAP</span>
      </button>

      {isOpen && (
        <div className="shap-modal-backdrop" onClick={handleClose}>
          <div className="shap-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="shap-modal-header">
              <div className="shap-modal-title-group">
                <BarChartIcon size={20} color="#334155" />
                <h2>Global SHAP Explainability</h2>
              </div>

              <div className="shap-modal-controls">
                <button onClick={handleRefresh} disabled={loading} className="shap-btn-icon" type="button">
                  <RefreshIcon size={14} className={loading ? 'shap-spin' : ''} />
                  Refresh
                </button>

                <button onClick={handleClose} className="shap-btn-close" type="button">
                  <XIcon size={20} />
                </button>
              </div>
            </div>

            <div className="shap-modal-body">
              {loading && (
                <div className="shap-loading-container">
                  <RefreshIcon size={32} className="shap-spin" color="#d71500" />
                  <span className="shap-loading-text">Analyzing model features...</span>
                </div>
              )}

              {error && (
                <div className="shap-error-container">
                  <strong>Error:</strong> {error}
                  <br />
                  <button onClick={() => fetchData(true)} className="shap-retry-btn" type="button">
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && data && (
                <>
                  <div className="shap-plot-toggle-row">
                    <button
                      className={activePlot === 'bar' ? 'active' : ''}
                      onClick={() => setActivePlot('bar')}
                      type="button"
                    >
                      Bar Plot
                    </button>

                    <button
                      className={activePlot === 'beeswarm' ? 'active' : ''}
                      onClick={() => setActivePlot('beeswarm')}
                      type="button"
                    >
                      Beeswarm Plot
                    </button>
                  </div>

                  <div className="shap-sections-stack">
                    {activePlot === 'bar' && (
                      <ShapSection
                        title="SHAP Bar Plot"
                        subtitle="Ranks the strongest overall drivers influencing the hospital risk model."
                        activeView={barView}
                        setActiveView={setBarView}
                        chart={<ShapBarChart data={data.shap_bar} />}
                        explanation={data.bar_explanation}
                      />
                    )}

                    {activePlot === 'beeswarm' && (
                      <ShapSection
                        title="SHAP Beeswarm Plot"
                        subtitle="Shows how feature values push hospital risk higher or lower across the current dataset."
                        activeView={summaryView}
                        setActiveView={setSummaryView}
                        chart={<ShapBeeswarmChart data={data.shap_summary} />}
                        explanation={data.summary_explanation}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalShapExplainer;