import { ArrowUpRight } from 'lucide-react'

function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className={`stat-icon stat-icon-${tone}`}>
          <Icon aria-hidden="true" size={19} strokeWidth={2} />
        </span>
        <ArrowUpRight aria-hidden="true" className="stat-card-mark" size={17} />
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
    </article>
  )
}

export default StatCard
