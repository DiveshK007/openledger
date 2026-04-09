interface Props {
  label: string;
  value: string;
  sub?: string;
  accentColor?: 'green' | 'red' | 'blue' | 'yellow';
}

const COLOR_MAP: Record<string, string> = {
  green:  'var(--green)',
  red:    'var(--red)',
  blue:   'var(--blue)',
  yellow: 'var(--yellow)',
};

export default function StatCard({ label, value, sub, accentColor = 'green' }: Props) {
  const accent = COLOR_MAP[accentColor];
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent top line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(to right, ${accent}, transparent)`,
      }} />
      <div style={{
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: 'var(--text-dim)',
        marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1.2,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: 11,
          color: 'var(--text-dim)',
          marginTop: 4,
        }}>{sub}</div>
      )}
    </div>
  );
}
