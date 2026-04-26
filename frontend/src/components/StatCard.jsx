const StatCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
    green: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    red: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
    purple: 'bg-violet-500/15 text-violet-200 border-violet-500/30'
  };

  return (
    <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-300 text-sm font-semibold">{title}</p>
          <p className="text-3xl font-extrabold text-slate-100 mt-2 tracking-tight">{value}</p>
        </div>
        <div className={`border ${colorClasses[color]} p-3 rounded-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

