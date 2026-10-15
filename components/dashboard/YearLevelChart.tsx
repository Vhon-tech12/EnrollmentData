const data = [
  { label: '1st Year', value: 412 },
  { label: '2nd Year', value: 356 },
  { label: '3rd Year', value: 298 },
  { label: '4th Year', value: 294 },
];

const max = Math.max(...data.map((d) => d.value));

export default function YearLevelChart() {
  return (
    <div className="flex h-72 items-end justify-around gap-3 px-2 pb-2">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
          <span className="mb-2 text-xs font-semibold text-slate-700">{d.value}</span>
          <div
            className="w-full max-w-[56px] rounded-t-md bg-blue-600 transition-all hover:bg-blue-700"
            style={{ height: `${(d.value / max) * 75}%` }}
          />
          <span className="mt-2 text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}