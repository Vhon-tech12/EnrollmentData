const data = [
  { year: '2021-22', enrolled: 890, total: 967 },
  { year: '2022-23', enrolled: 962, total: 1052 },
  { year: '2023-24', enrolled: 1045, total: 1147 },
  { year: '2024-25', enrolled: 1156, total: 1250 },
  { year: '2025-26', enrolled: 1247, total: 1360 },
];

export default function EnrollmentTrendChart() {
  const W = 600;
  const H = 280;
  const P = { t: 20, r: 20, b: 40, l: 50 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;
  const maxVal = 1500;
  const xStep = cw / (data.length - 1);

  const x = (i: number) => P.l + i * xStep;
  const y = (v: number) => P.t + ch - (v / maxVal) * ch;

  const totalPts = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  const enrolledPts = data.map((d, i) => `${x(i)},${y(d.enrolled)}`).join(' ');
  const gridLines = [0, 500, 1000, 1500];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full">
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={P.l}
              x2={W - P.r}
              y1={y(v)}
              y2={y(v)}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />
            <text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {v}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <text key={d.year} x={x(i)} y={H - 15} textAnchor="middle" fontSize="11" fill="#64748b">
            {d.year}
          </text>
        ))}

        <polyline points={totalPts} fill="none" stroke="#2563eb" strokeWidth="2.5" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.total)} r="3.5" fill="#fff" stroke="#2563eb" strokeWidth="2" />
        ))}

        <polyline
          points={enrolledPts}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
      </svg>

      <div className="mt-2 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-slate-600">Total Records</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-500" />
          <span className="text-slate-600">Enrolled</span>
        </div>
      </div>
    </div>
  );
}