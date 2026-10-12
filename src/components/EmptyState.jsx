import { Inbox } from 'lucide-react'

function EmptyState({ icon: Icon = Inbox, title, description, compact = false }) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <div className="empty-state-icon">
        <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export default EmptyState
