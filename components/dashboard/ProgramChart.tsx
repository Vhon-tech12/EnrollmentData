const data = [
  { label: 'BSIT', value: 342, color: 'bg-blue-600' },
  { label: 'BSCS', value: 268, color: 'bg-sky-500' },
  { label: 'BSBA', value: 297, color: 'bg-indigo-500' },
  { label: 'BSA', value: 189, color: 'bg-violet-500' },
  { label: 'BSED', value: 264, color: 'bg-teal-500' },
];

const max = Math.max(...data.map((d) => d.value));

export default function ProgramChart() {
  return (
    <div className="space-y-4 py-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{d.label}</span>
            <span className="font-semibold text-slate-900">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${d.color} transition-all`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}