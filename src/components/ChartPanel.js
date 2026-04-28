import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Bar,
  Line,
  ComposedChart
} from 'recharts';
import './ChartPanel.css';

function ChartPanel({ chartData }) {
  const [activeChart, setActiveChart] = useState('bubble');

  const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#d46b08',
    High: '#b91c1c',
    Critical: '#5c0011'
  };

  const SPECIALTY_COLORS = [
    '#5C0011',
    '#8B0000',
    '#B91C1C',
    '#D71500',
    '#F97316',
    '#FB8C00',
    '#F59E0B',
    '#FACC15',
    '#E6E8EB',
    '#9CA3AF'
  ];

  const DONUT_CONFIG = {
    height: 330,
    cx: '38%',
    cy: '50%',
    innerRadius: 62,
    outerRadius: 90,
    margin: { top: 10, right: 20, bottom: 10, left: 20 }
  };

  const getDonutColor = (name) => {
    if (name === 'Low Risk') return '#22c55e';
    if (name === 'Medium Risk') return '#d46b08';
    if (name === 'High Risk') return '#b91c1c';
    if (name === 'Critical') return '#5c0011';

    if (name === 'Risky Hospitals') return '#d71500';
    if (name === 'Safe Hospitals') return '#E6E8EB';

    return '#d71500';
  };

  const formatNumber = (value) => {
    const num = Number(value || 0);

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatCurrency = (value) => `$${formatNumber(value)}`;

  const buildPieData = (donutPayload) => {
    return (donutPayload?.labels || [])
      .map((label, i) => ({
        name: label,
        value: Number(donutPayload.values?.[i] || 0)
      }))
      .filter((item) => item.value > 0);
  };

  const BubbleTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="chart-panel-tooltip">
          <p className="tooltip-title">{data.label}</p>
          <p>DSO: <strong>{data.x}</strong></p>
          <p>Credit Used: <strong>{formatCurrency(data.y)}</strong></p>
          <p>Tier: <strong>{data.risk_tier || 'Unknown'}</strong></p>
          <p className="tooltip-muted">Bubble size = total payments</p>
        </div>
      );
    }

    return null;
  };

  const TierComparisonTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;

      return (
        <div className="chart-panel-tooltip">
          <p className="tooltip-title">{label}</p>
          <p>Total Exposure: <strong>{formatCurrency(row.total_exposure_raw)}</strong></p>
          <p>Hospitals: <strong>{formatNumber(row.hospital_count)}</strong></p>
          <p>Average Risk Score: <strong>{Number(row.avg_risk_score || 0).toFixed(1)}</strong></p>
          <p className="tooltip-muted">Bars are normalized for visual comparison.</p>
        </div>
      );
    }

    return null;
  };

  const renderChart = () => {
    if (!chartData) return <div className="no-data">No data available</div>;

    /* ---------------- BUBBLE ---------------- */
    if (activeChart === 'bubble') {
      const coloredBubbleData = (chartData.bubble || []).map((item) => ({
        ...item,
        fill:
          item.risk === 1
            ? RISK_COLORS[item.risk_tier] || '#d71500'
            : '#22c55e'
      }));

      if (!coloredBubbleData.length) {
        return <div className="no-data">No data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EB" />

            <XAxis
              dataKey="x"
              name="DSO 30d"
              type="number"
              label={{ value: 'DSO 30d', position: 'insideBottom', offset: -5 }}
            />

            <YAxis
              dataKey="y"
              name="Credit Used"
              type="number"
              tickFormatter={(value) => formatNumber(value)}
              label={{ value: 'Credit Used', angle: -90, position: 'insideLeft' }}
            />

            <ZAxis dataKey="size" range={[50, 400]} name="Total Payments" />

            <Tooltip content={<BubbleTooltip />} />

            <Scatter data={coloredBubbleData}>
              {coloredBubbleData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    /* ---------------- RISK DONUT ---------------- */
    if (activeChart === 'donut') {
      const data = buildPieData(chartData.donut);

      if (!data.length) {
        return <div className="no-data">No data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={DONUT_CONFIG.height}>
          <PieChart margin={DONUT_CONFIG.margin}>
            <Pie
              data={data}
              cx={DONUT_CONFIG.cx}
              cy={DONUT_CONFIG.cy}
              innerRadius={DONUT_CONFIG.innerRadius}
              outerRadius={DONUT_CONFIG.outerRadius}
              paddingAngle={3}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getDonutColor(entry.name)} />
              ))}
            </Pie>

            <Tooltip formatter={(value, name) => [`${value}`, name]} />

            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              formatter={(value, entry, index) => {
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const current = data[index]?.value || 0;
                const pct = total ? ((current / total) * 100).toFixed(0) : 0;
                return `${value} (${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    /* ---------------- SPECIALTY DONUT ---------------- */
    if (activeChart === 'specialty') {
      const data = buildPieData(chartData.specialty_donut);

      if (!data.length) {
        return <div className="no-data">No specialty data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={DONUT_CONFIG.height}>
          <PieChart margin={DONUT_CONFIG.margin}>
            <Pie
              data={data}
              cx={DONUT_CONFIG.cx}
              cy={DONUT_CONFIG.cy}
              innerRadius={DONUT_CONFIG.innerRadius}
              outerRadius={DONUT_CONFIG.outerRadius}
              paddingAngle={3}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`specialty-cell-${index}`}
                  fill={SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip formatter={(value, name) => [`${value} hospitals`, name]} />

            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              formatter={(value, entry, index) => {
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const current = data[index]?.value || 0;
                const pct = total ? ((current / total) * 100).toFixed(0) : 0;
                return `${value} (${current}, ${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    /* ---------------- RISK TIER COMPARISON ---------------- */
    if (activeChart === 'line') {
      const rawData = chartData.line || [];

      if (!rawData.length) {
        return <div className="no-data">No data available</div>;
      }

      const maxExposure = Math.max(
        ...rawData.map((d) => Number(d.total_exposure_raw || 0)),
        1
      );

      const maxHospitalCount = Math.max(
        ...rawData.map((d) => Number(d.hospital_count || 0)),
        1
      );

      const composedData = rawData.map((item) => ({
        tier: item.tier,
        exposureBar: (Number(item.total_exposure_raw || 0) / maxExposure) * 100,
        hospitalBar: (Number(item.hospital_count || 0) / maxHospitalCount) * 100,
        total_exposure_raw: Number(item.total_exposure_raw || 0),
        hospital_count: Number(item.hospital_count || 0),
        avg_risk_score: Number(item.avg_risk_score || 0)
      }));

      return (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart
            data={composedData}
            margin={{ top: 34, right: 30, bottom: 24, left: 20 }}
            barGap={10}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EB" />
            <XAxis dataKey="tier" />
            <YAxis yAxisId="left" domain={[0, 115]} tickFormatter={(v) => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip content={<TierComparisonTooltip />} />
            <Legend />

            <Bar
              yAxisId="left"
              dataKey="exposureBar"
              name="Exposure Scale"
              fill="#5C0011"
              radius={[7, 7, 0, 0]}
            />

            <Bar
              yAxisId="left"
              dataKey="hospitalBar"
              name="Hospital Count Scale"
              fill="#D71500"
              radius={[7, 7, 0, 0]}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_risk_score"
              name="Avg Risk Score"
              stroke="#F28B82"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h3>Risk Analysis Overview</h3>

        <div className="chart-toggles">
          <button
            type="button"
            className={activeChart === 'bubble' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('bubble')}
          >
            Payment & Credit Risk
          </button>

          <button
            type="button"
            className={activeChart === 'donut' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('donut')}
          >
            Risk Breakdown
          </button>

          <button
            type="button"
            className={activeChart === 'specialty' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('specialty')}
          >
            Specialty Breakdown
          </button>

          <button
            type="button"
            className={activeChart === 'line' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('line')}
          >
            Risk Tier Comparison
          </button>
        </div>
      </div>

      <div key={activeChart} className="chart-area chart-fade">
        {renderChart()}
      </div>
    </div>
  );
}

export default ChartPanel;