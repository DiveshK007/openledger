'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  positive: boolean;
}

export default function Sparkline({ data, positive }: Props) {
  if (!data || data.length < 2) return <div style={{ width: 80, height: 36 }} />;
  const chartData = data.map(v => ({ v }));
  return (
    <div style={{ width: 80, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? 'var(--green)' : 'var(--red)'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
