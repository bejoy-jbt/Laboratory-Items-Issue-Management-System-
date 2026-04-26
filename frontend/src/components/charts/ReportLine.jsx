import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ensureChartsRegistered } from './chartSetup';

const text = 'rgba(226, 232, 240, 0.9)';
const grid = 'rgba(148, 163, 184, 0.18)';
const cyan = 'rgba(34, 211, 238, 0.95)';
const cyanFill = 'rgba(34, 211, 238, 0.14)';

function normalizeDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmtDay(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export default function ReportLine({ title, issueRecords, days = 14 }) {
  ensureChartsRegistered();

  const { labels, values } = useMemo(() => {
    const now = normalizeDay(new Date());
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));

    const bucket = new Map();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      bucket.set(d.getTime(), 0);
    }

    (issueRecords || []).forEach((r) => {
      const t = r?.issueTime ? normalizeDay(r.issueTime).getTime() : null;
      if (t && bucket.has(t)) bucket.set(t, (bucket.get(t) || 0) + 1);
    });

    const keys = [...bucket.keys()].sort((a, b) => a - b);
    return {
      labels: keys.map((k) => fmtDay(k)),
      values: keys.map((k) => bucket.get(k) || 0),
    };
  }, [days, issueRecords]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Issues',
          data: values,
          borderColor: cyan,
          backgroundColor: cyanFill,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [labels, values]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: { color: text },
          grid: { color: 'transparent' },
        },
        y: {
          ticks: { color: text, precision: 0 },
          grid: { color: grid },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold tracking-tight text-slate-100">{title}</h3>
        <span className="text-xs text-slate-400">Last {days} days</span>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

