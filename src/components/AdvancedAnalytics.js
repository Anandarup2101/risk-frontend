import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import './AdvancedAnalytics.css';
import api from '../api';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

/* ---------------- ICONS ---------------- */

const MapIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 18 23 6"></polygon>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const ScatterIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="4"></circle>
  </svg>
);

const XIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
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
  >
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
  </svg>
);

/* ---------------- COLORS ---------------- */

const CLUSTER_COLORS =  [ '#D71500','#FACC15', '#F97316', '#5C0011', '#9CA3AF'];

const getClusterColor = (id = 0) =>
  CLUSTER_COLORS[Math.abs(Number(id || 0)) % CLUSTER_COLORS.length];

const getRiskColor = (risk) => {
  const value = Number(risk || 0);
  if (value >= 75) return '#5C0011';
  if (value >= 50) return '#d71500';
  if (value >= 25) return '#d46b08';
  return '#22c55e';
};

/* ---------------- HELPERS ---------------- */

const sanitizeGeoPoints = (points = []) =>
  points
    .map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      risk_percent: Number(p.risk_percent ?? 0)
    }))
    .filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        Number.isFinite(p.risk_percent)
    );

const getMapBounds = (points) => {
  if (!points.length) {
    return {
      center: [51.0, 10.5],
      bounds: [
        [47.0, 5.5],
        [55.0, 15.5]
      ]
    };
  }

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latPad = Math.max((maxLat - minLat) * 0.08, 0.3);
  const lonPad = Math.max((maxLon - minLon) * 0.08, 0.3);

  return {
    center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
    bounds: [
      [minLat - latPad, minLon - lonPad],
      [maxLat + latPad, maxLon + lonPad]
    ]
  };
};

const buildGeoPayload = (filters) => {
  const payload = {
    location: {
      min_lat: Number(filters?.location?.min_lat ?? 47),
      max_lat: Number(filters?.location?.max_lat ?? 55),
      min_lon: Number(filters?.location?.min_lon ?? 5.5),
      max_lon: Number(filters?.location?.max_lon ?? 15.5)
    },
    exposure_range: {
      min: Number(filters?.exposure_range?.min ?? 100000),
      max: Number(filters?.exposure_range?.max ?? 1000000)
    }
  };

  if (filters?.specialty?.length) payload.specialty = filters.specialty;
  if (filters?.risk_tier?.length) payload.risk_tier = filters.risk_tier;

  return payload;
};

const buildClusterPayload = (filters) => {
  const payload = {
    filters: {
      location: {
        min_lat: Number(filters?.location?.min_lat ?? 47),
        max_lat: Number(filters?.location?.max_lat ?? 55),
        min_lon: Number(filters?.location?.min_lon ?? 5.5),
        max_lon: Number(filters?.location?.max_lon ?? 15.5)
      },
      exposure_range: {
        min: Number(filters?.exposure_range?.min ?? 100000),
        max: Number(filters?.exposure_range?.max ?? 1000000)
      }
    },
    n_clusters: 3
  };

  if (filters?.specialty?.length) payload.filters.specialty = filters.specialty;
  if (filters?.risk_tier?.length) payload.filters.risk_tier = filters.risk_tier;

  return payload;
};

/* ---------------- GEO MAP ---------------- */

