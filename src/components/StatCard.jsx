export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="stat-card card">
      <span className="stat-icon">
        <Icon size={20} />
      </span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}
