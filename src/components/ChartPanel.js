import React, { useState } from 'react';
import { LabelList } from 'recharts';
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
  BarChart,
  Bar
} from 'recharts';
import './ChartPanel.css';

function ChartPanel({ chartData }) {
  const [activeChart, setActiveChart] = useState('bubble');

  const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#d46b08',
    High: '#cf1322',
    Critical: '#5c0011'
  };

  // const SPECIALTY_COLORS = [
  //   '#D71500',
  //   '#5C0011',
  //   '#F28B82',
  //   '#D46B08',
  //   '#F59E0B',
  //   '#1A2E44',
  //   '#64748B',
  //   '#22C55E',
  //   '#0EA5E9',
  //   '#8B5CF6'
  // ];

  const SPECIALTY_COLORS = [
    '#5C0011', // deep maroon
    '#8B0000', // dark red
    '#B91C1C', // strong red
    '#D32F2F', // primary red
    '#F97316', // orange
    '#FB8C00', // amber orange
    '#F59E0B', // warm amber
    '#FACC15', // yellow
    '#E6E8EB', // light grey
    '#9CA3AF'  // medium grey
  ];

  const getDonutColor = (name) => {
    if (name === 'Low Risk') return '#22c55e';
    if (name === 'Medium Risk') return '#d46b08';
    if (name === 'High Risk') return '#cf1322';
    if (name === 'Critical') return '#5c0011';

    if (name === 'Risky Hospitals') return '#D71500';
    if (name === 'Safe Hospitals') return '#E6E8EB';

    return '#D71500';
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(value);
  };

  const buildPieData = (donutPayload) => {
    return (donutPayload?.labels || []).map((label, i) => ({
      name: label,
      value: Number(donutPayload.values?.[i] || 0)
    })).filter((item) => item.value > 0);
  };

  const renderChart = () => {
    if (!chartData) return <div className="no-data">No data available</div>;

    if (activeChart === 'bubble') {
      const coloredBubbleData = (chartData.bubble || []).map((item) => ({
        ...item,
        fill: item.risk === 1 ? (RISK_COLORS[item.risk_tier] || '#D71500') : '#22c55e'
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
              label={{ value: 'Credit Used', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis dataKey="size" range={[50, 400]} name="Total Payments" />

            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</p>
                      <p style={{ margin: 0 }}>DSO: {data.x}</p>
                      <p style={{ margin: 0 }}>Credit: {data.y}</p>
                      <p style={{ margin: 0 }}>Tier: {data.risk_tier || 'Unknown'}</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Scatter data={coloredBubbleData} shape="circle">
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

    if (activeChart === 'donut') {
      const data = buildPieData(chartData.donut);

      if (!data.length) {
        return <div className="no-data">No data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
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

    if (activeChart === 'specialty') {
      const data = buildPieData(chartData.specialty_donut);

      if (!data.length) {
        return <div className="no-data">No specialty data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={330}>
          <PieChart>
            <Pie
              data={data}
              cx="38%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
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

    if (activeChart === 'line') {
      const rawData = chartData.line || [];

      if (!rawData.length) {
        return <div className="no-data">No data available</div>;
      }

      const maxExposure = Math.max(...rawData.map((d) => Number(d.total_exposure_raw || 0)), 1);
      const maxHospitalCount = Math.max(...rawData.map((d) => Number(d.hospital_count || 0)), 1);
      const maxAvgRisk = Math.max(...rawData.map((d) => Number(d.avg_risk_score || 0)), 1);

      const barData = rawData.map((item) => ({
        tier: item.tier,
        exposureBar: (Number(item.total_exposure_raw || 0) / maxExposure) * 100,
        hospitalBar: (Number(item.hospital_count || 0) / maxHospitalCount) * 100,
        riskBar: (Number(item.avg_risk_score || 0) / maxAvgRisk) * 100,
        total_exposure_raw: Number(item.total_exposure_raw || 0),
        hospital_count: Number(item.hospital_count || 0),
        avg_risk_score: Number(item.avg_risk_score || 0)
      }));

      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} barGap={10}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EB" />

            <XAxis
              dataKey="tier"
              label={{ value: 'Risk Tier', position: 'insideBottom', offset: -5 }}
            />

            <YAxis
              domain={[0, 110]}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Relative Scale', angle: -90, position: 'insideLeft' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>{label}</p>
                      <p style={{ margin: 0 }}>Total Exposure: {formatCurrency(data.total_exposure_raw)}</p>
                      <p style={{ margin: 0 }}>Hospital Count: {data.hospital_count}</p>
                      <p style={{ margin: 0 }}>
                        Avg Risk Score: {data.avg_risk_score.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend />

            <Bar
              dataKey="exposureBar"
              name="Total Exposure"
              fill="#5C0011"
              radius={[6, 6, 0, 0]}
            >
              <LabelList
                position="top"
                content={(props) => {
                  const { x, y, width } = props;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#5c0011"
                      fontWeight={600}
                    >
                      Exposure
                    </text>
                  );
                }}
              />
            </Bar>

            <Bar
              dataKey="hospitalBar"
              name="Hospital Count"
              fill="#D32F2F"
              radius={[6, 6, 0, 0]}
            >
              <LabelList
                position="top"
                content={(props) => {
                  const { x, y, width } = props;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#991b1b"
                      fontWeight={600}
                    >
                      Hospitals
                    </text>
                  );
                }}
              />
            </Bar>

            <Bar
              dataKey="riskBar"
              name="Avg Risk Score"
              fill="#F28B82"
              radius={[6, 6, 0, 0]}
            >
              <LabelList
                position="top"
                content={(props) => {
                  const { x, y, width } = props;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#7f1d1d"
                      fontWeight={600}
                    >
                      Risk Score
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
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
            className={activeChart === 'bubble' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('bubble')}
          >
            Payment & Credit Risk
          </button>

          <button
            className={activeChart === 'donut' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('donut')}
          >
            Risk Breakdown
          </button>

          <button
            className={activeChart === 'specialty' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('specialty')}
          >
            Specialty Breakdown
          </button>

          <button
            className={activeChart === 'line' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setActiveChart('line')}
          >
            Risk Tier Comparison
          </button>
        </div>
      </div>

      <div className="chart-area">
        {renderChart()}
      </div>
    </div>
  );
}

export default ChartPanel;