const GeoHeatmapChart = ({ data }) => {
  const points = useMemo(() => sanitizeGeoPoints(data?.points || []), [data]);
  const { center, bounds } = useMemo(() => getMapBounds(points), [points]);

  if (!points.length) {
    return <div className="analytics-empty-state">No valid geographic data available</div>;
  }

  return (
    <div className="analytics-chart-card">
      <div className="analytics-chart-title">Geographic Risk Intensity</div>
      <div className="analytics-chart-subtitle">
        Hospital locations colored by risk intensity
      </div>

      <div className="analytics-map-body">
        <MapContainer
          center={center}
          bounds={bounds}
          boundsOptions={{ padding: [20, 20] }}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map((p, i) => (
            <CircleMarker
              key={`geo-point-${i}`}
              center={[p.latitude, p.longitude]}
              radius={8}
              pathOptions={{
                fillColor: getRiskColor(p.risk_percent),
                fillOpacity: 0.88,
                color: '#ffffff',
                weight: 1.5
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -8]} opacity={1}>
                <div style={{ minWidth: 200, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {p.hospital_name || 'Unknown'}
                  </div>
                  <div>Risk: <strong>{p.risk_percent.toFixed(1)}%</strong></div>
                  <div>Tier: {p.risk_tier || 'N/A'}</div>
                  <div>Specialty: {p.specialty || 'N/A'}</div>
                  <div>Exposure: ${Number(p.ar_exposure || 0).toLocaleString()}</div>
                  <div>DSO 30d: {p.dso_30d || 0}</div>
                </div>
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

/* ---------------- CLUSTER SCATTER ---------------- */

const ZoneBadge = ({ className = '', style = {}, title, meaning }) => (
  <div className={`analytics-zone-badge ${className}`} style={style}>
    {title}
    <div className="analytics-zone-tooltip">{meaning}</div>
  </div>
);

const ClusterScatterChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || !data.clusters) return [];

    const allPoints = [];

    data.clusters.forEach((cluster) => {
      (cluster.points || []).forEach((point) => {
        allPoints.push({
          ...point,
          cluster: Number(point.cluster ?? cluster.cluster_id ?? 0),
          clusterColor: getClusterColor(cluster.cluster_id)
        });
      });
    });

    return allPoints;
  }, [data]);

  if (!chartData.length) {
    return <div className="analytics-empty-state">No cluster data available</div>;
  }

  return (
    <div className="analytics-chart-card analytics-cluster-chart-card">
      <div className="analytics-chart-title">Clustered Risk Exposure</div>
      <div className="analytics-chart-subtitle">
        Payment delay vs credit usage with risk intensity and clustering
      </div>

      <div className="analytics-cluster-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 40, right: 30, bottom: 40, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="x"
              type="number"
              name="DSO 30D"
              label={{
                value: 'Payment Delay (DSO - 30 Days)',
                position: 'bottom',
                offset: 10,
                style: { fontSize: 12, fill: '#475467', fontWeight: 600 }
              }}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />

            <YAxis
              dataKey="y"
              type="number"
              name="Credit Used"
              label={{
                value: 'Credit Utilization',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#475467', fontWeight: 600 }
              }}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />

            <ZAxis dataKey="risk_percent" range={[60, 400]} name="Risk %" />

            <RechartsTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;

                  return (
                    <div className="analytics-custom-tooltip">
                      <div className="analytics-tooltip-header">
                        {p.hospital_name || 'Unknown Hospital'}
                      </div>

                      <div className="analytics-tooltip-row">
                        Cluster:{' '}
                        <span style={{ color: p.clusterColor, fontWeight: 700 }}>
                          #{Number(p.cluster || 0) + 1}
                        </span>
                      </div>

                      <div className="analytics-tooltip-row">
                        Risk:{' '}
                        <strong>{Number(p.risk_percent || 0).toFixed(1)}%</strong>
                      </div>

                      <div className="analytics-tooltip-meta">
                        DSO: {p.x} | Credit: {p.y}
                      </div>
                    </div>
                  );
                }

                return null;
              }}
            />

            <Scatter data={chartData} shape="circle">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.clusterColor}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <ZoneBadge
        title="Stable Zone"
        meaning="Low payment delay and controlled credit usage. These hospitals are financially stable."
        className="stable-zone tooltip-bottom-right"
        style={{ position: 'absolute', top: 70, left: 60 }}
      />

      <ZoneBadge
        title="High Risk Zone"
        meaning="High payment delay and high credit usage. These hospitals need immediate attention."
        className="danger high-risk-zone tooltip-bottom-left"
        style={{ position: 'absolute', top: 70, right: 40 }}
      />

      <ZoneBadge
        title="Low Credit / Low Risk"
        meaning="Low credit usage and low payment delay. Exposure risk is currently limited."
        className="low-credit-zone tooltip-top-right"
        style={{ position: 'absolute', bottom: 52, left: 60 }}
      />

      <ZoneBadge
        title="Watchlist"
        meaning="Delay or exposure signals are emerging. Monitor these hospitals closely."
        className="warning watchlist-zone tooltip-top-left"
        style={{ position: 'absolute', bottom: 52, right: 40 }}
      />
    </div>
  );
};

/* ---------------- MAIN ---------------- */

