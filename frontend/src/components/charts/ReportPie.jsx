import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { ensureChartsRegistered } from './chartSetup';

const palette = {
  available: 'rgba(16, 185, 129, 0.85)',
  issued: 'rgba(245, 158, 11, 0.85)',
  maintenance: 'rgba(244, 63, 94, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  text: 'rgba(226, 232, 240, 0.9)',
};

export default function ReportPie({ title, data }) {
  ensureChartsRegistered();

  const chartData = useMemo(() => {
    const labels = ['Available', 'Issued', 'Maintenance'];
    const values = [
      Number(data?.available ?? 0),
      Number(data?.issued ?? 0),
      Number(data?.maintenance ?? 0),
    ];

    return {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          backgroundColor: [palette.available, palette.issued, palette.maintenance],
          borderColor: palette.border,
          borderWidth: 1,
        },
      ],
    };
  }, [data, title]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: palette.text, boxWidth: 12, boxHeight: 12 },
        },
        tooltip: {
          enabled: true,
        },
      },
    }),
    []
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold tracking-tight text-slate-100">{title}</h3>
      </div>
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

