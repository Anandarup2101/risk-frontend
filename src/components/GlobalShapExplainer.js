import React, { useState, useMemo } from 'react';
// import axios from 'axios';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import './GlobalShapExplainer.css';
import api from '../api'; 


// ---------------- INLINE ICONS ----------------

const ActivityIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const BarChartIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const RefreshIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
  </svg>
);

const XIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// ---------------- CHART HELPERS ----------------

// Color Logic: Red (Pos SHAP/Risk Increase) vs Green/Teal (Neg SHAP/Risk Decrease)
const getShapColor = (shapValue) => {
  return shapValue >= 0 ? '#d71500' : '#22c55e';
};

// Clean JNJ-style Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontSize: '12px',
        color: '#1e293b'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4px', margin: 0 }}>{data.feature}</p>
        <p style={{ margin: '2px 0' }}>SHAP Value: <span style={{ fontWeight: '600' }}>{data.shapValue.toFixed(4)}</span></p>
        <p style={{ margin: '2px 0' }}>Feature Value: {data.featureValue.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

// ---------------- SUB-COMPONENTS ----------------

// 1. Beeswarm Chart (Red/Green)
const ShapBeeswarmChart = ({ data }) => {
  const { chartData, features, ticks } = useMemo(() => {
    if (!data || !data.points) return { chartData: [], features: [], ticks: [] };
    const uniqueFeatures = [...new Set(data.points.map(p => p.feature))];
    const featureIndexMap = {};
    uniqueFeatures.forEach((f, i) => featureIndexMap[f] = i);
    const processed = data.points.map((p) => ({
      x: p.shap_value,
      y: featureIndexMap[p.feature] + (Math.random() - 0.5) * 0.8,
      feature: p.feature,
      shapValue: p.shap_value,
      featureValue: p.feature_value,
      color: getShapColor(p.shap_value)
    }));
    const axisTicks = uniqueFeatures.map((f, i) => ({ value: i, label: f }));
    return { chartData: processed, features: uniqueFeatures, ticks: axisTicks };
  }, [data]);

  const CustomPoint = (props) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={5} fill={payload.color} stroke="#fff" strokeWidth={1} opacity={0.85} />;
  };

  if (!chartData.length) return <div className="empty-state">No Beeswarm Data</div>;

  return (
    <div className="chart-container">
      <div className="chart-title">Summary Plot (Feature Impact)</div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" dataKey="x" name="SHAP Value" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Feature" 
            domain={[-1, features.length]} 
            ticks={ticks.map(t => t.value)}
            tickFormatter={(value) => ticks.find(t => t.value === Math.round(value))?.label || ''}
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

// 2. Bar Chart (Red Bars)
const ShapBarChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
  }, [data]);

  if (!chartData.length) return <div className="empty-state">No Bar Data</div>;

  return (
    <div className="chart-container">
      <div className="chart-title">Feature Importance (Mean Absolute SHAP)</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          layout="vertical" 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={100} stroke="#94a3b8" />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#d71500" /> 
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------- MAIN COMPONENT ----------------

const GlobalShapExplainer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = async (forceRefresh = false) => {
    if (data && !forceRefresh && lastFetched) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/global-shap`);
      if (!response.data || (!response.data.shap_summary && !response.data.shap_bar)) {
        throw new Error("Invalid response structure");
      }
      setData(response.data);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Error fetching SHAP data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load explainability data.");
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
    fetchData(true);
  };

  return (
    <>
      {/* 1. TRIGGER BUTTON (JNJ Style) */}
      <button onClick={handleOpen} className="shap-action-button">
        <div className="shap-icon-wrapper">
          <ActivityIcon size={18} />
        </div>
        <span>Global SHAP</span>
      </button>

      {/* 2. MODAL (JNJ Style) */}
      {isOpen && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <BarChartIcon size={20} color="#334155" />
                <h2>Global SHAP Explainability</h2>
              </div>
              
              <div className="modal-controls">
                <button onClick={handleRefresh} disabled={loading} className="btn-icon">
                  <RefreshIcon size={14} className={loading ? 'spin' : ''} />
                  Refresh
                </button>
                <button onClick={handleClose} className="btn-close">
                  <XIcon size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">
              {loading && (
                <div className="loading-container">
                  <RefreshIcon size={32} className="spin" color="#3b82f6" />
                  <span className="loading-text">Analyzing model features...</span>
                </div>
              )}

              {error && (
                <div className="error-container">
                  <strong>Error:</strong> {error}
                  <br />
                  <button 
                    onClick={() => fetchData(true)} 
                    className="retry-btn"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && data && (
                <div className="charts-grid">
                  <div className="chart-section">
                    <ShapBeeswarmChart data={data.shap_summary} />
                  </div>
                  <div className="chart-section">
                    <ShapBarChart data={data.shap_bar} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalShapExplainer;