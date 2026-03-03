import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  highlightThreshold?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color = '#3b82f6', height = 30, highlightThreshold }) => {
  if (data.length < 2) return null;

  const width = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;
  const chartHeight = height - padding * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, i) => ({
    x: i * stepX,
    y: padding + chartHeight - ((val - min) / range) * chartHeight,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {highlightThreshold !== undefined &&
        points.map(
          (p, i) =>
            data[i] >= highlightThreshold && (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="#ef4444" />
            )
        )}
    </svg>
  );
};

export default Sparkline;