const AdvancedAnalytics = ({ filters }) => {
  const [geoState, setGeoState] = useState({
    isOpen: false,
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  const [clusterState, setClusterState] = useState({
    isOpen: false,
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  useEffect(() => {
    setGeoState((prev) => ({
      ...prev,
      data: null,
      error: null,
      lastFetched: null
    }));

    setClusterState((prev) => ({
      ...prev,
      data: null,
      error: null,
      lastFetched: null
    }));
  }, [filters]);

  const fetchGeoData = useCallback(async () => {
    setGeoState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.post('/charts/geo-heatmap', buildGeoPayload(filters));

      setGeoState((prev) => ({
        ...prev,
        data: response.data,
        loading: false,
        error: null,
        lastFetched: new Date()
      }));
    } catch (err) {
      setGeoState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to load geo map'
      }));
    }
  }, [filters]);

  const fetchClusterData = useCallback(async () => {
    setClusterState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.post('/charts/cluster-scatter', buildClusterPayload(filters));

      setClusterState((prev) => ({
        ...prev,
        data: response.data,
        loading: false,
        error: null,
        lastFetched: new Date()
      }));
    } catch (err) {
      setClusterState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to load cluster chart'
      }));
    }
  }, [filters]);

  const handleGeoClick = async () => {
    setGeoState((prev) => ({ ...prev, isOpen: true }));

    if (geoState.data && geoState.lastFetched) return;

    await fetchGeoData();
  };

  const handleClusterClick = async () => {
    setClusterState((prev) => ({ ...prev, isOpen: true }));

    if (clusterState.data && clusterState.lastFetched) return;

    await fetchClusterData();
  };

  return (
    <div className="advanced-analytics">
      <div className="analytics-buttons">
        <button onClick={handleGeoClick} className="analytics-btn" type="button">
          <div className="analytics-icon-wrap">
            <MapIcon size={16} />
          </div>
          <span>Geo Risk Map</span>
        </button>

        <button onClick={handleClusterClick} className="analytics-btn" type="button">
          <div className="analytics-icon-wrap">
            <ScatterIcon size={16} />
          </div>
          <span>Hospital Clusters</span>
        </button>
      </div>

      {geoState.isOpen && (
        <div
          className="analytics-modal-backdrop"
          onClick={() => setGeoState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h3>{geoState.data?.title || 'Geographic Risk Heatmap'}</h3>

              <div className="analytics-modal-controls">
                <button onClick={fetchGeoData} disabled={geoState.loading} className="analytics-btn-icon" type="button">
                  <RefreshIcon size={14} className={geoState.loading ? 'analytics-spin' : ''} />
                  Refresh
                </button>

                <button
                  onClick={() => setGeoState((prev) => ({ ...prev, isOpen: false }))}
                  className="analytics-btn-close"
                  type="button"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>

            <div className="analytics-modal-body">
              {geoState.loading ? (
                <div className="analytics-loading-container">
                  <RefreshIcon size={32} className="analytics-spin" color="#D71500" />
                </div>
              ) : geoState.error ? (
                <div className="analytics-error-container">Error: {geoState.error}</div>
              ) : (
                <GeoHeatmapChart data={geoState.data} />
              )}
            </div>
          </div>
        </div>
      )}

      {clusterState.isOpen && (
        <div
          className="analytics-modal-backdrop"
          onClick={() => setClusterState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h3>{clusterState.data?.title || 'Hospital Cluster Analysis'}</h3>

              <div className="analytics-modal-controls">
                <button
                  onClick={fetchClusterData}
                  disabled={clusterState.loading}
                  className="analytics-btn-icon"
                  type="button"
                >
                  <RefreshIcon size={14} className={clusterState.loading ? 'analytics-spin' : ''} />
                  Refresh
                </button>

                <button
                  onClick={() => setClusterState((prev) => ({ ...prev, isOpen: false }))}
                  className="analytics-btn-close"
                  type="button"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>

            <div className="analytics-modal-body analytics-modal-body-cluster">
              {clusterState.loading ? (
                <div className="analytics-loading-container">
                  <RefreshIcon size={32} className="analytics-spin" color="#D71500" />
                </div>
              ) : clusterState.error ? (
                <div className="analytics-error-container">Error: {clusterState.error}</div>
              ) : (
                <ClusterScatterChart data={clusterState.data} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;