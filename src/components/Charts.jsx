import { CHART_COLORS } from '../utils/constants.js';

// Dependency-free charts: plain CSS bars and SVG rings.

export function BarChart({ data, unit = '', height = 190 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bar-chart" style={{ height }} role="img" aria-label="Bar chart">
      {data.map((d) => (
        <div className="bar-col" key={d.label} title={`${d.label}: ${d.value}${unit ? ` ${unit}` : ''}`}>
          <span className="bar-value">{d.value || ''}</span>
          <div className="bar-track">
            <div className={`bar-fill ${d.value ? '' : 'is-empty'}`} style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Ring({ segments, size, thickness, children }) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--sand)" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            const length = (s.value / total) * circumference;
            const circle = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += length;
            return circle;
          })}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function DonutChart({ data, size = 180, thickness = 26, centerValue, centerLabel }) {
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((sum, d) => sum + d.count, 0);
  const items = [...top, ...(rest ? [{ genre: 'Other', count: rest }] : [])];
  const segments = items.map((d, i) => ({ label: d.genre, value: d.count, color: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <div className="donut">
      <Ring segments={segments} size={size} thickness={thickness}>
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </Ring>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-name">{s.label}</span>
            <span className="legend-count">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressRing({ value, max, size = 140, thickness = 14, label }) {
  const filled = Math.min(value, max);
  const segments = max > 0 ? [{ label: 'done', value: filled, color: 'var(--forest)' }, { label: 'left', value: Math.max(0, max - filled), color: 'transparent' }] : [];
  return (
    <Ring segments={segments} size={size} thickness={thickness}>
      <strong>{value}</strong>
      <span>{label || `of ${max}`}</span>
    </Ring>
  );
}
