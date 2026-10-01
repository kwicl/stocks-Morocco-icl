interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive: boolean;
}

/** Mini-graphique SVG intrajournalier (sans dépendance externe) */
export function Sparkline({ data, width = 96, height = 32, positive }: SparklineProps) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(' ');
  const color = positive ? '#22c55e' : '#ef4444';
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <polygon points={areaPoints} fill={color} opacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
