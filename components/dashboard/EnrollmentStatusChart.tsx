const data = [
  { label: 'Enrolled', value: 1247, color: '#2563eb' },
  { label: 'Pending', value: 68, color: '#f59e0b' },
  { label: 'Cancelled', value: 45, color: '#ef4444' },
];

const total = data.reduce((s, d) => s + d.value, 0);
const radius = 60;
const C = 2 * Math.PI * radius;

export default function EnrollmentStatusChart() {
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 160 160" className="h-56 w-56 -rotate-90">
          {data.map((d) => {
            const portion = (d.value / total) * C;
            const segment = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="20"
                strokeDasharray={`${portion} ${C - portion}`}
                strokeDashoffset={-cumulative}
              />
            );
            cumulative += portion;
            return segment;
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{total.toLocaleString()}</span>
          <span className="text-xs text-slate-500">Total Records</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">
              {d.label} <span className="font-semibold text-slate-900">({d.value})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}